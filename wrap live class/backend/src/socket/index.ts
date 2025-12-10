import { Server as SocketServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { verifyAccessToken } from '../utils/auth';
import { mediasoupServer } from '../mediasoup/server';
import { roomManager, Peer } from '../mediasoup/room';
import { config } from '../mediasoup/config';
import { query } from '../database/connection';
import { DtlsParameters, MediaKind, RtpCapabilities, RtpParameters } from 'mediasoup/node/lib/types';

interface AuthSocket extends Socket {
  userId?: string;
  userName?: string;
  userRole?: string;
}

export function initSocketServer(httpServer: HttpServer) {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Authentication middleware
  io.use((socket: AuthSocket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = verifyAccessToken(token);
      socket.userId = decoded.userId;
      socket.userName = decoded.email;
      socket.userRole = decoded.role;
      
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: AuthSocket) => {
    console.log(`Client connected: ${socket.id}, User: ${socket.userId}`);

    // Join room
    socket.on('join-room', async ({ roomId }, callback) => {
      try {
        if (!socket.userId || !socket.userName || !socket.userRole) {
          return callback({ error: 'Unauthorized' });
        }

        // Verify room access (check enrollment)
        const scheduleResult = await query(
          'SELECT class_id FROM class_schedules WHERE meeting_room_id = $1',
          [roomId]
        );

        if (scheduleResult.rows.length === 0) {
          return callback({ error: 'Room not found' });
        }

        const classId = scheduleResult.rows[0].class_id;

        // Check if user is instructor or enrolled student
        if (socket.userRole !== 'instructor') {
          const enrollmentCheck = await query(
            'SELECT id FROM enrollments WHERE student_id = $1 AND class_id = $2',
            [socket.userId, classId]
          );

          if (enrollmentCheck.rows.length === 0) {
            return callback({ error: 'Not enrolled in this class' });
          }
        }

        // Get or create room
        let room = roomManager.getRoom(roomId);
        
        if (!room) {
          const router = await mediasoupServer.createRouter(roomId);
          room = roomManager.createRoom(roomId, router);
        }

        // Add peer to room
        const peer = room.addPeer(socket.id, socket.userId, socket.userName, socket.userRole);
        
        // Join socket room
        socket.join(roomId);

        // Get router capabilities
        const rtpCapabilities = room.router.rtpCapabilities;

        // Notify others
        socket.to(roomId).emit('peer-joined', {
          peerId: socket.id,
          userId: socket.userId,
          userName: socket.userName,
          role: socket.userRole,
        });

        // Get existing peers
        const existingPeers = room.getPeers()
          .filter(p => p.id !== socket.id)
          .map(p => ({
            peerId: p.id,
            userId: p.userId,
            userName: p.userName,
            role: p.role,
            producers: Array.from(p.producers.keys()),
          }));

        callback({
          rtpCapabilities,
          peers: existingPeers,
        });

        console.log(`Peer ${socket.id} joined room ${roomId}`);
      } catch (error: any) {
        console.error('Join room error:', error);
        callback({ error: error.message });
      }
    });

    // Create WebRTC transport
    socket.on('create-transport', async ({ roomId, direction }, callback) => {
      try {
        const room = roomManager.getRoom(roomId);
        if (!room) {
          return callback({ error: 'Room not found' });
        }

        const peer = room.getPeer(socket.id);
        if (!peer) {
          return callback({ error: 'Peer not found' });
        }

        const transport = await room.router.createWebRtcTransport({
          ...config.webRtcTransport,
          enableUdp: true,
          enableTcp: true,
          preferUdp: true,
        });

        peer.transports.set(transport.id, transport);

        callback({
          id: transport.id,
          iceParameters: transport.iceParameters,
          iceCandidates: transport.iceCandidates,
          dtlsParameters: transport.dtlsParameters,
        });

        console.log(`Transport created for peer ${socket.id}: ${transport.id}`);
      } catch (error: any) {
        console.error('Create transport error:', error);
        callback({ error: error.message });
      }
    });

    // Connect transport
    socket.on('connect-transport', async ({ transportId, dtlsParameters }: { transportId: string, dtlsParameters: DtlsParameters }, callback) => {
      try {
        const room = Array.from(roomManager['rooms'].values()).find(r => r.getPeer(socket.id));
        if (!room) {
          return callback({ error: 'Room not found' });
        }

        const peer = room.getPeer(socket.id);
        if (!peer) {
          return callback({ error: 'Peer not found' });
        }

        const transport = peer.transports.get(transportId);
        if (!transport) {
          return callback({ error: 'Transport not found' });
        }

        await transport.connect({ dtlsParameters });
        callback({ success: true });

        console.log(`Transport connected: ${transportId}`);
      } catch (error: any) {
        console.error('Connect transport error:', error);
        callback({ error: error.message });
      }
    });

    // Produce media
    socket.on('produce', async ({ transportId, kind, rtpParameters }: { transportId: string, kind: MediaKind, rtpParameters: RtpParameters }, callback) => {
      try {
        const room = Array.from(roomManager['rooms'].values()).find(r => r.getPeer(socket.id));
        if (!room) {
          return callback({ error: 'Room not found' });
        }

        const peer = room.getPeer(socket.id);
        if (!peer) {
          return callback({ error: 'Peer not found' });
        }

        const transport = peer.transports.get(transportId);
        if (!transport) {
          return callback({ error: 'Transport not found' });
        }

        const producer = await transport.produce({ kind, rtpParameters });
        peer.producers.set(producer.id, producer);

        // Notify other peers
        socket.to(room.id).emit('new-producer', {
          peerId: socket.id,
          producerId: producer.id,
          kind,
        });

        callback({ producerId: producer.id });

        console.log(`Producer created: ${producer.id} for peer ${socket.id}`);
      } catch (error: any) {
        console.error('Produce error:', error);
        callback({ error: error.message });
      }
    });

    // Consume media
    socket.on('consume', async ({ transportId, producerId, rtpCapabilities }: { transportId: string, producerId: string, rtpCapabilities: RtpCapabilities }, callback) => {
      try {
        const room = Array.from(roomManager['rooms'].values()).find(r => r.getPeer(socket.id));
        if (!room) {
          return callback({ error: 'Room not found' });
        }

        const peer = room.getPeer(socket.id);
        if (!peer) {
          return callback({ error: 'Peer not found' });
        }

        const transport = peer.transports.get(transportId);
        if (!transport) {
          return callback({ error: 'Transport not found' });
        }

        // Find producer
        let producer;
        for (const p of room.getPeers()) {
          producer = p.producers.get(producerId);
          if (producer) break;
        }

        if (!producer) {
          return callback({ error: 'Producer not found' });
        }

        if (!room.router.canConsume({ producerId, rtpCapabilities })) {
          return callback({ error: 'Cannot consume' });
        }

        const consumer = await transport.consume({
          producerId,
          rtpCapabilities,
          paused: false,
        });

        peer.consumers.set(consumer.id, consumer);

        callback({
          id: consumer.id,
          producerId,
          kind: consumer.kind,
          rtpParameters: consumer.rtpParameters,
        });

        console.log(`Consumer created: ${consumer.id} for peer ${socket.id}`);
      } catch (error: any) {
        console.error('Consume error:', error);
        callback({ error: error.message });
      }
    });

    // Chat message
    socket.on('send-message', async ({ roomId, message, isPrivate, recipientId }, callback) => {
      try {
        // Save to database
        const result = await query(
          'INSERT INTO chat_messages (room_id, user_id, message, is_private, recipient_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
          [roomId, socket.userId, message, isPrivate || false, recipientId || null]
        );

        const chatMessage = result.rows[0];

        const messageData = {
          id: chatMessage.id,
          userId: socket.userId,
          userName: socket.userName,
          message: chatMessage.message,
          timestamp: chatMessage.created_at,
          isPrivate: chatMessage.is_private,
        };

        if (isPrivate && recipientId) {
          // Send to recipient only
          const recipientSocket = Array.from(io.sockets.sockets.values()).find(
            (s: any) => s.userId === recipientId
          );
          if (recipientSocket) {
            recipientSocket.emit('receive-message', messageData);
          }
          socket.emit('receive-message', messageData);
        } else {
          // Broadcast to room
          io.to(roomId).emit('receive-message', messageData);
        }

        callback({ success: true });
      } catch (error: any) {
        console.error('Send message error:', error);
        callback({ error: error.message });
      }
    });

    // Get message history
    socket.on('get-messages', async ({ roomId, limit = 50 }, callback) => {
      try {
        const result = await query(
          `SELECT cm.*, u.full_name as user_name 
           FROM chat_messages cm
           JOIN users u ON cm.user_id = u.id
           WHERE cm.room_id = $1 AND cm.deleted_at IS NULL
           ORDER BY cm.created_at DESC
           LIMIT $2`,
          [roomId, limit]
        );

        callback({ messages: result.rows.reverse() });
      } catch (error: any) {
        console.error('Get messages error:', error);
        callback({ error: error.message });
      }
    });

    // Typing indicator
    socket.on('typing', ({ roomId, isTyping }) => {
      socket.to(roomId).emit('user-typing', {
        userId: socket.userId,
        userName: socket.userName,
        isTyping,
      });
    });

    // Leave room
    socket.on('leave-room', ({ roomId }) => {
      handleLeaveRoom(socket, roomId);
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
      
      // Find and leave all rooms
      for (const room of roomManager['rooms'].values()) {
        if (room.getPeer(socket.id)) {
          handleLeaveRoom(socket, room.id);
        }
      }
    });
  });

  function handleLeaveRoom(socket: AuthSocket, roomId: string) {
    const room = roomManager.getRoom(roomId);
    if (!room) return;

    room.removePeer(socket.id);
    socket.leave(roomId);

    // Notify others
    socket.to(roomId).emit('peer-left', {
      peerId: socket.id,
      userId: socket.userId,
    });

    // Delete room if empty
    if (room.isEmpty()) {
      mediasoupServer.deleteRouter(roomId);
      roomManager.deleteRoom(roomId);
    }

    console.log(`Peer ${socket.id} left room ${roomId}`);
  }

  return io;
}

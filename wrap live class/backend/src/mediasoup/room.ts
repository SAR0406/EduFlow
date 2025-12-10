import { Router, Transport, Producer, Consumer, RtpCapabilities } from 'mediasoup/node/lib/types';

export interface Peer {
  id: string;
  userId: string;
  userName: string;
  role: string;
  transports: Map<string, Transport>;
  producers: Map<string, Producer>;
  consumers: Map<string, Consumer>;
  rtpCapabilities?: RtpCapabilities;
}

export class Room {
  public id: string;
  public router: Router;
  public peers: Map<string, Peer>;
  private maxPeers: number;

  constructor(roomId: string, router: Router, maxPeers: number = 100) {
    this.id = roomId;
    this.router = router;
    this.peers = new Map();
    this.maxPeers = maxPeers;
  }

  addPeer(peerId: string, userId: string, userName: string, role: string): Peer {
    if (this.peers.size >= this.maxPeers) {
      throw new Error('Room is full');
    }

    const peer: Peer = {
      id: peerId,
      userId,
      userName,
      role,
      transports: new Map(),
      producers: new Map(),
      consumers: new Map(),
    };

    this.peers.set(peerId, peer);
    console.log(`Peer ${peerId} added to room ${this.id}`);
    return peer;
  }

  removePeer(peerId: string) {
    const peer = this.peers.get(peerId);
    if (!peer) return;

    // Close all transports
    peer.transports.forEach((transport) => transport.close());
    
    // Close all producers
    peer.producers.forEach((producer) => producer.close());
    
    // Close all consumers
    peer.consumers.forEach((consumer) => consumer.close());

    this.peers.delete(peerId);
    console.log(`Peer ${peerId} removed from room ${this.id}`);
  }

  getPeer(peerId: string): Peer | undefined {
    return this.peers.get(peerId);
  }

  getPeers(): Peer[] {
    return Array.from(this.peers.values());
  }

  getPeerCount(): number {
    return this.peers.size;
  }

  isEmpty(): boolean {
    return this.peers.size === 0;
  }

  close() {
    // Close all peer connections
    this.peers.forEach((peer) => {
      peer.transports.forEach((transport) => transport.close());
      peer.producers.forEach((producer) => producer.close());
      peer.consumers.forEach((consumer) => consumer.close());
    });

    this.peers.clear();
    this.router.close();
    console.log(`Room ${this.id} closed`);
  }
}

export class RoomManager {
  private rooms: Map<string, Room>;

  constructor() {
    this.rooms = new Map();
  }

  createRoom(roomId: string, router: Router, maxPeers?: number): Room {
    const room = new Room(roomId, router, maxPeers);
    this.rooms.set(roomId, room);
    console.log(`Room created: ${roomId}`);
    return room;
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  deleteRoom(roomId: string) {
    const room = this.rooms.get(roomId);
    if (room) {
      room.close();
      this.rooms.delete(roomId);
      console.log(`Room deleted: ${roomId}`);
    }
  }

  hasRoom(roomId: string): boolean {
    return this.rooms.has(roomId);
  }
}

export const roomManager = new RoomManager();

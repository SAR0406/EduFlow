import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Grid, Paper } from '@mui/material';
import { socketService } from '../../services/socket';
import { mediasoupService } from '../../services/mediasoup';
import { useAuthStore } from '../../store/authStore';
import VideoGrid from './VideoGrid';
import ControlBar from './ControlBar';
import Chat from './Chat';
import ParticipantList from './ParticipantList';
import toast from 'react-hot-toast';

interface Peer {
  peerId: string;
  userId: string;
  userName: string;
  role: string;
  producers: string[];
  stream?: MediaStream;
}

const Classroom: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { user, accessToken } = useAuthStore();
  
  const [peers, setPeers] = useState<Map<string, Peer>>(new Map());
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [showChat, setShowChat] = useState(true);
  const [showParticipants, setShowParticipants] = useState(true);
  
  const initialized = useRef(false);

  useEffect(() => {
    if (!roomId || !accessToken || initialized.current) return;

    initialized.current = true;
    initializeRoom();

    return () => {
      cleanup();
    };
  }, [roomId, accessToken]);

  const initializeRoom = async () => {
    try {
      // Connect to Socket.IO
      socketService.connect(accessToken!);

      // Get local media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);

      // Join room
      socketService.emit('join-room', { roomId }, async (response: any) => {
        if (response.error) {
          toast.error(response.error);
          navigate('/dashboard');
          return;
        }

        // Initialize MediaSoup
        await mediasoupService.init(response.rtpCapabilities);

        // Create transports
        await mediasoupService.createSendTransport(roomId!);
        await mediasoupService.createRecvTransport(roomId!);

        // Produce local media
        for (const track of stream.getTracks()) {
          await mediasoupService.produce(track);
        }

        // Set existing peers
        const peerMap = new Map();
        for (const peer of response.peers) {
          peerMap.set(peer.peerId, peer);
          // Consume their media
          for (const producerId of peer.producers) {
            try {
              const remoteStream = await mediasoupService.consume(producerId);
              peerMap.set(peer.peerId, { ...peer, stream: remoteStream });
            } catch (error) {
              console.error('Failed to consume producer:', error);
            }
          }
        }
        setPeers(peerMap);

        toast.success('Joined classroom successfully');
      });

      // Listen for new peers
      socketService.on('peer-joined', (data) => {
        toast.success(`${data.userName} joined`);
        setPeers((prev) => new Map(prev).set(data.peerId, data));
      });

      // Listen for new producers
      socketService.on('new-producer', async ({ peerId, producerId }) => {
        try {
          const stream = await mediasoupService.consume(producerId);
          setPeers((prev) => {
            const newPeers = new Map(prev);
            const peer = newPeers.get(peerId);
            if (peer) {
              newPeers.set(peerId, { ...peer, stream });
            }
            return newPeers;
          });
        } catch (error) {
          console.error('Failed to consume new producer:', error);
        }
      });

      // Listen for peer leaving
      socketService.on('peer-left', ({ peerId, userId }) => {
        setPeers((prev) => {
          const newPeers = new Map(prev);
          newPeers.delete(peerId);
          return newPeers;
        });
      });

    } catch (error: any) {
      console.error('Failed to initialize room:', error);
      toast.error(error.message || 'Failed to join classroom');
      navigate('/dashboard');
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsAudioEnabled(!isAudioEnabled);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  const leaveRoom = () => {
    cleanup();
    navigate('/dashboard');
  };

  const cleanup = () => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    mediasoupService.cleanup();
    socketService.emit('leave-room', { roomId });
    socketService.disconnect();
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#1a1a1a' }}>
      <Grid container sx={{ flex: 1, overflow: 'hidden' }}>
        <Grid item xs={showChat && showParticipants ? 8 : showChat || showParticipants ? 10 : 12}>
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
              <VideoGrid
                localStream={localStream}
                peers={Array.from(peers.values())}
                currentUserId={user?.id}
              />
            </Box>
            <ControlBar
              isAudioEnabled={isAudioEnabled}
              isVideoEnabled={isVideoEnabled}
              onToggleAudio={toggleAudio}
              onToggleVideo={toggleVideo}
              onLeaveRoom={leaveRoom}
              onToggleChat={() => setShowChat(!showChat)}
              onToggleParticipants={() => setShowParticipants(!showParticipants)}
              showChat={showChat}
              showParticipants={showParticipants}
            />
          </Box>
        </Grid>
        
        {showParticipants && (
          <Grid item xs={2}>
            <Paper sx={{ height: '100%', bgcolor: '#2a2a2a', overflowY: 'auto' }}>
              <ParticipantList
                peers={Array.from(peers.values())}
                currentUserId={user?.id}
                currentUserRole={user?.role}
              />
            </Paper>
          </Grid>
        )}
        
        {showChat && (
          <Grid item xs={2}>
            <Paper sx={{ height: '100%', bgcolor: '#2a2a2a' }}>
              <Chat roomId={roomId!} />
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default Classroom;

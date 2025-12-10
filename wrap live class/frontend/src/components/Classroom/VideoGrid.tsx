import React from 'react';
import { Box, Grid } from '@mui/material';
import VideoTile from './VideoTile';

interface Peer {
  peerId: string;
  userId: string;
  userName: string;
  role: string;
  stream?: MediaStream;
}

interface VideoGridProps {
  localStream: MediaStream | null;
  peers: Peer[];
  currentUserId?: string;
}

const VideoGrid: React.FC<VideoGridProps> = ({ localStream, peers, currentUserId }) => {
  const totalParticipants = peers.length + 1;
  
  const getGridColumns = () => {
    if (totalParticipants <= 1) return 12;
    if (totalParticipants <= 2) return 6;
    if (totalParticipants <= 4) return 6;
    if (totalParticipants <= 9) return 4;
    return 3;
  };

  return (
    <Grid container spacing={2}>
      {/* Local video */}
      <Grid item xs={getGridColumns()}>
        <VideoTile
          stream={localStream}
          userName="You"
          isLocal={true}
          isMuted={false}
        />
      </Grid>

      {/* Remote videos */}
      {peers.map((peer) => (
        <Grid item xs={getGridColumns()} key={peer.peerId}>
          <VideoTile
            stream={peer.stream}
            userName={peer.userName}
            isLocal={false}
            isMuted={false}
            role={peer.role}
          />
        </Grid>
      ))}
    </Grid>
  );
};

export default VideoGrid;

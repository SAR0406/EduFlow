import React, { useEffect, useRef } from 'react';
import { Box, Paper, Typography, Avatar } from '@mui/material';
import { Mic, MicOff, Videocam, VideocamOff } from '@mui/icons-material';

interface VideoTileProps {
  stream: MediaStream | null | undefined;
  userName: string;
  isLocal: boolean;
  isMuted: boolean;
  role?: string;
}

const VideoTile: React.FC<VideoTileProps> = ({
  stream,
  userName,
  isLocal,
  isMuted,
  role,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const hasVideo = stream?.getVideoTracks().some((track) => track.enabled);
  const hasAudio = stream?.getAudioTracks().some((track) => track.enabled);

  return (
    <Paper
      sx={{
        position: 'relative',
        paddingTop: '75%',
        bgcolor: '#1a1a1a',
        overflow: 'hidden',
        borderRadius: 2,
        border: role === 'instructor' ? '2px solid #2196f3' : 'none',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {hasVideo ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={isLocal}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: isLocal ? 'scaleX(-1)' : 'none',
            }}
          />
        ) : (
          <Avatar
            sx={{
              width: 80,
              height: 80,
              bgcolor: '#2196f3',
              fontSize: '2rem',
            }}
          >
            {userName.charAt(0).toUpperCase()}
          </Avatar>
        )}
      </Box>

      <Box
        sx={{
          position: 'absolute',
          bottom: 8,
          left: 8,
          right: 8,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography
          variant="body2"
          sx={{
            color: 'white',
            bgcolor: 'rgba(0,0,0,0.6)',
            px: 1,
            py: 0.5,
            borderRadius: 1,
            fontSize: '0.85rem',
          }}
        >
          {userName}
          {role === 'instructor' && ' (Instructor)'}
        </Typography>

        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {hasAudio ? (
            <Mic sx={{ color: 'white', fontSize: 20 }} />
          ) : (
            <MicOff sx={{ color: '#f44336', fontSize: 20 }} />
          )}
          {!hasVideo && <VideocamOff sx={{ color: '#f44336', fontSize: 20 }} />}
        </Box>
      </Box>
    </Paper>
  );
};

export default VideoTile;

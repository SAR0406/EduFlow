import React from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import {
  Mic,
  MicOff,
  Videocam,
  VideocamOff,
  CallEnd,
  Chat,
  People,
  ScreenShare,
} from '@mui/icons-material';

interface ControlBarProps {
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onLeaveRoom: () => void;
  onToggleChat: () => void;
  onToggleParticipants: () => void;
  showChat: boolean;
  showParticipants: boolean;
}

const ControlBar: React.FC<ControlBarProps> = ({
  isAudioEnabled,
  isVideoEnabled,
  onToggleAudio,
  onToggleVideo,
  onLeaveRoom,
  onToggleChat,
  onToggleParticipants,
  showChat,
  showParticipants,
}) => {
  return (
    <Box
      sx={{
        bgcolor: '#2a2a2a',
        p: 2,
        display: 'flex',
        justifyContent: 'center',
        gap: 2,
      }}
    >
      <Tooltip title={isAudioEnabled ? 'Mute' : 'Unmute'}>
        <IconButton
          onClick={onToggleAudio}
          sx={{
            bgcolor: isAudioEnabled ? '#424242' : '#f44336',
            color: 'white',
            '&:hover': { bgcolor: isAudioEnabled ? '#616161' : '#d32f2f' },
          }}
        >
          {isAudioEnabled ? <Mic /> : <MicOff />}
        </IconButton>
      </Tooltip>

      <Tooltip title={isVideoEnabled ? 'Stop Video' : 'Start Video'}>
        <IconButton
          onClick={onToggleVideo}
          sx={{
            bgcolor: isVideoEnabled ? '#424242' : '#f44336',
            color: 'white',
            '&:hover': { bgcolor: isVideoEnabled ? '#616161' : '#d32f2f' },
          }}
        >
          {isVideoEnabled ? <Videocam /> : <VideocamOff />}
        </IconButton>
      </Tooltip>

      <Tooltip title="Leave">
        <IconButton
          onClick={onLeaveRoom}
          sx={{
            bgcolor: '#f44336',
            color: 'white',
            '&:hover': { bgcolor: '#d32f2f' },
          }}
        >
          <CallEnd />
        </IconButton>
      </Tooltip>

      <Tooltip title={showChat ? 'Hide Chat' : 'Show Chat'}>
        <IconButton
          onClick={onToggleChat}
          sx={{
            bgcolor: showChat ? '#2196f3' : '#424242',
            color: 'white',
            '&:hover': { bgcolor: showChat ? '#1976d2' : '#616161' },
          }}
        >
          <Chat />
        </IconButton>
      </Tooltip>

      <Tooltip title={showParticipants ? 'Hide Participants' : 'Show Participants'}>
        <IconButton
          onClick={onToggleParticipants}
          sx={{
            bgcolor: showParticipants ? '#2196f3' : '#424242',
            color: 'white',
            '&:hover': { bgcolor: showParticipants ? '#1976d2' : '#616161' },
          }}
        >
          <People />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default ControlBar;

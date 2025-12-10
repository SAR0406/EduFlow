import React from 'react';
import { Box, Typography, List, ListItem, ListItemText, Avatar, Chip } from '@mui/material';

interface Peer {
  peerId: string;
  userId: string;
  userName: string;
  role: string;
}

interface ParticipantListProps {
  peers: Peer[];
  currentUserId?: string;
  currentUserRole?: string;
}

const ParticipantList: React.FC<ParticipantListProps> = ({
  peers,
  currentUserId,
  currentUserRole,
}) => {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
        Participants ({peers.length + 1})
      </Typography>

      <List>
        {/* Current user */}
        <ListItem
          sx={{
            bgcolor: '#424242',
            mb: 1,
            borderRadius: 1,
          }}
        >
          <Avatar sx={{ mr: 2, bgcolor: '#2196f3' }}>
            {currentUserRole === 'instructor' ? 'I' : 'S'}
          </Avatar>
          <ListItemText
            primary={
              <Typography variant="body1" sx={{ color: 'white' }}>
                You
              </Typography>
            }
            secondary={
              <Chip
                label={currentUserRole}
                size="small"
                sx={{
                  bgcolor: currentUserRole === 'instructor' ? '#2196f3' : '#4caf50',
                  color: 'white',
                  mt: 0.5,
                }}
              />
            }
          />
        </ListItem>

        {/* Other participants */}
        {peers.map((peer) => (
          <ListItem
            key={peer.peerId}
            sx={{
              bgcolor: '#424242',
              mb: 1,
              borderRadius: 1,
            }}
          >
            <Avatar sx={{ mr: 2, bgcolor: '#757575' }}>
              {peer.userName.charAt(0).toUpperCase()}
            </Avatar>
            <ListItemText
              primary={
                <Typography variant="body1" sx={{ color: 'white' }}>
                  {peer.userName}
                </Typography>
              }
              secondary={
                <Chip
                  label={peer.role}
                  size="small"
                  sx={{
                    bgcolor: peer.role === 'instructor' ? '#2196f3' : '#4caf50',
                    color: 'white',
                    mt: 0.5,
                  }}
                />
              }
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default ParticipantList;

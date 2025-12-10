import React, { useState, useEffect, useRef } from 'react';
import { Box, TextField, IconButton, Typography, Paper } from '@mui/material';
import { Send } from '@mui/icons-material';
import { socketService } from '../../services/socket';
import { format } from 'date-fns';

interface Message {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: string;
}

interface ChatProps {
  roomId: string;
}

const Chat: React.FC<ChatProps> = ({ roomId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load message history
    socketService.emit('get-messages', { roomId }, (response: any) => {
      if (response.messages) {
        setMessages(response.messages);
      }
    });

    // Listen for new messages
    const handleNewMessage = (message: Message) => {
      setMessages((prev) => [...prev, message]);
    };

    socketService.on('receive-message', handleNewMessage);

    return () => {
      socketService.off('receive-message', handleNewMessage);
    };
  }, [roomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!inputMessage.trim()) return;

    socketService.emit(
      'send-message',
      { roomId, message: inputMessage, isPrivate: false },
      (response: any) => {
        if (response.error) {
          console.error('Failed to send message:', response.error);
        }
      }
    );

    setInputMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        p: 2,
      }}
    >
      <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
        Chat
      </Typography>

      <Box sx={{ flex: 1, overflowY: 'auto', mb: 2 }}>
        {messages.map((msg) => (
          <Paper
            key={msg.id}
            sx={{
              p: 1,
              mb: 1,
              bgcolor: '#424242',
              color: 'white',
            }}
          >
            <Typography variant="caption" sx={{ color: '#90caf9', fontWeight: 'bold' }}>
              {msg.userName}
            </Typography>
            <Typography variant="body2">{msg.message}</Typography>
            <Typography variant="caption" sx={{ color: '#9e9e9e' }}>
              {format(new Date(msg.timestamp), 'HH:mm')}
            </Typography>
          </Paper>
        ))}
        <div ref={messagesEndRef} />
      </Box>

      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Type a message..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          sx={{
            '& .MuiOutlinedInput-root': {
              color: 'white',
              '& fieldset': { borderColor: '#616161' },
              '&:hover fieldset': { borderColor: '#9e9e9e' },
            },
          }}
        />
        <IconButton
          onClick={handleSend}
          sx={{
            bgcolor: '#2196f3',
            color: 'white',
            '&:hover': { bgcolor: '#1976d2' },
          }}
        >
          <Send />
        </IconButton>
      </Box>
    </Box>
  );
};

export default Chat;

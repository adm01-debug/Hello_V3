import io from 'socket.io-client';

const socket = io('https://api.hello.app', {
  auth: {
    token: 'YOUR_JWT_TOKEN',
  },
});

socket.on('connect', () => {
  console.log('Connected to WebSocket');
});

socket.on('call:started', (data) => {
  console.log('New call started:', data);
});

socket.emit('call:start', {
  callId: '123',
  contactId: '456',
});

export default socket;

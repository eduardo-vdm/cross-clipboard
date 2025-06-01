import { io } from 'socket.io-client';

const SOCKET_URL = process.env.SOCKET_URL || 'http://localhost:3000';
const token = process.env.DEBUG_TOKEN || 'debug123';

const socket = io(SOCKET_URL, {
  auth: { token },
  transports: ['websocket'],
});

socket.on('connect', () => {
  console.log('[✓] Connected:', socket.id);

  // Example test emit
  socket.emit('test:event', { hello: 'world' });
});

socket.onAny((event, ...args) => {
  console.log(`[⇐] Received: ${event}`, ...args);
});

socket.on('connect_error', (err) => {
  console.error('[!] Connection error:', err.message);
});

export default socket;

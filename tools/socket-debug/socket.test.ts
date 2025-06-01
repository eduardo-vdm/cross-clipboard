import { io, Socket } from 'socket.io-client';

let socket: Socket;
const SERVER_URL = 'http://localhost:3001';
const token = process.env.TEST_TOKEN || 'debug123';

beforeAll((done) => {
  socket = io(SERVER_URL, {
    auth: { token },
    transports: ['websocket'],
  });

  socket.on('connect', () => done());
  socket.on('connect_error', done);
});

afterAll(() => {
  if (socket?.connected) socket.disconnect();
});

test('should receive welcome message on connect', (done) => {
  socket.once('welcome', (msg) => {
    expect(msg).toHaveProperty('message');
    done();
  });
});

test('should emit and receive a test event', (done) => {
  const payload = { test: true };
  socket.emit('test:event', payload);

  socket.once('test:response', (res) => {
    expect(res).toMatchObject({ received: true });
    expect(res).toHaveProperty('data');
    expect(res.data).toMatchObject(payload);
    done();
  });
});

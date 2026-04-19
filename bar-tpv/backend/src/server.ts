import http from 'node:http';
import { Server } from 'socket.io';
import { createApp } from './app.js';
import { env } from './config/env.js';


const app = createApp();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

io.on('connection', (socket) => {
  socket.on('join:tavolo', (ordineId: string) => socket.join(`ordine:${ordineId}`));
  socket.on('evento:tavolo', (payload) => io.emit('evento:tavolo', payload));
  socket.on('evento:magazzino', (payload) => io.emit('evento:magazzino', payload));
});

server.listen(env.port, () => {
  console.log(`Backend Bar TPV attivo su http://localhost:${env.port}`);
});

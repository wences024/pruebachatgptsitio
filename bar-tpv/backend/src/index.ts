import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { Server as SocketServer } from 'socket.io';

dotenv.config();

import { runMigrations } from './models/migrations';
import authRoutes from './routes/auth';
import categorieRoutes from './routes/categorie';
import prodottiRoutes from './routes/prodotti';
import attributiRoutes from './routes/attributi';
import saleRoutes from './routes/sale';
import ordiniRoutes, { setSocketIO as setOrdiniIO } from './routes/ordini';
import transakzioniRoutes, { setSocketIO as setTransazioniIO } from './routes/transazioni';
import stampantiRoutes from './routes/stampanti';
import analyticsRoutes from './routes/analytics';
import satispayRoutes from './routes/satispay';
import utentiRoutes from './routes/utenti';

const app = express();
const server = http.createServer(app);

const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

const io = new SocketServer(server, {
  cors: {
    origin: [frontendUrl, 'http://localhost:5173', 'http://localhost:4173'],
    credentials: true,
  },
});

// Inietta io nelle route
setOrdiniIO(io);
setTransazioniIO(io);

// Middleware
app.use(cors({
  origin: [frontendUrl, 'http://localhost:5173', 'http://localhost:4173'],
  credentials: true,
}));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging sviluppo
if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// Health check
app.get('/health', (_req, res) => {
  res.json({ stato: 'ok', timestamp: new Date().toISOString() });
});

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/categorie', categorieRoutes);
app.use('/api/prodotti', prodottiRoutes);
app.use('/api/attributi', attributiRoutes);
app.use('/api/sale', saleRoutes);
app.use('/api/ordini', ordiniRoutes);
app.use('/api/transazioni', transakzioniRoutes);
app.use('/api/stampanti', stampantiRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/satispay', satispayRoutes);
app.use('/api/utenti', utentiRoutes);

// Socket.io connessione
io.on('connection', (socket) => {
  console.log(`Client connesso: ${socket.id}`);

  socket.on('join_ordine', (ordine_id: string) => {
    socket.join(`ordine:${ordine_id}`);
  });

  socket.on('leave_ordine', (ordine_id: string) => {
    socket.leave(`ordine:${ordine_id}`);
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnesso: ${socket.id}`);
  });
});

// Avvio server
const PORT = parseInt(process.env.PORT || '3001');

async function start() {
  try {
    await runMigrations();
    server.listen(PORT, () => {
      console.log(`🚀 Server avviato su http://localhost:${PORT}`);
      console.log(`📡 WebSocket pronto`);
    });
  } catch (err) {
    console.error('Errore avvio server:', err);
    process.exit(1);
  }
}

start();

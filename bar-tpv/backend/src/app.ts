import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import masterDataRoutes from './routes/masterDataRoutes.js';
import printRoutes from './routes/printRoutes.js';
import satispayRoutes from './routes/satispayRoutes.js';

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'bar-tpv-backend' }));
  app.use('/api/auth', authRoutes);
  app.use('/api', masterDataRoutes);
  app.use('/api/stampante', printRoutes);
  app.use('/api/satispay', satispayRoutes);

  return app;
}

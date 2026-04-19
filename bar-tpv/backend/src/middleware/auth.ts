import { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../services/authService.js';
import type { RuoloUtente } from '@bar-tpv/shared';

declare global {
  namespace Express {
    interface Request {
      utente?: { id: string; email: string; ruolo: RuoloUtente; nome: string };
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: 'Token mancante' });
  const token = header.replace('Bearer ', '');
  try {
    req.utente = verifyToken(token) as Request['utente'];
    next();
  } catch {
    res.status(401).json({ message: 'Token non valido' });
  }
}

export function requireRole(...roles: RuoloUtente[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.utente || !roles.includes(req.utente.ruolo)) {
      return res.status(403).json({ message: 'Permessi insufficienti' });
    }
    next();
  };
}

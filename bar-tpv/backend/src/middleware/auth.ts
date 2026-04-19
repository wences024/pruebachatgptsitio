import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { RuoloUtente } from '../../../shared/types';

export interface JwtPayload {
  id: string;
  email: string;
  ruolo: RuoloUtente;
}

declare global {
  namespace Express {
    interface Request {
      utente?: JwtPayload;
    }
  }
}

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ errore: 'Token mancante' });
    return;
  }
  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    req.utente = payload;
    next();
  } catch {
    res.status(401).json({ errore: 'Token non valido' });
  }
};

export const requireRuolo = (...ruoli: RuoloUtente[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    if (!req.utente) {
      res.status(401).json({ errore: 'Non autenticato' });
      return;
    }
    if (!ruoli.includes(req.utente.ruolo)) {
      res.status(403).json({ errore: 'Permessi insufficienti' });
      return;
    }
    next();
  };

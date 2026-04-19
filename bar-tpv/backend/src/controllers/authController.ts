import { Request, Response } from 'express';
import { createTokens, verifyCredentials, verifyRefreshToken } from '../services/authService.js';

export function login(req: Request, res: Response) {
  const { email, password } = req.body;
  const utente = verifyCredentials(email, password);
  if (!utente) return res.status(401).json({ message: 'Credenziali non valide' });
  const tokens = createTokens({ id: utente.id, email: utente.email, ruolo: utente.ruolo, nome: utente.nome });
  res.json({ ...tokens, utente });
}

export function refresh(req: Request, res: Response) {
  const { refreshToken } = req.body;
  try {
    const decoded = verifyRefreshToken(refreshToken) as { id: string; email: string; ruolo: 'admin' | 'cassiere' | 'cameriere'; nome: string };
    const tokens = createTokens(decoded);
    res.json({ ...tokens, utente: decoded });
  } catch {
    res.status(401).json({ message: 'Refresh token non valido' });
  }
}

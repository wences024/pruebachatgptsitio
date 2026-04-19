import jwt from 'jsonwebtoken';
import { env } from './config/env.js';
import { utentiDemo } from '../models/demoData.js';

export function verifyCredentials(email: string, password: string) {
  const user = utentiDemo.find((utente) => utente.email === email && utente.password === password && utente.attivo);
  if (!user) return null;
  const { password: _password, ...safeUser } = user;
  return safeUser;
}

export function createTokens(payload: { id: string; email: string; ruolo: string; nome: string }) {
  const token = jwt.sign(payload, env.jwtSecret, { expiresIn: '12h' });
  const refreshToken = jwt.sign(payload, env.jwtRefreshSecret, { expiresIn: '30d' });
  return { token, refreshToken };
}

export function verifyToken(token: string) {
  return jwt.verify(token, env.jwtSecret);
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, env.jwtRefreshSecret);
}

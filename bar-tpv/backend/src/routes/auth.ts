import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../db';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ errore: 'Email e password obbligatorie' });
      return;
    }

    const { rows } = await query(
      `SELECT id, nome, email, password_hash, ruolo, attivo FROM utenti WHERE email = $1`,
      [email.toLowerCase()]
    );

    if (rows.length === 0) {
      res.status(401).json({ errore: 'Credenziali non valide' });
      return;
    }

    const utente = rows[0];
    if (!utente.attivo) {
      res.status(403).json({ errore: 'Account disabilitato' });
      return;
    }

    const valida = await bcrypt.compare(password, utente.password_hash);
    if (!valida) {
      res.status(401).json({ errore: 'Credenziali non valide' });
      return;
    }

    const token = jwt.sign(
      { id: utente.id, email: utente.email, ruolo: utente.ruolo },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
    );

    res.json({
      token,
      utente: { id: utente.id, nome: utente.nome, email: utente.email, ruolo: utente.ruolo },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ errore: 'Errore interno del server' });
  }
});

router.get('/me', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { rows } = await query(
      `SELECT id, nome, email, ruolo, attivo FROM utenti WHERE id = $1`,
      [req.utente!.id]
    );
    if (rows.length === 0) {
      res.status(404).json({ errore: 'Utente non trovato' });
      return;
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ errore: 'Errore interno del server' });
  }
});

router.put('/cambio-password', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { password_attuale, nuova_password } = req.body;
    const { rows } = await query(
      `SELECT password_hash FROM utenti WHERE id = $1`,
      [req.utente!.id]
    );
    const valida = await bcrypt.compare(password_attuale, rows[0].password_hash);
    if (!valida) {
      res.status(400).json({ errore: 'Password attuale non corretta' });
      return;
    }
    const hash = await bcrypt.hash(nuova_password, 10);
    await query(`UPDATE utenti SET password_hash = $1 WHERE id = $2`, [hash, req.utente!.id]);
    res.json({ messaggio: 'Password aggiornata' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ errore: 'Errore interno del server' });
  }
});

export default router;

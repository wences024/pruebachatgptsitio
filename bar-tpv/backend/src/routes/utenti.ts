import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { query } from '../db';
import { requireAuth, requireRuolo } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, requireRuolo('admin'), async (_req: Request, res: Response): Promise<void> => {
  try {
    const { rows } = await query(
      `SELECT id, nome, email, ruolo, attivo FROM utenti ORDER BY nome`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ errore: 'Errore interno del server' });
  }
});

router.post('/', requireAuth, requireRuolo('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { nome, email, password, ruolo = 'cameriere' } = req.body;
    if (!nome || !email || !password) {
      res.status(400).json({ errore: 'Nome, email e password obbligatori' });
      return;
    }
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await query(
      `INSERT INTO utenti (nome, email, password_hash, ruolo) VALUES ($1, $2, $3, $4)
       RETURNING id, nome, email, ruolo, attivo`,
      [nome, email.toLowerCase(), hash, ruolo]
    );
    res.status(201).json(rows[0]);
  } catch (err: unknown) {
    console.error(err);
    if (err instanceof Error && err.message.includes('unique')) {
      res.status(400).json({ errore: 'Email già in uso' });
    } else {
      res.status(500).json({ errore: 'Errore interno del server' });
    }
  }
});

router.put('/:id', requireAuth, requireRuolo('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { nome, ruolo, attivo, password } = req.body;
    let hashQuery = '';
    const params: unknown[] = [nome, ruolo, attivo, req.params.id];

    if (password) {
      const hash = await bcrypt.hash(password, 10);
      hashQuery = ', password_hash = $5';
      params.push(hash);
    }

    const { rows } = await query(
      `UPDATE utenti SET
        nome = COALESCE($1, nome),
        ruolo = COALESCE($2, ruolo),
        attivo = COALESCE($3, attivo)
        ${hashQuery}
       WHERE id = $4 RETURNING id, nome, email, ruolo, attivo`,
      params
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

router.delete('/:id', requireAuth, requireRuolo('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    if (req.params.id === req.utente!.id) {
      res.status(400).json({ errore: 'Non puoi eliminare il tuo account' });
      return;
    }
    await query(`UPDATE utenti SET attivo = false WHERE id = $1`, [req.params.id]);
    res.json({ messaggio: 'Utente disattivato' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ errore: 'Errore interno del server' });
  }
});

export default router;

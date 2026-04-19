import { Router, Request, Response } from 'express';
import { query } from '../db';
import { requireAuth, requireRuolo } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, async (_req: Request, res: Response): Promise<void> => {
  try {
    const { rows } = await query(`SELECT * FROM attributi ORDER BY nome`);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ errore: 'Errore interno del server' });
  }
});

router.post('/', requireAuth, requireRuolo('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { nome, valori, max_selezionabili = 1 } = req.body;
    if (!nome || !valori || !Array.isArray(valori)) {
      res.status(400).json({ errore: 'Nome e valori obbligatori' });
      return;
    }
    const { rows } = await query(
      `INSERT INTO attributi (nome, valori, max_selezionabili) VALUES ($1, $2, $3) RETURNING *`,
      [nome, JSON.stringify(valori), max_selezionabili]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ errore: 'Errore interno del server' });
  }
});

router.put('/:id', requireAuth, requireRuolo('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { nome, valori, max_selezionabili } = req.body;
    const { rows } = await query(
      `UPDATE attributi SET
        nome = COALESCE($1, nome),
        valori = COALESCE($2::jsonb, valori),
        max_selezionabili = COALESCE($3, max_selezionabili)
       WHERE id = $4 RETURNING *`,
      [nome, valori ? JSON.stringify(valori) : null, max_selezionabili, req.params.id]
    );
    if (rows.length === 0) {
      res.status(404).json({ errore: 'Attributo non trovato' });
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
    await query(`DELETE FROM attributi WHERE id = $1`, [req.params.id]);
    res.json({ messaggio: 'Attributo eliminato' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ errore: 'Errore interno del server' });
  }
});

export default router;

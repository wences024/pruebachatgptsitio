import { Router, Request, Response } from 'express';
import { query } from '../db';
import { requireAuth, requireRuolo } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, async (_req: Request, res: Response): Promise<void> => {
  try {
    const { rows } = await query(`
      SELECT c.*, COUNT(p.id)::int AS num_prodotti
      FROM categorie c
      LEFT JOIN prodotti p ON p.categoria_id = c.id AND p.attivo = true
      GROUP BY c.id
      ORDER BY c.ordine, c.nome
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ errore: 'Errore interno del server' });
  }
});

router.post('/', requireAuth, requireRuolo('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { nome, emoji, destinazione_stampa, ordine = 0 } = req.body;
    if (!nome || !destinazione_stampa) {
      res.status(400).json({ errore: 'Nome e destinazione stampa obbligatori' });
      return;
    }
    const { rows } = await query(
      `INSERT INTO categorie (nome, emoji, destinazione_stampa, ordine) VALUES ($1, $2, $3, $4) RETURNING *`,
      [nome, emoji, destinazione_stampa, ordine]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ errore: 'Errore interno del server' });
  }
});

router.put('/:id', requireAuth, requireRuolo('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { nome, emoji, destinazione_stampa, ordine } = req.body;
    const { rows } = await query(
      `UPDATE categorie SET nome = COALESCE($1, nome), emoji = COALESCE($2, emoji),
       destinazione_stampa = COALESCE($3, destinazione_stampa), ordine = COALESCE($4, ordine)
       WHERE id = $5 RETURNING *`,
      [nome, emoji, destinazione_stampa, ordine, req.params.id]
    );
    if (rows.length === 0) {
      res.status(404).json({ errore: 'Categoria non trovata' });
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
    await query(`UPDATE prodotti SET categoria_id = NULL WHERE categoria_id = $1`, [req.params.id]);
    await query(`DELETE FROM categorie WHERE id = $1`, [req.params.id]);
    res.json({ messaggio: 'Categoria eliminata' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ errore: 'Errore interno del server' });
  }
});

export default router;

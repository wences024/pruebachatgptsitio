import { Router, Request, Response } from 'express';
import { query } from '../db';
import { requireAuth, requireRuolo } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, async (_req: Request, res: Response): Promise<void> => {
  try {
    const { rows: sale } = await query(`SELECT * FROM sale ORDER BY ordine, nome`);
    const { rows: tavoli } = await query(`
      SELECT t.*,
        CASE WHEN o.id IS NOT NULL THEN json_build_object('id', o.id, 'totale', o.totale, 'aperto_at', o.aperto_at)
             ELSE NULL END AS ordine_attivo
      FROM tavoli t
      LEFT JOIN ordini o ON o.tavolo_id = t.id AND o.stato = 'aperto'
      ORDER BY t.numero
    `);

    const result = sale.map(s => ({
      ...s,
      tavoli: tavoli.filter(t => t.sala_id === s.id),
    }));
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ errore: 'Errore interno del server' });
  }
});

router.post('/', requireAuth, requireRuolo('admin', 'cassiere'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { nome, ordine = 0 } = req.body;
    if (!nome) {
      res.status(400).json({ errore: 'Nome obbligatorio' });
      return;
    }
    const { rows } = await query(
      `INSERT INTO sale (nome, ordine) VALUES ($1, $2) RETURNING *`,
      [nome, ordine]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ errore: 'Errore interno del server' });
  }
});

router.put('/:id', requireAuth, requireRuolo('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { nome, ordine } = req.body;
    const { rows } = await query(
      `UPDATE sale SET nome = COALESCE($1, nome), ordine = COALESCE($2, ordine) WHERE id = $3 RETURNING *`,
      [nome, ordine, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ errore: 'Errore interno del server' });
  }
});

router.delete('/:id', requireAuth, requireRuolo('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    await query(`DELETE FROM sale WHERE id = $1`, [req.params.id]);
    res.json({ messaggio: 'Sala eliminata' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ errore: 'Errore interno del server' });
  }
});

// Tavoli CRUD
router.post('/:sala_id/tavoli', requireAuth, requireRuolo('admin', 'cassiere'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { numero } = req.body;
    const { rows } = await query(
      `INSERT INTO tavoli (numero, sala_id) VALUES ($1, $2) RETURNING *`,
      [numero, req.params.sala_id]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ errore: 'Errore interno del server' });
  }
});

router.delete('/tavoli/:id', requireAuth, requireRuolo('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    await query(`DELETE FROM tavoli WHERE id = $1`, [req.params.id]);
    res.json({ messaggio: 'Tavolo eliminato' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ errore: 'Errore interno del server' });
  }
});

export default router;

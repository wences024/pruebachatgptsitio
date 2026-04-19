import { Router, Request, Response } from 'express';
import { query } from '../db';
import { requireAuth, requireRuolo } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, async (_req: Request, res: Response): Promise<void> => {
  try {
    const { rows } = await query(`
      SELECT p.*,
        row_to_json(c) AS categoria,
        COALESCE(
          (SELECT json_agg(a) FROM attributi a WHERE a.id = ANY(p.attributi_ids)),
          '[]'::json
        ) AS attributi
      FROM prodotti p
      LEFT JOIN categorie c ON c.id = p.categoria_id
      WHERE p.attivo = true
      ORDER BY c.ordine, p.nome
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ errore: 'Errore interno del server' });
  }
});

router.post('/', requireAuth, requireRuolo('admin', 'cassiere'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { nome, emoji, categoria_id, prezzo, costo = 0, stock = 0, stock_minimo = 5, attributi_ids = [] } = req.body;
    if (!nome || prezzo == null) {
      res.status(400).json({ errore: 'Nome e prezzo obbligatori' });
      return;
    }
    const attIds = attributi_ids.length > 0 ? `{${attributi_ids.join(',')}}` : '{}';
    const { rows } = await query(
      `INSERT INTO prodotti (nome, emoji, categoria_id, prezzo, costo, stock, stock_minimo, attributi_ids)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [nome, emoji, categoria_id || null, prezzo, costo, stock, stock_minimo, attIds]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ errore: 'Errore interno del server' });
  }
});

router.put('/:id', requireAuth, requireRuolo('admin', 'cassiere'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { nome, emoji, categoria_id, prezzo, costo, stock, stock_minimo, attributi_ids, attivo } = req.body;
    const attIds = attributi_ids != null
      ? (attributi_ids.length > 0 ? `{${attributi_ids.join(',')}}` : '{}')
      : undefined;

    const { rows } = await query(
      `UPDATE prodotti SET
        nome = COALESCE($1, nome),
        emoji = COALESCE($2, emoji),
        categoria_id = COALESCE($3, categoria_id),
        prezzo = COALESCE($4, prezzo),
        costo = COALESCE($5, costo),
        stock = COALESCE($6, stock),
        stock_minimo = COALESCE($7, stock_minimo),
        attributi_ids = COALESCE($8::uuid[], attributi_ids),
        attivo = COALESCE($9, attivo)
       WHERE id = $10 RETURNING *`,
      [nome, emoji, categoria_id, prezzo, costo, stock, stock_minimo, attIds, attivo, req.params.id]
    );
    if (rows.length === 0) {
      res.status(404).json({ errore: 'Prodotto non trovato' });
      return;
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ errore: 'Errore interno del server' });
  }
});

router.patch('/:id/stock', requireAuth, requireRuolo('admin', 'cassiere'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { stock } = req.body;
    if (stock == null) {
      res.status(400).json({ errore: 'Stock obbligatorio' });
      return;
    }
    const { rows } = await query(
      `UPDATE prodotti SET stock = $1 WHERE id = $2 RETURNING id, stock, stock_minimo`,
      [stock, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ errore: 'Errore interno del server' });
  }
});

router.delete('/:id', requireAuth, requireRuolo('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    await query(`UPDATE prodotti SET attivo = false WHERE id = $1`, [req.params.id]);
    res.json({ messaggio: 'Prodotto disattivato' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ errore: 'Errore interno del server' });
  }
});

export default router;

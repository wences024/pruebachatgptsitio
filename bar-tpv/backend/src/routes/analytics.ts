import { Router, Request, Response } from 'express';
import { query } from '../db';
import { requireAuth, requireRuolo } from '../middleware/auth';

const router = Router();

// Dashboard principale
router.get('/dashboard', requireAuth, requireRuolo('admin'), async (_req: Request, res: Response): Promise<void> => {
  try {
    const oggi = new Date().toISOString().split('T')[0];
    const inizioSettimana = new Date();
    inizioSettimana.setDate(inizioSettimana.getDate() - inizioSettimana.getDay());
    const inizioMese = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const inizioAnno = new Date(new Date().getFullYear(), 0, 1);

    const [rOggi, rSettimana, rMese, rAnno] = await Promise.all([
      query(`SELECT COALESCE(SUM(totale),0) as totale, COALESCE(SUM(num_transazioni),0) as num_transazioni,
              COALESCE(SUM(contanti),0) as contanti, COALESCE(SUM(carta),0) as carta, COALESCE(SUM(satispay),0) as satispay
             FROM vendite_giornaliere WHERE data = $1`, [oggi]),
      query(`SELECT COALESCE(SUM(totale),0) as totale, COALESCE(SUM(num_transazioni),0) as num_transazioni
             FROM vendite_giornaliere WHERE data >= $1`, [inizioSettimana.toISOString().split('T')[0]]),
      query(`SELECT COALESCE(SUM(totale),0) as totale, COALESCE(SUM(num_transazioni),0) as num_transazioni
             FROM vendite_giornaliere WHERE data >= $1`, [inizioMese.toISOString().split('T')[0]]),
      query(`SELECT COALESCE(SUM(totale),0) as totale, COALESCE(SUM(num_transazioni),0) as num_transazioni
             FROM vendite_giornaliere WHERE data >= $1`, [inizioAnno.toISOString().split('T')[0]]),
    ]);

    res.json({
      oggi: rOggi.rows[0],
      settimana: rSettimana.rows[0],
      mese: rMese.rows[0],
      anno: rAnno.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ errore: 'Errore interno del server' });
  }
});

// Vendite per giorno in un periodo
router.get('/vendite-giornaliere', requireAuth, requireRuolo('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { da, a } = req.query;
    const { rows } = await query(
      `SELECT * FROM vendite_giornaliere
       WHERE data BETWEEN $1 AND $2
       ORDER BY data`,
      [da || '2020-01-01', a || new Date().toISOString().split('T')[0]]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ errore: 'Errore interno del server' });
  }
});

// Prodotti più venduti
router.get('/prodotti-venduti', requireAuth, requireRuolo('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { da, a, limit = '20' } = req.query;
    const { rows } = await query(`
      SELECT
        r.prodotto_id,
        r.nome_prodotto AS nome,
        SUM(r.quantita) AS quantita_totale,
        SUM(r.quantita * r.prezzo_unitario) AS ricavo_totale,
        p.costo,
        SUM(r.quantita) * p.costo AS costo_totale,
        CASE WHEN SUM(r.quantita * r.prezzo_unitario) > 0
          THEN ROUND(((SUM(r.quantita * r.prezzo_unitario) - SUM(r.quantita) * p.costo) / SUM(r.quantita * r.prezzo_unitario) * 100)::numeric, 1)
          ELSE 0 END AS margine_percentuale
      FROM righe_ordine r
      JOIN ordini o ON o.id = r.ordine_id
      LEFT JOIN prodotti p ON p.id = r.prodotto_id
      WHERE o.stato = 'pagato'
        AND o.aperto_at BETWEEN $1 AND $2
      GROUP BY r.prodotto_id, r.nome_prodotto, p.costo
      ORDER BY quantita_totale DESC
      LIMIT $3
    `, [
      da ? `${da} 00:00:00` : '2020-01-01 00:00:00',
      a ? `${a} 23:59:59` : new Date().toISOString(),
      parseInt(limit as string),
    ]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ errore: 'Errore interno del server' });
  }
});

// Vendite per categoria
router.get('/categorie', requireAuth, requireRuolo('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { da, a } = req.query;
    const { rows } = await query(`
      SELECT
        c.id AS categoria_id,
        c.nome,
        c.emoji,
        SUM(r.quantita) AS num_vendite,
        SUM(r.quantita * r.prezzo_unitario) AS ricavo_totale
      FROM righe_ordine r
      JOIN ordini o ON o.id = r.ordine_id
      JOIN prodotti p ON p.id = r.prodotto_id
      JOIN categorie c ON c.id = p.categoria_id
      WHERE o.stato = 'pagato'
        AND o.aperto_at BETWEEN $1 AND $2
      GROUP BY c.id, c.nome, c.emoji
      ORDER BY ricavo_totale DESC
    `, [
      da ? `${da} 00:00:00` : '2020-01-01 00:00:00',
      a ? `${a} 23:59:59` : new Date().toISOString(),
    ]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ errore: 'Errore interno del server' });
  }
});

// Metodi pagamento
router.get('/metodi-pagamento', requireAuth, requireRuolo('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { da, a } = req.query;
    const { rows } = await query(`
      SELECT metodo, COUNT(*) AS num_transazioni, SUM(importo) AS totale
      FROM transazioni
      WHERE creato_at BETWEEN $1 AND $2
      GROUP BY metodo
    `, [
      da ? `${da} 00:00:00` : '2020-01-01 00:00:00',
      a ? `${a} 23:59:59` : new Date().toISOString(),
    ]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ errore: 'Errore interno del server' });
  }
});

export default router;

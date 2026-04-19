import { Router, Request, Response } from 'express';
import { query } from '../db';
import { requireAuth } from '../middleware/auth';
import { Server as SocketServer } from 'socket.io';

const router = Router();
let io: SocketServer | null = null;

export function setSocketIO(socketIO: SocketServer) {
  io = socketIO;
}

// Ottieni ordine attivo per tavolo
router.get('/tavolo/:tavolo_id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { rows: ordini } = await query(
      `SELECT * FROM ordini WHERE tavolo_id = $1 AND stato = 'aperto' LIMIT 1`,
      [req.params.tavolo_id]
    );
    if (ordini.length === 0) {
      res.json(null);
      return;
    }

    const ordine = ordini[0];
    const { rows: righe } = await query(`
      SELECT r.*,
        row_to_json(p) AS prodotto
      FROM righe_ordine r
      LEFT JOIN prodotti p ON p.id = r.prodotto_id
      WHERE r.ordine_id = $1
      ORDER BY r.creato_at
    `, [ordine.id]);

    res.json({ ...ordine, righe });
  } catch (err) {
    console.error(err);
    res.status(500).json({ errore: 'Errore interno del server' });
  }
});

// Apri ordine (tavolo o rapido)
router.post('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { tavolo_id } = req.body;

    if (tavolo_id) {
      const { rows: existing } = await query(
        `SELECT id FROM ordini WHERE tavolo_id = $1 AND stato = 'aperto'`,
        [tavolo_id]
      );
      if (existing.length > 0) {
        res.status(400).json({ errore: 'Tavolo già occupato' });
        return;
      }
    }

    const { rows } = await query(
      `INSERT INTO ordini (tavolo_id) VALUES ($1) RETURNING *`,
      [tavolo_id || null]
    );
    const ordine = rows[0];

    if (tavolo_id) {
      await query(`UPDATE tavoli SET stato = 'occupato' WHERE id = $1`, [tavolo_id]);
      io?.emit('tavolo_aggiornato', { id: tavolo_id, stato: 'occupato' });
    }

    res.status(201).json({ ...ordine, righe: [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ errore: 'Errore interno del server' });
  }
});

// Aggiungi riga a ordine
router.post('/:ordine_id/righe', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { prodotto_id, quantita = 1, prezzo_unitario, attributi_selezionati = {}, nota = '' } = req.body;

    if (!prodotto_id || prezzo_unitario == null) {
      res.status(400).json({ errore: 'prodotto_id e prezzo_unitario obbligatori' });
      return;
    }

    // Snapshot nome prodotto
    const { rows: prod } = await query(`SELECT nome FROM prodotti WHERE id = $1`, [prodotto_id]);
    if (prod.length === 0) {
      res.status(404).json({ errore: 'Prodotto non trovato' });
      return;
    }

    const { rows } = await query(
      `INSERT INTO righe_ordine (ordine_id, prodotto_id, nome_prodotto, quantita, prezzo_unitario, attributi_selezionati, nota)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.params.ordine_id, prodotto_id, prod[0].nome, quantita, prezzo_unitario,
       JSON.stringify(attributi_selezionati), nota]
    );

    const riga = rows[0];
    await aggiornaOrdineTotale(req.params.ordine_id);

    io?.emit('riga_aggiunta', { riga, ordine_id: req.params.ordine_id });
    res.status(201).json(riga);
  } catch (err) {
    console.error(err);
    res.status(500).json({ errore: 'Errore interno del server' });
  }
});

// Modifica riga
router.put('/:ordine_id/righe/:riga_id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { quantita, prezzo_unitario, attributi_selezionati, nota } = req.body;
    const { rows } = await query(
      `UPDATE righe_ordine SET
        quantita = COALESCE($1, quantita),
        prezzo_unitario = COALESCE($2, prezzo_unitario),
        attributi_selezionati = COALESCE($3::jsonb, attributi_selezionati),
        nota = COALESCE($4, nota)
       WHERE id = $5 AND ordine_id = $6 RETURNING *`,
      [quantita, prezzo_unitario, attributi_selezionati ? JSON.stringify(attributi_selezionati) : null,
       nota, req.params.riga_id, req.params.ordine_id]
    );

    await aggiornaOrdineTotale(req.params.ordine_id);
    io?.emit('riga_aggiunta', { riga: rows[0], ordine_id: req.params.ordine_id });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ errore: 'Errore interno del server' });
  }
});

// Elimina riga
router.delete('/:ordine_id/righe/:riga_id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    await query(`DELETE FROM righe_ordine WHERE id = $1 AND ordine_id = $2`,
      [req.params.riga_id, req.params.ordine_id]);
    await aggiornaOrdineTotale(req.params.ordine_id);
    io?.emit('riga_rimossa', { riga_id: req.params.riga_id, ordine_id: req.params.ordine_id });
    res.json({ messaggio: 'Riga eliminata' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ errore: 'Errore interno del server' });
  }
});

// Libera tavolo (chiude ordine vuoto)
router.post('/:ordine_id/libera', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { rows } = await query(`SELECT * FROM ordini WHERE id = $1`, [req.params.ordine_id]);
    if (rows.length === 0) {
      res.status(404).json({ errore: 'Ordine non trovato' });
      return;
    }
    const ordine = rows[0];
    await query(`UPDATE ordini SET stato = 'chiuso' WHERE id = $1`, [ordine.id]);
    if (ordine.tavolo_id) {
      await query(`UPDATE tavoli SET stato = 'libero' WHERE id = $1`, [ordine.tavolo_id]);
      io?.emit('tavolo_aggiornato', { id: ordine.tavolo_id, stato: 'libero' });
    }
    res.json({ messaggio: 'Tavolo liberato' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ errore: 'Errore interno del server' });
  }
});

async function aggiornaOrdineTotale(ordine_id: string) {
  await query(
    `UPDATE ordini SET totale = (
      SELECT COALESCE(SUM(quantita * prezzo_unitario), 0)
      FROM righe_ordine
      WHERE ordine_id = $1
    ) WHERE id = $1`,
    [ordine_id]
  );
}

export default router;

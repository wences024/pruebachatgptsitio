import { Router, Request, Response } from 'express';
import { query } from '../db';
import { requireAuth } from '../middleware/auth';
import { Server as SocketServer } from 'socket.io';
import { stampaScontrino } from '../services/epson';

const router = Router();
let io: SocketServer | null = null;

export function setSocketIO(socketIO: SocketServer) {
  io = socketIO;
}

router.post('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { ordine_id, tipo, metodo, importo, righe_pagate = [], num_persone } = req.body;

    if (!ordine_id || !tipo || !metodo || importo == null) {
      res.status(400).json({ errore: 'Campi obbligatori mancanti' });
      return;
    }

    const { rows: ordineRows } = await query(
      `SELECT * FROM ordini WHERE id = $1 AND stato = 'aperto'`,
      [ordine_id]
    );
    if (ordineRows.length === 0) {
      res.status(404).json({ errore: 'Ordine non trovato o già chiuso' });
      return;
    }
    const ordine = ordineRows[0];

    // Crea transazione
    const { rows } = await query(
      `INSERT INTO transazioni (ordine_id, tipo, metodo, importo, righe_pagate)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [ordine_id, tipo, metodo, importo, JSON.stringify(righe_pagate)]
    );
    const transazione = rows[0];

    // Gestione pagamento parziale — rimuovi righe pagate o decrementa quantità
    if (tipo === 'selezione' && righe_pagate.length > 0) {
      for (const rp of righe_pagate) {
        const { rows: rigaRows } = await query(
          `SELECT * FROM righe_ordine WHERE id = $1`,
          [rp.riga_id]
        );
        if (rigaRows.length === 0) continue;
        const riga = rigaRows[0];

        if (rp.quantita_pagata >= riga.quantita) {
          await query(`DELETE FROM righe_ordine WHERE id = $1`, [riga.id]);
          io?.emit('riga_rimossa', { riga_id: riga.id, ordine_id });
        } else {
          await query(
            `UPDATE righe_ordine SET quantita = quantita - $1 WHERE id = $2`,
            [rp.quantita_pagata, riga.id]
          );
          io?.emit('riga_aggiornata', { riga_id: riga.id, ordine_id });
        }

        // Decrementa stock
        await query(
          `UPDATE prodotti SET stock = GREATEST(stock - $1, 0) WHERE id = (SELECT prodotto_id FROM righe_ordine WHERE id = $2)`,
          [rp.quantita_pagata, rp.riga_id]
        );
      }

      // Controlla se ordine vuoto dopo pagamento parziale
      const { rows: rimanenti } = await query(
        `SELECT COUNT(*) FROM righe_ordine WHERE ordine_id = $1`,
        [ordine_id]
      );
      if (parseInt(rimanenti[0].count) === 0) {
        await chiudiOrdine(ordine, io);
      }
    } else if (tipo === 'totale' || tipo === 'divisione') {
      // Pagamento totale: decrementa stock per tutte le righe
      const { rows: righe } = await query(
        `SELECT prodotto_id, quantita FROM righe_ordine WHERE ordine_id = $1`,
        [ordine_id]
      );
      for (const r of righe) {
        if (r.prodotto_id) {
          await query(
            `UPDATE prodotti SET stock = GREATEST(stock - $1, 0) WHERE id = $2`,
            [r.quantita, r.prodotto_id]
          );
          // Notifica aggiornamento stock
          const { rows: stockRows } = await query(
            `SELECT stock FROM prodotti WHERE id = $1`, [r.prodotto_id]
          );
          if (stockRows[0]) {
            io?.emit('stock_aggiornato', { prodotto_id: r.prodotto_id, stock: stockRows[0].stock });
          }
        }
      }
      await chiudiOrdine(ordine, io);
    }

    // Aggiorna vendite giornaliere
    await aggiornaVenditeGiornaliere(metodo, importo);

    // Stampa scontrino fiscale (se configurata)
    const epsonIp = process.env.EPSON_FP81_IP;
    const epsonPorta = parseInt(process.env.EPSON_FP81_PORT || '9100');
    if (epsonIp) {
      try {
        const { rows: righeStampa } = await query(
          `SELECT nome_prodotto, SUM(quantita) AS quantita, prezzo_unitario
           FROM righe_ordine WHERE ordine_id = $1
           GROUP BY nome_prodotto, prezzo_unitario`,
          [ordine_id]
        );
        // Recupera righe dal momento della transazione per pagamenti parziali
        const righePerStampa = tipo === 'totale' || tipo === 'divisione'
          ? righeStampa
          : righe_pagate.map((rp: { riga_id: string; quantita_pagata: number }) => ({
              nome_prodotto: rp.riga_id,
              quantita: rp.quantita_pagata,
              prezzo_unitario: 0,
            }));

        if (righePerStampa.length > 0) {
          await stampaScontrino(
            epsonIp,
            epsonPorta,
            righePerStampa.map((r: { nome_prodotto: string; quantita: number; prezzo_unitario: number }) => ({
              nome: r.nome_prodotto,
              quantita: parseFloat(r.quantita),
              prezzo: parseFloat(r.prezzo_unitario),
            })),
            metodo,
            importo
          );
          await query(`UPDATE transazioni SET stampato = true WHERE id = $1`, [transazione.id]);
        }
      } catch (stampErr) {
        console.warn('Errore stampa scontrino (non critico):', stampErr);
      }
    }

    res.status(201).json(transazione);
  } catch (err) {
    console.error(err);
    res.status(500).json({ errore: 'Errore interno del server' });
  }
});

async function chiudiOrdine(ordine: { id: string; tavolo_id?: string }, socketIO: SocketServer | null) {
  await query(`UPDATE ordini SET stato = 'pagato' WHERE id = $1`, [ordine.id]);
  if (ordine.tavolo_id) {
    await query(`UPDATE tavoli SET stato = 'libero' WHERE id = $1`, [ordine.tavolo_id]);
    socketIO?.emit('tavolo_aggiornato', { id: ordine.tavolo_id, stato: 'libero' });
  }
  socketIO?.emit('ordine_pagato', { ordine_id: ordine.id, tavolo_id: ordine.tavolo_id });
}

async function aggiornaVenditeGiornaliere(metodo: string, importo: number) {
  const oggi = new Date().toISOString().split('T')[0];
  await query(`
    INSERT INTO vendite_giornaliere (data, totale, contanti, carta, satispay, num_transazioni)
    VALUES ($1, $2, $3, $4, $5, 1)
    ON CONFLICT (data) DO UPDATE SET
      totale = vendite_giornaliere.totale + $2,
      contanti = vendite_giornaliere.contanti + $3,
      carta = vendite_giornaliere.carta + $4,
      satispay = vendite_giornaliere.satispay + $5,
      num_transazioni = vendite_giornaliere.num_transazioni + 1
  `, [
    oggi,
    importo,
    metodo === 'contanti' ? importo : 0,
    metodo === 'carta' ? importo : 0,
    metodo === 'satispay' ? importo : 0,
  ]);
}

// Riepilogo giornata
router.get('/riepilogo-oggi', requireAuth, async (_req: Request, res: Response): Promise<void> => {
  try {
    const oggi = new Date().toISOString().split('T')[0];
    const { rows } = await query(
      `SELECT * FROM vendite_giornaliere WHERE data = $1`,
      [oggi]
    );
    res.json(rows[0] || { totale: 0, contanti: 0, carta: 0, satispay: 0, num_transazioni: 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ errore: 'Errore interno del server' });
  }
});

export default router;

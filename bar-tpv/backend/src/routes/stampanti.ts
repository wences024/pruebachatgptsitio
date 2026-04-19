import { Router, Request, Response } from 'express';
import { query } from '../db';
import { requireAuth, requireRuolo } from '../middleware/auth';
import { stampaComanda, apriCassetto, zReport, testConnessione } from '../services/epson';

const router = Router();

router.get('/', requireAuth, async (_req: Request, res: Response): Promise<void> => {
  try {
    const { rows } = await query(`SELECT * FROM stampanti ORDER BY tipo, nome`);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ errore: 'Errore interno del server' });
  }
});

router.post('/', requireAuth, requireRuolo('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { nome, ip, porta = 9100, tipo, attiva = true } = req.body;
    if (!nome || !ip || !tipo) {
      res.status(400).json({ errore: 'Nome, IP e tipo obbligatori' });
      return;
    }
    const { rows } = await query(
      `INSERT INTO stampanti (nome, ip, porta, tipo, attiva) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [nome, ip, porta, tipo, attiva]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ errore: 'Errore interno del server' });
  }
});

router.put('/:id', requireAuth, requireRuolo('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { nome, ip, porta, tipo, attiva } = req.body;
    const { rows } = await query(
      `UPDATE stampanti SET
        nome = COALESCE($1, nome),
        ip = COALESCE($2, ip),
        porta = COALESCE($3, porta),
        tipo = COALESCE($4, tipo),
        attiva = COALESCE($5, attiva)
       WHERE id = $6 RETURNING *`,
      [nome, ip, porta, tipo, attiva, req.params.id]
    );
    if (rows.length === 0) {
      res.status(404).json({ errore: 'Stampante non trovata' });
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
    await query(`DELETE FROM stampanti WHERE id = $1`, [req.params.id]);
    res.json({ messaggio: 'Stampante eliminata' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ errore: 'Errore interno del server' });
  }
});

router.post('/:id/test', requireAuth, requireRuolo('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { rows } = await query(`SELECT * FROM stampanti WHERE id = $1`, [req.params.id]);
    if (rows.length === 0) {
      res.status(404).json({ errore: 'Stampante non trovata' });
      return;
    }
    const online = await testConnessione(rows[0].ip, rows[0].porta);
    res.json({ online });
  } catch (err) {
    console.error(err);
    res.status(500).json({ errore: 'Errore test connessione' });
  }
});

// Stampa comanda — smista automaticamente per categoria
router.post('/comanda', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { ordine_id, tavolo_numero } = req.body;

    // Recupera righe con categoria
    const { rows: righe } = await query(`
      SELECT r.nome_prodotto, r.quantita, r.nota, r.attributi_selezionati,
             c.destinazione_stampa
      FROM righe_ordine r
      LEFT JOIN prodotti p ON p.id = r.prodotto_id
      LEFT JOIN categorie c ON c.id = p.categoria_id
      WHERE r.ordine_id = $1
    `, [ordine_id]);

    // Recupera stampanti attive
    const { rows: stampanti } = await query(
      `SELECT * FROM stampanti WHERE attiva = true`
    );

    const stampaBar = stampanti.find(s => s.tipo === 'bar');
    const stampaCucina = stampanti.find(s => s.tipo === 'cucina');

    const righeBar = righe.filter(r =>
      r.destinazione_stampa === 'bar' || r.destinazione_stampa === 'entrambe'
    );
    const righeCucina = righe.filter(r =>
      r.destinazione_stampa === 'cucina' || r.destinazione_stampa === 'entrambe'
    );

    const errori: string[] = [];

    if (stampaBar && righeBar.length > 0) {
      try {
        await stampaComanda(stampaBar.ip, stampaBar.porta, righeBar, tavolo_numero?.toString());
      } catch {
        errori.push(`Bar: stampante non raggiungibile`);
      }
    }

    if (stampaCucina && righeCucina.length > 0) {
      try {
        await stampaComanda(stampaCucina.ip, stampaCucina.porta, righeCucina, tavolo_numero?.toString());
      } catch {
        errori.push(`Cucina: stampante non raggiungibile`);
      }
    }

    res.json({
      messaggio: errori.length === 0 ? 'Comanda inviata' : 'Comanda inviata con avvisi',
      errori,
      righe_bar: righeBar.length,
      righe_cucina: righeCucina.length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ errore: 'Errore stampa comanda' });
  }
});

// Apri cassetto fiscale
router.post('/cassetto', requireAuth, async (_req: Request, res: Response): Promise<void> => {
  try {
    const { rows } = await query(`SELECT * FROM stampanti WHERE tipo = 'fiscale' AND attiva = true LIMIT 1`);
    if (rows.length === 0) {
      res.status(400).json({ errore: 'Nessuna stampante fiscale configurata' });
      return;
    }
    await apriCassetto(rows[0].ip, rows[0].porta);
    res.json({ messaggio: 'Cassetto aperto' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ errore: 'Errore apertura cassetto' });
  }
});

// Z-Report chiusura giornata
router.post('/z-report', requireAuth, requireRuolo('admin', 'cassiere'), async (_req: Request, res: Response): Promise<void> => {
  try {
    const { rows } = await query(`SELECT * FROM stampanti WHERE tipo = 'fiscale' AND attiva = true LIMIT 1`);
    if (rows.length === 0) {
      res.status(400).json({ errore: 'Nessuna stampante fiscale configurata' });
      return;
    }
    await zReport(rows[0].ip, rows[0].porta);
    res.json({ messaggio: 'Z-Report inviato' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ errore: 'Errore Z-Report' });
  }
});

export default router;

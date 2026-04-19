import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { creaPagamento, verificaPagamento } from '../services/satispay';
import { query } from '../db';

const router = Router();

router.post('/crea-pagamento', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { importo, ordine_id } = req.body;
    if (!importo || !ordine_id) {
      res.status(400).json({ errore: 'importo e ordine_id obbligatori' });
      return;
    }
    const { payment_id, qr_code } = await creaPagamento(importo, `Ordine ${ordine_id}`);
    res.json({ payment_id, qr_code });
  } catch (err: unknown) {
    console.error(err);
    res.status(500).json({ errore: err instanceof Error ? err.message : 'Errore Satispay' });
  }
});

router.get('/verifica/:payment_id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const payment = await verificaPagamento(req.params.payment_id);
    res.json(payment);
  } catch (err: unknown) {
    console.error(err);
    res.status(500).json({ errore: 'Errore verifica pagamento' });
  }
});

router.post('/webhook', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: payment_id, status } = req.body;
    if (status === 'ACCEPTED') {
      console.log(`Pagamento Satispay confermato: ${payment_id}`);
      // Qui si potrebbe aggiornare lo stato della transazione nel DB
      await query(
        `UPDATE transazioni SET stampato = true WHERE id IN (
          SELECT id FROM transazioni WHERE metodo = 'satispay' AND stampato = false
          ORDER BY creato_at DESC LIMIT 1
        )`
      );
    }
    res.status(200).send('OK');
  } catch (err) {
    console.error(err);
    res.status(500).send('ERROR');
  }
});

router.get('/stato', requireAuth, async (_req: Request, res: Response): Promise<void> => {
  const configurato = !!(process.env.SATISPAY_KEY_ID && process.env.SATISPAY_PRIVATE_KEY);
  res.json({
    configurato,
    env: process.env.SATISPAY_ENV || 'sandbox',
    key_id: process.env.SATISPAY_KEY_ID ? '***' + process.env.SATISPAY_KEY_ID.slice(-4) : null,
  });
});

export default router;

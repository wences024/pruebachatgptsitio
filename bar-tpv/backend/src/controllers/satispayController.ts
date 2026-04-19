import { Request, Response } from 'express';
import { creaPagamentoSatispay, gestisciWebhookSatispay } from '../services/satispay.js';

export async function createPayment(req: Request, res: Response) {
  const { importo } = req.body;
  res.json(await creaPagamentoSatispay(importo));
}

export async function webhook(req: Request, res: Response) {
  res.json(await gestisciWebhookSatispay(req.body));
}

import { Request, Response } from 'express';
import { apriCassetto, inviaComanda, stampaFiscale } from '../services/epson.js';

export async function postCassetto(_req: Request, res: Response) {
  const result = await apriCassetto();
  res.json(result);
}

export async function postFiscale(req: Request, res: Response) {
  const result = await stampaFiscale(req.body);
  res.json(result);
}

export async function postComanda(req: Request, res: Response) {
  const { destinazione, contenuto } = req.body;
  const result = await inviaComanda(destinazione, contenuto);
  res.json(result);
}

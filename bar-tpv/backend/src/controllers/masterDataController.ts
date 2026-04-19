import { Request, Response } from 'express';
import { attributiDemo, categorieDemo, prodottiDemo, saleDemo, tavoliDemo, venditeDemo, utentiDemo } from '../models/demoData.js';

export function getCategorie(_req: Request, res: Response) {
  res.json(categorieDemo);
}
export function getAttributi(_req: Request, res: Response) {
  res.json(attributiDemo);
}
export function getProdotti(_req: Request, res: Response) {
  res.json(prodottiDemo);
}
export function getSale(_req: Request, res: Response) {
  res.json(saleDemo);
}
export function getTavoli(_req: Request, res: Response) {
  res.json(tavoliDemo);
}
export function getUtenti(_req: Request, res: Response) {
  res.json(utentiDemo.map(({ password, ...utente }) => utente));
}
export function getVenditeGiornaliere(_req: Request, res: Response) {
  res.json(venditeDemo);
}

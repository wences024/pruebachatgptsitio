import { Router } from 'express';
import { getAttributi, getCategorie, getProdotti, getSale, getTavoli, getUtenti, getVenditeGiornaliere } from '../controllers/masterDataController.js';

const router = Router();
router.get('/categorie', getCategorie);
router.get('/attributi', getAttributi);
router.get('/prodotti', getProdotti);
router.get('/sale', getSale);
router.get('/tavoli', getTavoli);
router.get('/utenti', getUtenti);
router.get('/vendite-giornaliere', getVenditeGiornaliere);
export default router;

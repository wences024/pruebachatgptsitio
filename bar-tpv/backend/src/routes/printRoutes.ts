import { Router } from 'express';
import { postCassetto, postComanda, postFiscale } from '../controllers/printController.js';

const router = Router();
router.post('/cassetto', postCassetto);
router.post('/fiscale', postFiscale);
router.post('/comanda', postComanda);
export default router;

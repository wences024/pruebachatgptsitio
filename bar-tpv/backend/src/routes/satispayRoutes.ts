import { Router } from 'express';
import { createPayment, webhook } from '../controllers/satispayController.js';

const router = Router();
router.post('/crea-pagamento', createPayment);
router.post('/webhook', webhook);
export default router;

import { Router } from 'express';
import PaymentController from '../controllers/payment.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';
import { validateWebhookSignature } from '../middlewares/payment.middleware';

const router = Router();
const paymentController = new PaymentController();

// Protected payment routes
router.use('/initiate', authenticateJWT);
router.post('/initiate', paymentController.initiatePayment);
router.get('/status/:paymentId', paymentController.getPaymentStatus);

// Webhook routes (public but validated)
router.post(
  '/webhook/mpesa',
  (req, res, next) => {
    validateWebhookSignature(req, res, next);
  },
  paymentController.handleMpesaWebhook);
router.post(
  '/webhook/paypal',
  (req, res, next) => {
    validateWebhookSignature(req, res, next);
  },
  paymentController.handlePayPalWebhook
);


export default router;
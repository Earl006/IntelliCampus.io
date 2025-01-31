import { Request, Response } from 'express';
import { PaymentService } from '../services/payment.service';
import { PaymentMethod } from '../interfaces/payment';

export default class PaymentController {
  private paymentService: PaymentService;

  constructor() {
    this.paymentService = new PaymentService();
  }

  async initiatePayment(req: Request, res: Response) {
    try {
      const { amount, courseId, paymentMethod, phoneNumber, currency } = req.body;
      const userId = req.user.id; // From auth middleware

      if (!amount || !courseId || !paymentMethod) {
         res.status(400).json({
          success: false,
          message: 'Missing required payment details'
        });
      }

      const paymentResponse = await this.paymentService.initiatePayment({
        amount,
        userId,
        courseId,
        paymentMethod,
        phoneNumber,
        currency,
        customerEmail: req.user.email
      });

       res.status(200).json({
        success: true,
        data: paymentResponse
      });
    } catch (error: any) {
       res.status(500).json({
        success: false,
        message: error.message || 'Payment initiation failed'
      });
    }
  }

  async handleMpesaWebhook(req: Request, res: Response) {
    try {
      await this.paymentService.handleWebhook(PaymentMethod.MPESA, req.body);
       res.status(200).json({ success: true });
    } catch (error: any) {
       res.status(500).json({
        success: false,
        message: error.message || 'Failed to process M-Pesa webhook'
      });
    }
  }

  async handlePayPalWebhook(req: Request, res: Response) {
    try {
      await this.paymentService.handleWebhook(PaymentMethod.PAYPAL, req.body);
       res.status(200).json({ success: true });
    } catch (error: any) {
       res.status(500).json({
        success: false,
        message: error.message || 'Failed to process PayPal webhook'
      });
    }
  }

  async getPaymentStatus(req: Request, res: Response) {
    try {
      const { paymentId } = req.params;
      const status = await this.paymentService.getPaymentStatus(paymentId);

       res.status(200).json({
        success: true,
        data: { status }
      });
    } catch (error: any) {
       res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch payment status'
      });
    }
  }
}
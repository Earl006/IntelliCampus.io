import { Request, Response, NextFunction } from 'express';
import { PaymentMethod } from '../interfaces/payment';
import crypto from 'crypto';

export const validateWebhookSignature = (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  try {
    const signature = req.headers['x-webhook-signature'];
    const paymentProvider = req.path.includes('mpesa') ? 'mpesa' : 'paypal';

    if (!signature) {
      return res.status(401).json({
        success: false,
        message: 'Missing webhook signature'
      });
    }

    // Verify signature based on payment provider
    if (paymentProvider === 'mpesa') {
      const mpesaKey = process.env.MPESA_WEBHOOK_KEY || '';
      if (!mpesaKey) {
        return res.status(500).json({
          success: false,
          message: 'Missing M-Pesa webhook key configuration'
        });
      }
      const payload = JSON.stringify(req.body);
      const computedSignature = crypto
        .createHmac('sha256', mpesaKey)
        .update(payload)
        .digest('hex');

    } else {
      const paypalKey = process.env.PAYPAL_WEBHOOK_KEY || '';
      if (!paypalKey) {
        return res.status(500).json({
          success: false,
          message: 'Missing PayPal webhook key configuration'
        });
      }
      const payload = JSON.stringify(req.body);
      const computedSignature = crypto
        .createHmac('sha256', paypalKey)
        .update(payload)
        .digest('hex');

      if (signature !== computedSignature) {
        return res.status(401).json({
          success: false,
          message: 'Invalid PayPal webhook signature'
        });
      }
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Webhook validation failed'
    });
  }
};

export const validatePaymentMethod = (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  const { paymentMethod } = req.body;

  if (!paymentMethod || !Object.values(PaymentMethod).includes(paymentMethod)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid payment method'
    });
  }

  next();
};

export const validateAmount = (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  const { amount } = req.body;

  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Invalid payment amount'
    });
  }

  next();
};

export const validateCurrency = (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  const { currency } = req.body;
  const validCurrencies = ['USD', 'KES'];

  if (!currency || !validCurrencies.includes(currency.toUpperCase())) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or unsupported currency'
    });
  }

  next();
};
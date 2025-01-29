import checkoutNodeJssdk from '@paypal/checkout-server-sdk';
import { PaymentResponse } from '../interfaces/payment';

export class PayPalService {
  private client: checkoutNodeJssdk.core.PayPalHttpClient;

  constructor() {
    const environment = process.env.NODE_ENV === 'production'
      ? new checkoutNodeJssdk.core.LiveEnvironment(
          process.env.PAYPAL_CLIENT_ID!,
          process.env.PAYPAL_CLIENT_SECRET!
        )
      : new checkoutNodeJssdk.core.SandboxEnvironment(
          process.env.PAYPAL_CLIENT_ID!,
          process.env.PAYPAL_CLIENT_SECRET!
        );

    this.client = new checkoutNodeJssdk.core.PayPalHttpClient(environment);
  }

  async createOrder(amount: number, currency: string = 'USD'): Promise<PaymentResponse> {
    try {
      const request = new checkoutNodeJssdk.orders.OrdersCreateRequest();
      request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: currency,
            value: amount.toString()
          }
        }]
      });

      const order = await this.client.execute(request);
      
      if (!order.result.id) {
        throw new Error('Failed to create PayPal order');
      }

      return {
        success: true,
        transactionId: order.result.id,
        status: 'PENDING'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        status: 'FAILED'
      };
    }
  }

  async capturePayment(orderId: string): Promise<PaymentResponse> {
    try {
      const request = new checkoutNodeJssdk.orders.OrdersCaptureRequest(orderId);
      const capture = await this.client.execute(request);

      return {
        success: true,
        transactionId: capture.result.id,
        status: capture.result.status === 'COMPLETED' ? 'COMPLETED' : 'PENDING'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        status: 'FAILED'
      };
    }
  }

  async verifyWebhookSignature(headers: any, body: string): Promise<boolean> {
    try {
      // @ts-ignore
            const request = new checkoutNodeJssdk.notifications.VerifyWebhookSignatureRequest();
      request.requestBody({
        auth_algo: headers['paypal-auth-algo'],
        cert_url: headers['paypal-cert-url'],
        transmission_id: headers['paypal-transmission-id'],
        transmission_sig: headers['paypal-transmission-sig'],
        transmission_time: headers['paypal-transmission-time'],
        webhook_id: process.env.PAYPAL_WEBHOOK_ID,
        webhook_event: JSON.parse(body)
      });

      const response = await this.client.execute(request);
      return response.result.verification_status === 'SUCCESS';
    } catch {
      return false;
    }
  }
}
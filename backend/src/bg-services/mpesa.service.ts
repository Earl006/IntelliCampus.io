import axios from 'axios';
import { PaymentResponse } from '../interfaces/payment';

export class MpesaService {
  private readonly consumerKey: string;
  private readonly consumerSecret: string;
  private readonly passkey: string;
  private readonly shortcode: string;
  private readonly callbackUrl: string;

  constructor() {
    this.consumerKey = process.env.MPESA_CONSUMER_KEY!;
    this.consumerSecret = process.env.MPESA_CONSUMER_SECRET!;
    this.passkey = process.env.MPESA_PASSKEY!;
    this.shortcode = process.env.MPESA_SHORTCODE!;
    this.callbackUrl = `${process.env.BASE_URL}/api/payments/mpesa/callback`;
  }

  private async getAccessToken(): Promise<string> {
    const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');
    const response = await axios.get(
      'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    );
    return response.data.access_token;
  }

  async initiatePayment(
    phoneNumber: string,
    amount: number,
    accountReference: string
  ): Promise<PaymentResponse> {
    try {
      const token = await this.getAccessToken();
      const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
      const password = Buffer.from(
        `${this.shortcode}${this.passkey}${timestamp}`
      ).toString('base64');

      const response = await axios.post(
        'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
        {
          BusinessShortCode: this.shortcode,
          Password: password,
          Timestamp: timestamp,
          TransactionType: 'CustomerPayBillOnline',
          Amount: amount,
          PartyA: phoneNumber,
          PartyB: this.shortcode,
          PhoneNumber: phoneNumber,
          CallBackURL: this.callbackUrl,
          AccountReference: accountReference,
          TransactionDesc: 'Course Payment',
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return {
        success: true,
        transactionId: response.data.CheckoutRequestID,
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

  async verifyTransaction(checkoutRequestId: string): Promise<PaymentResponse> {
    // Implement verification logic
    // This would query M-Pesa API to check transaction status
    return {
      success: true,
      transactionId: checkoutRequestId,
      status: 'COMPLETED'
    };
  }
}
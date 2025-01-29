import { PrismaClient, PaymentStatus } from '@prisma/client';
import { MpesaService } from '../bg-services/mpesa.service';
import { PayPalService } from '../bg-services/paypal.service';
import { PaymentMethod, PaymentRequest, PaymentResponse } from '../interfaces/payment';
import { createClient } from 'redis';

export class PaymentService {
  private prisma: PrismaClient;
  private mpesa: MpesaService;
  private paypal: PayPalService;
  private redis: ReturnType<typeof createClient>;

  constructor() {
    this.prisma = new PrismaClient();
    this.mpesa = new MpesaService();
    this.paypal = new PayPalService();
    this.redis = createClient({
      url: process.env.REDIS_URL
    });
    this.redis.connect();
  }

  async initiatePayment(request: PaymentRequest): Promise<PaymentResponse> {
    // Create payment record
    const payment = await this.prisma.payment.create({
      data: {
        amount: request.amount,
        userId: request.userId,
        courseId: request.courseId,
        status: 'PENDING'
      }
    });

    let response: PaymentResponse;

    switch (request.paymentMethod) {
      case PaymentMethod.MPESA:
        if (!request.phoneNumber) throw new Error('Phone number required for M-Pesa');
        response = await this.mpesa.initiatePayment(
          request.phoneNumber,
          request.amount,
          payment.id
        );
        break;

      case PaymentMethod.PAYPAL:
        response = await this.paypal.createOrder(
          request.amount,
          request.currency
        );
        break;

      default:
        throw new Error('Unsupported payment method');
    }

    // Cache payment details for webhook processing
    await this.redis.set(
      `payment:${payment.id}`,
      JSON.stringify({ ...payment, transactionId: response.transactionId })
    );

    return response;
  }

  async handleWebhook(method: PaymentMethod, payload: any): Promise<void> {
    let paymentId: string;
    let status: PaymentStatus;

    switch (method) {
      case PaymentMethod.MPESA:
        paymentId = payload.AccountReference;
        status = payload.ResultCode === '0' ? 'COMPLETED' : 'FAILED';
        break;

      case PaymentMethod.PAYPAL:
        const cached = await this.redis.get(`paypal:${payload.orderID}`);
        if (!cached) throw new Error('Payment not found');
        const payment = JSON.parse(cached);
        paymentId = payment.id;
        status = 'COMPLETED';
        break;

      default:
        throw new Error('Unsupported payment method');
    }

    await this.prisma.payment.update({
      where: { id: paymentId },
      data: { status }
    });

    // If payment successful, enroll student
    if (status === 'COMPLETED') {
      const payment = await this.prisma.payment.findUnique({
        where: { id: paymentId }
      });
      
      if (payment) {
        await this.prisma.enrollment.create({
          data: {
            userId: payment.userId,
            courseId: payment.courseId
          }
        });
      }
    }
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    const cached = await this.redis.get(`payment:${paymentId}`);
    if (cached) {
      return JSON.parse(cached).status;
    }

    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId }
    });

    return payment?.status || 'FAILED';
  }
}
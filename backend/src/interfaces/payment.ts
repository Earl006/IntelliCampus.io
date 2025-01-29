import { PaymentStatus } from "@prisma/client";

export enum PaymentMethod {
    MPESA = 'MPESA',
    PAYPAL = 'PAYPAL',
    SQUARE = 'SQUARE'
  }
  
  export interface PaymentResponse {
    success: boolean;
    transactionId?: string;
    error?: string;
    status: PaymentStatus;
  }
  
  export interface PaymentRequest {
    amount: number;
    currency: string;
    courseId: string;
    userId: string;
    paymentMethod: PaymentMethod;
    customerEmail: string;
    phoneNumber?: string;
  }
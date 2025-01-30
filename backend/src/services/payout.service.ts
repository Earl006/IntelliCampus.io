// import { PrismaClient, PayoutStatus, PayoutMethod } from '@prisma/client';
// import { MpesaService } from '../bg-services/mpesa.service';
// import { PayPalService } from '../bg-services/paypal.service';

// export class PayoutService {
//   private prisma: PrismaClient;
//   private mpesa: MpesaService;
//   private paypal: PayPalService;

//   constructor() {
//     this.prisma = new PrismaClient();
//     this.mpesa = new MpesaService();
//     this.paypal = new PayPalService();
//   }

//   async requestPayout(instructorId: string, amount: number, method: PayoutMethod) {
//     // Verify instructor earnings
//     const earnings = await this.calculateInstructorEarnings(instructorId);
//     if (earnings < amount) {
//       throw new Error('Insufficient balance');
//     }

//     // Create payout request
//     return this.prisma.payout.create({
//       data: {
//         instructorId,
//         amount,
//         method,
//         status: 'PENDING'
//       }
//     });
//   }

//   async approvePayout(payoutId: string) {
//     const payout = await this.prisma.payout.findUnique({
//       where: { id: payoutId },
//       include: { instructor: true }
//     });

//     if (!payout) throw new Error('Payout not found');

//     try {
//       // Process payout based on method
//       switch (payout.method) {
//         case 'MPESA':
//           await this.mpesa.initiateB2CPayment(
//             payout.instructor.phoneNumber,
//             payout.amount,
//             payout.id
//           );
//           break;
//         case 'PAYPAL':
//           await this.paypal.createPayout(
//             payout.instructor.email,
//             payout.amount,
//             'USD',
//             payout.id
//           );
//           break;
//       }

//       // Update payout status and instructor earnings
//       await this.prisma.$transaction([
//         this.prisma.payout.update({
//           where: { id: payoutId },
//           data: { status: 'COMPLETED' }
//         }),
//         this.prisma.user.update({
//           where: { id: payout.instructorId },
//           data: {
//             earnings: { decrement: payout.amount }
//           }
//         })
//       ]);

//       return payout;
//     } catch (error) {
//       await this.prisma.payout.update({
//         where: { id: payoutId },
//         data: { status: 'FAILED' }
//       });
//       throw error;
//     }
//   }

//   async rejectPayout(payoutId: string) {
//     return this.prisma.payout.update({
//       where: { id: payoutId },
//       data: { status: 'REJECTED' }
//     });
//   }

//   async getPayoutHistory(instructorId: string) {
//     return this.prisma.payout.findMany({
//       where: { instructorId },
//       include: { instructor: true },
//       orderBy: { createdAt: 'desc' }
//     });
//   }

//   private async calculateInstructorEarnings(instructorId: string): Promise<number> {
//     const instructor = await this.prisma.user.findUnique({
//       where: { id: instructorId }
//     });
    
//     return instructor?.earnings || 0;
//   }
// }
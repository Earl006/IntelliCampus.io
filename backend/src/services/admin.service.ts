import { PrismaClient, User, Role } from '@prisma/client';
import UserService from './user.service';
import CategoryService from './category.service';
import ChatService from './chat.service';
// import { PayoutService } from './payment.service';

export class AdminService {
  private prisma: PrismaClient;
  private userService: UserService;
  private categoryService: CategoryService;
  private chatService: ChatService;
//   private payoutService: PayoutService;

  constructor(
    prisma: PrismaClient,
    userService: UserService,
    categoryService: CategoryService,
    chatService: ChatService,
    // payoutService: PayoutService
  ) {
    this.prisma = prisma;
    this.userService = userService;
    this.categoryService = categoryService;
    this.chatService = chatService;
    // this.payoutService = payoutService;
  }

  // Instructor Management (wraps UserService)
  async approveInstructorRequest(userId: string): Promise<User | null> {
    return this.userService.approveInstructorRequests(userId);
  }

  async rejectInstructorRequest(userId: string): Promise<User | null> {
    return this.userService.rejectInstructorRequests(userId);
  }

  // User Management
  async manageUser(userId: string, action: 'activate' | 'deactivate' | 'delete'): Promise<User | null> {
    switch (action) {
      case 'activate':
        return this.userService.activateAccount(userId);
      case 'deactivate':
        return this.userService.deactivateAccount(userId);
      case 'delete':
        return this.userService.deleteAccount(userId);
      default:
        throw new Error('Invalid action');
    }
  }

  // Category Management (wraps CategoryService)
  async manageCategories(action: 'create' | 'update' | 'delete', params: {
    categoryId?: string;
    name: string;
  }) {
    switch (action) {
      case 'create':
        return this.categoryService.createCategory(params.name);
      case 'update':
        if (!params.categoryId) throw new Error('Category ID required');
        return this.categoryService.updateCategory(params.categoryId, params.name);
      case 'delete':
        if (!params.categoryId) throw new Error('Category ID required');
        return this.categoryService.deleteCategory(params.categoryId);
      default:
        throw new Error('Invalid action');
    }
  }

  // Chat Monitoring
  async monitorChatRooms() {
    const courseChatRooms = await this.prisma.courseChatRoom.findMany({
      include: {
        messages: {
          orderBy: { sentAt: 'desc' },
          take: 100
        }
      }
    });

    const cohortChatRooms = await this.prisma.cohortChatRoom.findMany({
      include: {
        messages: {
          orderBy: { sentAt: 'desc' },
          take: 100
        }
      }
    });

    return {
      courseChatRooms,
      cohortChatRooms
    };
  }

  // Payout Management
//   async initiatePayout(instructorId: string, amount: number): Promise<void> {
//     const instructor = await this.userService.getInstructorByUserId(instructorId);
//     if (!instructor) {
//       throw new Error('Invalid instructor ID');
//     }

//     await this.payoutService.requestPayout(instructorId, amount, instructor.payoutMethod!);
//   }

  // Dashboard Statistics
  async getDashboardStats() {
    const [users, courses, activeChats, pendingPayouts] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.course.count(),
      this.prisma.chatMessage.count({
        where: {
          sentAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      }),
      this.prisma.payout.count({
        where: { status: 'PENDING' }
      })
    ]);

    return {
      totalUsers: users,
      totalCourses: courses,
      activeChats,
      pendingPayouts
    };
  }
}
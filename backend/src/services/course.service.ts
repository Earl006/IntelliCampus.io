import { PrismaClient, Course, Enrollment } from '@prisma/client';
import ChatService from './chat.service';
import { PaymentService } from './payment.service';
import { PaymentMethod } from '../interfaces/payment';

export default class CourseService {
  private prisma: PrismaClient;
  private chatService: ChatService;
  private paymentService: PaymentService;

  constructor(
    prismaClient: PrismaClient,
    chatService: ChatService,
    paymentService: PaymentService
  ) {
    this.prisma = prismaClient;
    this.chatService = chatService;
    this.paymentService = paymentService;
  }

  async createCourse(
    title: string,
    description: string,
    instructorId: string,
    bannerImageUrl?: string,
    isPaid?: boolean,
    price?: number,
    categoryIds?: string[],
    subCategoryIds?: string[]
  ) {
    const course = await this.prisma.course.create({
      data: {
        title,
        description,
        instructorId,
        bannerImageUrl,
        isPaid: isPaid || false,
        price: price || 0,
        categories: categoryIds
          ? {
              connect: categoryIds.map((cid) => ({ id: cid })),
            }
          : undefined,
        subCategories: subCategoryIds
          ? {
              connect: subCategoryIds.map((sid) => ({ id: sid })),
            }
          : undefined,
      },
    });

    // Create associated course chat room
    await this.chatService.createCourseChatRoom(course.id);
    return course;
  }

  async getCourse(courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        instructor: true,
        subCategories: true,
        chatRooms: true,
      },
    });

    return course;
  }

  async getPublishedCourses() {
    const courses = await this.prisma.course.findMany({
      where: { isPublished: true },
      include: {
        instructor: true,
        subCategories: true,
      },
    });
    return courses;
  }

  async getCoursesByInstructor(instructorId: string) {
    return this.prisma.course.findMany({
      where: { instructorId },
      include: {
        instructor: true,
        subCategories: true,
      },
    });
  }

  async getCoursesByCategory(categoryId: string) {
    return this.prisma.course.findMany({
      where: { subCategories: { some: { categoryId } } },
      include: {
        instructor: true,
        subCategories: true,
      },
    });
  }

  async updateCourse(
    courseId: string,
    data: Partial<Course> & {
      subCategoryIds?: string[];
    }
  ) {

    const existingCourse = await this.prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!existingCourse) {
      throw new Error('Course not found');
    }
    let subCatsConnect, subCatsDisconnect;
    if (data.subCategoryIds) {
      const existing = await this.prisma.course.findUnique({
        where: { id: courseId },
        select: { subCategories: true },
      });
      const existingIds = (existing?.subCategories || []).map((s) => s.id);
      subCatsConnect = data.subCategoryIds
        .filter((sid) => !existingIds.includes(sid))
        .map((sid) => ({ id: sid }));
      subCatsDisconnect = existingIds
        .filter((eid) => !data.subCategoryIds?.includes(eid))
        .map((eid) => ({ id: eid }));
    }

    const { subCategoryIds, ...rest } = data;
    return this.prisma.course.update({
      where: { id: courseId },
      data: {
        ...rest,
        subCategories:
          data.subCategoryIds !== undefined
            ? {
                connect: subCatsConnect,
                disconnect: subCatsDisconnect,
              }
            : undefined,
      },
    });
  }

  async deleteCourse(courseId: string) {
    // Cascade deletes chatRooms, enrollments, etc. as configured in schema
    return this.prisma.course.delete({ where: { id: courseId } });
  }

  async setCoursePublishStatus(courseId: string, published: boolean) {
    return this.prisma.course.update({
      where: { id: courseId },
      data: { isPublished: published },
    });
  }

  /**
   * Creates a new cohort for a course and sets up a chat room.
   */
  async createCohort(courseId: string, instructorId: string, startDate: Date) {
    // 1. Gather existing cohorts for the given course
    const existingCohorts = await this.prisma.cohort.findMany({
      where: { courseId },
      orderBy: { startDate: 'desc' } // newest start date first
    });
  
    // 2. Ensure the new cohort doesn't start earlier than the latest existing cohort
    if (existingCohorts.length > 0) {
      const latestCohort = existingCohorts[0];
      if (startDate < latestCohort.startDate) {
        throw new Error(
          `Cannot create a new cohort with a start date earlier than existing cohort (${latestCohort.name}).`
        );
      }
    }
  
    // 3. Compute the next cohort number by parsing existing cohort names
    let maxNumber = 0;
    for (const cohort of existingCohorts) {
      const parts = cohort.name.split(' ');
      const numPart = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(numPart) && numPart > maxNumber) {
        maxNumber = numPart;
      }
    }
    const newCohortNumber = maxNumber + 1;
  
    // 4. Create the new cohort
    const cohort = await this.prisma.cohort.create({
      data: {
        name: `Cohort ${newCohortNumber}`,
        courseId,
        instructorId,
        startDate
      },
      include: {
        chatRooms: true,
        course: {
          include: {
            chatRooms: true
          }
        }
      }
    });
  
    // 5. Create chat room for new cohort
    await this.chatService.createCohortChatRoom(cohort.id);
  
    return cohort;
  }

  /**
   * Retrieves all cohorts for a course.
   */
  async getCohortsForCourse(courseId: string) {
    return this.prisma.cohort.findMany({
      where: { courseId },
      include: { chatRooms: true },
    });
  }

  /**
   * Retrieves all enrollments for a course.
   */
  async getEnrollmentsForCourse(courseId: string) {
    return this.prisma.enrollment.findMany({
      where: { courseId },
    });
  }

  /**
   * Enrolls a student in a course, optionally requiring payment if course is paid.
   */
  async enrollStudent(
    studentId: string,
    courseId: string,
    paymentMethod?: PaymentMethod
  ): Promise<Enrollment> {
    console.log(`Attempting to enroll student ${studentId} in course ${courseId}`);
    
    // Check if course exists
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        chatRooms: true // Include chat rooms for notifications
      }
    });
    if (!course) {
      throw new Error('Course not found');
    }
  
    // Check if student already enrolled
    const existingEnrollment = await this.prisma.enrollment.findFirst({
      where: {
        userId: studentId,
        courseId,
      },
    });
    if (existingEnrollment) {
      throw new Error('Student is already enrolled in this course');
    }
  
    // If course is paid, handle payment
    if (course.isPaid) {
      if (!paymentMethod) {
        throw new Error('Payment method required for paid courses');
      }
  
      const user = await this.prisma.user.findUnique({ where: { id: studentId } });
      if (!user) {
        throw new Error('User not found');
      }
  
      console.log(`Initiating payment for student ${studentId}`);
      const paymentResponse = await this.paymentService.initiatePayment({
        amount: course.price,
        courseId,
        userId: studentId,
        paymentMethod,
        currency: 'KES',
        customerEmail: user.email,
        phoneNumber: user.phoneNumber,
      });
  
      if (!paymentResponse.success) {
        throw new Error('Payment failed. Please retry or use a different method.');
      }
  
      // Notify chat room about pending enrollment
      if (course.chatRooms[0]) {
        console.log(`Notifying course room ${course.chatRooms[0].id} about pending enrollment`);
        await this.chatService.notifyRoomMembership(
          course.chatRooms[0].id,
          studentId,
          'joined'
        );
      }
  
      // Enrollment completed after webhook confirms payment
      throw new Error('Payment initiated. Awaiting confirmation...');
    }
  
    // For free courses, enroll directly and notify
    console.log(`Creating direct enrollment for free course ${courseId}`);
    const enrollment = await this.createEnrollment(studentId, courseId);
  
    // Notify chat room about successful enrollment
    if (course.chatRooms?.[0]) {
      console.log('Notifying chat rooms about enrollment');
      await this.chatService.notifyRoomMembership(
        course.chatRooms[0].id,
        studentId,
        'joined'
      );
    }
  
    return enrollment;
  }

  /**
   * Helper method to create an enrollment + join chat rooms without payment flow.
   */
  private async createEnrollment(userId: string, courseId: string): Promise<Enrollment> {
    let cohort = await this.prisma.cohort.findFirst({
      where: {
        courseId,
        isCompleted: false,
      },
      include: {
        chatRooms: true,
        course: {
          include: {
            chatRooms: true,
          },
        },
      },
    });

    // If no active cohort, create one
    if (!cohort) {
      cohort = await this.createCohort(courseId, userId, new Date());
    }

    // Create enrollment
    const enrollment = await this.prisma.enrollment.create({
      data: {
        userId,
        courseId,
        cohortId: cohort.id,
      },
    });

    // Notify both the cohort and course rooms
    if (cohort.chatRooms[0]) {
      this.chatService.notifyRoomMembership(cohort.chatRooms[0].id, userId, 'joined');
    }
    if (cohort.course.chatRooms[0]) {
      this.chatService.notifyRoomMembership(cohort.course.chatRooms[0].id, userId, 'joined');
    }
    return enrollment;
  }

  /**
   * Defer a student from one cohort to another
   */
  async deferStudent(studentId: string, currentCohortId: string, targetCohortId: string) {
    const [currentCohort, targetCohort] = await Promise.all([
      this.prisma.cohort.findUnique({
        where: { id: currentCohortId },
        include: { chatRooms: true },
      }),
      this.prisma.cohort.findUnique({
        where: { id: targetCohortId },
        include: { chatRooms: true },
      }),
    ]);

    const updated = await this.prisma.enrollment.updateMany({
      where: { userId: studentId, cohortId: currentCohortId },
      data: { cohortId: targetCohortId },
    });

    // Notify chatRooms about membership change
    if (currentCohort?.chatRooms[0]) {
      this.chatService.notifyRoomMembership(currentCohort.chatRooms[0].id, studentId, 'left');
    }
    if (targetCohort?.chatRooms[0]) {
      this.chatService.notifyRoomMembership(targetCohort.chatRooms[0].id, studentId, 'joined');
    }

    return updated;
  }

  /**
   * Get enrollments for a user
   */
  async getEnrollmentsForUser(userId: string) {
    return this.prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: true,
        cohort: true,
      },
    });
  }
}
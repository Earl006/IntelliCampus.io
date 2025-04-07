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
      categoryIds?: string[]; // Add this to properly type the incoming data
    }
  ) {
    const existingCourse = await this.prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!existingCourse) {
      throw new Error('Course not found');
    }
  
    // Handle sub-categories connect/disconnect
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
  
    // Handle categories connect/disconnect
    let catsConnect, catsDisconnect;
    if (data.categoryIds) {
      const existing = await this.prisma.course.findUnique({
        where: { id: courseId },
        select: { categories: true },
      });
      const existingIds = (existing?.categories || []).map((c) => c.id);
      catsConnect = data.categoryIds
        .filter((cid) => !existingIds.includes(cid))
        .map((cid) => ({ id: cid }));
      catsDisconnect = existingIds
        .filter((eid) => !data.categoryIds?.includes(eid))
        .map((eid) => ({ id: eid }));
    }
  
    // Remove categoryIds and subCategoryIds from rest to avoid Prisma errors
    const { subCategoryIds, categoryIds, ...rest } = data;
    
    return this.prisma.course.update({
      where: { id: courseId },
      data: {
        ...rest,
        // Add categories handling if categoryIds is provided
        categories: data.categoryIds !== undefined
          ? {
              connect: catsConnect,
              disconnect: catsDisconnect,
            }
          : undefined,
        subCategories: data.subCategoryIds !== undefined
          ? {
              connect: subCatsConnect,
              disconnect: subCatsDisconnect,
            }
          : undefined,
      },
    });
  }

  async deleteCourse(courseId: string) {
    // Delete chat messages in course chat rooms first
    await this.prisma.chatMessage.deleteMany({
      where: {
        courseChatRoomId: {
          in: await this.prisma.courseChatRoom
            .findMany({
              where: { courseId },
              select: { id: true }
            })
            .then(rooms => rooms.map(r => r.id))
        }
      }
    });
    
    // Delete related records in order
    await this.prisma.courseChatRoom.deleteMany({ where: { courseId } });
    await this.prisma.enrollment.deleteMany({ where: { courseId } });
    await this.prisma.cohort.deleteMany({ where: { courseId } });
    await this.prisma.review.deleteMany({ where: { courseId } });
    await this.prisma.courseMaterial.deleteMany({ where: { courseId } });
    await this.prisma.assessment.deleteMany({ where: { courseId } });
    await this.prisma.announcement.deleteMany({ where: { courseId } });
    await this.prisma.certificate.deleteMany({ where: { courseId } });
    
    // Finally delete the course
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

 /**
 * Get detailed information about all courses taught by an instructor
 * Includes statistics needed for the instructor dashboard
 */
async getInstructorCourses(instructorId: string) {
  // Basic course info with enrollment counts
  const courses = await this.prisma.course.findMany({
    where: { instructorId },
    include: {
      _count: {
        select: { 
          enrollments: true,
          materials: true,
          reviews: true 
        }
      },
      // Get most recent reviews
      reviews: {
        orderBy: {
          createdAt: 'desc'
        },
        take: 3,
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      },
      // Get most recent enrollments
      enrollments: {
        orderBy: {
          enrolledAt: 'desc'
        },
        take: 5,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        }
      },
      // Include categories for filtering
      categories: true,
      subCategories: true
    }
  });

  // Enhance courses with additional analytics
  const enhancedCourses = await Promise.all(courses.map(async course => {
    // Calculate average rating
    const avgRating = await this.prisma.review.aggregate({
      where: { courseId: course.id },
      _avg: { rating: true }
    });

    // Calculate completion statistics
    const completionStats = await this.prisma.enrollment.aggregate({
      where: { courseId: course.id },
      _count: { id: true },
      _avg: { 
        progress: true 
      }
    });
    
    // Count completed enrollments separately
    const completedEnrollments = await this.prisma.enrollment.count({
      where: {
        courseId: course.id,
        completed: true
      }
    });
    
    // Calculate completion rate (percentage of enrollments that are completed)
    const completionRate = completionStats._count.id > 0
      ? (completedEnrollments / completionStats._count.id) * 100
      : 0;

    // Get revenue data
    const revenue = await this.prisma.payment.aggregate({
      where: {
        courseId: course.id,
        status: 'COMPLETED'
      },
      _sum: { amount: true },
      _count: { id: true }
    });

    // Check if published and has materials
    const isReadyToPublish = course._count.materials > 0 && 
                            course.title && 
                            course.description;

    return {
      ...course,
      statistics: {
        totalEnrollments: course._count.enrollments,
        totalMaterials: course._count.materials,
        totalReviews: course._count.reviews,
        avgRating: avgRating._avg.rating || 0,
        completionRate: parseFloat(completionRate.toFixed(1)),
        avgProgress: parseFloat((completionStats._avg.progress || 0).toFixed(1)),
        revenue: revenue._sum.amount || 0,
        totalPayments: revenue._count.id || 0,
        isReadyToPublish
      }
    };
  }));

  return enhancedCourses;
}

/**
 * Get comprehensive analytics for a specific course
 * Provides data needed for the course analytics dashboard
 */
async getCourseAnalytics(courseId: string) {
  // Verify the course exists
  const course = await this.prisma.course.findUnique({
    where: { id: courseId },
    include: {
      _count: {
        select: {
          enrollments: true,
          materials: true,
          reviews: true
        }
      },
      instructor: {
        select: {
          firstName: true,
          lastName: true
        }
      }
    }
  });

  if (!course) {
    throw new Error('Course not found');
  }

  // 1. Enrollment trends (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const enrollments = await this.prisma.enrollment.findMany({
    where: {
      courseId,
      enrolledAt: { gte: sixMonthsAgo }
    },
    select: {
      id: true,
      enrolledAt: true,
      progress: true,
      completed: true
    },
    orderBy: {
      enrolledAt: 'asc'
    }
  });

  // Group enrollments by month
  const enrollmentsByMonth = enrollments.reduce((acc, enrollment) => {
    const month = enrollment.enrolledAt.toISOString().substring(0, 7); // YYYY-MM format
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Fill in missing months with zero values
  const monthlyEnrollmentTrends: { month: string; count: number }[] = [];
  for (let i = 0; i < 6; i++) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthKey = date.toISOString().substring(0, 7);
    monthlyEnrollmentTrends.unshift({
      month: monthKey,
      count: enrollmentsByMonth[monthKey] || 0
    });
  }

  // 2. Completion rates
  const completionStats = await this.prisma.enrollment.aggregate({
    where: { courseId },
    _count: { id: true },
    _avg: { progress: true }
  });
  
  // Count completed enrollments separately
  const completedEnrollmentsCount = await this.prisma.enrollment.count({
    where: { 
      courseId,
      completed: true 
    }
  });

  // 3. Revenue data
  const paymentStats = await this.prisma.payment.findMany({
    where: { 
      courseId,
      status: 'COMPLETED'
    },
    select: {
      amount: true,
      createdAt: true
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  // Group revenue by month
  const revenueByMonth = paymentStats.reduce((acc, payment) => {
    const month = payment.createdAt.toISOString().substring(0, 7); // YYYY-MM format
    acc[month] = (acc[month] || 0) + payment.amount;
    return acc;
  }, {} as Record<string, number>);

  const monthlyRevenueTrends: { month: string; amount: number }[] = [];
  for (let i = 0; i < 6; i++) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthKey = date.toISOString().substring(0, 7);
    monthlyRevenueTrends.unshift({
      month: monthKey,
      amount: revenueByMonth[monthKey] || 0
    });
  }

  // 4. Material engagement
  const materials = await this.prisma.courseMaterial.findMany({
    where: { courseId },
    include: {
      _count: {
        select: { comments: true }
      }
    },
    orderBy: {
      week: 'asc'
    }
  });

  // Sort materials by comment count to find most/least engaging
  const sortedMaterials = [...materials].sort((a, b) => 
    (b._count.comments) - (a._count.comments)
  );

  // 5. Student progress distribution
  const progressGroups = [
    { range: '0-25%', count: 0 },
    { range: '26-50%', count: 0 },
    { range: '51-75%', count: 0 },
    { range: '76-99%', count: 0 },
    { range: '100%', count: 0 }
  ];

  enrollments.forEach(enrollment => {
    if (enrollment.progress <= 25) progressGroups[0].count++;
    else if (enrollment.progress <= 50) progressGroups[1].count++;
    else if (enrollment.progress <= 75) progressGroups[2].count++;
    else if (enrollment.progress < 100) progressGroups[3].count++;
    else progressGroups[4].count++;
  });

  // 6. Reviews analytics
  const reviews = await this.prisma.review.findMany({
    where: { courseId },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  const ratingDistribution = [0, 0, 0, 0, 0]; // 1-5 stars
  reviews.forEach(review => {
    if (review.rating >= 1 && review.rating <= 5) {
      ratingDistribution[review.rating - 1]++;
    }
  });

  return {
    courseInfo: {
      id: course.id,
      title: course.title,
      instructor: `${course.instructor.firstName} ${course.instructor.lastName}`,
      enrollmentAnalytics: {
        total: course._count.enrollments,
        completionRate: completionStats._count.id > 0
          ? (completedEnrollmentsCount / completionStats._count.id) * 100
          : 0,
        averageProgress: completionStats._avg.progress || 0,
        monthlyTrends: monthlyEnrollmentTrends,
        progressDistribution: progressGroups
      }
    },
    revenueAnalytics: {
      totalRevenue: paymentStats.reduce((sum, payment) => sum + payment.amount, 0),
      monthlyTrends: monthlyRevenueTrends,
      averageRevenuePerEnrollment: paymentStats.length > 0
        ? paymentStats.reduce((sum, payment) => sum + payment.amount, 0) / paymentStats.length
        : 0
    },
    contentEngagement: {
      mostEngaging: sortedMaterials.slice(0, 3).map(m => ({
        id: m.id,
        title: m.title,
        type: m.type,
        week: m.week,
        day: m.day,
        commentCount: m._count.comments
      })),
      leastEngaging: sortedMaterials.slice(-3).map(m => ({
        id: m.id,
        title: m.title,
        type: m.type,
        week: m.week,
        day: m.day,
        commentCount: m._count.comments
      })).reverse(),
      weeklyEngagement: this.groupMaterialsByWeek(materials)
    },
    reviewAnalytics: {
      averageRating: reviews.length > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
        : 0,
      ratingDistribution,
      recentReviews: reviews.slice(0, 5).map(review => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment || '',
        reviewer: `${review.user.firstName} ${review.user.lastName}`,
        date: review.createdAt
      }))
    }
  };
}

/**
 * Helper method to group materials by week for analytics
 */
private groupMaterialsByWeek(materials: any[]) {
  const weeks: Record<string, any> = {};
  
  materials.forEach(material => {
    const week = material.week || 1;
    if (!weeks[week]) {
      weeks[week] = {
        week,
        totalMaterials: 0,
        totalComments: 0,
        materials: []
      };
    }
    
    weeks[week].totalMaterials++;
    weeks[week].totalComments += material._count.comments;
    weeks[week].materials.push({
      id: material.id,
      title: material.title,
      type: material.type,
      commentCount: material._count.comments
    });
  });
  
  return Object.values(weeks).sort((a, b) => a.week - b.week);
}

/**
 * Publish a course after validation
 * Ensures the course meets minimum requirements before publishing
 */
async publishCourse(courseId: string) {
  // 1. Retrieve course with materials
  const course = await this.prisma.course.findUnique({
    where: { id: courseId },
    include: {
      _count: {
        select: {
          materials: true
        }
      }
    }
  });

  if (!course) {
    throw new Error('Course not found');
  }

  // 2. Validate course has minimum requirements to publish
  const validationErrors = [];

  if (!course.title || course.title.trim().length < 5) {
    validationErrors.push('Course title is too short (minimum 5 characters)');
  }

  if (!course.description || course.description.trim().length < 20) {
    validationErrors.push('Course description is too short (minimum 20 characters)');
  }

  if (!course.bannerImageUrl) {
    validationErrors.push('Course banner image is required');
  }

  if (course._count.materials === 0) {
    validationErrors.push('Course must have at least one material');
  }

  if (course.isPaid && (!course.price || course.price <= 0)) {
    validationErrors.push('Paid courses must have a price greater than zero');
  }

  // Throw error with all validation failures if any exist
  if (validationErrors.length > 0) {
    throw new Error(`Cannot publish course: ${validationErrors.join(', ')}`);
  }

  // 3. Update course to published state
  const publishedCourse = await this.prisma.course.update({
    where: { id: courseId },
    data: { 
      isPublished: true 
    }
  });
  
  // 4. Optional: Create an announcement about course publication
  try {
    await this.prisma.announcement.create({
      data: {
        courseId,
        title: 'Course Now Available!',
        content: `${course.title} is now published and available for enrollment. Welcome to the course!`
      }
    });
  } catch (error) {
    // Log but don't fail if announcement creation fails
    console.error('Failed to create course publication announcement:', error);
  }

  return publishedCourse;
}
}
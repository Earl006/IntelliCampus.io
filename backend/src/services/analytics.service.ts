import { PrismaClient } from '@prisma/client';
import { injectable } from 'tsyringe';

@injectable()
export default class InstructorAnalyticsService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async getDashboardData(instructorId: string) {
    try {
      // Get all courses by this instructor
      const courses = await this.prisma.course.findMany({
        where: { instructorId },
        select: { id: true }
      });
      
      const courseIds = courses.map(course => course.id);
      
      // Get total student count (unique students across all courses)
      const totalStudents = await this.prisma.enrollment.groupBy({
        by: ['userId'],
        where: {
          courseId: { in: courseIds }
        }
      }).then(result => result.length);
      
      // Get total earnings
      const totalEarnings = await this.prisma.payment.aggregate({
        where: {
          courseId: { in: courseIds },
          status: 'COMPLETED'
        },
        _sum: { amount: true }
      });
      
      // Get average course completion rate
      const completionData = await this.prisma.enrollment.aggregate({
        where: {
          courseId: { in: courseIds }
        },
        _avg: { progress: true },
        _count: { id: true }
      });
      
      // Get completed enrollments count
      const completedEnrollmentsCount = await this.prisma.enrollment.count({
        where: {
          courseId: { in: courseIds },
          completed: true
        }
      });
      
      // Get recent enrollments
      const recentEnrollments = await this.prisma.enrollment.findMany({
        where: {
          courseId: { in: courseIds }
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          },
          course: {
            select: {
              id: true,
              title: true
            }
          }
        },
        orderBy: {
          enrolledAt: 'desc'
        },
        take: 10
      });
      
      // Get recent reviews
      const recentReviews = await this.prisma.review.findMany({
        where: {
          courseId: { in: courseIds }
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          },
          course: {
            select: {
              id: true,
              title: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 5
      });

      // Calculate average rating across all courses
      const ratings = await this.prisma.review.groupBy({
        by: ['courseId'],
        where: {
          courseId: { in: courseIds }
        },
        _avg: {
          rating: true
        }
      });
      
      const avgRating = ratings.length > 0 
        ? ratings.reduce((sum, item) => sum + (item._avg.rating || 0), 0) / ratings.length 
        : 0;
      
      return {
        totalStudents,
        totalEarnings: totalEarnings._sum.amount || 0,
        courseCount: courseIds.length,
        avgCompletionRate: completionData._avg.progress || 0,
        completedEnrollments: completedEnrollmentsCount,
        totalEnrollments: completionData._count.id || 0,
        avgRating,
        recentActivity: {
          enrollments: recentEnrollments,
          reviews: recentReviews
        }
      };
    } catch (error) {
      console.error('Error getting instructor dashboard data:', error);
      throw new Error('Failed to retrieve dashboard data');
    }
  }
    
  async getRevenueStats(instructorId: string, period: string) {
    try {
      // Define date range based on period
      const now = new Date();
      let startDate = new Date();
      
      switch (period) {
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(now.getMonth() - 3);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          startDate.setMonth(now.getMonth() - 1); // Default to month
      }
      
      // Get all courses by this instructor
      const courses = await this.prisma.course.findMany({
        where: { instructorId },
        select: { id: true, title: true }
      });
      
      const courseIds = courses.map(course => course.id);
      
      // Get payments in the period
      const payments = await this.prisma.payment.findMany({
        where: {
          courseId: { in: courseIds },
          status: 'COMPLETED',
          createdAt: {
            gte: startDate,
            lte: now
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      });
      
      // Group payments by day/week/month depending on period
      const groupedPayments = this.groupPaymentsByTimeInterval(payments, period);
      
      // Get revenue breakdown by course
      const courseRevenue = await this.prisma.payment.groupBy({
        by: ['courseId'],
        where: {
          courseId: { in: courseIds },
          status: 'COMPLETED',
          createdAt: {
            gte: startDate,
            lte: now
          }
        },
        _sum: {
          amount: true
        }
      });
      
      // Map course IDs to titles for better readability
      const courseRevenueData = courseRevenue.map(item => {
        const course = courses.find(c => c.id === item.courseId);
        return {
          courseId: item.courseId,
          courseTitle: course?.title || 'Unknown Course',
          revenue: item._sum.amount || 0
        };
      });
      
      // Calculate total for the period
      const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
      
      // Get payouts in the period
      const payouts = await this.prisma.payout.findMany({
        where: {
          instructorId,
          createdAt: {
            gte: startDate,
            lte: now
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      });
      
      const totalPayouts = payouts.reduce((sum, payout) => sum + payout.amount, 0);
      
      return {
        totalRevenue,
        totalPayouts,
        netEarnings: totalRevenue - totalPayouts,
        revenueByTimeInterval: groupedPayments,
        revenueByCourse: courseRevenueData,
        period
      };
    } catch (error) {
      console.error('Error getting revenue stats:', error);
      throw new Error('Failed to retrieve revenue statistics');
    }
  }
    
  async getCourseEngagementData(courseId: string) {
    try {
      // Get course details
      const course = await this.prisma.course.findUnique({
        where: { id: courseId },
        include: {
          materials: true,
          enrollments: {
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
          reviews: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        }
      });
      
      if (!course) {
        throw new Error('Course not found');
      }
      
      // Calculate completion rate
      const completionRate = course.enrollments.length > 0
        ? (course.enrollments.filter(e => e.completed).length / course.enrollments.length) * 100
        : 0;
      
      // Calculate average progress
      const avgProgress = course.enrollments.length > 0
        ? course.enrollments.reduce((sum, enrollment) => sum + enrollment.progress, 0) / course.enrollments.length
        : 0;
      
      // Calculate average rating
      const avgRating = course.reviews.length > 0
        ? course.reviews.reduce((sum, review) => sum + review.rating, 0) / course.reviews.length
        : 0;
      
      // Get material engagement data
      const materialEngagement = await Promise.all(course.materials.map(async (material) => {
        // For a real implementation, you would track material views/completion
        // This is a placeholder since we don't have that data in the schema yet
        const comments = await this.prisma.comment.count({
          where: { materialId: material.id }
        });
        
        return {
          materialId: material.id,
          title: material.title,
          type: material.type,
          commentCount: comments,
          // In a real implementation, add view count, avg time spent, etc.
        };
      }));
      
      // Get enrollment trends (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      // Get enrollments and group them by month in JavaScript
      const enrollments = await this.prisma.enrollment.findMany({
        where: {
          courseId,
          enrolledAt: {
            gte: sixMonthsAgo
          }
        },
        select: {
          enrolledAt: true
        }
      });
      
      // Process enrollments to group by month
      const enrollmentsByMonth: Record<string, number> = {};
      enrollments.forEach(enrollment => {
        const month = enrollment.enrolledAt.toISOString().substring(0, 7); // YYYY-MM format
        enrollmentsByMonth[month] = (enrollmentsByMonth[month] || 0) + 1;
      });
      
      const enrollmentTrendsByMonth = Object.entries(enrollmentsByMonth).map(([month, count]) => ({
        month,
        count
      }));
      
      return {
        courseId,
        title: course.title,
        totalEnrollments: course.enrollments.length,
        enrollmentTrends: enrollmentTrendsByMonth,
        avgRating,
        reviewCount: course.reviews.length,
        materialEngagement
      };
    } catch (error) {
      console.error('Error getting course engagement data:', error);
      throw new Error('Failed to retrieve course engagement data');
    }
  }

  // Helper method to group payments by time intervals
  private groupPaymentsByTimeInterval(payments: any[], period: string) {
    const result: { [key: string]: number } = {};
    
    payments.forEach(payment => {
      let timeKey: string;
      const date = new Date(payment.createdAt);
      
      switch (period) {
        case 'week':
          // Group by day of week
          timeKey = date.toLocaleDateString('en-US', { weekday: 'short' });
          break;
        case 'month':
          // Group by day of month
          timeKey = date.getDate().toString();
          break;
        case 'quarter':
        case 'year':
          // Group by month
          timeKey = date.toLocaleDateString('en-US', { month: 'short' });
          break;
        default:
          timeKey = date.toISOString().split('T')[0];
      }
      
      if (!result[timeKey]) {
        result[timeKey] = 0;
      }
      
      result[timeKey] += payment.amount;
    });
    
    return Object.entries(result).map(([timeKey, amount]) => ({
      timeKey,
      amount
    }));
  }
}
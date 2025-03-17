import { Request, Response } from 'express';
import { injectable } from 'tsyringe';
import InstructorAnalyticsService from '../services/analytics.service';

@injectable()
export default class AnalyticsController {
  private analyticsService: InstructorAnalyticsService;

  constructor() {
    this.analyticsService = new InstructorAnalyticsService();
  }

  /**
   * Get dashboard overview data for an instructor
   * GET /api/analytics/dashboard
   */
  async getDashboardData(req: Request, res: Response): Promise<void> {
    try {
      // Verify user is authenticated and is the instructor
      const instructorId = req.user?.id;
      
      if (!instructorId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const dashboardData = await this.analyticsService.getDashboardData(instructorId);
      
      res.status(200).json({ success: true, data: dashboardData });
    } catch (error: any) {
      console.error('Error in getDashboardData controller:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to retrieve dashboard data',
        message: error.message 
      });
    }
  }

  /**
   * Get revenue statistics for an instructor
   * GET /api/analytics/revenue?period=month
   */
  async getRevenueStats(req: Request, res: Response): Promise<void> {
    try {
      // Verify user is authenticated and is the instructor
      const instructorId = req.user?.id;
      
      if (!instructorId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      // Get period from query parameter, default to 'month'
      const period = req.query.period as string || 'month';
      
      // Validate period parameter
      const validPeriods = ['week', 'month', 'quarter', 'year'];
      if (!validPeriods.includes(period)) {
        res.status(400).json({ 
          success: false, 
          error: `Invalid period. Must be one of: ${validPeriods.join(', ')}` 
        });
        return;
      }

      const revenueData = await this.analyticsService.getRevenueStats(instructorId, period);
      
      res.status(200).json({ success: true, data: revenueData });
    } catch (error: any) {
      console.error('Error in getRevenueStats controller:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to retrieve revenue statistics',
        message: error.message 
      });
    }
  }

  /**
   * Get engagement data for a specific course
   * GET /api/analytics/courses/:courseId/engagement
   */
  async getCourseEngagementData(req: Request, res: Response): Promise<void> {
    try {
      // Verify user is authenticated
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const courseId = req.params.courseId;
      
      if (!courseId) {
        res.status(400).json({ success: false, error: 'Course ID is required' });
        return;
      }

      // Verify the user is the instructor of this course
      const course = await new (await import('@prisma/client')).PrismaClient().course.findUnique({
        where: { id: courseId },
        select: { instructorId: true }
      });

      if (!course) {
        res.status(404).json({ success: false, error: 'Course not found' });
        return;
      }

      if (course.instructorId !== userId) {
        res.status(403).json({ 
          success: false, 
          error: 'You do not have permission to view analytics for this course' 
        });
        return;
      }

      const engagementData = await this.analyticsService.getCourseEngagementData(courseId);
      
      res.status(200).json({ success: true, data: engagementData });
    } catch (error: any) {
      console.error('Error in getCourseEngagementData controller:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to retrieve course engagement data',
        message: error.message 
      });
    }
  }

  /**
   * Get all analytics for instructor (combined dashboard)
   * GET /api/analytics/instructor
   */
  async getInstructorAnalytics(req: Request, res: Response): Promise<void> {
    try {
      // Verify user is authenticated and is an instructor
      const instructorId = req.user?.id;
      const role = req.user?.role;
      
      if (!instructorId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      if (role !== 'INSTRUCTOR') {
        res.status(403).json({ 
          success: false, 
          error: 'Only instructors can access analytics' 
        });
        return;
      }

      // Get dashboard data
      const dashboardData = await this.analyticsService.getDashboardData(instructorId);
      
      // Get revenue data for last month by default
      const revenueData = await this.analyticsService.getRevenueStats(instructorId, 'month');
      
      // Combine data for a complete dashboard
      const analyticsData = {
        dashboard: dashboardData,
        revenue: revenueData
      };
      
      res.status(200).json({ success: true, data: analyticsData });
    } catch (error: any) {
      console.error('Error in getInstructorAnalytics controller:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to retrieve analytics data',
        message: error.message 
      });
    }
  }
}
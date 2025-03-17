import { Request, Response } from 'express';
import { injectable } from 'tsyringe';
import 'reflect-metadata';
import AnnouncementService from '../services/announcement.service';

@injectable()
export default class AnnouncementController {
  private announcementService: AnnouncementService;

  constructor() {
    this.announcementService = new AnnouncementService();
  }

  /**
   * Create a new announcement for a course
   * POST /api/courses/:courseId/announcements
   */
  async createAnnouncement(req: Request, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;
      const { title, content } = req.body;
      const instructorId = req.user?.id;

      // Basic validation
      if (!courseId || !title || !content) {
        res.status(400).json({
          success: false,
          error: 'Course ID, announcement title, and content are required'
        });
        return;
      }

      if (!instructorId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      const announcement = await this.announcementService.createAnnouncement(courseId, {
        title,
        content,
        instructorId
      });

      res.status(201).json({
        success: true,
        message: 'Announcement created successfully',
        data: announcement
      });
    } catch (error: any) {
      console.error('Error creating announcement:', error);
      
      if (error.message.includes('permission')) {
        res.status(403).json({
          success: false,
          error: error.message
        });
      } else if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to create announcement',
          message: error.message
        });
      }
    }
  }

  /**
   * Get all announcements for an instructor
   * GET /api/instructor/announcements
   */
  async getInstructorAnnouncements(req: Request, res: Response): Promise<void> {
    try {
      const instructorId = req.user?.id;

      if (!instructorId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      const announcements = await this.announcementService.getAnnouncementsForInstructor(instructorId);

      res.status(200).json({
        success: true,
        data: announcements
      });
    } catch (error: any) {
      console.error('Error getting instructor announcements:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve announcements',
        message: error.message
      });
    }
  }

  /**
   * Get all announcements for a course
   * GET /api/courses/:courseId/announcements
   */
  async getCourseAnnouncements(req: Request, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;
      const userId = req.user?.id;

      if (!courseId) {
        res.status(400).json({
          success: false,
          error: 'Course ID is required'
        });
        return;
      }

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      // Check if user is enrolled in the course or is the instructor
      const prisma = new (await import('@prisma/client')).PrismaClient();
      
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: { instructorId: true }
      });

      if (!course) {
        res.status(404).json({
          success: false,
          error: 'Course not found'
        });
        return;
      }

      const isInstructor = course.instructorId === userId;
      
      if (!isInstructor) {
        const enrollment = await prisma.enrollment.findFirst({
          where: {
            userId,
            courseId
          }
        });

        if (!enrollment) {
          res.status(403).json({
            success: false,
            error: 'You must be enrolled in this course to view announcements'
          });
          return;
        }
      }

      const announcements = await this.announcementService.getAnnouncementsForCourse(courseId);

      res.status(200).json({
        success: true,
        data: announcements
      });
    } catch (error: any) {
      console.error('Error getting course announcements:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve course announcements',
        message: error.message
      });
    }
  }

  /**
   * Delete an announcement
   * DELETE /api/announcements/:id
   */
  async deleteAnnouncement(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const instructorId = req.user?.id;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Announcement ID is required'
        });
        return;
      }

      if (!instructorId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      const result = await this.announcementService.deleteAnnouncement(id, instructorId);

      res.status(200).json({
        success: true,
        message: 'Announcement deleted successfully',
        data: result
      });
    } catch (error: any) {
      console.error('Error deleting announcement:', error);
      
      if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: error.message
        });
      } else if (error.message.includes('permission')) {
        res.status(403).json({
          success: false,
          error: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to delete announcement',
          message: error.message
        });
      }
    }
  }

  /**
   * Configure WebSocket for real-time announcements
   * This method should be called during server initialization
   */
  configureWebSocket(io: any): void {
    const eventEmitter = this.announcementService.getEventEmitter();
    
    eventEmitter.on('announcement', (data) => {
      // Broadcast the announcement to the course room
      io.to(`course-${data.courseId}`).emit('announcement', {
        title: data.title,
        content: data.content,
        instructorName: data.instructorName,
        courseId: data.courseId,
        sentAt: data.sentAt
      });
    });
  }
}
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { Server } from 'socket.io';
import CourseService from '../services/course.service';
import ChatService from '../services/chat.service';
import { PaymentService } from '../services/payment.service';
import { uploadToCloudinary } from '../bg-services/file-upload.service';

export default class CourseController {
  private courseService: CourseService;

  constructor(io: Server) {
    const prisma = new PrismaClient();
    const chatService = new ChatService(prisma, io);
    const paymentService = new PaymentService();
    this.courseService = new CourseService(prisma, chatService, paymentService);

    // Bind all methods to this instance
    this.getCourses = this.getCourses.bind(this);
    this.getCourse = this.getCourse.bind(this);
    this.getCoursesByCategory = this.getCoursesByCategory.bind(this);
    this.getCoursesByInstructor = this.getCoursesByInstructor.bind(this);
    this.createCourse = this.createCourse.bind(this);
    this.updateCourse = this.updateCourse.bind(this);
    this.deleteCourse = this.deleteCourse.bind(this);
    this.publishCourse = this.publishCourse.bind(this);
    this.createCohort = this.createCohort.bind(this);
    this.getCourseCohorts = this.getCourseCohorts.bind(this);
    this.getCourseStudents = this.getCourseStudents.bind(this);
    this.enrollStudent = this.enrollStudent.bind(this);
    this.deferStudent = this.deferStudent.bind(this);
    this.getEnrollmentsForUser = this.getEnrollmentsForUser.bind(this);
    this.getInstructorDashboardCourses = this.getInstructorDashboardCourses.bind(this);
    this.getCourseAnalytics = this.getCourseAnalytics.bind(this);
    this.publishCourseWithValidation = this.publishCourseWithValidation.bind(this);
  }

  async createCourse(req: Request, res: Response) {
    try {
      let { title, description, isPaid, price, categoryIds, subCategoryIds } = req.body;
      const instructorId = req.user.id;
      const bannerImage = req.file;
  
      // Convert categoryIds to array if it's in JSON string form
      if (typeof categoryIds === 'string') {
        categoryIds = JSON.parse(categoryIds);
      }
      // Convert subCategoryIds if needed
      if (typeof subCategoryIds === 'string') {
        subCategoryIds = JSON.parse(subCategoryIds);
      }
      // Convert isPaid string to boolean if needed
      if (typeof isPaid === 'string') {
        isPaid = isPaid === 'true';
      }
      // Convert price to number if it's a string
      if (typeof price === 'string') {
        price = parseFloat(price);
      }
  
      let bannerImageUrl;
      if (bannerImage) {
        bannerImageUrl = await uploadToCloudinary(bannerImage);
      }
  
      const course = await this.courseService.createCourse(
        title,
        description,
        instructorId,
        bannerImageUrl,
        isPaid,
        price,
        categoryIds,
        subCategoryIds
      );
  
      res.status(201).json({
        success: true,
        data: course,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create course',
      });
    }
  }

  async getCourse(req: Request, res: Response) {
    try {
      const { courseId } = req.params;

      const course = await this.courseService.getCourse(courseId);

       res.status(200).json({
        success: true,
        data: course
      });
    } catch (error: any) {
       res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch course'
      });
    }
  }

  async getCourses(req: Request, res: Response) {
    try {
      const courses = await this.courseService.getPublishedCourses();

       res.status(200).json({
        success: true,
        data: courses
      });
    } catch (error: any) {
       res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch courses'
      });
    }
  }

  async getCoursesByInstructor(req: Request, res: Response) {
    const instructorId = req.params.id;

    try {
      const courses = await this.courseService.getCoursesByInstructor(instructorId);

       res.status(200).json({
        success: true,
        data: courses
      });
    } catch (error: any) {
       res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch instructor courses'
      });
    }
}

    async getCourseCohorts(req: Request, res: Response) {
        try {
        const { courseId } = req.params;
    
        const cohorts = await this.courseService.getCohortsForCourse(courseId);
    
         res.status(200).json({
            success: true,
            data: cohorts
        });
        } catch (error: any) {
         res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch course cohorts'
        });
        }
    }

    async getCourseStudents(req: Request, res: Response) {
        try {
        const { courseId } = req.params;
    
        const students = await this.courseService.getEnrollmentsForCourse(courseId);
    
         res.status(200).json({
            success: true,
            data: students
        });
        } catch (error: any) {
         res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch course students'
        });
        }
    }

    async getCoursesByCategory(req: Request, res: Response) {
        const categoryId = req.params.id;
    
        try {
        const courses = await this.courseService.getCoursesByCategory(categoryId);
    
         res.status(200).json({
            success: true,
            data: courses
        });
        } catch (error: any) {
         res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch courses by category'
        });
        }
    }
    async updateCourse(req: Request, res: Response) {
      try {
        const { courseId } = req.params;
        const updateData = req.body;
        const bannerImage = req.file;
    
        // Convert category/subCategory arrays if they are JSON strings
        if (typeof updateData.categoryIds === 'string') {
          updateData.categoryIds = JSON.parse(updateData.categoryIds);
        }
        if (typeof updateData.subCategoryIds === 'string') {
          updateData.subCategoryIds = JSON.parse(updateData.subCategoryIds);
        }
        if (typeof updateData.isPaid === 'string') {
          updateData.isPaid = updateData.isPaid === 'true';
        }
        if (typeof updateData.price === 'string') {
          updateData.price = parseFloat(updateData.price);
        }      
    
        if (bannerImage) {
          updateData.bannerImageUrl = await uploadToCloudinary(bannerImage);
        }
    
        const course = await this.courseService.updateCourse(courseId, updateData);
    
        res.status(200).json({
          success: true,
          data: course,
        });
      } catch (error: any) {
        res.status(500).json({
          success: false,
          message: error.message || 'Failed to update course',
        });
      }
    }

  async deleteCourse(req: Request, res: Response) {
    try {
      const { courseId } = req.params;

      await this.courseService.deleteCourse(courseId);

       res.status(200).json({
        success: true,
        message: 'Course deleted successfully'
      });
    } catch (error: any) {
       res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete course'
      });
    }
  }

  async publishCourse(req: Request, res: Response) {
    try {
      const { courseId } = req.params;
      const { publish } = req.body;

      const course = await this.courseService.setCoursePublishStatus(courseId, publish);

       res.status(200).json({
        success: true,
        data: course
      });
    } catch (error: any) {
       res.status(500).json({
        success: false,
        message: error.message || 'Failed to update course publish status'
      });
    }
  }

  async createCohort(req: Request, res: Response) {
    try {
      const { courseId } = req.params;
      const { startDate } = req.body;
      const instructorId = req.user.id;

      const cohort = await this.courseService.createCohort(
        courseId,
        instructorId,
        new Date(startDate)
      );

       res.status(201).json({
        success: true,
        data: cohort
      });
    } catch (error: any) {
       res.status(500).json({
        success: false,
        message: error.message || 'Failed to create cohort'
      });
    }
  }

  async enrollStudent(req: Request, res: Response) {
    try {
      const { courseId } = req.params;
      const { paymentMethod } = req.body;
      const studentId = req.user.id;

      const enrollment = await this.courseService.enrollStudent(
        studentId,
        courseId,
        paymentMethod
      );

       res.status(201).json({
        success: true,
        data: enrollment
      });
    } catch (error: any) {
       res.status(400).json({
        success: false,
        message: error.message || 'Failed to enroll in course'
      });
    }
  }

  async deferStudent(req: Request, res: Response) {
    try {
      const { currentCohortId, targetCohortId } = req.params;
      const studentId = req.user.id;

      const result = await this.courseService.deferStudent(
        studentId,
        currentCohortId,
        targetCohortId
      );

       res.status(200).json({

        success: true,
        data: result
      });
    } catch (error: any) {
       res.status(400).json({
        success: false,
        message: error.message || 'Failed to defer student'
      });
    }
  }

  async getEnrollmentsForUser(req: Request, res: Response) {
    try {
      const studentId = req.user.id;

      const enrollments = await this.courseService.getEnrollmentsForUser(studentId);

       res.status(200).json({
        success: true,
        data: enrollments
      });
    } catch (error: any) {
       res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch enrollments'
      });
    }
  }

 
  async getInstructorDashboardCourses(req: Request, res: Response) {
    try {
      const instructorId = req.user.id;
      
      const courses = await this.courseService.getInstructorCourses(instructorId);

      res.status(200).json({
        success: true,
        data: courses
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch instructor dashboard courses'
      });
    }
  }

  /**
   * Get detailed analytics for a specific course
   * GET /api/courses/:courseId/analytics
   */
  async getCourseAnalytics(req: Request, res: Response) {
    try {
      const { courseId } = req.params;
      const instructorId = req.user.id;
      
      // Check if course exists and belongs to this instructor
      const course = await this.courseService.getCourse(courseId);
      
      if (!course) {
         res.status(404).json({
          success: false,
          message: 'Course not found'
        });
      }
      
      if (course!.instructorId !== instructorId) {
         res.status(403).json({
          success: false,
          message: 'You do not have permission to access analytics for this course'
        });
      }
      
      const analytics = await this.courseService.getCourseAnalytics(courseId);

      res.status(200).json({
        success: true,
        data: analytics
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch course analytics'
      });
    }
  }

  /**
   * Publish a course with validation checks
   * POST /api/courses/:courseId/publish-verified
   */
  async publishCourseWithValidation(req: Request, res: Response) {
    try {
      const { courseId } = req.params;
      const instructorId = req.user.id;
      
      // Check if course belongs to this instructor
      const course = await this.courseService.getCourse(courseId);
      
      if (!course) {
          res.status(404).json({
          success: false,
          message: 'Course not found'
        });
      }
      
      if (course!.instructorId !== instructorId) {
         res.status(403).json({
          success: false,
          message: 'You do not have permission to publish this course'
        });
      }
      
      const publishedCourse = await this.courseService.publishCourse(courseId);
      
      res.status(200).json({
        success: true,
        message: 'Course published successfully',
        data: publishedCourse
      });
    } catch (error: any) {
      // If the error is about validation, send a 400 status
      if (error.message.includes('Cannot publish course:')) {
         res.status(400).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to publish course'
      });
    }
}
}
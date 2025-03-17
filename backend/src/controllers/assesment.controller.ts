import { Request, Response } from 'express';
import { injectable } from 'inversify';
import 'reflect-metadata';
import AssessmentService, { QuestionType } from '../services/assesment.service';
import CertificateService from '../bg-services/certificate.service';

@injectable()
export default class AssessmentController {
  private assessmentService: AssessmentService;

  constructor() {
    const certificateService = new CertificateService();
    this.assessmentService = new AssessmentService(certificateService);
  }

  /**
   * Create a new assessment
   * POST /api/courses/:courseId/assessments
   */
  async createAssessment(req: Request, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;
      const userId = req.user?.id;

      // Verify course exists and user is instructor
      const course = await (new (await import('@prisma/client')).PrismaClient()).course.findUnique({
        where: { id: courseId }
      });

      if (!course) {
        res.status(404).json({ success: false, error: 'Course not found' });
        return;
      }

      if (course.instructorId !== userId) {
        res.status(403).json({ 
          success: false, 
          error: 'Only the course instructor can create assessments' 
        });
        return;
      }

      // Validate assessment data
      const { title, description, questions, passingScore, issueCertificate } = req.body;

      if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
        res.status(400).json({ 
          success: false, 
          error: 'Assessment title and at least one question are required' 
        });
        return;
      }

      // Validate questions
      for (const question of questions) {
        if (!question.content || !question.type || question.points === undefined) {
          res.status(400).json({
            success: false,
            error: 'Each question must have content, type, and points'
          });
          return;
        }

        // Validate multiple choice questions
        if (question.type === QuestionType.MULTIPLE_CHOICE && 
            (!question.options || !Array.isArray(question.options) || question.options.length < 2)) {
          res.status(400).json({
            success: false,
            error: 'Multiple choice questions must have at least 2 options'
          });
          return;
        }
      }

      // Create assessment
      const assessment = await this.assessmentService.createAssessment(courseId, {
        title,
        description,
        questions,
        passingScore,
        issueCertificate
      });

      res.status(201).json({ 
        success: true, 
        message: 'Assessment created successfully',
        data: assessment 
      });
    } catch (error: any) {
      console.error('Error creating assessment:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to create assessment',
        message: error.message 
      });
    }
  }

  /**
   * Get assessment by ID
   * GET /api/assessments/:id
   */
  async getAssessment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const assessment = await this.assessmentService.getAssessment(id);
      
      // Check if user has permission to view this assessment
      const prisma = new (await import('@prisma/client')).PrismaClient();
      const course = await prisma.course.findUnique({
        where: { id: assessment.courseId }
      });

      const isInstructor = course?.instructorId === userId;
      const isEnrolled = await prisma.enrollment.findFirst({
        where: {
          userId,
          courseId: assessment.courseId
        }
      });

      if (!isInstructor && !isEnrolled) {
        res.status(403).json({
          success: false,
          error: 'You do not have permission to view this assessment'
        });
        return;
      }

      // If user is a student (not instructor), remove correct answers
      if (!isInstructor) {
        const studentSafeAssessment = {
          ...assessment,
          questions: assessment.questions.map(q => ({
            ...q,
            correctAnswer: undefined,
            options: q.options ? q.options.map((o: { id: string; text: string; isCorrect?: boolean }) => ({
              id: o.id,
              text: o.text,
              // Remove isCorrect flag from options
              ...(typeof o === 'object' && 'isCorrect' in o ? { } : {})
            })) : []
          }))
        };
        
        res.status(200).json({ success: true, data: studentSafeAssessment });
        return;
      }

      res.status(200).json({ success: true, data: assessment });
    } catch (error: any) {
      console.error('Error fetching assessment:', error);
      res.status(error.message === 'Assessment not found' ? 404 : 500).json({
        success: false,
        error: error.message || 'Failed to fetch assessment'
      });
    }
  }

  /**
   * Get all assessments for a course
   * GET /api/courses/:courseId/assessments
   */
  async getCourseAssessments(req: Request, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;
      const userId = req.user?.id;

      // Check if user has permission to view assessments
      const prisma = new (await import('@prisma/client')).PrismaClient();
      const course = await prisma.course.findUnique({
        where: { id: courseId }
      });

      if (!course) {
        res.status(404).json({ success: false, error: 'Course not found' });
        return;
      }

      const isInstructor = course.instructorId === userId;
      const isEnrolled = await prisma.enrollment.findFirst({
        where: {
          userId,
          courseId
        }
      });

      if (!isInstructor && !isEnrolled) {
        res.status(403).json({
          success: false,
          error: 'You do not have permission to view assessments for this course'
        });
        return;
      }

      const assessments = await this.assessmentService.getCourseAssessments(courseId);

      // Add user's submission status for each assessment
      const enrichedAssessments = await Promise.all(assessments.map(async assessment => {
        if (isInstructor) {
          return {
            ...assessment,
            isInstructor: true
          };
        } else {
          // For students, check if they've submitted this assessment
          const submission = await prisma.submission.findFirst({
            where: {
              userId,
              assessmentId: assessment.id
            }
          });

          return {
            ...assessment,
            isInstructor: false,
            submission: submission ? {
              id: submission.id,
              submittedAt: submission.submittedAt,
              score: submission.score,
              isGraded: !!submission.gradedAt
            } : null
          };
        }
      }));

      res.status(200).json({ success: true, data: enrichedAssessments });
    } catch (error: any) {
      console.error('Error fetching course assessments:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch course assessments',
        message: error.message
      });
    }
  }

  /**
   * Update an assessment
   * PUT /api/assessments/:id
   */
  async updateAssessment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      // Check if user has permission to update this assessment
      const prisma = new (await import('@prisma/client')).PrismaClient();
      const assessment = await prisma.assessment.findUnique({
        where: { id },
        include: { course: true }
      });

      if (!assessment) {
        res.status(404).json({ success: false, error: 'Assessment not found' });
        return;
      }

      if (assessment.course.instructorId !== userId) {
        res.status(403).json({
          success: false,
          error: 'Only the course instructor can update this assessment'
        });
        return;
      }

      const { title, description, questions } = req.body;

      // Validate required fields
      if (questions && questions.length > 0) {
        for (const question of questions) {
          if (!question.content || !question.type || question.points === undefined) {
            res.status(400).json({
              success: false,
              error: 'Each question must have content, type, and points'
            });
            return;
          }
        }
      }

      // Update assessment
      const updatedAssessment = await this.assessmentService.updateAssessment(id, {
        title,
        description,
        questions
      });

      res.status(200).json({
        success: true,
        message: 'Assessment updated successfully',
        data: updatedAssessment
      });
    } catch (error: any) {
      console.error('Error updating assessment:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update assessment',
        message: error.message
      });
    }
  }

  /**
   * Delete an assessment
   * DELETE /api/assessments/:id
   */
  async deleteAssessment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      // Check if user has permission to delete this assessment
      const prisma = new (await import('@prisma/client')).PrismaClient();
      const assessment = await prisma.assessment.findUnique({
        where: { id },
        include: { course: true }
      });

      if (!assessment) {
        res.status(404).json({ success: false, error: 'Assessment not found' });
        return;
      }

      if (assessment.course.instructorId !== userId) {
        res.status(403).json({
          success: false,
          error: 'Only the course instructor can delete this assessment'
        });
        return;
      }

      // Check if assessment has submissions
      const submissionsCount = await prisma.submission.count({
        where: { assessmentId: id }
      });

      if (submissionsCount > 0) {
        res.status(400).json({
          success: false,
          error: 'Cannot delete assessment with existing submissions',
          message: `This assessment has ${submissionsCount} submission(s)`
        });
        return;
      }

      // Delete assessment
      await this.assessmentService.deleteAssessment(id);

      res.status(200).json({
        success: true,
        message: 'Assessment deleted successfully'
      });
    } catch (error: any) {
      console.error('Error deleting assessment:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete assessment',
        message: error.message
      });
    }
  }

  /**
   * Submit answers to an assessment
   * POST /api/assessments/:id/submit
   */
  async submitAssessment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      // Check if user is enrolled in the course
      const prisma = new (await import('@prisma/client')).PrismaClient();
      const assessment = await prisma.assessment.findUnique({
        where: { id }
      });

      if (!assessment) {
        res.status(404).json({ success: false, error: 'Assessment not found' });
        return;
      }

      const enrollment = await prisma.enrollment.findFirst({
        where: {
          userId,
          courseId: assessment.courseId
        }
      });

      if (!enrollment) {
        res.status(403).json({
          success: false,
          error: 'You must be enrolled in this course to submit assessments'
        });
        return;
      }

      const { answers } = req.body;

      if (!answers || typeof answers !== 'object') {
        res.status(400).json({
          success: false,
          error: 'Assessment answers are required'
        });
        return;
      }

      // Submit assessment
      const submission = await this.assessmentService.submitAssessment(id, userId, answers);

      res.status(201).json({
        success: true,
        message: 'Assessment submitted successfully',
        data: {
          id: submission.id,
          submittedAt: submission.submittedAt
        }
      });
    } catch (error: any) {
      console.error('Error submitting assessment:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to submit assessment',
        message: error.message
      });
    }
  }

  /**
   * Get all submissions for an assessment
   * GET /api/assessments/:id/submissions
   */
  async getSubmissions(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      // Check if user is the course instructor
      const prisma = new (await import('@prisma/client')).PrismaClient();
      const assessment = await prisma.assessment.findUnique({
        where: { id },
        include: { course: true }
      });

      if (!assessment) {
        res.status(404).json({ success: false, error: 'Assessment not found' });
        return;
      }

      if (assessment.course.instructorId !== userId) {
        res.status(403).json({
          success: false,
          error: 'Only the course instructor can view submissions'
        });
        return;
      }

      const submissions = await this.assessmentService.getSubmissions(id);

      res.status(200).json({ success: true, data: submissions });
    } catch (error: any) {
      console.error('Error fetching submissions:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch submissions',
        message: error.message
      });
    }
  }

  /**
   * Grade a submission
   * POST /api/submissions/:id/grade
   */
  async gradeSubmission(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      // Get the submission
      const prisma = new (await import('@prisma/client')).PrismaClient();
      const submission = await prisma.submission.findUnique({
        where: { id },
        include: {
          assessment: {
            include: { course: true }
          }
        }
      });

      if (!submission) {
        res.status(404).json({ success: false, error: 'Submission not found' });
        return;
      }

      // Check if user is the course instructor
      if (submission.assessment.course.instructorId !== userId) {
        res.status(403).json({
          success: false,
          error: 'Only the course instructor can grade submissions'
        });
        return;
      }

      const { grades, feedback } = req.body;

      if (!grades || !Array.isArray(grades)) {
        res.status(400).json({
          success: false,
          error: 'Grades are required for grading a submission'
        });
        return;
      }

      // Grade submission
      const gradedSubmission = await this.assessmentService.gradeSubmission(
        id,
        grades,
        feedback || ''
      );

      res.status(200).json({
        success: true,
        message: 'Submission graded successfully',
        data: {
          id: gradedSubmission.id,
          score: gradedSubmission.score,
          feedback: gradedSubmission.feedback,
          gradedAt: gradedSubmission.gradedAt
        }
      });
    } catch (error: any) {
      console.error('Error grading submission:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to grade submission',
        message: error.message
      });
    }
  }

  /**
   * Get analytics for an assessment
   * GET /api/assessments/:id/analytics
   */
  async getAssessmentAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      // Check if user is the course instructor
      const prisma = new (await import('@prisma/client')).PrismaClient();
      const assessment = await prisma.assessment.findUnique({
        where: { id },
        include: { course: true }
      });

      if (!assessment) {
        res.status(404).json({ success: false, error: 'Assessment not found' });
        return;
      }

      if (assessment.course.instructorId !== userId) {
        res.status(403).json({
          success: false,
          error: 'Only the course instructor can view assessment analytics'
        });
        return;
      }

      const analytics = await this.assessmentService.getAssessmentAnalytics(id);

      res.status(200).json({ success: true, data: analytics });
    } catch (error: any) {
      console.error('Error fetching assessment analytics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch assessment analytics',
        message: error.message
      });
    }
  }
}
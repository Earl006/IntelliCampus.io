import express from 'express';
import { container } from 'tsyringe';
import AssessmentController from '../controllers/assesment.controller';
import { authenticateJWT, requireRole } from '../middlewares/auth.middleware';
import { Role } from '@prisma/client';

const router = express.Router();
const assessmentController = container.resolve(AssessmentController);

// Apply authentication to all assessment routes
router.use(authenticateJWT);

/**
 * @route   POST /api/assesment/courses/:courseId
 * @desc    Create a new assessment for a course
 * @access  Private (Instructors only)
 */
router.post(
  '/courses/:courseId',
  requireRole([Role.INSTRUCTOR]),
  (req, res) => assessmentController.createAssessment(req, res)
);

/**
 * @route   GET /api/assesment/:id
 * @desc    Get assessment by ID
 * @access  Private (Course instructor and enrolled students)
 */
router.get(
  '/:id',
  (req, res) => assessmentController.getAssessment(req, res)
);

/**
 * @route   GET /api/assesment/courses/:courseId
 * @desc    Get all assessments for a course
 * @access  Private (Course instructor and enrolled students)
 */
router.get(
  '/courses/:courseId',
  (req, res) => assessmentController.getCourseAssessments(req, res)
);

/**
 * @route   PUT /api/assesment/:id
 * @desc    Update an assessment
 * @access  Private (Instructors only)
 */
router.put(
  '/:id',
  requireRole([Role.INSTRUCTOR]),
  (req, res) => assessmentController.updateAssessment(req, res)
);

/**
 * @route   DELETE /api/assesment/:id
 * @desc    Delete an assessment
 * @access  Private (Instructors only)
 */
router.delete(
  '/:id',
  requireRole([Role.INSTRUCTOR]),
  (req, res) => assessmentController.deleteAssessment(req, res)
);

/**
 * @route   POST /api/assesment/:id/submit
 * @desc    Submit answers to an assessment
 * @access  Private (Enrolled students only)
 */
router.post(
  '/:id/submit',
  (req, res) => assessmentController.submitAssessment(req, res)
);

/**
 * @route   GET /api/assesment/:id/submissions
 * @desc    Get all submissions for an assessment
 * @access  Private (Instructors only)
 */
router.get(
  '/:id/submissions',
  requireRole([Role.INSTRUCTOR]),
  (req, res) => assessmentController.getSubmissions(req, res)
);

/**
 * @route   POST /api/assesment/submissions/:id/grade
 * @desc    Grade a submission
 * @access  Private (Instructors only)
 */
router.post(
  '/submissions/:id/grade',
  requireRole([Role.INSTRUCTOR]),
  (req, res) => assessmentController.gradeSubmission(req, res)
);

/**
 * @route   GET /api/assesment/:id/analytics
 * @desc    Get analytics for an assessment
 * @access  Private (Instructors only)
 */
router.get(
  '/:id/analytics',
  requireRole([Role.INSTRUCTOR]),
  (req, res) => assessmentController.getAssessmentAnalytics(req, res)
);

export default router;
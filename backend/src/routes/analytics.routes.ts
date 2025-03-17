import 'reflect-metadata';
import express from 'express';
import { container } from 'tsyringe';
import AnalyticsController from '../controllers/analytics.controller';
import { authenticateJWT, requireRole } from '../middlewares/auth.middleware';
import { Role } from '@prisma/client';

const router = express.Router();
const analyticsController = container.resolve(AnalyticsController);

// Apply authentication to all analytics routes
router.use(authenticateJWT);

/**
 * @route   GET /api/analytics/dashboard
 * @desc    Get instructor dashboard overview data
 * @access  Private (Instructors only)
 */
router.get(
  '/dashboard', 
  requireRole([Role.INSTRUCTOR]),
  (req, res) => analyticsController.getDashboardData(req, res)
);

/**
 * @route   GET /api/analytics/revenue
 * @desc    Get revenue statistics for an instructor
 * @access  Private (Instructors only)
 */
router.get(
  '/revenue', 
  requireRole([Role.INSTRUCTOR]),
  (req, res) => analyticsController.getRevenueStats(req, res)
);

/**
 * @route   GET /api/analytics/courses/:courseId/engagement
 * @desc    Get engagement data for a specific course
 * @access  Private (Course instructor only)
 */
router.get(
  '/courses/:courseId/engagement',
  requireRole([Role.INSTRUCTOR]),
  (req, res) => analyticsController.getCourseEngagementData(req, res)
);

/**
 * @route   GET /api/analytics/instructor
 * @desc    Get combined analytics data for instructor dashboard
 * @access  Private (Instructors only)
 */
router.get(
  '/instructor',
  requireRole([Role.INSTRUCTOR]),
  (req, res) => analyticsController.getInstructorAnalytics(req, res)
);

export default router;
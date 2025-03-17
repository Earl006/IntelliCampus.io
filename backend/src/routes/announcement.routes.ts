import express from 'express';
import { container } from 'tsyringe';
import AnnouncementController from '../controllers/announcement.controller';
import { authenticateJWT, requireRole } from '../middlewares/auth.middleware';
import { Role } from '@prisma/client';

const router = express.Router();
const announcementController = container.resolve(AnnouncementController);

// Apply authentication middleware to all routes
router.use(authenticateJWT);

/**
 * @route   POST /api/announcement/courses/:courseId
 * @desc    Create a new announcement for a course
 * @access  Private (Instructors only)
 */
router.post(
  '/courses/:courseId',
  requireRole([Role.INSTRUCTOR]),
  (req, res) => announcementController.createAnnouncement(req, res)
);

/**
 * @route   GET /api/announcement/instructor
 * @desc    Get all announcements for the logged-in instructor
 * @access  Private (Instructors only)
 */
router.get(
  '/instructor',
  requireRole([Role.INSTRUCTOR]),
  (req, res) => announcementController.getInstructorAnnouncements(req, res)
);

/**
 * @route   GET /api/announcement/courses/:courseId
 * @desc    Get all announcements for a specific course
 * @access  Private (Course instructor and enrolled students)
 */
router.get(
  '/courses/:courseId',
  (req, res) => announcementController.getCourseAnnouncements(req, res)
);

/**
 * @route   DELETE /api/announcement/:id
 * @desc    Delete an announcement
 * @access  Private (Instructors only)
 */
router.delete(
  '/:id',
  requireRole([Role.INSTRUCTOR]),
  (req, res) => announcementController.deleteAnnouncement(req, res)
);

export default router;
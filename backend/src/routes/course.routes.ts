import { Router } from 'express';
import { Server } from 'socket.io';
import CourseController from '../controllers/course.controller';
import { authenticateJWT, requireRole } from '../middlewares/auth.middleware';
import { Role } from '@prisma/client';

const router = Router();
const io = new Server();
const courseController = new CourseController(io);

// All routes require authentication
router.use(authenticateJWT);

// Public routes (authenticated users)
router.get('/', courseController.getCourses);
router.get('/:courseId', courseController.getCourse);
router.get('/category/:categoryId', courseController.getCoursesByCategory);
router.get('/instructor/:id', courseController.getCoursesByInstructor);

// Student routes
router.post('/:courseId/enroll', requireRole([Role.LEARNER]), courseController.enrollStudent);
router.post(
  '/cohorts/:currentCohortId/defer/:targetCohortId', 
  requireRole([Role.LEARNER]), 
  courseController.deferStudent
);

// Instructor routes
router.use(requireRole([Role.INSTRUCTOR, Role.ADMIN]));

// Course management
router.post('/', courseController.createCourse);
router.put('/:courseId', courseController.updateCourse);
router.delete('/:courseId', courseController.deleteCourse);
router.post('/:courseId/publish', courseController.publishCourse);

// Cohort management
router.post('/:courseId/cohorts', courseController.createCohort);
router.get('/:courseId/cohorts', courseController.getCourseCohorts);

// Student management
router.get('/:courseId/students', courseController.getCourseStudents);

export default router;
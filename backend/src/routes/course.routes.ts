import { Router } from 'express';
import { Server } from 'socket.io';
import multer from 'multer';
import CourseController from '../controllers/course.controller';
import { authenticateJWT, requireRole } from '../middlewares/auth.middleware';
import { Role } from '@prisma/client';

const router = Router();
const io = new Server();
const courseController = new CourseController(io);
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Max 5 files per upload
  }
});



// Public routes (authenticated users)
router.get('/', courseController.getCourses);
router.get('/:courseId', courseController.getCourse);
router.get('/category/:categoryId', courseController.getCoursesByCategory);
router.get('/instructor/:id', courseController.getCoursesByInstructor);

// All routes require authentication
router.use(authenticateJWT);
// Student routes
router.post('/:courseId/enroll', requireRole([Role.LEARNER]), courseController.enrollStudent);
router.post(
  '/cohorts/:currentCohortId/defer/:targetCohortId', 
  requireRole([Role.LEARNER]), 
  courseController.deferStudent
);
// Get enrollments for user
router.get('/u/enrollments', requireRole([Role.LEARNER]),  courseController.getEnrollmentsForUser);

// Instructor routes
router.use(requireRole([Role.INSTRUCTOR, Role.ADMIN]));

// Course management
router.post('/', 
  upload.single('bannerImage'), 
  courseController.createCourse
);
router.put('/:courseId', 
  upload.single('bannerImage'),
  courseController.updateCourse
);
router.delete('/:courseId', courseController.deleteCourse);
router.post('/:courseId/publish', courseController.publishCourse);

// Cohort management
router.post('/:courseId/cohorts', courseController.createCohort);
router.get('/:courseId/cohorts', courseController.getCourseCohorts);

// Student management
router.get('/:courseId/students', courseController.getCourseStudents);



export default router;
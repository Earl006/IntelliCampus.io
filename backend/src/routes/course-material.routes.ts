import { Router } from 'express';
import multer from 'multer';
import CourseMaterialController from '../controllers/course-material.controller';
import { authenticateJWT, requireRole } from '../middlewares/auth.middleware';
import { Role } from '@prisma/client';

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Max 5 files per upload
  }
});

const router = Router();
const courseMaterialController = new CourseMaterialController();

// All routes require authentication
router.use(authenticateJWT);

// Public routes (for authenticated users)
router.get('/course/:courseId', courseMaterialController.getMaterialsByCourse);

// Protected routes (instructors only)
router.use(requireRole([Role.INSTRUCTOR, Role.ADMIN]));

router.post(
  '/course/:courseId',
  upload.array('files'),
  courseMaterialController.createMaterial
);

router.put(
  '/:materialId',
  courseMaterialController.updateMaterial
);

router.delete(
  '/:materialId',
  courseMaterialController.deleteMaterial
);

export default router;
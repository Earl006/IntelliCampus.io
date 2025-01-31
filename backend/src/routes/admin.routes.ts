import { Router } from 'express';
import AdminController from '../controllers/admin.controller';
import { authenticateJWT, requireRole } from '../middlewares/auth.middleware';
import { Role } from '@prisma/client';

const router = Router();
const adminController = new AdminController();

// All routes require authentication and admin role
router.use(authenticateJWT);
router.use(requireRole([Role.ADMIN]));

// Instructor Management Routes
router.post('/instructors/approve/:userId', adminController.approveInstructorRequest);
router.post('/instructors/reject/:userId', adminController.rejectInstructorRequest);

// User Management Routes
router.post('/users/:userId', adminController.manageUser);

// Category Management Routes
router.post('/categories', adminController.manageCategories);

// Chat Monitoring Routes
router.get('/chat/monitor', adminController.monitorChatRooms);

// Dashboard Statistics Routes
router.get('/dashboard/stats', adminController.getDashboardStats);

export default router;
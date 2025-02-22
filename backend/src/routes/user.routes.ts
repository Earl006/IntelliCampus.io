import { Router } from 'express';
import UserController from '../controllers/user.controller';
import { authenticateJWT, requireRole } from '../middlewares/auth.middleware';
import { Role } from '@prisma/client';

const router = Router();
const userController = new UserController();

// Public routes
router.get('/:email', userController.getUserByEmail);
router.get('/phone/:phoneNumber', userController.getUserByPhoneNumber);
router.post('/name', userController.getUserNameById);
router.get('/instructor/:userId', userController.getInstructorByUserId);

// Protected routes - require authentication
router.use(authenticateJWT);

// User profile routes - any authenticated user
router.get('/profile/me', userController.getUserById);
router.put('/profile/update', userController.updateProfile);
router.put('/profile/change-password', userController.changePassword);
router.post('/profile/deactivate', userController.deactivateAccount);

// Instructor related routes - learners can request, admin can view
router.post('/instructor/request', userController.requestInstructorRole);

// Admin only routes - require ADMIN role
router.use('/admin', requireRole([Role.ADMIN]));
router.get('/admin/all', userController.getAllUsers);
router.get('/admin/active', userController.getAllActiveUsers);
router.get('/admin/inactive', userController.getAllInactiveUsers);
router.get('/admin/role/:role', userController.getAllUsersByRole);
router.get('/admin/instructor-requests', userController.getInstructorRequests);
router.post('/admin/approve-instructor/:id', userController.approveInstructorRequests);
router.post('/admin/reject-instructor/:id', userController.rejectInstructorRequests);
router.put('/admin/assign-role/:id', userController.assignRole);
router.delete('/admin/delete/:id', userController.deleteAccount);
router.post('/admin/activate/:id', userController.ActivateAccount);

export default router;
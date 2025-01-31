import { Router } from 'express';
import CategoryController from '../controllers/category.controller';
import { authenticateJWT, requireRole } from '../middlewares/auth.middleware';
import { Role } from '@prisma/client';

const router = Router();
const categoryController = new CategoryController();

// Public routes - no authentication needed
router.get('/', categoryController.listAllCategories);
router.get('/:id', categoryController.getCategoryById);

// Protected routes - require authentication and admin role
router.use(authenticateJWT);
router.use(requireRole([Role.ADMIN]));

// Category management
router.post('/', categoryController.createCategory);
router.put('/:id', categoryController.updateCategory);
router.delete('/:id', categoryController.deleteCategory);

// Subcategory management
router.post('/:categoryId/subcategories', categoryController.createSubCategory);
router.put('/subcategories/:id', categoryController.updateSubCategory);
router.delete('/subcategories/:id', categoryController.deleteSubCategory);

export default router;
import { Router } from 'express';
import CommentReviewController from '../controllers/comment-review.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';

const router = Router();
const commentReviewController = new CommentReviewController();

//Public routes
router.get('/materials/:materialId/comments', commentReviewController.getCommentsForMaterial);
router.get('/courses/:courseId/reviews', commentReviewController.getReviewsForCourse);

// All routes require authentication
router.use(authenticateJWT);

// Comment routes
router.post('/materials/:materialId/comments', commentReviewController.addComment);

// Review routes
router.post('/courses/:courseId/reviews', commentReviewController.addReview);

export default router;
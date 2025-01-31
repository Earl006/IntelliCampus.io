import { Request, Response } from 'express';
import CommentReviewService from '../services/comment-review.service';

export default class CommentReviewController {
  private commentReviewService: CommentReviewService;

  constructor() {
    this.commentReviewService = new CommentReviewService();
  }

  async addComment(req: Request, res: Response) {
    try {
      const { materialId } = req.params;
      const { content } = req.body;
      const userId = req.user.id; // From auth middleware

      if (!content) {
         res.status(400).json({
          success: false,
          message: 'Comment content is required'
        });
      }

      const comment = await this.commentReviewService.addComment(
        materialId,
        userId,
        content
      );

       res.status(201).json({
        success: true,
        data: comment
      });
    } catch (error: any) {
       res.status(500).json({
        success: false,
        message: error.message || 'Failed to add comment'
      });
    }
  }

  async getCommentsForMaterial(req: Request, res: Response) {
    try {
      const { materialId } = req.params;
      const comments = await this.commentReviewService.getCommentsForMaterial(materialId);

       res.status(200).json({
        success: true,
        data: comments
      });
    } catch (error: any) {
       res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch comments'
      });
    }
  }

  async addReview(req: Request, res: Response) {
    try {
      const { courseId } = req.params;
      const { rating, comment } = req.body;
      const userId = req.user.id; // From auth middleware

      if (!rating) {
         res.status(400).json({
          success: false,
          message: 'Rating is required'
        });
      }

      if (typeof rating !== 'number' || rating < 1 || rating > 5) {
         res.status(400).json({
          success: false,
          message: 'Rating must be a number between 1 and 5'
        });
      }

      const review = await this.commentReviewService.addReview(
        courseId,
        userId,
        rating,
        comment
      );

       res.status(201).json({
        success: true,
        data: review
      });
    } catch (error: any) {
       res.status(500).json({
        success: false,
        message: error.message || 'Failed to add review'
      });
    }
  }

  async getReviewsForCourse(req: Request, res: Response) {
    try {
      const { courseId } = req.params;
      const reviews = await this.commentReviewService.getReviewsForCourse(courseId);

       res.status(200).json({
        success: true,
        data: reviews
      });
    } catch (error: any) {
       res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch reviews'
      });
    }
  }
}
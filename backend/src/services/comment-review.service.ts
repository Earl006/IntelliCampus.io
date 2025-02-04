import { PrismaClient } from '@prisma/client';
import redisClient from '../bg-services/redis.service';

const prisma = new PrismaClient();


export default class CommentReviewService {

  
  /**
   * Creates a new comment for a CourseMaterial.
   * @param {string} materialId - The associated material ID.
   * @param {string} userId - The user posting the comment.
   * @param {string} content - The comment text.
   */
  async addComment(materialId: string, userId: string, content: string) {
    const comment = await prisma.comment.create({
      data: {
        materialId,
        userId,
        content,
      },
    });
    // Invalidate cached comments for this material
    await redisClient.del(`comments:${materialId}`);
    return comment;
  }

  /**
   * Retrieves all comments for a given material, possibly from Redis cache.
   * @param {string} materialId - The material ID.
   */
  async getCommentsForMaterial(materialId: string) {
    const cached = await redisClient.get(`comments:${materialId}`);
    if (cached) {
      return JSON.parse(cached);
    }
    const comments = await prisma.comment.findMany({
      where: { materialId },
      orderBy: { createdAt: 'desc' },
    });
    await redisClient.set(`comments:${materialId}`, JSON.stringify(comments));
    return comments;
  }

  async getAllReviews() {
    const reviews = await prisma.review.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return reviews;
  }
  /**
   * Adds a new course review with a max rating of 5.
   * @param {string} courseId - The course ID being reviewed.
   * @param {string} userId - The user providing the review.
   * @param {number} rating - The star rating (1-5).
   * @param {string} [comment] - Optional text feedback.
   */
  async addReview(courseId: string, userId: string, rating: number, comment?: string) {
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be an integer from 1 to 5.');
    }
    const review = await prisma.review.create({
      data: {
        courseId,
        userId,
        rating,
        comment,
      },
    });
    // Invalidate cached reviews for this course
    await redisClient.del(`reviews:${courseId}`);
    return review;
  }

  /**
   * Retrieves all reviews for a given course, possibly from Redis.
   * @param {string} courseId - The course ID.
   */
  async getReviewsForCourse(courseId: string) {
    const cached = await redisClient.get(`reviews:${courseId}`);
    if (cached) {
      return JSON.parse(cached);
    }
    const reviews = await prisma.review.findMany({
      where: { courseId },
      orderBy: { createdAt: 'desc' },
    });
    await redisClient.set(`reviews:${courseId}`, JSON.stringify(reviews));
    return reviews;
  }
}
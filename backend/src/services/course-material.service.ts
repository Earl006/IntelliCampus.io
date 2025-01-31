import { PrismaClient, MaterialType, CourseMaterial } from '@prisma/client';
import redisClient from '../bg-services/redis.service';
import { uploadToCloudinary } from '../bg-services/file-upload.service';

/**
 * CourseMaterialService handles all actions involving course materials:
 * - Creating or deleting a material
 * - Uploading files (docs, videos, images)
 * - Organizing materials by week / day
 * - Caching reads in Redis
 */
const prisma = new PrismaClient();


export default class CourseMaterialService {
 /**
 * Create a new material and immediately upload its file(s) to Cloudinary.
 * @param {string} courseId - The parent course ID.
 * @param {string} title - Title of the material.
 * @param {MaterialType} type - e.g. VIDEO, DOCUMENT, QUIZ.
 * @param {Express.Multer.File[]} files - Files from Multer.
 * @param {number} [week] - Optional weekly scheduling index.
 * @param {number} [day] - Optional daily scheduling index.
 */
async createMaterialWithUpload(
    courseId: string,
    title: string,
    type: MaterialType,
    files: Express.Multer.File[],
    week?: number,
    day?: number
  ): Promise<CourseMaterial> {
    // Upload all files to Cloudinary (assumes multiple).
    let uploadedUrls: string[] = [];
    if (files && files.length) {
      uploadedUrls = await Promise.all(files.map((file) => uploadToCloudinary(file)));
    }
  
    // Combine all file URLs into the "content" field (JSON string or first URL, depending on your needs).
    const contentField = uploadedUrls.length ? JSON.stringify(uploadedUrls) : '';
  
    // Create the course material record in the database.
    const material = await prisma.courseMaterial.create({
      data: {
        courseId,
        title,
        type,
        week,
        day,
        content: contentField,
      },
    });
  
    // Clear any cached materials list for this course.
    await redisClient.del(`materials:${courseId}`);
    return material;
  }

  /**
   * Update an existing material record (e.g. rename, reorder).
   * @param {string} materialId - The material ID in the database.
   * @param {Partial<CourseMaterial>} updatedFields - Fields you want to update.
   */
  async updateMaterial(
    materialId: string,
    updatedFields: Partial<CourseMaterial>
  ): Promise<CourseMaterial> {
    const existing = await prisma.courseMaterial.findUnique({
      where: { id: materialId },
    });
    if (!existing) {
      throw new Error('Course material not found');
    }

    const material = await prisma.courseMaterial.update({
      where: { id: materialId },
      data: {
        ...updatedFields,
      },
    });

    // Clear the cache for its parent course.
    await redisClient.del(`materials:${existing.courseId}`);
    return material;
  }

  /**
   * Delete a material record from the database.
   * @param {string} materialId - The material ID to remove.
   */
  async deleteMaterial(materialId: string): Promise<CourseMaterial> {
    // Fetch first for caching cleanup.
    const existing = await prisma.courseMaterial.findUnique({
      where: { id: materialId },
    });
    if (!existing) {
      throw new Error('Course material not found');
    }

    const deleted = await prisma.courseMaterial.delete({
      where: { id: materialId },
    });

    // Remove from Redis cache for this course's materials.
    await redisClient.del(`materials:${existing.courseId}`);
    return deleted;
  }

  /**
   * Retrieve all materials for a given course in ascending order of (week, day).
   * Caches the results in Redis for faster subsequent lookups.
   * @param {string} courseId - The ID of the course whose materials to fetch.
   */
  async getMaterialsByCourse(courseId: string): Promise<CourseMaterial[]> {
    // Check Redis first.
    const cached = await redisClient.get(`materials:${courseId}`);
    if (cached) {
      return JSON.parse(cached);
    }

    // Fetch from DB and sort logically by week, day.
    const materials = await prisma.courseMaterial.findMany({
      where: { courseId },
      orderBy: [
        { week: 'asc' },
        { day: 'asc' },
      ],
    });

    // Save to Redis.
    await redisClient.set(`materials:${courseId}`, JSON.stringify(materials));
    return materials;
  }
}
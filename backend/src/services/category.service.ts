import { PrismaClient, Category, SubCategory } from '@prisma/client';
import { createClient } from 'redis';

const prisma = new PrismaClient();
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});
redisClient.connect().catch(console.error);

export default class CategoryService {
  /**
   * Create a new category.
   * @param {string} name - The category name.
   */
  async createCategory(name: string): Promise<Category> {
    // Check cache first (optional). If found, return it or throw an error if duplicate.
    const cachedValue = await redisClient.get(`category:${name}`);
    if (cachedValue) {
      throw new Error('Category with this name already exists (cached).');
    }

    // Create category in DB.
    const category = await prisma.category.create({
      data: {
        name,
      },
    });

    // Update cache.
    await redisClient.set(`category:${category.name}`, JSON.stringify(category));
    return category;
  }

  /**
   * Retrieve a category by its ID.
   * @param {string} categoryId - The category ID.
   */
  async getCategoryById(categoryId: string): Promise<Category | null> {
    // Attempt to retrieve from cache.
    const cachedData = await redisClient.get(`category:id:${categoryId}`);
    if (cachedData) {
      return JSON.parse(cachedData);
    }

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: { subCategories: true },
    });
    // Save to cache if found.
    if (category) {
      await redisClient.set(`category:id:${categoryId}`, JSON.stringify(category));
    }
    return category;
  }

  /**
   * Update an existing category by its ID.
   * @param {string} categoryId - The category ID.
   * @param {string} newName - The new category name.
   */
  async updateCategory(categoryId: string, newName: string): Promise<Category> {
    // Update DB record.
    const updatedCategory = await prisma.category.update({
      where: { id: categoryId },
      data: { name: newName },
    });

    // Update caches. We can clear old keys and set new ones.
    await redisClient.del(`category:id:${categoryId}`);
    await redisClient.del(`category:${updatedCategory.name}`);
    await redisClient.set(`category:id:${categoryId}`, JSON.stringify(updatedCategory));
    await redisClient.set(`category:${updatedCategory.name}`, JSON.stringify(updatedCategory));

    return updatedCategory;
  }

  /**
   * Delete a category by its ID.
   * @param {string} categoryId - The category ID.
   */
  async deleteCategory(categoryId: string): Promise<Category> {
    // Find category first.
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      throw new Error('Category not found');
    }

    // Delete from DB.
    const deleted = await prisma.category.delete({
      where: { id: categoryId },
    });

    // Cleanup cache.
    await redisClient.del(`category:id:${categoryId}`);
    await redisClient.del(`category:${category.name}`);

    return deleted;
  }

  /**
   * Create a new subcategory under a specified parent category.
   * @param {string} categoryId - The parent category ID.
   * @param {string} name       - The subcategory name.
   */
  async createSubCategory(categoryId: string, name: string): Promise<SubCategory> {
    // Optional cache check for duplicates, not shown for brevity.
    const subCategory = await prisma.subCategory.create({
      data: {
        name,
        categoryId,
      },
    });

    // Invalidating or updating relevant caches.
    await redisClient.del(`category:id:${categoryId}`);
    // Potentially re-fetch updated category and set to cache if needed.

    return subCategory;
  }

  /**
   * Update an existing subcategory by its ID.
   * @param {string} subCategoryId - The subcategory ID.
   * @param {string} newName       - The new subcategory name.
   */
  async updateSubCategory(subCategoryId: string, newName: string): Promise<SubCategory> {
    const updatedSubCategory = await prisma.subCategory.update({
      where: { id: subCategoryId },
      data: { name: newName },
    });

    // Potentially remove or refresh related cache data here.

    return updatedSubCategory;
  }

  /**
   * Delete a subcategory by its ID.
   * @param {string} subCategoryId - The subcategory ID.
   */
  async deleteSubCategory(subCategoryId: string): Promise<SubCategory> {
    const subCategory = await prisma.subCategory.findUnique({
      where: { id: subCategoryId },
    });
    if (!subCategory) {
      throw new Error('Subcategory not found');
    }

    const deleted = await prisma.subCategory.delete({
      where: { id: subCategoryId },
    });

    // Clear caches that might reference this subcategory.

    return deleted;
  }

  /**
   * Optional: Retrieve a list of all categories and subcategories.
   */
  async listAllCategories(): Promise<Category[]> {
    // Attempt to get from cache.
    const cached = await redisClient.get('all-categories');
    if (cached) {
      return JSON.parse(cached);
    }

    const categories = await prisma.category.findMany({
      include: { subCategories: true },
    });

    // Update cache.
    await redisClient.set('all-categories', JSON.stringify(categories));
    return categories;
  }
}
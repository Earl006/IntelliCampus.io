import { PrismaClient, Category, SubCategory } from '@prisma/client';
import redisClient from '../bg-services/redis.service';

const prisma = new PrismaClient();
const CACHE_TTL = 3600; // 1 hour in seconds
const CACHE_KEYS = {
  ALL_CATEGORIES: 'all-categories',
  CATEGORY_BY_ID: (id: string) => `category:${id}`,
  SUB_CATEGORIES: (categoryId: string) => `subcategories:${categoryId}`

};

export default class CategoryService {
  private async cacheSet(key: string, data: any): Promise<void> {
    try {
      await redisClient.setEx(key, CACHE_TTL, JSON.stringify(data));
    } catch (error) {
      console.warn('Cache set failed:', error);
    }
  }

  private async cacheGet(key: string): Promise<any> {
    try {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.warn('Cache get failed:', error);
      return null;
    }
  }

  private async invalidateCache(keys: string[]): Promise<void> {
    try {
      await Promise.all(keys.map(key => redisClient.del(key)));
    } catch (error) {
      console.warn('Cache invalidation failed:', error);
    }
  }

  async createCategory(name: string): Promise<Category> {
    try {
      console.log('Creating new category:', name);
      
      const categoryExists = await prisma.category.findUnique({
        where: { name }
      });
      
      if (categoryExists) {
        throw new Error('Category already exists');
      }
  
      const category = await prisma.category.create({
        data: { name }
      });
      

      console.log('Category created:', category);
  
      // Clear the all categories cache to force refresh
      await this.invalidateCache([CACHE_KEYS.ALL_CATEGORIES]);
      console.log('Invalidated categories cache');
  
      return category;
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new Error('Category already exists');
      }
      throw error;
    }
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
    try {

      const subCategoryExists = await prisma.subCategory.findUnique({
        where: { name }
      });

      if(subCategoryExists){
        throw new Error('Subcategory already exists');
      }
      const subCategory = await prisma.subCategory.create({
        data: { name, categoryId }
      });

      // Invalidate affected caches
      await this.invalidateCache([
        CACHE_KEYS.ALL_CATEGORIES,
        CACHE_KEYS.CATEGORY_BY_ID(categoryId),
        CACHE_KEYS.SUB_CATEGORIES(categoryId)
      ]);

      return subCategory;
    } catch (error) {
      console.error('Error creating subcategory:', error);
      throw error;
    }
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
    try {
      // Fetch with complete relation tree
      const categories = await prisma.category.findMany({
        include: {
          subCategories: {
            select: {
              id: true,
              name: true,
              categoryId: true,
              // category: {
              //   select: {
              //     id: true,
              //     name: true
              //   }
              // }
            }
          }
        }
       
      });

      // Update cache with fresh data
      if (categories.length > 0) {
        await this.cacheSet(CACHE_KEYS.ALL_CATEGORIES, categories);
        // Cache individual subcategory lists
        for (const category of categories) {
          await this.cacheSet(
            CACHE_KEYS.SUB_CATEGORIES(category.id),
            category.subCategories
          );
        }
      }

      return categories;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }
}
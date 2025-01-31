import { Request, Response } from 'express';
import CategoryService from '../services/category.service';

const categoryService = new CategoryService();

export default class CategoryController {
  async listAllCategories(req: Request, res: Response) {
    try {
      const categories = await categoryService.listAllCategories();
      res.status(200).json({
        success: true,
        data: categories
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch categories'
      });
    }
  }

  async getCategoryById(req: Request, res: Response) {
    try {
      const category = await categoryService.getCategoryById(req.params.id);
      if (!category) {
         res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }
      res.status(200).json({
        success: true,
        data: category
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch category'
      });
    }
  }

  async createCategory(req: Request, res: Response) {
    try {
      const category = await categoryService.createCategory(req.body.name);
      res.status(201).json({
        success: true,
        data: category
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create category'
      });
    }
  }

  async updateCategory(req: Request, res: Response) {
    try {
      const category = await categoryService.updateCategory(
        req.params.id,
        req.body.name
      );
      res.status(200).json({
        success: true,
        data: category
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update category'
      });
    }
  }

  async deleteCategory(req: Request, res: Response) {
    try {
      await categoryService.deleteCategory(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Category deleted successfully'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to delete category'
      });
    }
  }

  async createSubCategory(req: Request, res: Response) {
    try {
      const subCategory = await categoryService.createSubCategory(
        req.params.categoryId,
        req.body.name
      );
      res.status(201).json({
        success: true,
        data: subCategory
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create subcategory'
      });
    }
  }

  async updateSubCategory(req: Request, res: Response) {
    try {
      const subCategory = await categoryService.updateSubCategory(
        req.params.id,
        req.body.name
      );
      res.status(200).json({
        success: true,
        data: subCategory
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update subcategory'
      });
    }
  }

  async deleteSubCategory(req: Request, res: Response) {
    try {
      await categoryService.deleteSubCategory(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Subcategory deleted successfully'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to delete subcategory'
      });
    }
  }
}
import { Request, Response } from 'express';
import CourseMaterialService from '../services/course-material.service';
import { MaterialType } from '@prisma/client';

export default class CourseMaterialController {
  private courseMaterialService: CourseMaterialService;

  constructor() {
    this.courseMaterialService = new CourseMaterialService();
  }

  async createMaterial(req: Request, res: Response) {
    try {
      const { courseId } = req.params;
      const { title, type, week, day } = req.body;
      const files = req.files as Express.Multer.File[];

      if (!title || !type || !files?.length) {
         res.status(400).json({
          success: false,
          message: 'Title, type and files are required'
        });
      }

      const material = await this.courseMaterialService.createMaterialWithUpload(
        courseId,
        title,
        type as MaterialType,
        files,
        Number(week) || undefined,
        Number(day) || undefined
      );

       res.status(201).json({
        success: true,
        data: material
      });
    } catch (error: any) {
       res.status(500).json({
        success: false,
        message: error.message || 'Failed to create material'
      });
    }
  }

  async updateMaterial(req: Request, res: Response) {
    try {
      const { materialId } = req.params;
      const updateData = req.body;

      const material = await this.courseMaterialService.updateMaterial(
        materialId,
        updateData
      );

       res.status(200).json({
        success: true,
        data: material
      });
    } catch (error: any) {
       res.status(500).json({
        success: false,
        message: error.message || 'Failed to update material'
      });
    }
  }

  async deleteMaterial(req: Request, res: Response) {
    try {
      const { materialId } = req.params;
      
      const material = await this.courseMaterialService.deleteMaterial(materialId);

       res.status(200).json({
        success: true,
        data: material
      });
    } catch (error: any) {
       res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete material'
      });
    }
  }

  async getMaterialsByCourse(req: Request, res: Response) {
    try {
      const { courseId } = req.params;
      
      const materials = await this.courseMaterialService.getMaterialsByCourse(courseId);

       res.status(200).json({
        success: true,
        data: materials
      });
    } catch (error: any) {
       res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch materials'
      });
    }
  }
}
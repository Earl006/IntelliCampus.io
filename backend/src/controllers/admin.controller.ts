import { Request, Response } from 'express';
import { AdminService } from '../services/admin.service';
import { PrismaClient } from '@prisma/client';
import UserService from '../services/user.service';
import CategoryService from '../services/category.service';
import ChatService from '../services/chat.service';
import { Server } from 'socket.io';

const prisma = new PrismaClient();
const userService = new UserService();
const categoryService = new CategoryService();
const io = new Server();
const chatService = new ChatService(prisma, io);

const adminService = new AdminService(
  prisma,
  userService,
  categoryService,
  chatService
);

export default class AdminController {
  // Instructor Management
  async approveInstructorRequest(req: Request, res: Response) {
    try {
      const instructor = await adminService.approveInstructorRequest(req.params.userId);
      res.status(200).json({
        success: true,
        data: instructor
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async rejectInstructorRequest(req: Request, res: Response) {
    try {
      const instructor = await adminService.rejectInstructorRequest(req.params.userId);
      res.status(200).json({
        success: true,
        data: instructor
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // User Management
  async manageUser(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { action } = req.body;
      
      const user = await adminService.manageUser(userId, action);
      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Category Management
  async manageCategories(req: Request, res: Response) {
    try {
      const { action, categoryId, name } = req.body;
      
      const category = await adminService.manageCategories(action, { categoryId, name });
      res.status(200).json({
        success: true,
        data: category
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Chat Monitoring
  async monitorChatRooms(req: Request, res: Response) {
    try {
      const chatRooms = await adminService.monitorChatRooms();
      res.status(200).json({
        success: true,
        data: chatRooms
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Dashboard Statistics
  async getDashboardStats(req: Request, res: Response) {
    try {
      const stats = await adminService.getDashboardStats();
      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}
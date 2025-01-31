import { Request, Response } from 'express';
import ChatService from '../services/chat.service';
import { PrismaClient } from '@prisma/client';
import { Server } from 'socket.io';

export default class ChatController {
  private chatService: ChatService;

  constructor(prisma: PrismaClient, io: Server) {
    this.chatService = new ChatService(prisma, io);
  }

  // Get chat history for a course
  async getCourseMessages(req: Request, res: Response) {
    try {
      const { roomId } = req.params;
      const messages = await this.chatService.getMessagesForCourseChat(roomId);
      
      res.status(200).json({
        success: true,
        data: messages
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch course messages'
      });
    }
  }

  // Get chat history for a cohort
  async getCohortMessages(req: Request, res: Response) {
    try {
      const { roomId } = req.params;
      const messages = await this.chatService.getMessagesForCohortChat(roomId);
      
      res.status(200).json({
        success: true,
        data: messages
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch cohort messages'
      });
    }
  }

  // Create a course chat room
  async createCourseChatRoom(req: Request, res: Response) {
    try {
      const { courseId } = req.params;
      const chatRoom = await this.chatService.createCourseChatRoom(courseId);
      
      res.status(201).json({
        success: true,
        data: chatRoom
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create course chat room'
      });
    }
  }

  // Create a cohort chat room
  async createCohortChatRoom(req: Request, res: Response) {
    try {
      const { cohortId } = req.params;
      const chatRoom = await this.chatService.createCohortChatRoom(cohortId);
      
      res.status(201).json({
        success: true,
        data: chatRoom
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create cohort chat room'
      });
    }
  }

  // Post message to course chat (HTTP fallback)
  async postCourseMessage(req: Request, res: Response) {
    try {
      const { roomId } = req.params;
      const { content } = req.body;
      const userId = req.user.id; // From auth middleware

      const message = await this.chatService.postMessageToCourseChat(
        roomId,
        userId,
        content
      );
      
      res.status(201).json({
        success: true,
        data: message
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to post message'
      });
    }
  }

  // Post message to cohort chat (HTTP fallback)
  async postCohortMessage(req: Request, res: Response) {
    try {
      const { roomId } = req.params;
      const { content } = req.body;
      const userId = req.user.id; // From auth middleware

      const message = await this.chatService.postMessageToCohortChat(
        roomId,
        userId,
        content
      );
      
      res.status(201).json({
        success: true,
        data: message
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to post message'
      });
    }
  }

  // Initialize Socket.IO handlers
  initializeSocketHandlers() {
    this.chatService.setupSocketHandlers();
  }
}
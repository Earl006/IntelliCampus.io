import { Request, Response } from 'express';
import ChatService from '../services/chat.service';
import { PrismaClient } from '@prisma/client';
import { Server } from 'socket.io';

export default class ChatController {
  private chatService!: ChatService;

  constructor(private prisma: PrismaClient) {}

  // Add a method to set chatService after initialization
  setChatService(chatService: ChatService): void {
    this.chatService = chatService;
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

  async getCourseChatRoomInfo(req: Request, res: Response) {
    try {
      const { courseId } = req.params;
      const userId = (req as any).user.id;
      
      // Find the CourseChatRoom associated with this course
      const chatRoom = await this.prisma.courseChatRoom.findFirst({
        where: { courseId }
      });
      
      if (!chatRoom) {
         res.status(404).json({
          success: false,
          message: 'Chat room not found'
        });
      }
      
      //  the chat room ID
       res.status(200).json({
        success: true,
        data: {
          chatRoomId: chatRoom!.id,
          courseId: chatRoom!.courseId
        }
      });
    } catch (error) {
      console.error('Error fetching course chat room info:', error);
       res.status(500).json({
        success: false,
        message: 'Failed to get chat room information'
      });
    }
  }
  
  async getCohortChatRoomInfo(req: Request, res: Response) {
    try {
      const { cohortId } = req.params;
      const userId = (req as any).user.id;
      
      // Find the CohortChatRoom associated with this cohort
      const chatRoom = await this.prisma.cohortChatRoom.findFirst({
        where: { cohortId }
      });
      
      if (!chatRoom) {
         res.status(404).json({
          success: false,
          message: 'Chat room not found'
        });
      }
      
      //  the chat room ID
       res.status(200).json({
        success: true,
        data: {
          chatRoomId: chatRoom!.id,
          cohortId: chatRoom!.cohortId
        }
      });
    } catch (error) {
      console.error('Error fetching cohort chat room info:', error);
       res.status(500).json({
        success: false,
        message: 'Failed to get chat room information'
      });
    }
  }

  /**
   * Get all messages for an instructor across courses and cohorts
   * GET /api/chat/instructor/messages
   */
  async getInstructorMessages(req: Request, res: Response) {
    try {
      const instructorId = req.user.id;
      
      // Check if user is an instructor
      const user = await this.prisma.user.findUnique({
        where: { id: instructorId },
        select: { role: true }
      });
      
      if (user?.role !== 'INSTRUCTOR') {
         res.status(403).json({
          success: false,
          message: 'Access denied. Only instructors can access this endpoint'
        });
      }
      
      const messages = await this.chatService.getInstructorMessages(instructorId);
      
       res.status(200).json({
        success: true,
        data: messages
      });
    } catch (error: any) {
      console.error('Error fetching instructor messages:', error);
       res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch instructor messages'
      });
    }
  }
  
  /**
   * Mark messages as read
   * POST /api/chat/instructor/mark-read
   */
  async markMessagesAsRead(req: Request, res: Response) {
    try {
      const instructorId = req.user.id;
      const { messageIds } = req.body;
      
      if (!Array.isArray(messageIds) || messageIds.length === 0) {
         res.status(400).json({
          success: false,
          message: 'Please provide an array of message IDs to mark as read'
        });
      }
      
      // This is a placeholder - you would implement message read status tracking in your database
      // await this.chatService.markMessagesAsRead(instructorId, messageIds);
      
       res.status(200).json({
        success: true,
        message: `${messageIds.length} messages marked as read`,
        data: { readIds: messageIds }
      });
    } catch (error: any) {
      console.error('Error marking messages as read:', error);
       res.status(500).json({
        success: false,
        message: error.message || 'Failed to mark messages as read'
      });
    }
  }
}
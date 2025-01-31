import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { Server } from 'socket.io';
import ChatController from '../controllers/chat.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';

const router = Router();
const prisma = new PrismaClient();
const io = new Server();
const chatController = new ChatController(prisma, io);

// Initialize Socket.IO handlers
chatController.initializeSocketHandlers();

// All chat routes require authentication
router.use(authenticateJWT);

// Course chat routes
router.get('/course/:roomId/messages', chatController.getCourseMessages);
router.post('/course/:courseId/room', chatController.createCourseChatRoom);
router.post('/course/:roomId/message', chatController.postCourseMessage);

// Cohort chat routes
router.get('/cohort/:roomId/messages', chatController.getCohortMessages);
router.post('/cohort/:cohortId/room', chatController.createCohortChatRoom);
router.post('/cohort/:roomId/message', chatController.postCohortMessage);

export default router;
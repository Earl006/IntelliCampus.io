import { Router } from 'express';
import ChatController from '../controllers/chat.controller';
import { authenticateJWT, requireRole } from '../middlewares/auth.middleware';
import { Role } from '@prisma/client';

// Export a function that takes the chatController as a parameter
export default function(chatController: ChatController) {
  const router = Router();
  
  // All chat routes require authentication
  router.use(authenticateJWT);
  
  // Course chat routes
  router.get('/course/:roomId/messages', (req, res) => chatController.getCourseMessages(req, res));
  router.post('/course/:courseId/room', (req, res) => chatController.createCourseChatRoom(req, res));
  router.post('/course/:roomId/message', (req, res) => chatController.postCourseMessage(req, res));
  
  // Cohort chat routes
  router.get('/cohort/:roomId/messages', (req, res) => chatController.getCohortMessages(req, res));
  router.post('/cohort/:cohortId/room', (req, res) => chatController.createCohortChatRoom(req, res));
  router.post('/cohort/:roomId/message', (req, res) => chatController.postCohortMessage(req, res));
  router.get('/course/:courseId/room/info', (req, res) => chatController.getCourseChatRoomInfo(req, res));
  router.get('/cohort/:cohortId/room/info', (req, res) => chatController.getCohortChatRoomInfo(req, res));
  
  // Instructor messages routes
  router.get('/instructor/messages', 
    requireRole([Role.INSTRUCTOR]),
    (req, res) => chatController.getInstructorMessages(req, res)
  );
  
  router.post('/instructor/mark-read', 
    requireRole([Role.INSTRUCTOR]),
    (req, res) => chatController.markMessagesAsRead(req, res)
  );

  return router;
}
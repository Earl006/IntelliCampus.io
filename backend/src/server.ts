import { createServer } from 'http';
import { Server } from 'socket.io';
import app, { prisma } from "./app";
import { authenticateSocket } from './middlewares/auth.middleware';
import ChatService from './services/chat.service';
import CourseService from './services/course.service';
import { PaymentService } from './services/payment.service';

// Configure port
const port = process.env.PORT || 3000;

// Create HTTP server
const httpServer = createServer(app);

// Configure Socket.IO without CORS (handled in app.ts)
const io = new Server(httpServer);

// Socket authentication
io.use(authenticateSocket);

// Initialize services
const chatService = new ChatService(prisma, io);
const paymentService = new PaymentService();
const courseService = new CourseService(prisma, chatService, paymentService);

// Setup socket handlers
chatService.setupSocketHandlers();

// Start server
httpServer.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Export instances
export { io, chatService, courseService };
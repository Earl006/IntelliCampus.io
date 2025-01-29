import { createServer } from 'http';
import { Server } from 'socket.io';
import app, { prisma } from "./app";
import { authenticateSocket } from './middlewares/auth.middleware';
import ChatService from './services/chat.service';
import CourseService from './services/course.service';
import { PaymentService } from './services/payment.service';

const port = process.env.PORT || 3000;
const httpServer = createServer(app);

// Create Socket.IO instance after HTTP server
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Setup authentication before creating services
io.use(authenticateSocket);

const chatService = new ChatService(prisma, io);
const paymentService = new PaymentService();
const courseService = new CourseService(prisma, chatService, paymentService);

// Setup socket handlers after authentication
chatService.setupSocketHandlers();
chatService.setupSocketHandlers();

httpServer.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

export { io, chatService, courseService };
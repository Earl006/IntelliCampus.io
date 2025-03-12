import express from 'express';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import categoryRoutes from './routes/category.routes';
import adminRoutes from './routes/admin.routes';
import chatRoutesFactory from './routes/chat.routes'; // Note the change from chatRoutes to chatRoutesFactory
import commentReviewRoutes from './routes/comment-review.routes';
import coursematerialRoutes from './routes/course-material.routes';
import courseRoutes from './routes/course.routes';
import paymentRoutes from './routes/payment.routes';
import ChatController from './controllers/chat.controller';

const app = express();
const prisma = new PrismaClient();

// Initialize ChatController (without chatService for now)
const chatController = new ChatController(prisma);

// CORS configuration - must be before routes
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:4200',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Global middleware
app.use(express.json());

// Handle preflight
app.options('*', cors());

// Routes
app.use('/api/auth/', authRoutes);
app.use('/api/users/', userRoutes);
app.use('/api/categories/', categoryRoutes);
app.use('/api/admin/', adminRoutes);
app.use('/api/chat/', chatRoutesFactory(chatController)); // Pass chatController to the factory
app.use('/api/comment-review/', commentReviewRoutes);
app.use('/api/materials/', coursematerialRoutes);
app.use('/api/courses/', courseRoutes);
app.use('/api/payments/', paymentRoutes);

export { prisma, chatController }; // Export chatController
export default app;
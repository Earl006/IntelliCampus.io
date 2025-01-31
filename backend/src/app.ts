import express from 'express';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import categoryRoutes from './routes/category.routes';
import adminRoutes from './routes/admin.routes';
import chatRoutes from './routes/chat.routes';
import commentReviewRoutes from './routes/comment-review.routes';
import coursematerialRoutes from './routes/course-material.routes';
import courseRoutes from './routes/course.routes';
import paymentRoutes from './routes/payment.routes';

const app = express();
const prisma = new PrismaClient();

app.use(express.json());
app.use('/api/auth/', authRoutes);
app.use('/api/users/', userRoutes);
app.use('/api/categories/', categoryRoutes);
app.use('/api/admin/', adminRoutes);
app.use('/api/chat/', chatRoutes);
app.use('/api/comment-review/', commentReviewRoutes);
app.use('/api/materials/', coursematerialRoutes);
app.use('/api/courses/', courseRoutes);
app.use('/api/payments/', paymentRoutes);

export { prisma };
export default app;
import express from 'express';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import categoryRoutes from './routes/category.routes';
import adminRoutes from './routes/admin.routes';

const app = express();
const prisma = new PrismaClient();

app.use(express.json());
app.use('/api/auth/', authRoutes);
app.use('/api/users/', userRoutes);
app.use('/api/categories/', categoryRoutes);
app.use('/api/admin/', adminRoutes);

export { prisma };
export default app;
import express from 'express';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';

const app = express();
const prisma = new PrismaClient();

app.use(express.json());

app.use('/api/auth/', authRoutes);
app.use('/api/users/', userRoutes);

export default app;
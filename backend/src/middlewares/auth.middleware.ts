import { Request, Response, NextFunction, RequestHandler } from 'express';
import { Socket } from 'socket.io';
import { verifyToken } from '../utils/jwt.utils';
import { Role } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const authenticateJWT: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'No token provided' });
    return;
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' });
    return;
  }
};

export const authenticateSocket = async (
  socket: Socket, 
  next: (err?: Error) => void
): Promise<void> => {
  const token = socket.handshake.auth.token;

  if (!token) {
    next(new Error('Authentication required'));
    return;
  }

  try {
    const decoded = verifyToken(token);
    socket.data.user = decoded;
    next();
  } catch (error) {
    next(new Error('Invalid or expired token'));
  }
};

export const requireRole = (roles: Role[]): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ message: 'Insufficient permissions' });
      return;
    }

    next();
  };
};
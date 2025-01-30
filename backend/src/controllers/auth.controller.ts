import { Request, Response } from 'express';
import AuthService from '../services/auth.service';

const authService = new AuthService();

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const user = await authService.registerUser(req.body);
      res.status(201).json({
        success: true,
        data: user,
        message: 'User registered successfully'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { user, token } = await authService.login(req.body);
      res.status(200).json({
        success: true,
        token,
        message: 'Login successful'
      });
    } catch (error: any) {
      res.status(401).json({
        success: false,
        message: error.message
      });
    }
  }

  async requestPasswordReset(req: Request, res: Response) {
    try {
      await authService.requestPasswordReset(req.body.email);
      res.status(200).json({
        success: true,
        message: 'Reset code sent to email'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async resetPassword(req: Request, res: Response) {
    try {
      const { resetCode, newPassword } = req.body;
      await authService.resetPassword(resetCode, newPassword);
      res.status(200).json({
        success: true,
        message: 'Password reset successful'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}
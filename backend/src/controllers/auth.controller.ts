import AuthService from "../services/auth.service";
import { Request, Response } from "express";

const authService = new AuthService();

export default class AuthController {
  async registerUser(req: Request, res: Response) {
    try {
      const user = await authService.registerUser(req.body);
      res.status(201).json({user, message: 'User registered Succesfully'});
    } catch (error: any) {
      res.status(400).json({ message: error.message || error });
    }
  }

  async loginUser(req: Request, res: Response) {
    try {
      const user = await authService.login(req.body);
      res.status(200).json({user, message: 'User logged in Succesfully'});
    } catch (error: any) {
      res.status(400).json({ message: error.message || error });
    }
  }

  async requestPasswordReset(req: Request, res: Response) {
    try {
      const user = await authService.requestPasswordReset(req.body.email);
      res.status(200).json({user, message: 'Password reset code has been sent to your email. Please Enter this code within 15 minutes'});
    } catch (error: any) {
      res.status(400).json({ message: error.message || error });
    }
  }

  async resetPassword(req: Request, res: Response) {
    try {
        const resetCode = req.body.resetCode;
        const newPassword = req.body.newPassword;
      const user = await authService.resetPassword(resetCode, newPassword);
      res.status(200).json({user, message: 'Password reset Succesfully'});
    } catch (error: any) {
      res.status(400).json({ message: error.message || error });
    }
  }
}
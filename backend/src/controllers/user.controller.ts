import { Request, Response } from 'express';
import UserService from '../services/user.service';
import { Role } from '@prisma/client';

const userService = new UserService();

export default class UserController {
  async getUserById(req: Request, res: Response) {
    try {
      const user = await userService.getUserById(req.params.id);
      res.status(200).json(user);
    } catch (error: any) {
      res.status(400).json({ message: error.message || error });
    }
  }

  async getUserByEmail(req: Request, res: Response) {
    try {
      const user = await userService.getUserByEmail(req.params.email);
      res.status(200).json(user);
    } catch (error: any) {
      res.status(400).json({ message: error.message || error });
    }
  }

  async getUserByPhoneNumber(req: Request, res: Response) {
    try {
      const user = await userService.getUserByPhoneNumber(req.params.phoneNumber);
      res.status(200).json(user);
    } catch (error: any) {
      res.status(400).json({ message: error.message || error });
    }
  }

  async changePassword(req: Request, res: Response) {
    try {
      const user = await userService.changePassword(req.params.id, req.body.newPassword);
      res.status(200).json({user, message: 'Password changed successfully'});
    } catch (error: any) {
      res.status(400).json({ message: error.message || error });
    }
  }

  async updateProfile(req: Request, res: Response) {
    try {
      const user = await userService.updateProfile(req.params.id, req.body);
      res.status(200).json({user, message: 'Profile updated successfully'});
    } catch (error: any) {
      res.status(400).json({ message: error.message || error });
    }
  }

  async approveInstructorRequests(req: Request, res: Response) {
    try {
      const user = await userService.approveInstructorRequests(req.params.id);
      res.status(200).json({user, message: 'Instructor request approved successfully'});
    } catch (error: any) {
      res.status(400).json({ message: error.message || error });
    }
  }

  async rejectInstructorRequests(req: Request, res: Response) {
    try {
      const user = await userService.rejectInstructorRequests(req.params.id);
      res.status(200).json({user, message: 'Instructor request rejected successfully'});
    } catch (error: any) {
      res.status(400).json({ message: error.message || error });
    }
  }

  async getAllUsers(req: Request, res: Response) {
    try {
      const users = await userService.getAllUsers();
      res.status(200).json(users);
    } catch (error: any) {
      res.status(400).json({ message: error.message || error });
    }
  }

  async getAllActiveUsers(req: Request, res: Response) {
    try {
      const users = await userService.getAllActiveUsers();
      res.status(200).json(users);
    } catch (error: any) {
      res.status(400).json({ message: error.message || error });
    }
  }

  async getAllInactiveUsers(req: Request, res: Response) {
    try {
      const users = await userService.getAllInactiveUsers();
      res.status(200).json(users);
    } catch (error: any) {
      res.status(400).json({ message: error.message || error });
    }
  }

  async getAllUsersByRole(req: Request, res: Response) {
    try {
        
      const role = req.params.role as Role;
      const users = await userService.getAllUsersByRole(role);
      res.status(200).json(users);
    } catch (error: any) {
      res.status(400).json({ message: error.message || error });
    }
  }
  async requestInstructorRole(req: Request, res: Response) {
    try {
      const user = await userService.requestInstructorRole(req.params.id);
      res.status(200).json({user, message: 'Instructor role has been requested, pending verification by admin. You will receive an email on succesful verification '});
    } catch (error: any) {
      res.status(400).json({ message: error.message || error });
    }
  }

  async getInstructorRequests(req: Request, res: Response) {
    try {
      const users = await userService.getInstructorRequests();
      res.status(200).json(users);
    } catch (error: any) {
      res.status(400).json({ message: error.message || error });
    }
  }

  async assignRole(req: Request, res: Response) {
    try {
      const user = await userService.assignRole(req.params.id, req.body.role as Role);
      res.status(200).json({user, message: 'Role assigned successfully'});
    } catch (error: any) {
      res.status(400).json({ message: error.message || error });
    }
  }

  async getInstructorByUserId(req: Request, res:Response){
    try{
        const instructor = await userService.getInstructorByUserId(req.params.userId);
        res.status(200).json(instructor);
    }catch(error: any){
        res.status(400).json({ message: error.message || error });
    }
}

 async deactivateAccount(req: Request, res: Response) {
    try {
      const user = await userService.deactivateAccount(req.params.id);
      res.status(200).json({user, message: 'Account deactivated successfully'});
    } catch (error: any) {
      res.status(400).json({ message: error.message || error });
    }
  }

  async deleteAccount(req: Request, res: Response) {
    try {
      const user = await userService.deleteAccount(req.params.id);
      res.status(200).json({user, message: 'Account deleted successfully'});
    } catch (error: any) {
      res.status(400).json({ message: error.message || error });
    }
  }

  async ActivateAccount(req: Request, res: Response) {
    try {
      const user = await userService.activateAccount(req.params.id);
      res.status(200).json({user, message: 'Account activated successfully'});
    } catch (error: any) {
      res.status(400).json({ message: error.message || error });
    }
  }
}
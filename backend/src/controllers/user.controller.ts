import { Request, Response } from 'express';
import UserService from '../services/user.service';
import { Role } from '@prisma/client';

const userService = new UserService();

export default class UserController {
  async getUserById(req: Request, res: Response) {
    try {
      const user = await userService.getUserById(req.user.id);
      res.status(200).json({
        success: true,
        data:user
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message || error });
    }
  }
  async getUserNameById(req: Request, res: Response) {
    try {
      const user = await userService.getUserNameById(req.body.id);
      res.status(200).json({
        success: true,
        data:user
      });
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
      const user = await userService.changePassword(req.user.id, req.body.newPassword);
      res.status(200).json({
        success: true,
        data:user, 
        message: 'Password changed successfully'});
    } catch (error: any) {
      res.status(400).json({ message: error.message || error });
    }
  }

  async updateProfile(req: Request, res: Response) {
    try {
      const user = await userService.updateProfile(req.user.id, req.body);
      res.status(200).json({
        success: true,
        data:user, 
        message: 'Profile updated successfully'});
    } catch (error: any) {
      res.status(400).json({ 
        success: false,
        message: error.message || error });
    }
  }

  async approveInstructorRequests(req: Request, res: Response) {
    try {
      const user = await userService.approveInstructorRequests(req.params.id);
      res.status(200).json({
          success: true,
        data:user,
         message: 'Instructor request approved successfully'});
    } catch (error: any) {
      res.status(400).json({ 
        success: false,
        message: error.message || error });
    }
  }

  async rejectInstructorRequests(req: Request, res: Response) {
    try {
      const user = await userService.rejectInstructorRequests(req.params.id);
      res.status(200).json({
        success: true,
        data:user, 
        message: 'Instructor request rejected successfully'});
    } catch (error: any) {
      res.status(400).json({ message: error.message || error });
    }
  }

  async getAllUsers(req: Request, res: Response) {
    try {
      const users = await userService.getAllUsers();
      res.status(200).json({
        success: true,
        data:users});
    } catch (error: any) {
      res.status(400).json({ 
        success: false,
        message: error.message || error });
    }
  }

  async getAllActiveUsers(req: Request, res: Response) {
    try {
      const users = await userService.getAllActiveUsers();
      res.status(200).json({success: true ,data:users});
    } catch (error: any) {
      res.status(400).json({ success: false,message: error.message || error });
    }
  }

  async getAllInactiveUsers(req: Request, res: Response) {
    try {
      const users = await userService.getAllInactiveUsers();
      res.status(200).json({ success: true,data:users});
    } catch (error: any) {
      res.status(400).json({ success: false,message: error.message || error });
    }
  }

  async getAllUsersByRole(req: Request, res: Response) {
    try {
        
      const role = req.params.role as Role;
      const users = await userService.getAllUsersByRole(role);
      res.status(200).json({ success:true,data:users});
    } catch (error: any) {
      res.status(400).json({ success:false,message: error.message || error });
    }
  }
  async requestInstructorRole(req: Request, res: Response) {
    try {
      const user = await userService.requestInstructorRole(req.user.id);
      res.status(200).json({
        success: true,
        data:user, 
        message: 'Instructor role has been requested, pending verification by admin. You will receive an email on succesful verification '});
    } catch (error: any) {
      res.status(400).json({ 
        success: false,
        message: error.message || error });
    }
  }

  async getInstructorRequests(req: Request, res: Response) {
    try {
      const users = await userService.getInstructorRequests();
      res.status(200).json({success:true,data:users});
    } catch (error: any) {
      res.status(400).json({ success:false,message: error.message || error });
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
        res.status(200).json({sucess:true, data:instructor});
    }catch(error: any){
        res.status(400).json({ success:false,message: error.message || error });
    }
}

 async deactivateAccount(req: Request, res: Response) {
    try {
      const user = await userService.deactivateAccount(req.user.id);
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


   /**
   * Get detailed information about a student for an instructor
   * GET /api/users/instructor/students/:studentId
   */
   async getStudentDetailsForInstructor(req: Request, res: Response) {
    try {
      const { studentId } = req.params;
      const instructorId = req.user.id;
      
      if (!studentId) {
         res.status(400).json({ 
          success: false, 
          message: 'Student ID is required' 
        });
      }
      
      const details = await userService.getStudentDetailsForInstructor(studentId, instructorId);
      res.status(200).json({
        success: true,
        data: details
      });
    } catch (error: any) {
      res.status(error.message === "Student not found" ? 404 : 400).json({ 
        success: false, 
        message: error.message || error 
      });
    }
  }

  /**
   * Get detailed progress information for a specific student in a specific course
   * GET /api/users/instructor/students/:studentId/courses/:courseId/progress
   */
  async getStudentProgressInCourse(req: Request, res: Response) {
    try {
      const { courseId, studentId } = req.params;
      
      if (!courseId || !studentId) {
         res.status(400).json({ 
          success: false, 
          message: 'Course ID and Student ID are required' 
        });
      }
      
      const progress = await userService.getStudentProgressInCourse(courseId, studentId);
      res.status(200).json({
        success: true,
        data: progress
      });
    } catch (error: any) {
      res.status(error.message === "Student is not enrolled in this course" ? 404 : 400).json({ 
        success: false, 
        message: error.message || error 
      });
    }
  }

  /**
   * Update the progress percentage for a specific enrollment
   * PUT /api/users/instructor/enrollments/:enrollmentId/progress
   */
  async updateStudentProgress(req: Request, res: Response) {
    try {
      const { enrollmentId } = req.params;
      const { progress } = req.body;
      
      if (!enrollmentId) {
         res.status(400).json({ 
          success: false, 
          message: 'Enrollment ID is required' 
        });
      }
      
      if (progress === undefined || progress === null) {
         res.status(400).json({ 
          success: false, 
          message: 'Progress value is required' 
        });
      }
      
      const updatedEnrollment = await userService.updateStudentProgress(enrollmentId, progress);
      res.status(200).json({
        success: true,
        data: updatedEnrollment,
        message: 'Student progress updated successfully'
      });
    } catch (error: any) {
      res.status(error.message === "Enrollment not found" ? 404 : 400).json({ 
        success: false, 
        message: error.message || error 
      });
    }
  }
}
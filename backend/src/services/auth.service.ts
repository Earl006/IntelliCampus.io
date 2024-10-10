import { PrismaClient, User } from "@prisma/client";
import { generateToken, verifyToken } from "../utils/jwt.utils";
import bycryptjs from "bcryptjs";   
import {v4 as uuidv4} from "uuid";
import path from "path";
import sendMail from "../bg-services/email.servcie";


const prisma = new PrismaClient();

export default class AuthService {
   async registerUser(data:User){
    const phoneNumberExists = await prisma.user.findUnique({
      where: {
        phoneNumber: data.phoneNumber,
      },
    });
    if (phoneNumberExists) {
      throw new Error("Phone number already exists");
    }
    const emailExists = await prisma.user.findUnique({
      where: {
        email: data.email,
      },
    });
    if (emailExists) {
      throw new Error("Email already exists");
    }
    const hashedPassword = await bycryptjs.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
      },
    });
    const templatePath = path.join(__dirname, "../mails/welcome.mail.ejs");

    const body ={
        user,
    }
    await sendMail({
        email: user.email,
        subject: "Welcome to our IntelliCampus",
        template: templatePath,
        body,
    })
    return user;

   }

   async login(data:User){
    const user = await prisma.user.findUnique({
        where: {
            email: data.email,
        },
    });
    if (!user) {
        throw new Error("User account doesn't exist. Please create an account and try again");
    }
    const isPasswordValid = await bycryptjs.compare(data.password, user.password);
    if (!isPasswordValid) {
        throw new Error("Invalid email or password");
    }
    const token = generateToken({
        id: user.id,
        email: user.email,
        phoneNumber: user.phoneNumber,
    });
    return {
        user,
        token,
    };
   }

  async requestPasswordReset(email: string) {
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });
    if (!user) {
      throw new Error("User not found");
    }
    const generateResetCode: () => string = () => {
        return Math.floor(1000 + Math.random() * 9000).toString();
      };
  
      // Generate reset token
      const resetCode = generateResetCode();
      const resetCodeExpiry = new Date(Date.now() + 900000); // 15 minutes
  
      // Save reset token to user
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetCode,
          resetCodeExpiry,
        },
      });
  
    
    const templatePath = path.join(__dirname, "../mails/reset-password.mail.ejs");

    const body={
        user,
        resetCode
    }
    await sendMail({
        email: user.email,
        subject: 'Reset Your Password- IntelliCampus',
        template: templatePath,
        body,
    });
    return resetCode;

}

    async resetPassword(resetCode: string, newPassword: string) {
        const user = await prisma.user.findFirst({
            where: {
              resetCode,
              resetCodeExpiry: { gt: new Date() },
            },
          });
      
          if (!user) {
            throw new Error('Invalid or expired reset Code');
          }
      
          // Hash new password
          const newPasswordHash = await bycryptjs.hash(newPassword, 10);
      
          // Update user with new password and clear reset Code
          return prisma.user.update({
            where: { id: user.id },
            data: {
              password: newPasswordHash,
              resetCode: null,
              resetCodeExpiry: null,
            },
          });
        }   
    }

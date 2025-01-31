import { PrismaClient, User } from "@prisma/client";
import { generateToken } from "../utils/jwt.utils";
import bycryptjs from "bcryptjs";
import path from "path";
import sendMail from "../bg-services/email.service";

const prisma = new PrismaClient();

export default class AuthService {
  private async sendWelcomeEmail(user: User) {
    try {
      const templatePath = path.join(__dirname, "../mails/welcome.mail.ejs");
      const body = { user };
      await sendMail({
        email: user.email,
        subject: "Welcome to IntelliCampus",
        template: templatePath,
        body,
      });
    } catch (error) {
      console.error('Welcome email failed:', error);
      // Log to monitoring service
    }
  }

  private async sendPasswordResetEmail(user: User, resetCode: string) {
    try {
      const templatePath = path.join(__dirname, "../mails/reset-password.mail.ejs");
      const body = { user, resetCode };
      await sendMail({
        email: user.email,
        subject: "Reset Your Password - IntelliCampus",
        template: templatePath,
        body,
      });
    } catch (error) {
      console.error('Reset password email failed:', error);
      // Log to monitoring service
    }
  }

  async registerUser(data: User) {
    const phoneNumberExists = await prisma.user.findUnique({
      where: { phoneNumber: data.phoneNumber },
    });
    if (phoneNumberExists) {
      throw new Error("Phone number already exists");
    }

    const emailExists = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (emailExists) {
      throw new Error("Email already exists");
    }

    const hashedPassword = await bycryptjs.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
        role: "LEARNER", 
      },
    });

    // Send welcome email in background
    Promise.resolve(this.sendWelcomeEmail(user)).catch(console.error);

    return user;
  }

  async login(data: User) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (!user) {
      throw new Error("User account doesn't exist. Please create an account and try again.");
    }

    if (!user.isActive) {
      throw new Error("Your account has been deactivated. Please contact support.");
    }

    const isPasswordValid = await bycryptjs.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw new Error("Invalid email or password");
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,

    });

    return { user, token };
  }

  async requestPasswordReset(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      throw new Error("User not found");
    }

    const generateResetCode = () => {
      return Math.floor(1000 + Math.random() * 9000).toString();
    };

    const resetCode = generateResetCode();
    const resetCodeExpiry = new Date(Date.now() + 900000); // 15 minutes

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetCode,
        resetCodeExpiry,
      },
    });

    // Send reset password email in background
    Promise.resolve(this.sendPasswordResetEmail(user, resetCode)).catch(console.error);

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
      throw new Error("Invalid or expired reset Code");
    }

    const newPasswordHash = await bycryptjs.hash(newPassword, 10);
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
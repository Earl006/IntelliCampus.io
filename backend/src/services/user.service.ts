import { PrismaClient, User, Role } from "@prisma/client";
import bycryptjs from "bcryptjs";
import path from "path";
import sendMail from "../bg-services/email.service";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

export default class UserService {
  async getUserById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  async getUserByPhoneNumber(phoneNumber: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { phoneNumber } });
  }

  async changePassword(id: string, newPassword: string): Promise<User | null> {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new Error("User not found");
    }
    const hashedPassword = await bycryptjs.hash(newPassword, 10);
    return prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
  }

  async updateProfile(id: string, data: Partial<User>): Promise<User | null> {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  async deactivateAccount(id: string): Promise<User | null> {
    return prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async activateAccount(id: string): Promise<User | null> {
    return prisma.user.update({
      where: { id },
      data: { isActive: true },
    });
  }

  async deleteAccount(id: string): Promise<User | null> {
    return prisma.user.delete({ where: { id } });
  }

  async getAllUsers(): Promise<User[]> {
    return prisma.user.findMany();
  }

  async getAllActiveUsers(): Promise<User[]> {
    return prisma.user.findMany({
      where: { isActive: true },
    });
  }

  async getAllInactiveUsers(): Promise<User[]> {
    return prisma.user.findMany({
      where: { isActive: false },
    });
  }

  async getAllUsersByRole(role: Role): Promise<User[]> {
    return prisma.user.findMany({
      where: {
        role,
        isActive: true,
      },
    });
  }

  // Request instructor role
  async requestInstructorRole(id: string): Promise<User | null> {
    const templatePath = path.join(__dirname, "../mails/instructor-request.mail.ejs");
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new Error("User not found");
    }

    const body = { user };
    await sendMail({
      email: user.email,
      subject: "Instructor Role Request",
      template: templatePath,
      body,
    });

    return prisma.user.update({
      where: { id },
      data: {
        instructorStatus: "PENDING",
      },
    });
  }

  // Admin fetch of instructor requests
  async getInstructorRequests(): Promise<User[]> {
    return prisma.user.findMany({
      where: { instructorStatus: "PENDING" },
    });
  }

  // Approve instructor
  async approveInstructorRequests(id: string): Promise<User | null> {
    const templatePath = path.join(__dirname, "../mails/approve-request.mail.ejs");
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new Error("User not found");
    }

    const body = { user };
    await sendMail({
      email: user.email,
      subject: "Instructor Role Approved",
      template: templatePath,
      body,
    });

    return prisma.user.update({
      where: { id },
      data: {
        instructorStatus: "APPROVED",
        role: "INSTRUCTOR",
      },
    });
  }

  // Reject instructor
  async rejectInstructorRequests(id: string): Promise<User | null> {
    const templatePath = path.join(__dirname, "../mails/reject-request.mail.ejs");
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new Error("User not found");
    }

    const body = { user };
    await sendMail({
      email: user.email,
      subject: "Instructor Role Rejected",
      template: templatePath,
      body,
    });

    return prisma.user.update({
      where: { id },
      data: {
        instructorStatus: "REJECTED",
      },
    });
  }

  // Assign role (admin usage)
  async assignRole(id: string, role: Role): Promise<User | null> {
    return prisma.user.update({
      where: { id },
      data: { role },
    });
  }

  async getInstructorByUserId(userId: string): Promise<User | null> {
    return prisma.user.findFirst({
      where: {
        id: userId,
        role: "INSTRUCTOR",
      },
    });
  }

  // Mark a cohort as completed
  async markCohortAsCompleted(cohortId: string): Promise<void> {
    await prisma.cohort.update({
      where: { id: cohortId },
      data: { isCompleted: true },
    });
    //  send mails to each enrolled learner with a "certificate" or usage of your choice
  }
}
import { PrismaClient } from '@prisma/client';
import { Server } from 'socket.io';

const prisma = new PrismaClient();
const io = new Server();

class CourseService {
  async createCourse(title: string, description: string, instructorId: string) {
    const course = await prisma.course.create({
      data: {
        title,
        description,
        instructorId,
      },
    });

    // Create a chat room for the course
    await prisma.courseChatRoom.create({
      data: {
        courseId: course.id,
      },
    });

    return course;
  }

  async createCohort(courseId: string, instructorId: string) {
    const cohort = await prisma.cohort.create({
      data: {
        name: `Cohort ${new Date().getMonth() + 1}`,
        courseId,
        instructorId,
        startDate: new Date(),
      },
    });

    // Create a chat room for the cohort
    await prisma.cohortChatRoom.create({
      data: {
        cohortId: cohort.id,
      },
    });

    return cohort;
  }

  async enrollStudent(studentId: string, courseId: string) {
    // Find or create a cohort for the current month
    const currentMonth = new Date().getMonth() + 1;
    let cohort = await prisma.cohort.findFirst({
      where: {
        courseId,
        startDate: {
          gte: new Date(new Date().getFullYear(), currentMonth - 1, 1),
          lt: new Date(new Date().getFullYear(), currentMonth, 1),
        },
      },
    });

    if (!cohort) {
      cohort = await this.createCohort(courseId, studentId);
    }

    const enrollment = await prisma.enrollment.create({
      data: {
        userId: studentId,
        courseId,
        cohortId: cohort.id,
      },
    });

    // Add the student to the cohort chat room
    io.to(`cohort_${cohort.id}`).emit('new_student', { studentId });

    return enrollment;
  }

  async deferStudent(studentId: string, currentCohortId: string, targetCohortId: string) {
    // Update the student's enrollment to the target cohort
    const enrollment = await prisma.enrollment.updateMany({
      where: {
        userId: studentId,
        cohortId: currentCohortId,
      },
      data: {
        cohortId: targetCohortId,
      },
    });

    // Update the chat room membership
    io.to(`cohort_${currentCohortId}`).emit('student_left', { studentId });
    io.to(`cohort_${targetCohortId}`).emit('student_joined', { studentId });

    return enrollment;
  }
}

export default new CourseService();
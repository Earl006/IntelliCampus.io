import { PrismaClient, Course, Role } from "@prisma/client";
import { Server } from "socket.io";

const prisma = new PrismaClient();
const io = new Server();

class CourseService {
  // Create a new course, optionally with bannerImageUrl, subCategoryIds, isPaid, price, etc.
  async createCourse(
    title: string,
    description: string,
    instructorId: string,
    bannerImageUrl?: string,
    isPaid?: boolean,
    price?: number,
    subCategoryIds?: string[]
  ) {
    const course = await prisma.course.create({
      data: {
        title,
        description,
        instructorId,
        bannerImageUrl,
        isPaid: isPaid || false,
        price: price || 0,
        subCategories: subCategoryIds
          ? {
              connect: subCategoryIds.map((sid) => ({ id: sid })),
            }
          : undefined,
      },
    });

    // Create a chat room for the course
    await prisma.courseChatRoom.create({
      data: { courseId: course.id },
    });

    return course;
  }

  // CRUD for course
  async updateCourse(
    courseId: string,
    data: Partial<Course> & {
      subCategoryIds?: string[];
    }
  ) {
    // handle subcategory updates if provided
    let subCatsConnect, subCatsDisconnect;
    if (data.subCategoryIds) {
      // find existing subcats
      const existing = await prisma.course.findUnique({
        where: { id: courseId },
        select: { subCategories: true },
      });
      const existingIds = (existing?.subCategories || []).map((s) => s.id);
      subCatsConnect = data.subCategoryIds
        .filter((sid) => !existingIds.includes(sid))
        .map((sid) => ({ id: sid }));
      subCatsDisconnect = existingIds
        .filter((eid) => !data.subCategoryIds?.includes(eid))
        .map((eid) => ({ id: eid }));
    }

    const { subCategoryIds, ...rest } = data;
    const updated = await prisma.course.update({
      where: { id: courseId },
      data: {
        ...rest,
        subCategories:
          data.subCategoryIds !== undefined
            ? {
                connect: subCatsConnect,
                disconnect: subCatsDisconnect,
              }
            : undefined,
      },
    });
    return updated;
  }

  async deleteCourse(courseId: string) {
    return prisma.course.delete({ where: { id: courseId } });
  }

  // Publish or unpublish a course
  async setCoursePublishStatus(courseId: string, published: boolean) {
    return prisma.course.update({
      where: { id: courseId },
      data: { isPublished: published },
    });
  }

  // Create a cohort
  async createCohort(courseId: string, instructorId: string, startDate: Date) {
    const cohort = await prisma.cohort.create({
      data: {
        name: `Cohort ${new Date().getMonth() + 1}`,
        courseId,
        instructorId,
        startDate,
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

  // Enroll a learner in a course
  async enrollStudent(studentId: string, courseId: string) {
    // Find or create a cohort that suits the student's start (simple logic here).
    let cohort = await prisma.cohort.findFirst({
      where: {
        courseId,
        isCompleted: false,
      },
    });

    if (!cohort) {
      // fallback behavior: create a new cohort if none found
      cohort = await this.createCohort(courseId, studentId, new Date());
    }

    const enrollment = await prisma.enrollment.create({
      data: {
        userId: studentId,
        courseId,
        cohortId: cohort.id,
      },
    });

    // Add the student to the chat rooms
    io.to(`cohort_${cohort.id}`).emit("new_student", { studentId });
    io.to(`course_${courseId}`).emit("new_student", { studentId });

    return enrollment;
  }

  // Defer a student from one cohort to another
  async deferStudent(studentId: string, currentCohortId: string, targetCohortId: string) {
    const updated = await prisma.enrollment.updateMany({
      where: { userId: studentId, cohortId: currentCohortId },
      data: { cohortId: targetCohortId },
    });

    io.to(`cohort_${currentCohortId}`).emit("student_left", { studentId });
    io.to(`cohort_${targetCohortId}`).emit("student_joined", { studentId });

    return updated;
  }
}

export default new CourseService();
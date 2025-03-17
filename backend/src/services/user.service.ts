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
  async getUserNameById(id: string): Promise<string | null> {
    const user = await prisma.user.findUnique({ where: { id } });
    const name = `${user?.firstName} ${user?.lastName}`;
    return name;
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
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new Error("User not found");
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        instructorStatus: "PENDING",
      },
    });

    // Send email in background
    Promise.resolve(this.sendInstructorRequestEmail(user)).catch(console.error);

    return updatedUser;
  }

  // Admin fetch of instructor requests
  async getInstructorRequests(): Promise<User[]> {
    return prisma.user.findMany({
      where: { instructorStatus: "PENDING" },
    });
  }

  // Approve instructor
  async approveInstructorRequests(id: string): Promise<User | null> {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new Error("User not found");
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        instructorStatus: "APPROVED",
        role: "INSTRUCTOR",
      },
    });

    // Send approval email in background
    Promise.resolve(this.sendInstructorApprovalEmail(user)).catch(console.error);

    return updatedUser;
  }

  // Reject instructor
  async rejectInstructorRequests(id: string): Promise<User | null> {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new Error("User not found");
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        instructorStatus: "REJECTED",
      },
    });

    // Send rejection email in background
    Promise.resolve(this.sendInstructorRejectionEmail(user)).catch(console.error);

    return updatedUser;
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
      include: {
        coursesCreated: true,
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

  // Private email methods
  private async sendInstructorRequestEmail(user: User) {
    try {
      const templatePath = path.join(__dirname, "../mails/instructor-request.mail.ejs");
      const body = { user };
      await sendMail({
        email: user.email,
        subject: "Instructor Role Request",
        template: templatePath,
        body,
      });
    } catch (error) {
      console.error('Instructor request email failed:', error);
    }
  }

  private async sendInstructorApprovalEmail(user: User) {
    try {
      const templatePath = path.join(__dirname, "../mails/approve-request.mail.ejs");
      const body = { user };
      await sendMail({
        email: user.email,
        subject: "Instructor Role Approved",
        template: templatePath,
        body,
      });
    } catch (error) {
      console.error('Instructor approval email failed:', error);
    }
  }

  private async sendInstructorRejectionEmail(user: User) {
    try {
      const templatePath = path.join(__dirname, "../mails/reject-request.mail.ejs");
      const body = { user };
      await sendMail({
        email: user.email,
        subject: "Instructor Role Rejected",
        template: templatePath,
        body,
      });
    } catch (error) {
      console.error('Instructor rejection email failed:', error);
    }
  }


  /**
 * Get detailed information about a student for an instructor
 * Only returns information about the courses taught by the instructor
 */
async getStudentDetailsForInstructor(studentId: string, instructorId: string) {
  // Verify the student exists
  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phoneNumber: true,
      bio: true,
      createdAt: true,
    }
  });

  if (!student) {
    throw new Error("Student not found");
  }

  // Get all courses taught by this instructor
  const instructorCourses = await prisma.course.findMany({
    where: { instructorId },
    select: { id: true }
  });

  const instructorCourseIds = instructorCourses.map(course => course.id);

  // Get the student's enrollments in these courses
  const enrollments = await prisma.enrollment.findMany({
    where: {
      userId: studentId,
      courseId: { in: instructorCourseIds }
    },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          bannerImageUrl: true,
          price: true,
          isPaid: true,
        }
      }
    }
  });

  // Get assessment submissions
  const submissions = await prisma.submission.findMany({
    where: {
      userId: studentId,
      assessment: {
        courseId: { in: instructorCourseIds }
      }
    },
    include: {
      assessment: {
        select: {
          id: true,
          title: true,
          courseId: true,
        }
      }
    }
  });

  // Group submissions by course
  const submissionsByCourse = submissions.reduce((acc, submission) => {
    const courseId = submission.assessment.courseId;
    if (!acc[courseId]) {
      acc[courseId] = [];
    }
    acc[courseId].push(submission);
    return acc;
  }, {} as Record<string, typeof submissions>);

  // Calculate overall statistics
  const totalCourses = enrollments.length;
  const completedCourses = enrollments.filter(e => e.completed).length;
  const avgProgress = enrollments.length ? 
    enrollments.reduce((sum, e) => sum + e.progress, 0) / enrollments.length : 
    0;

  // Get reviews left by this student
  const reviews = await prisma.review.findMany({
    where: {
      userId: studentId,
      courseId: { in: instructorCourseIds }
    }
  });

  // Get comments by this student
  const comments = await prisma.comment.findMany({
    where: {
      userId: studentId,
      material: {
        courseId: { in: instructorCourseIds }
      }
    },
    include: {
      material: {
        select: {
          id: true,
          title: true,
          courseId: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 10
  });

  // Enrich the enrollments with additional data
  const enrichedEnrollments = enrollments.map(enrollment => {
    const courseSubmissions = submissionsByCourse[enrollment.courseId] || [];
    const totalSubmissions = courseSubmissions.length;
    const gradedSubmissions = courseSubmissions.filter(s => s.gradedAt).length;
    
    // Calculate average score for graded submissions
    let avgScore = null;
    if (gradedSubmissions > 0) {
      const scoreSum = courseSubmissions
        .filter(s => s.score !== null)
        .reduce((sum, s) => sum + (s.score || 0), 0);
      avgScore = scoreSum / gradedSubmissions;
    }
    
    // Find review for this course
    const review = reviews.find(r => r.courseId === enrollment.courseId);
    
    return {
      ...enrollment,
      submissions: {
        total: totalSubmissions,
        graded: gradedSubmissions,
        avgScore: avgScore
      },
      review: review ? {
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt
      } : null
    };
  });

  return {
    student,
    enrollments: enrichedEnrollments,
    statistics: {
      totalCourses,
      completedCourses,
      avgProgress,
      enrollmentRate: totalCourses / instructorCourseIds.length
    },
    recentComments: comments.map(comment => ({
      id: comment.id,
      content: comment.content,
      materialTitle: comment.material.title,
      courseId: comment.material.courseId,
      createdAt: comment.createdAt
    }))
  };
}

/**
 * Get detailed progress information for a specific student in a specific course
 */
async getStudentProgressInCourse(courseId: string, studentId: string) {
  // Verify the enrollment exists
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      userId: studentId,
      courseId
    }
  });

  if (!enrollment) {
    throw new Error("Student is not enrolled in this course");
  }

  // Get course materials
  const materials = await prisma.courseMaterial.findMany({
    where: { courseId },
    orderBy: [
      { week: 'asc' },
      { day: 'asc' },
    ]
  });

  // Get assessments for this course
  const assessments = await prisma.assessment.findMany({
    where: { courseId },
    include: {
      questions: {
        select: {
          id: true,
          content: true,
          type: true,
          points: true
        }
      }
    }
  });

  // Get student's submissions for this course
  const submissions = await prisma.submission.findMany({
    where: {
      userId: studentId,
      assessment: {
        courseId
      }
    }
  });

  // Map submissions to assessments
  const submissionsMap = submissions.reduce((map, submission) => {
    map[submission.assessmentId] = submission;
    return map;
  }, {} as Record<string, any>);

  // Get comments made by the student on materials
  const comments = await prisma.comment.findMany({
    where: {
      userId: studentId,
      material: {
        courseId
      }
    },
    include: {
      material: {
        select: { id: true }
      }
    }
  });

  // Create a map of material ID to comments count
  const commentsByMaterialId = comments.reduce((map, comment) => {
    const materialId = comment.materialId;
    if (!map[materialId]) map[materialId] = 0;
    map[materialId]++;
    return map;
  }, {} as Record<string, number>);

  // Calculate total points across all assessments
  const totalAssessmentPoints = assessments.reduce((total, assessment) => {
    return total + assessment.questions.reduce((sum, q) => sum + q.points, 0);
  }, 0);

  // Calculate earned points from submissions
  const earnedAssessmentPoints = submissions.reduce((total, submission) => {
    return total + (submission.score || 0);
  }, 0);

  // Transform assessments with submission data
  const assessmentProgress = assessments.map(assessment => {
    const submission = submissionsMap[assessment.id];
    const totalPoints = assessment.questions.reduce((sum, q) => sum + q.points, 0);
    
    return {
      id: assessment.id,
      title: assessment.title,
      description: assessment.description,
      totalPoints,
      questionCount: assessment.questions.length,
      submission: submission ? {
        id: submission.id,
        score: submission.score,
        submittedAt: submission.submittedAt,
        gradedAt: submission.gradedAt,
        feedback: submission.feedback,
        scorePercentage: submission.score !== null ? (submission.score / totalPoints) * 100 : null
      } : null
    };
  });

  // Group materials by week for better organization
  const materialsByWeek = materials.reduce((weeks, material) => {
    const weekNumber = material.week || 1; // Default to week 1 if not specified
    
    if (!weeks[weekNumber]) {
      weeks[weekNumber] = [];
    }
    
    weeks[weekNumber].push({
      id: material.id,
      title: material.title,
      type: material.type,
      commentCount: commentsByMaterialId[material.id] || 0,
      downloadable: material.downloadable,
      day: material.day || null
    });
    
    return weeks;
  }, {} as Record<number, any[]>);

  // Calculate overall course progress
  // We'll estimate based on enrollment.progress since we don't have content views
  const assessmentWeight = 0.3;
  const materialWeight = 0.7;
  
  let assessmentProgressPct = 0;
  if (totalAssessmentPoints > 0) {
    assessmentProgressPct = (earnedAssessmentPoints / totalAssessmentPoints) * 100;
  }
  
  // Use the enrollment.progress field as our material progress indicator
  const materialProgressPct = enrollment.progress;
  
  // Calculate weighted overall progress
  const overallProgress = (assessmentProgressPct * assessmentWeight) + 
                         (materialProgressPct * materialWeight);

  return {
    enrollment: {
      id: enrollment.id,
      enrolledAt: enrollment.enrolledAt,
      progress: enrollment.progress,
      completed: enrollment.completed
    },
    materials: materialsByWeek,
    assessments: assessmentProgress,
    progress: {
      overall: overallProgress,
      materials: materialProgressPct,
      assessments: assessmentProgressPct
    },
    certificateEligible: enrollment.completed
  };
}

/**
 * Update the progress percentage for a specific enrollment
 * Automatically marks enrollment as completed when progress reaches 100%
 */
async updateStudentProgress(enrollmentId: string, progress: number) {
  // Validate progress value
  if (progress < 0 || progress > 100) {
    throw new Error("Progress must be between 0 and 100");
  }
  
  // Get the current enrollment
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      },
      course: {
        select: {
          id: true,
          title: true
        }
      }
    }
  });
  
  if (!enrollment) {
    throw new Error("Enrollment not found");
  }
  
  // Check if progress is already at the desired value
  if (enrollment.progress === progress) {
    return enrollment;
  }
  
  // Determine if this update should mark the course as completed
  const isNowCompleted = progress >= 100;
  const wasAlreadyCompleted = enrollment.completed;
  
  // Update the enrollment
  const updatedEnrollment = await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: {
      progress: progress,
      completed: isNowCompleted
    }
  });
  
  // If the course was just completed, take additional actions
  if (isNowCompleted && !wasAlreadyCompleted) {
    // Send completion email in background
    Promise.resolve(this.sendCourseCompletionEmail(
      enrollment.user.email, 
      enrollment.user.firstName, 
      enrollment.course.title, 
      enrollment.course.id
    )).catch(console.error);
    
    // Generate certificate in background
    try {
      // Import the certificate service to generate a certificate
      const CertificateService = require('../bg-services/certificate.service').default;
      const certificateService = new CertificateService();
      
      Promise.resolve(certificateService.generateCertificate(
        enrollment.userId,
        enrollment.courseId
      )).catch(error => {
        console.error('Certificate generation failed:', error);
      });
    } catch (error) {
      console.error('Certificate service error:', error);
    }
  }
  
  return updatedEnrollment;
}

// Helper method for sending course completion email
private async sendCourseCompletionEmail(
  email: string, 
  firstName: string, 
  courseTitle: string,
  courseId: string
) {
  // Import necessary modules
  const path = require('path');
  const { sendMail } = require('../utils/email');
  
  try {
    const templatePath = path.join(__dirname, "../mails/course-completion.mail.ejs");
    const body = { 
      firstName,
      courseTitle,
      courseId,
      certificateUrl: `/certificates/${courseId}`
    };
    
    await sendMail({
      email: email,
      subject: `Congratulations on completing ${courseTitle}!`,
      template: templatePath,
      body,
    });
  } catch (error) {
    console.error('Course completion email failed:', error);
  }
}
}
import { PrismaClient, Assessment, Question, Submission, Prisma } from '@prisma/client';
import { injectable } from 'inversify';
import CertificateService from '../bg-services/certificate.service';
import { v4 as uuidv4 } from 'uuid';

export enum QuestionType {
  MULTIPLE_CHOICE = 'multiple-choice',
  ESSAY = 'essay',
  TRUE_FALSE = 'true-false',
  SHORT_ANSWER = 'short-answer',
  FILE_UPLOAD = 'file-upload'
}

interface QuestionOption {
  id: string;
  text: string;
  isCorrect?: boolean;
}

interface QuestionData {
  content: string;
  type: QuestionType;
  options?: QuestionOption[];
  correctAnswer?: string;
  points: number;
}

interface AssessmentData {
  title: string;
  description?: string;
  questions: QuestionData[];
  passingScore?: number;
  issueCertificate?: boolean;
}

@injectable()
export default class AssessmentService {
  private prisma: PrismaClient;
  private certificateService: CertificateService;

  constructor(certificateService: CertificateService) {
    this.prisma = new PrismaClient();
    this.certificateService = certificateService;
  }

  /**
   * Create a new assessment with questions
   */
  async createAssessment(courseId: string, data: AssessmentData): Promise<Assessment> {
    // Begin transaction to create assessment and related questions
    return this.prisma.$transaction(async (tx) => {
      // Create the assessment
      const assessment = await tx.assessment.create({
        data: {
          title: data.title,
          description: data.description,
          courseId,
        },
      });

      // Create questions for the assessment
      if (data.questions && data.questions.length > 0) {
        for (const questionData of data.questions) {
          await tx.question.create({
            data: {
              assessmentId: assessment.id,
              content: questionData.content,
              type: questionData.type,
              options: questionData.options ? JSON.stringify(questionData.options) : Prisma.JsonNull,
              correctAnswer: questionData.correctAnswer,
              points: questionData.points,
            },
          });
        }
      }

      return assessment;
    });
  }

  /**
   * Get assessment by ID with related questions
   */
  async getAssessment(assessmentId: string) {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: {
        questions: true,
      },
    });

    if (!assessment) {
      throw new Error('Assessment not found');
    }

    // Convert string options to JSON
    const questions = assessment.questions.map(question => ({
      ...question,
      options: question.options ? JSON.parse(question.options as string) : null,
    }));

    return {
      ...assessment,
      questions,
    };
  }

  /**
   * Get all assessments for a course
   */
  async getCourseAssessments(courseId: string) {
    return this.prisma.assessment.findMany({
      where: { courseId },
      include: {
        _count: {
          select: { questions: true, submissions: true },
        },
      },
    });
  }

  /**
   * Update an existing assessment
   */
  async updateAssessment(assessmentId: string, data: Partial<AssessmentData>) {
    return this.prisma.$transaction(async (tx) => {
      // Update the assessment
      const assessment = await tx.assessment.update({
        where: { id: assessmentId },
        data: {
          title: data.title,
          description: data.description,
        },
      });

      // If questions are provided, update them
      if (data.questions && data.questions.length > 0) {
        // Delete existing questions
        await tx.question.deleteMany({
          where: { assessmentId },
        });

        // Create new questions
        for (const questionData of data.questions) {
          await tx.question.create({
            data: {
              assessmentId: assessment.id,
              content: questionData.content,
              type: questionData.type,
              options: questionData.options ? JSON.stringify(questionData.options) : Prisma.JsonNull,
              correctAnswer: questionData.correctAnswer,
              points: questionData.points,
            },
          });
        }
      }

      return assessment;
    });
  }

  /**
   * Delete an assessment
   */
  async deleteAssessment(assessmentId: string) {
    // Check if assessment exists
    const assessment = await this.prisma.assessment.findUnique({
      where: { id: assessmentId },
    });

    if (!assessment) {
      throw new Error('Assessment not found');
    }

    // Delete the assessment and related questions/submissions
    return this.prisma.$transaction([
      this.prisma.question.deleteMany({
        where: { assessmentId },
      }),
      this.prisma.submission.deleteMany({
        where: { assessmentId },
      }),
      this.prisma.assessment.delete({
        where: { id: assessmentId },
      }),
    ]);
  }

  /**
   * Submit answers to an assessment
   */
  async submitAssessment(assessmentId: string, userId: string, answers: any) {
    // Verify the assessment exists
    const assessment = await this.prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: {
        questions: true,
        course: true,
      },
    });

    if (!assessment) {
      throw new Error('Assessment not found');
    }

    // Check for existing submission
    const existingSubmission = await this.prisma.submission.findFirst({
      where: {
        assessmentId,
        userId,
      },
    });

    if (existingSubmission) {
      throw new Error('You have already submitted this assessment');
    }

    // Create the submission
    const submission = await this.prisma.submission.create({
      data: {
        assessmentId,
        userId,
        answers: JSON.stringify(answers),
      },
    });

    // For auto-graded assessments (multiple choice, true/false)
    // we can automatically score the submission
    if (this.canAutoGrade(assessment.questions)) {
      await this.autoGradeSubmission(submission.id);
    }

    return submission;
  }

  /**
   * Check if an assessment can be auto-graded
   */
  private canAutoGrade(questions: any[]): boolean {
    // If all questions are multiple choice or true/false, we can auto-grade
    return questions.every(q => 
      q.type === QuestionType.MULTIPLE_CHOICE || 
      q.type === QuestionType.TRUE_FALSE
    );
  }

  /**
   * Auto-grade a submission for multiple choice questions
   */
  private async autoGradeSubmission(submissionId: string) {
    const submission = await this.prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        assessment: {
          include: {
            questions: true,
          },
        },
      },
    });

    if (!submission) {
      throw new Error('Submission not found');
    }

    // Parse the answers
    const answers = JSON.parse(submission.answers as string);
    const questions = submission.assessment.questions;
    
    let totalPoints = 0;
    let earnedPoints = 0;
    const gradedAnswers = [];

    for (const question of questions) {
      totalPoints += question.points;
      const userAnswer = answers[question.id];
      
      // Parse options if needed
      const options = question.options ? JSON.parse(question.options as string) : null;
      
      // Grade based on question type
      let isCorrect = false;
      if (question.type === QuestionType.MULTIPLE_CHOICE) {
        isCorrect = userAnswer === question.correctAnswer;
      } else if (question.type === QuestionType.TRUE_FALSE) {
        isCorrect = userAnswer === question.correctAnswer;
      }

      if (isCorrect) {
        earnedPoints += question.points;
      }

      gradedAnswers.push({
        questionId: question.id,
        userAnswer,
        isCorrect,
        pointsEarned: isCorrect ? question.points : 0,
      });
    }

    // Calculate percentage score
    const score = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;

    // Update the submission
    await this.prisma.submission.update({
      where: { id: submissionId },
      data: {
        score,
        gradedAt: new Date(),
      },
    });

    // Check if the user has completed the course
    // If score is passing (e.g., >= 70%), generate certificate
    if (score >= 70) {
      await this.checkCourseCompletion(submission.userId, submission.assessment.courseId);
    }

    return {
      submissionId,
      score,
      gradedAnswers,
    };
  }

  /**
   * Get all submissions for an assessment
   */
  async getSubmissions(assessmentId: string) {
    return this.prisma.submission.findMany({
      where: { assessmentId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        submittedAt: 'desc',
      },
    });
  }

  /**
   * Grade a submission manually
   */
  async gradeSubmission(submissionId: string, grades: any[], feedback: string) {
    // Validate submission exists
    const submission = await this.prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        assessment: true,
      },
    });

    if (!submission) {
      throw new Error('Submission not found');
    }

    // Calculate total score based on grades
    let totalPoints = 0;
    let earnedPoints = 0;

    for (const grade of grades) {
      totalPoints += grade.maxPoints;
      earnedPoints += grade.pointsAwarded;
    }

    const score = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;

    // Update the submission
    const gradedSubmission = await this.prisma.submission.update({
      where: { id: submissionId },
      data: {
        score,
        feedback,
        gradedAt: new Date(),
      },
      include: {
        user: true,
        assessment: {
          include: {
            course: true,
          },
        },
      },
    });

    // Check if the user has completed the course
    // If score is passing (e.g., >= 70%), generate certificate
    if (score >= 70) {
      await this.checkCourseCompletion(
        gradedSubmission.userId, 
        gradedSubmission.assessment.courseId
      );
    }

    return gradedSubmission;
  }

  /**
   * Check if a user has completed all assessments for a course
   * If so, generate a certificate
   */
  async checkCourseCompletion(userId: string, courseId: string) {
    // Get all assessments for the course
    const assessments = await this.prisma.assessment.findMany({
      where: { courseId },
    });

    // Get all user submissions for these assessments
    const submissions = await this.prisma.submission.findMany({
      where: {
        userId,
        assessmentId: {
          in: assessments.map(a => a.id),
        },
      },
    });

    // Check if user has completed all assessments with passing score
    const allCompleted = assessments.every(assessment => {
      const submission = submissions.find(s => s.assessmentId === assessment.id);
      return submission && submission.score && submission.score >= 70;
    });

    if (allCompleted) {
      // Update enrollment status if needed
      await this.prisma.enrollment.updateMany({
        where: {
          userId,
          courseId,
        },
        data: {
          completed: true,
          progress: 100,
        },
      });

      // Generate certificate
      await this.certificateService.generateCertificate(userId, courseId);
    }

    return allCompleted;
  }

  /**
   * Get analytics for an assessment
   */
  async getAssessmentAnalytics(assessmentId: string) {
    // Get the assessment
    const assessment = await this.prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: {
        questions: true,
        submissions: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!assessment) {
      throw new Error('Assessment not found');
    }

    // Calculate statistics
    const submissionsCount = assessment.submissions.length;
    const gradedSubmissions = assessment.submissions.filter(s => s.gradedAt !== null);
    const averageScore = gradedSubmissions.length > 0
      ? gradedSubmissions.reduce((sum, s) => sum + (s.score || 0), 0) / gradedSubmissions.length
      : 0;

    // Calculate score distribution
    const scoreDistribution = {
      '0-20': 0,
      '21-40': 0,
      '41-60': 0,
      '61-80': 0,
      '81-100': 0,
    };

    gradedSubmissions.forEach(submission => {
      const score = submission.score || 0;
      if (score <= 20) scoreDistribution['0-20']++;
      else if (score <= 40) scoreDistribution['21-40']++;
      else if (score <= 60) scoreDistribution['41-60']++;
      else if (score <= 80) scoreDistribution['61-80']++;
      else scoreDistribution['81-100']++;
    });

    // Find most missed questions
    const missedQuestions = [];
    if (gradedSubmissions.length > 0) {
      for (const question of assessment.questions) {
        const incorrectCount = gradedSubmissions.filter(submission => {
          const answers = JSON.parse(submission.answers as string);
          const answer = answers[question.id];
          return answer !== question.correctAnswer;
        }).length;

        const incorrectPercentage = (incorrectCount / gradedSubmissions.length) * 100;
        
        missedQuestions.push({
          questionId: question.id,
          content: question.content,
          incorrectPercentage,
        });
      }
    }

    // Sort by most missed
    missedQuestions.sort((a, b) => b.incorrectPercentage - a.incorrectPercentage);

    return {
      assessmentId,
      title: assessment.title,
      submissionsCount,
      gradedCount: gradedSubmissions.length,
      averageScore,
      scoreDistribution,
      mostMissedQuestions: missedQuestions.slice(0, 3),  // Top 3 most missed
      lastSubmissions: assessment.submissions
        .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
        .slice(0, 5)  // Latest 5 submissions
        .map(s => ({
          id: s.id,
          studentName: `${s.user.firstName} ${s.user.lastName}`,
          submittedAt: s.submittedAt,
          score: s.score,
          graded: s.gradedAt !== null,
        }))
    };
  }
}
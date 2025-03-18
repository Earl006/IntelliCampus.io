import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export enum QuestionType {
  MULTIPLE_CHOICE = 'multiple-choice',
  ESSAY = 'essay',
  TRUE_FALSE = 'true-false',
  SHORT_ANSWER = 'short-answer',
  FILE_UPLOAD = 'file-upload'
}

interface QuestionOption {
  id?: string;
  text: string;
  isCorrect?: boolean;
}

interface Question {
  id?: string;
  content: string;
  type: QuestionType;
  options?: QuestionOption[];
  correctAnswer?: string;
  points: number;
}

interface Assessment {
  id?: string;
  title: string;
  description?: string;
  courseId?: string;
  questions: Question[];
  passingScore?: number;
  issueCertificate?: boolean;
}

interface SubmissionGrade {
  questionId: string;
  score: number;
  comment: string;
}

@Injectable({
  providedIn: 'root'
})
export class AssessmentService {
  private apiUrl = `${environment.apiUrl}/assesment`;

  constructor(private http: HttpClient) { }

  /**
   * Create a new assessment for a course
   * @param courseId - ID of the course
   * @param assessment - Assessment data
   */
  createAssessment(courseId: string, assessment: Assessment): Observable<any> {
    return this.http.post(`${this.apiUrl}/courses/${courseId}`, assessment);
  }

  /**
   * Get an assessment by ID
   * @param assessmentId - ID of the assessment
   */
  getAssessment(assessmentId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${assessmentId}`);
  }

  /**
   * Get all assessments for a course
   * @param courseId - ID of the course
   */
  getCourseAssessments(courseId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/courses/${courseId}`);
  }

  /**
   * Update an assessment
   * @param assessmentId - ID of the assessment
   * @param assessment - Updated assessment data
   */
  updateAssessment(assessmentId: string, assessment: Partial<Assessment>): Observable<any> {
    return this.http.put(`${this.apiUrl}/${assessmentId}`, assessment);
  }

  /**
   * Delete an assessment
   * @param assessmentId - ID of the assessment
   */
  deleteAssessment(assessmentId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${assessmentId}`);
  }

  /**
   * Submit answers to an assessment
   * @param assessmentId - ID of the assessment
   * @param answers - Student answers
   */
  submitAssessment(assessmentId: string, answers: Record<string, any>): Observable<any> {
    return this.http.post(`${this.apiUrl}/${assessmentId}/submit`, { answers });
  }

  /**
   * Get all submissions for an assessment
   * @param assessmentId - ID of the assessment
   */
  getSubmissions(assessmentId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${assessmentId}/submissions`);
  }

  /**
   * Grade a submission
   * @param submissionId - ID of the submission
   * @param grades - Grades for each question
   * @param feedback - Overall feedback
   */
  gradeSubmission(submissionId: string, grades: SubmissionGrade[], feedback: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/submissions/${submissionId}/grade`, {
      grades,
      feedback
    });
  }

  /**
   * Get analytics for an assessment
   * @param assessmentId - ID of the assessment
   */
  getAssessmentAnalytics(assessmentId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${assessmentId}/analytics`);
  }
}
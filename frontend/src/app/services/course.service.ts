import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface Course {
  id: string;
  title: string;
  description: string;
  instructor: Instructor;
  instructorId: string;
  isPaid: boolean;
  isPublished: boolean;
  price: number;
  bannerImageUrl?: string;
  subCategories: SubCategory[];
  createdAt: Date;
  updatedAt: Date;
}

interface Instructor {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  bio?: string;
  phoneNumber: string;
  role: string;
  instructorStatus: string;
  earnings: number;
  isActive: boolean;
}

interface SubCategory {
  id: string;
  name: string;
  categoryId: string;
}
export interface ApiResponse<T> {
  success: boolean;
  data: T;
}



export interface Cohort {
  id: string;
  name: string;
  courseId: string;
  instructorId: string;
  startDate: Date;
  endDate?: Date;
  isCompleted: boolean;
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  enrolledAt: Date;
  progress: number;
  completed: boolean;
  cohortId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CourseService {
  private apiUrl = 'http://localhost:3000/api/courses';
  private headers = new HttpHeaders().set('Content-Type', 'application/json');
  private token = localStorage.getItem('token');
  private tokenHeader = new HttpHeaders().set('Authorization', `Bearer ${this.token}`);
  constructor(private http: HttpClient) { }

  // Course CRUD Operations
  getCourses(): Observable<ApiResponse<Course[]>> {
    return this.http.get<ApiResponse<Course[]>>(this.apiUrl)
      .pipe(catchError(this.handleError));
  }

  getCourseById(id: string): Observable<ApiResponse<Course>> {
    return this.http.get<ApiResponse<Course>>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  getCoursesByCategory(categoryId: string): Observable<Course[]> {
    return this.http.get<Course[]>(`${this.apiUrl}/category/${categoryId}`)
      .pipe(catchError(this.handleError));
  }

  getInstructorCourses(instructorId: string): Observable<Course[]> {
    return this.http.get<Course[]>(`${this.apiUrl}/instructor/${instructorId}`)
      .pipe(catchError(this.handleError));
  }

  createCourse(formData: FormData): Observable<Course> {
    return this.http.post<Course>(this.apiUrl, formData)
      .pipe(catchError(this.handleError));
  }

  updateCourse(id: string, formData: FormData): Observable<Course> {
    return this.http.put<Course>(`${this.apiUrl}/${id}`, formData)
      .pipe(catchError(this.handleError));
  }

  deleteCourse(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  // Course Publishing
  setCoursePublishStatus(courseId: string, publish: boolean): Observable<Course> {
    return this.http.post<Course>(`${this.apiUrl}/${courseId}/publish`, { publish })
      .pipe(catchError(this.handleError));
  }

  // Enrollment Management
  enrollInCourse(courseId: string, paymentMethod?: string): Observable<Enrollment> {
    return this.http.post<Enrollment>(`${this.apiUrl}/${courseId}/enroll`, { paymentMethod })
      .pipe(catchError(this.handleError));
  }

  // Cohort Management
  createCohort(courseId: string, startDate: Date): Observable<Cohort> {
    return this.http.post<Cohort>(`${this.apiUrl}/${courseId}/cohorts`, { startDate })
      .pipe(catchError(this.handleError));
  }

  getCourseCohorts(courseId: string): Observable<Cohort[]> {
    return this.http.get<Cohort[]>(`${this.apiUrl}/${courseId}/cohorts`)
      .pipe(catchError(this.handleError));
  }

  deferStudent(currentCohortId: string, targetCohortId: string): Observable<void> {
    return this.http.post<void>(
      `${this.apiUrl}/cohorts/${currentCohortId}/defer/${targetCohortId}`, {})
      .pipe(catchError(this.handleError));
  }

  getEnrolledStudents(courseId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${courseId}/students`)
      .pipe(catchError(this.handleError));
  }

  getEnrollmentsForUser(): Observable<any[]> {
    return this.http.get<Enrollment[]>(`${this.apiUrl}/u/enrollments`,{ headers: this.tokenHeader })
      .pipe(catchError(this.handleError));
  }
  private handleError(error: any) {
    let errorMessage = 'An error occurred';
    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else if (error.status) {
      errorMessage = `Error: ${error.error.message || error.statusText}`;
    }
    return throwError(() => errorMessage);
  }


  /**
 * Get all courses taught by the current instructor with dashboard statistics
 * @returns Observable with dashboard course data
 */
getInstructorDashboardCourses(): Observable<any> {
  return this.http.get<any>(
    `${this.apiUrl}/instructor/dashboard`, 
    { headers: this.tokenHeader }
  ).pipe(catchError(this.handleError));
}

/**
 * Get detailed analytics for a specific course
 * @param courseId The ID of the course
 * @returns Observable with course analytics data
 */
getCourseAnalytics(courseId: string): Observable<any> {
  return this.http.get<any>(
    `${this.apiUrl}/${courseId}/analytics`, 
    { headers: this.tokenHeader }
  ).pipe(catchError(this.handleError));
}

/**
 * Publish a course with validation checks
 * Ensures the course meets all requirements before publishing
 * @param courseId The ID of the course to publish
 * @returns Observable with the published course
 */
publishCourseWithValidation(courseId: string): Observable<Course> {
  return this.http.post<Course>(
    `${this.apiUrl}/${courseId}/publish-verified`, 
    {}, 
    { headers: this.headers }
  ).pipe(catchError(this.handleError));
}
}
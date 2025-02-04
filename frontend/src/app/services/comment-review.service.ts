import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface Comment {
  id: string;
  materialId: string;
  userId: string;
  content: string;
  createdAt: Date;
}

export interface Review {
  id: string;
  courseId: string;
  userId: string;
  rating: number;
  comment?: string;
  createdAt: Date;
}
export interface ApiResponse<T> {
  success: boolean;
  data: T;
}


@Injectable({
  providedIn: 'root'
})
export class CommentReviewService {
  private apiUrl = 'http://localhost:3000/api/comment-review';
  private headers = new HttpHeaders().set('Content-Type', 'application/json');

  constructor(private http: HttpClient) { }

  // Comment Methods
  getCommentsForMaterial(materialId: string): Observable<Comment[]> {
    return this.http.get<Comment[]>(`${this.apiUrl}/materials/${materialId}/comments`)
      .pipe(catchError(this.handleError));
  }

  addComment(materialId: string, content: string): Observable<Comment> {
    return this.http.post<Comment>(
      `${this.apiUrl}/materials/${materialId}/comments`,
      { content },
      { headers: this.headers }
    ).pipe(catchError(this.handleError));
  }
  getAllReviews(): Observable<ApiResponse<Review[]>> {
    return this.http.get<ApiResponse<Review[]>>(`${this.apiUrl}/reviews`)
      .pipe(catchError(this.handleError));
  }

  // Review Methods
  getReviewsForCourse(courseId: string): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.apiUrl}/courses/${courseId}/reviews`)
      .pipe(catchError(this.handleError));
  }

  addReview(courseId: string, rating: number, comment?: string): Observable<Review> {
    return this.http.post<Review>(
      `${this.apiUrl}/courses/${courseId}/reviews`,
      { rating, comment },
      { headers: this.headers }
    ).pipe(catchError(this.handleError));
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
}
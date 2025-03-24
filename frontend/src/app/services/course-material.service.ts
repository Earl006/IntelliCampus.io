import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface Material {
  id: string;
  title: string;
  type: 'VIDEO' | 'DOCUMENT' | 'QUIZ' | 'ASSIGNMENT';
  week: number;
  day: number;
  order?: number;
  createdAt: string;
  updatedAt: string;
  duration?: number;
  fileUrl?: string;
  content?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CourseMaterialService {
  private baseUrl = `${environment.apiUrl}/api/materials`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  /**
   * Get all materials for a specific course
   */
  getMaterialsByCourse(courseId: string): Observable<ApiResponse<Material[]>> {
    const url = `${this.baseUrl}/course/${courseId}`;
    return this.http.get<ApiResponse<Material[]>>(url, { headers: this.getAuthHeaders() })
      .pipe(
        tap(response => console.log('Fetched course materials:', response)),
        catchError(this.handleError)
      );
  }

  /**
   * Get a single material by its ID
   */
  getMaterialById(materialId: string): Observable<ApiResponse<Material>> {
    const url = `${this.baseUrl}/${materialId}`;
    return this.http.get<ApiResponse<Material>>(url, { headers: this.getAuthHeaders() })
      .pipe(
        tap(response => console.log(`Fetched material ${materialId}:`, response)),
        catchError(this.handleError)
      );
  }

  /**
   * Create a new material for a course
   * Expects multipart/form-data (including file/s)
   */
  createMaterial(courseId: string, formData: FormData): Observable<ApiResponse<Material>> {
    const url = `${this.baseUrl}/course/${courseId}`;
    return this.http.post<ApiResponse<Material>>(url, formData, { headers: this.getAuthHeadersMultipart() })
      .pipe(
        tap(response => console.log('Created material:', response)),
        catchError(this.handleError)
      );
  }

  /**
   * Update an existing material by its ID
   */
  updateMaterial(materialId: string, data: any): Observable<ApiResponse<Material>> {
    const url = `${this.baseUrl}/${materialId}`;
    return this.http.put<ApiResponse<Material>>(url, data, { headers: this.getAuthHeaders() })
      .pipe(
        tap(response => console.log(`Updated material ${materialId}:`, response)),
        catchError(this.handleError)
      );
  }

  /**
   * Delete a material by its ID
   */
  deleteMaterial(materialId: string): Observable<ApiResponse<any>> {
    const url = `${this.baseUrl}/${materialId}`;
    return this.http.delete<ApiResponse<any>>(url, { headers: this.getAuthHeaders() })
      .pipe(
        tap(response => console.log(`Deleted material ${materialId}:`, response)),
        catchError(this.handleError)
      );
  }

  /**
   * Returns auth headers using the AuthService token.
   */
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }
  
  /**
   * Returns headers for multipart/form-data.
   * Note: Angular will automatically set the Content-Type with proper boundary.
   */
  private getAuthHeadersMultipart(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Centralized error handling
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side/network error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = error.error?.message || `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}

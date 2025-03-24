import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export interface Category {
  id: string;
  name: string;
  subCategories?: SubCategory[];
}

export interface SubCategory {
  id: string;
  name: string;
  categoryId: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private apiUrl = `${environment.apiUrl}/api/categories`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  /**
   * Get all categories
   * Public endpoint - no authentication required
   */
  getCategories(): Observable<ApiResponse<Category[]>> {
    return this.http.get<ApiResponse<Category[]>>(this.apiUrl)
      .pipe(
        tap(response => console.log('Categories fetched:', response)),
        catchError(this.handleError)
      );
  }

  /**
   * Get a specific category by ID
   * Public endpoint - no authentication required
   */
  getCategoryById(id: string): Observable<ApiResponse<Category>> {
    return this.http.get<ApiResponse<Category>>(`${this.apiUrl}/${id}`)
      .pipe(
        tap(response => console.log(`Category ${id} fetched:`, response)),
        catchError(this.handleError)
      );
  }

  /**
   * Create a new category
   * Admin only endpoint
   */
  createCategory(categoryData: { name: string }): Observable<ApiResponse<Category>> {
    return this.http.post<ApiResponse<Category>>(this.apiUrl, categoryData, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      tap(response => console.log('Category created:', response)),
      catchError(this.handleError)
    );
  }

  /**
   * Update an existing category
   * Admin only endpoint
   */
  updateCategory(id: string, categoryData: { name: string }): Observable<ApiResponse<Category>> {
    return this.http.put<ApiResponse<Category>>(`${this.apiUrl}/${id}`, categoryData, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      tap(response => console.log(`Category ${id} updated:`, response)),
      catchError(this.handleError)
    );
  }

  /**
   * Delete a category
   * Admin only endpoint
   */
  deleteCategory(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      tap(response => console.log(`Category ${id} deleted:`, response)),
      catchError(this.handleError)
    );
  }

  /**
   * Create a new subcategory within a category
   * Admin only endpoint
   */
  createSubCategory(categoryId: string, subCategoryData: { name: string }): Observable<ApiResponse<SubCategory>> {
    return this.http.post<ApiResponse<SubCategory>>(`${this.apiUrl}/${categoryId}/subcategories`, subCategoryData, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      tap(response => console.log(`Subcategory created in category ${categoryId}:`, response)),
      catchError(this.handleError)
    );
  }

  /**
   * Update an existing subcategory
   * Admin only endpoint
   */
  updateSubCategory(id: string, subCategoryData: { name: string }): Observable<ApiResponse<SubCategory>> {
    return this.http.put<ApiResponse<SubCategory>>(`${this.apiUrl}/subcategories/${id}`, subCategoryData, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      tap(response => console.log(`Subcategory ${id} updated:`, response)),
      catchError(this.handleError)
    );
  }

  /**
   * Delete a subcategory
   * Admin only endpoint
   */
  deleteSubCategory(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/subcategories/${id}`, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      tap(response => console.log(`Subcategory ${id} deleted:`, response)),
      catchError(this.handleError)
    );
  }

  /**
   * Error handler for HTTP requests
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = error.error?.message || `Error Code: ${error.status}, Message: ${error.message}`;
    }
    
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
  
  /**
   * Check if user has admin privileges
   * Utility method to determine if UI should show admin features
   */
  // isAdmin(): boolean {
  //   return this.authService.hasRole('ADMIN');
  // }
}
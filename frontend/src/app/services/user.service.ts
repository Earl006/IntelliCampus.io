import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  role: 'ADMIN' | 'INSTRUCTOR' | 'LEARNER';
  instructorStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'NOT_REQUESTED';
  isActive: boolean;
  bio?: string;
  earnings: number;
  createdAt: Date;
  updatedAt: Date;
}
export interface ApiResponse<T> {
  success: boolean;
  data: T;
}
export interface UserNameResponse {
  success: boolean;
  data: string;
}


@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:3000/api/users';
  private headers = new HttpHeaders().set('Content-Type', 'application/json');

  constructor(private http: HttpClient) { }

  // // Public Routes
  // getUserByEmail(email: string): Observable<User> {
  //   return this.http.get<User>(`${this.apiUrl}/${email}`)
  //     .pipe(catchError(this.handleError));
  // }

  // getUserByPhone(phone: string): Observable<User> {
  //   return this.http.get<User>(`${this.apiUrl}/phone/${phone}`)
  //     .pipe(catchError(this.handleError));
  // }

  // Protected User Routes
  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/profile/me`)
      .pipe(catchError(this.handleError));
  }

  getUserNameById(id: string): Observable<UserNameResponse> {
    return this.http.post<UserNameResponse>(`${this.apiUrl}/name`, { id }, { headers: this.headers });
  }

  updateProfile(data: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/profile/update`, data, { headers: this.headers })
      .pipe(catchError(this.handleError));
  }

  changePassword(newPassword: string): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/profile/change-password`, { newPassword }, { headers: this.headers })
      .pipe(catchError(this.handleError));
  }

  deactivateAccount(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/profile/deactivate`, {})
      .pipe(catchError(this.handleError));
  }

  requestInstructorRole(): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/instructor/request`, {})
      .pipe(catchError(this.handleError));
  }

  // Admin Routes
  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/admin/all`)
      .pipe(catchError(this.handleError));
  }

  getActiveUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/admin/active`)
      .pipe(catchError(this.handleError));
  }

  getInactiveUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/admin/inactive`)
      .pipe(catchError(this.handleError));
  }

  getUsersByRole(role: string): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/admin/role/${role}`)
      .pipe(catchError(this.handleError));
  }

  getInstructorRequests(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/admin/instructor-requests`)
      .pipe(catchError(this.handleError));
  }

  getInstructor(id: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/instructor/${id}`)
      .pipe(catchError(this.handleError));
  }

  approveInstructor(id: string): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/admin/approve-instructor/${id}`, {})
      .pipe(catchError(this.handleError));
  }

  rejectInstructor(id: string): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/admin/reject-instructor/${id}`, {})
      .pipe(catchError(this.handleError));
  }

  assignRole(id: string, role: string): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/admin/assign-role/${id}`, { role }, { headers: this.headers })
      .pipe(catchError(this.handleError));
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/admin/delete/${id}`)
      .pipe(catchError(this.handleError));
  }

  activateUser(id: string): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/admin/activate/${id}`, {})
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
}

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private apiUrl = `${environment.apiUrl}/api/analytics`;

  constructor(
    private http: HttpClient,
    private authService: AuthService 
  ) { }

  // Get fresh auth headers for each request
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }  

  /**
   * Get instructor dashboard overview data
   */
  getDashboardData(): Observable<any> {
    return this.http.get(`${this.apiUrl}/dashboard`, { 
      headers: this.getAuthHeaders() 
    });
  }

  /**
   * Get revenue statistics
   * @param period - The time period for revenue data ('week', 'month', 'quarter', 'year')
   */
  getRevenueStats(period: string = 'month'): Observable<any> {
    return this.http.get(`${this.apiUrl}/revenue`, {
      headers: this.getAuthHeaders(),
      params: { period }
    });
  }

  /**
   * Get custom date range revenue statistics
   * @param startDate - Start date for revenue data
   * @param endDate - End date for revenue data
   */
  getCustomRevenueStats(startDate: string, endDate: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/revenue`, {
      headers: this.getAuthHeaders(),
      params: { 
        period: 'custom',
        start: startDate,
        end: endDate
      }
    });
  }

  /**
   * Get course engagement data
   * @param courseId - ID of the course
   */
  getCourseEngagementData(courseId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/courses/${courseId}/engagement`, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Get combined analytics data for instructor dashboard
   */
  getInstructorAnalytics(): Observable<any> {
    console.log('Getting fresh token for analytics request');
    const headers = this.getAuthHeaders();
    console.log('Using auth header:', headers.get('Authorization')?.substring(0, 20) + '...');
    
    return this.http.get(`${this.apiUrl}/instructor`, { 
      headers: headers 
    });
  }
}
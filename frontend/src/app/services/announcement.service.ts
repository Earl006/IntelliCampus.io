import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

interface Announcement {
  id?: string;
  title: string;
  content: string;
  courseId?: string;
  courseTitle?: string;
  instructorId?: string;
  instructorName?: string;
  createdAt?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class AnnouncementService {
  private apiUrl = `${environment.apiUrl}/api/announcement`;

  constructor(private http: HttpClient) { }

    private getAuthHeaders(): HttpHeaders {
      const token = localStorage.getItem('token');
      return new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      });
    }   

  /**
   * Create a new announcement for a course
   * @param courseId - ID of the course
   * @param announcement - Announcement data
   */
  createAnnouncement(courseId: string, announcement: Announcement): Observable<any> {
    return this.http.post(`${this.apiUrl}/courses/${courseId}`,announcement, {headers:this.getAuthHeaders()} );
  }

  /**
   * Get all announcements for an instructor
   */
  getInstructorAnnouncements(): Observable<any> {
    return this.http.get(`${this.apiUrl}/instructor`, {headers:this.getAuthHeaders()});
  }

  /**
   * Get all announcements for a course
   * @param courseId - ID of the course
   */
  getCourseAnnouncements(courseId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/courses/${courseId}`, {headers:this.getAuthHeaders()});
  }

  /**
   * Delete an announcement
   * @param announcementId - ID of the announcement
   */
  deleteAnnouncement(announcementId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${announcementId}`, {headers:this.getAuthHeaders()});
  }

  /**
   * Process markdown content for rendering
   * @param content - Markdown content
   */
  processAnnouncementContent(content: string): string {
    // This is a placeholder. Implement with markdown-it or similar library
    return content;
  }
}
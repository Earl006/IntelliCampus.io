import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, forkJoin } from 'rxjs';
import { tap, map, catchError } from 'rxjs/operators';
import { AnalyticsService } from './analytics.service';
import { AnnouncementService } from './announcement.service';
import { AssessmentService } from './assessment.service';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private dashboardDataSubject = new BehaviorSubject<any>(null);
  private loadingSubject = new BehaviorSubject<boolean>(false);

  dashboardData$ = this.dashboardDataSubject.asObservable();
  loading$ = this.loadingSubject.asObservable();

  constructor(
    private analyticsService: AnalyticsService,
    private announcementService: AnnouncementService,
    private assessmentService: AssessmentService
  ) { }

  /**
   * Load all dashboard data
   */
  loadDashboardData(): void {
    this.loadingSubject.next(true);

    this.analyticsService.getInstructorAnalytics().pipe(
      tap(data => {
        this.dashboardDataSubject.next(data);
        this.loadingSubject.next(false);
      }),
      catchError(error => {
        console.error('Error loading dashboard data', error);
        this.loadingSubject.next(false);
        throw error;
      })
    ).subscribe();
  }

  /**
   * Load course-specific data
   * @param courseId - ID of the course
   */
  loadCourseData(courseId: string): Observable<any> {
    this.loadingSubject.next(true);

    return forkJoin({
      analytics: this.analyticsService.getCourseEngagementData(courseId),
      announcements: this.announcementService.getCourseAnnouncements(courseId),
      assessments: this.assessmentService.getCourseAssessments(courseId)
    }).pipe(
      map(result => {
        this.loadingSubject.next(false);
        return result;
      }),
      catchError(error => {
        console.error('Error loading course data', error);
        this.loadingSubject.next(false);
        throw error;
      })
    );
  }

  /**
   * Get revenue statistics with date range
   * @param period - Period for revenue data
   */
  getRevenueStats(period: string = 'month'): Observable<any> {
    return this.analyticsService.getRevenueStats(period);
  }

  /**
   * Get recent announcements for dashboard
   */
  getRecentAnnouncements(): Observable<any> {
    return this.announcementService.getInstructorAnnouncements().pipe(
      map(response => {
        if (response && response.data) {
          // Sort by date and limit to 5 most recent
          return response.data
            .sort((a: any, b: any) => 
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )
            .slice(0, 5);
        }
        return [];
      })
    );
  }
}
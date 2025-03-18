import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DashboardService } from '../../services/dashboard.service';
import { CourseService } from '../../services/course.service';
import { AuthService } from '../../services/auth.service';
import { AnnouncementService } from '../../services/announcement.service';
import { AnalyticsService } from '../../services/analytics.service';

interface CourseStats {
  id: string;
  title: string;
  bannerImageUrl?: string;
  description: string;
  statistics: {
    totalEnrollments: number;
    completionRate: number;
    avgRating: number;
    revenue: number;
    isReadyToPublish: boolean;
  };
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  isLoading = true;
  error: string | null = null;
  dashboardData: any = null;
  instructorCourses: CourseStats[] = [];
  recentAnnouncements: any[] = [];
  recentReviews: any[] = [];
  recentEnrollments: any[] = [];
  
  // Calculated metrics
  totalRevenue = 0;
  totalStudents = 0;
  avgCompletionRate = 0;
  totalCourses = 0;
  
  constructor(
    private dashboardService: DashboardService,
    private courseService: CourseService,
    private authService: AuthService,
    private announcementService: AnnouncementService,
    private analyticsService: AnalyticsService
  ) { }

  ngOnInit(): void {
    this.loadDashboardData();
    this.loadInstructorCourses();
    this.loadRecentAnnouncements();
  }

  // Update only the loadDashboardData method in your DashboardComponent
  loadDashboardData(): void {
    console.log('Dashboard: Loading dashboard data...');
    this.isLoading = true;
    this.error = null;
    
    this.analyticsService.getInstructorAnalytics().subscribe({
      next: (response) => {
        console.log('Dashboard: Received response:', response);
        
        // Check for both response structures - direct and wrapped
        if (response && response.success && response.data) {
          console.log('Dashboard: Using wrapped response structure');
          this.dashboardData = response.data;
        } else if (response && (response.dashboard || response.success)) {
          console.log('Dashboard: Using direct response structure');
          this.dashboardData = response;
        } else {
          console.error('Dashboard: Unexpected response format:', response);
          this.error = 'Failed to parse dashboard data';
          this.isLoading = false;
          return;
        }
        
        try {
          // Extract essential data
          if (this.dashboardData.dashboard) {
            const dashboard = this.dashboardData.dashboard;
            this.totalStudents = dashboard.totalStudents || 0;
            this.totalRevenue = dashboard.totalEarnings || 0;
            this.totalCourses = dashboard.courseCount || 0;
            this.avgCompletionRate = dashboard.avgCompletionRate || 0;
            
            // Get recent activity
            if (dashboard.recentActivity) {
              this.recentEnrollments = dashboard.recentActivity.enrollments || [];
              this.recentReviews = dashboard.recentActivity.reviews || [];
            }
          } else {
            console.warn('Dashboard: No dashboard data found in response');
          }
        } catch (err) {
          console.error('Dashboard: Error parsing dashboard data', err);
          this.error = 'Error parsing dashboard data';
        }
        
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Dashboard: Failed to load dashboard data', err);
        this.error = 'Failed to load dashboard data: ' + (err.message || err.error?.message || 'Unknown error');
        this.isLoading = false;
      }
    });
  }
  
  loadInstructorCourses(): void {
    this.courseService.getInstructorDashboardCourses().subscribe({
      next: (response) => {
        if (response && response.data) {
          this.instructorCourses = response.data;
        }
      },
      error: (err) => {
        console.error('Failed to load instructor courses', err);
      }
    });
  }
  
  loadRecentAnnouncements(): void {
    this.announcementService.getInstructorAnnouncements().subscribe({
      next: (response) => {
        if (response && response.data) {
          this.recentAnnouncements = response.data.slice(0, 5);
        }
      },
      error: (err) => {
        console.error('Failed to load announcements', err);
      }
    });
  }
  
  formatCurrency(value: number): string {
    return `KES ${value.toLocaleString()}`;
  }
  
  formatDate(date: string): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
  
  getProgressColorClass(progress: number): string {
    if (progress < 30) return 'text-red-600';
    if (progress < 70) return 'text-yellow-600';
    return 'text-green-600';
  }
  
  formatPercent(value: number): string {
    return `${value.toFixed(1)}%`;
  }
  
  publishCourse(courseId: string, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    
    this.courseService.publishCourseWithValidation(courseId).subscribe({
      next: (response) => {
        // Reload courses after publishing
        this.loadInstructorCourses();
      },
      error: (err) => {
        console.error('Failed to publish course', err);
        alert(err.error?.message || 'Failed to publish course. Ensure all requirements are met.');
      }
    });
  }
}
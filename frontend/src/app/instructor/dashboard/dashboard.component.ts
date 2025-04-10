import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AnalyticsService } from '../../services/analytics.service';
import { CourseService } from '../../services/course.service';
import { AnnouncementService } from '../../services/announcement.service';
import { CourseFormComponent } from '../course-form/course-form.component';
import { CourseComponent } from '../course/course.component'; // Import CourseComponent

// Add proper interfaces to match API response
interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  enrolledAt: string;
  progress: number;
  completed: boolean;
  cohortId: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
  };
  course: {
    id: string;
    title: string;
  };
}

interface Review {
  id: string;
  courseId: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
  };
  course: {
    id: string;
    title: string;
  };
}

// Map these to display formats
interface DisplayEnrollment {
  id: string;
  courseId: string;
  studentName: string;
  courseTitle: string;
  enrolledAt: string;
}

interface DisplayReview {
  id: string;
  courseId: string;
  studentName: string;
  courseTitle: string;
  content: string;
  rating: number;
  createdAt: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, CourseFormComponent, CourseComponent], // Add CourseComponent to imports
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  // Maintain the existing properties
  isLoading = true;
  error: string | null = null;
  dashboardData: any = null;
  instructorCourses: any[] = [];
  recentAnnouncements: any[] = [];
  
  // Updated properties with proper types
  recentEnrollments: DisplayEnrollment[] = [];
  recentReviews: DisplayReview[] = [];
  
  // Calculated metrics
  totalRevenue = 0;
  totalStudents = 0;
  avgCompletionRate = 0;
  totalCourses = 0;
  
  // Add these properties for the course form modal
  showCourseFormModal = false;
  selectedCourse: any = null;
  
  // Add new properties for the course modal
  showCourseModal = false;
  selectedViewCourse: any = null;
  
  constructor(
    private courseService: CourseService,
    private announcementService: AnnouncementService,
    private analyticsService: AnalyticsService
  ) { }

  ngOnInit(): void {
    this.loadInstructorCourses();
    this.loadDashboardData();
    this.loadRecentAnnouncements();
  }

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
            
            // Get recent activity and map to display format
            if (dashboard.recentActivity) {
              // Map enrollments to display format
              this.recentEnrollments = (dashboard.recentActivity.enrollments || [])
                .map((enrollment: Enrollment) => ({
                  id: enrollment.id,
                  courseId: enrollment.courseId,
                  studentName: enrollment.user ? `${enrollment.user.firstName} ${enrollment.user.lastName}` : 'Student',
                  courseTitle: enrollment.course ? enrollment.course.title : 'Course',
                  enrolledAt: enrollment.enrolledAt
                }));
              
              // Map reviews to display format
              this.recentReviews = (dashboard.recentActivity.reviews || [])
                .map((review: Review) => ({
                  id: review.id,
                  courseId: review.courseId,
                  studentName: review.user ? `${review.user.firstName} ${review.user.lastName}` : 'Student',
                  courseTitle: review.course ? review.course.title : 'Course',
                  content: review.comment || '',  // Map comment to content
                  rating: review.rating,
                  createdAt: review.createdAt
                }));
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
  
  // Existing methods remain unchanged
  loadInstructorCourses(): void {
    console.log('Loading instructor courses...');
    
    this.courseService.getInstructorDashboardCourses().subscribe({
      next: (response) => {
        if (response && response.data && Array.isArray(response.data)) {
          // Log the raw isPublished values before any processing
          response.data.forEach((course: any) => {
            console.log(`BEFORE: Course ${course.title} isPublished=${course.isPublished} (${typeof course.isPublished})`);
          });
          
          this.instructorCourses = response.data.map((course: any) => {
            // ONLY focus on the isPublished field - nothing else
            if (typeof course.isPublished !== 'boolean') {
              console.warn(`Converting non-boolean isPublished value for ${course.title}`);
              course.isPublished = Boolean(course.isPublished);
            }
            
            // Log after conversion
            console.log(`AFTER: Course ${course.title} isPublished=${course.isPublished} (${typeof course.isPublished})`);
            
            return course;
          });
        } else {
          console.error('Invalid response format from server:', response);
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
  
  // Add these methods for modal control
  openNewCourseForm(event?: Event): void {
    // Prevent default navigation for anchor tags
    if (event) {
      event.preventDefault();
    }
    
    // Reset selected course (create mode)
    this.selectedCourse = null;
    
    // Show the modal
    this.showCourseFormModal = true;
    console.log('Opening new course form modal');
  }
  
  openEditCourseForm(course: any, event: Event): void {
    event.preventDefault();
    
    // Set course for editing
    this.selectedCourse = course;
    
    // Show the modal
    this.showCourseFormModal = true;
    console.log('Opening edit course form modal for:', course.title);
  }
  
  closeCourseForm(): void {
    this.showCourseFormModal = false;
    console.log('Course form modal closed');
  }
  
  onCourseSaved(courseData: any): void {
    console.log('Course saved:', courseData);
    
    // Refresh course lists
    this.loadInstructorCourses();
    this.loadDashboardData();
    
    // Show success message
    // This could be improved with a toast/notification system
    alert('Course successfully ' + (this.selectedCourse ? 'updated' : 'created'));
  }
  
  // Add new methods for course modal
  viewCourse(course: any, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    
    // Load the complete course with all details
    this.courseService.getCourseById(course.id).subscribe({
      next: (response) => {
        if (response && response.data) {
          this.selectedViewCourse = response.data;
          this.showCourseModal = true;
          console.log('Opening course view modal for:', this.selectedViewCourse.title);
        } else {
          console.error('Invalid course data returned:', response);
        }
      },
      error: (err) => {
        console.error('Failed to load course details', err);
        alert('Failed to load course details');
      }
    });
  }
  
  closeCourseModal(): void {
    this.showCourseModal = false;
    this.selectedViewCourse = null;
    console.log('Course view modal closed');
  }
  
  editCourseFromModal(course: any): void {
    // Close the view modal
    this.showCourseModal = false;
    
    // Open the edit form modal with the course data
    this.selectedCourse = course;
    this.showCourseFormModal = true;
    console.log('Opening edit form from course modal for:', course.title);
  }
  
  deleteCourseFromModal(courseId: string): void {
    console.log('Deleting course from modal:', courseId);
    
    if (confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      this.courseService.deleteCourse(courseId).subscribe({
        next: () => {
          // Close the modal
          this.showCourseModal = false;
          
          // Refresh course lists
          this.loadInstructorCourses();
          this.loadDashboardData();
          
          // Show success message
          alert('Course deleted successfully');
        },
        error: (err) => {
          console.error('Failed to delete course', err);
          alert('Failed to delete course: ' + (err.error?.message || 'Unknown error'));
        }
      });
    }
  }
}
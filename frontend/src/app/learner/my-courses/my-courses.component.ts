import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CourseService, Enrollment, Course, Cohort, ApiResponse } from '../../services/course.service';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

interface EnrollmentWithDetails extends Enrollment {
  course: Course;
  cohort: Cohort;
}

@Component({
  selector: 'app-my-courses',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './my-courses.component.html',
  styleUrl: './my-courses.component.css'
})
export class MyCoursesComponent implements OnInit {
  enrollments: EnrollmentWithDetails[] = [];
  isLoading = true;
  error: string | null = null;
  activeCourseTab: 'all' | 'in-progress' | 'completed' = 'all';
  filteredEnrollments: EnrollmentWithDetails[] = [];

  constructor(private courseService: CourseService) { }

  ngOnInit(): void {
    this.loadEnrollments();
  }

  loadEnrollments(): void {
    this.isLoading = true;
    this.error = null;

    this.courseService.getEnrollmentsForUser()
      .pipe(
        catchError(error => {
          this.error = typeof error === 'string' ? error : 'Failed to load enrolled courses';
          return of({ success: false, data: [] } as ApiResponse<EnrollmentWithDetails[]>);
        }),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe((value: any[] | ApiResponse<EnrollmentWithDetails[]>) => {
        const response: ApiResponse<EnrollmentWithDetails[]> = Array.isArray(value) ? { success: true, data: value } : value;
        if (response.success) {
          this.enrollments = response.data;
          this.filterEnrollments(this.activeCourseTab);
        } else {
          this.error = 'Failed to fetch enrolled courses';
        }
      });
  }

  onFilterChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    this.filterEnrollments(selectElement.value as 'all' | 'in-progress' | 'completed');
  }

  filterEnrollments(tab: 'all' | 'in-progress' | 'completed'): void {
    this.activeCourseTab = tab;
    
    if (tab === 'all') {
      this.filteredEnrollments = [...this.enrollments];
    } else if (tab === 'in-progress') {
      this.filteredEnrollments = this.enrollments.filter(enrollment => 
        !enrollment.completed && enrollment.progress > 0
      );
    } else if (tab === 'completed') {
      this.filteredEnrollments = this.enrollments.filter(enrollment => 
        enrollment.completed
      );
    }
  }

  calculateDaysLeft(endDate: string | null | undefined): number {
    if (!endDate) return 0;
    
    const end = new Date(endDate);
    const today = new Date();
    const diffTime = end.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  formatDate(date: string | Date): string {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    return new Date(date).toLocaleDateString(undefined, options);
  }

  openCohortChatroom(cohortId: string): void {
    // Navigate to cohort chatroom (to be implemented)
    console.log('Opening cohort chatroom for:', cohortId);
    // This would typically involve router navigation to the chat feature
  }

  getProgressColorClass(progress: number): string {
    if (progress >= 75) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 25) return 'bg-yellow-500';
    return 'bg-gray-300';
  }
}

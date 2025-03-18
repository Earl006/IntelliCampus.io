import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CourseService, Enrollment, Course, Cohort, ApiResponse } from '../../services/course.service';
import { ChatService } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';
import { ChatDrawerComponent } from '../../shared/chat-drawer/chat-drawer.component';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { FooterComponent } from "../footer/footer.component";
import { NavbarComponent } from "../navbar/navbar.component";

interface EnrollmentWithDetails extends Enrollment {
  course: Course;
  cohort: Cohort;
}

@Component({
  selector: 'app-my-courses',
  standalone: true,
  imports: [CommonModule, RouterModule, ChatDrawerComponent, FooterComponent, NavbarComponent],
  templateUrl: './my-courses.component.html',
  styleUrl: './my-courses.component.css'
})
export class MyCoursesComponent implements OnInit, OnDestroy {
  enrollments: EnrollmentWithDetails[] = [];
  isLoading = true;
  error: string | null = null;
  activeCourseTab: 'all' | 'in-progress' | 'completed' = 'all';
  filteredEnrollments: EnrollmentWithDetails[] = [];
  isChatOpen = false;
  activeChatRoom: {
    id: string;
    type: 'course' | 'cohort';
    name: string;
  } | null = null;
  constructor(
    private courseService: CourseService,
    private chatService: ChatService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.loadEnrollments();
  }

  ngOnDestroy(): void {
    this.chatService.disconnect();
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

  // Updated to use completed flag only for determining course status
  filterEnrollments(tab: 'all' | 'in-progress' | 'completed'): void {
    this.activeCourseTab = tab;
    
    if (tab === 'all') {
      this.filteredEnrollments = [...this.enrollments];
    } else if (tab === 'in-progress') {
      this.filteredEnrollments = this.enrollments.filter(enrollment => 
        !enrollment.completed
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

  formatDate(date: string | Date | null | undefined): string {
    if (!date) return 'Not set';
    
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    return new Date(date).toLocaleDateString(undefined, options);
  }

  async openCourseChatroom(courseId: string, courseName: string): Promise<void> {
    if (!courseId) return;
    
    try {
      // Fetch the correct chat room ID associated with this course
      const response = await fetch(`${environment.apiUrl}/api/chat/course/${courseId}/room/info`, {
        headers: {
          'Authorization': `Bearer ${this.authService.getToken()}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch chat room info');
      
      const data = await response.json();
      if (!data.success || !data.data.chatRoomId) {
        throw new Error('Chat room not available');
      }
      
      console.log(`Opening chat room for course ${courseId}: ${data.data.chatRoomId}`);
      
      // Now open the drawer with the ACTUAL chat room ID
      this.activeChatRoom = {
        id: data.data.chatRoomId, // Use the chat room ID, not the course ID
        type: 'course',
        name: courseName
      };
      
      this.isChatOpen = true;
    } catch (error) {
      console.error('Error opening course chat:', error);
      // Show error notification to user
    }
  }
  
  // Similarly for cohort chat rooms
  async openCohortChatroom(cohortId: string, cohortName: string): Promise<void> {
    if (!cohortId) return;
    
    try {
      // Fetch the correct chat room ID associated with this cohort
      const response = await fetch(`${environment.apiUrl}/api/chat/cohort/${cohortId}/room/info`, {
        headers: {
          'Authorization': `Bearer ${this.authService.getToken()}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch chat room info');
      
      const data = await response.json();
      if (!data.success || !data.data.chatRoomId) {
        throw new Error('Chat room not available');
      }
      
      console.log(`Opening chat room for cohort ${cohortId}: ${data.data.chatRoomId}`);
      
      // Now open the drawer with the ACTUAL chat room ID
      this.activeChatRoom = {
        id: data.data.chatRoomId, // Use the chat room ID, not the cohort ID
        type: 'cohort',
        name: cohortName
      };
      
      this.isChatOpen = true;
    } catch (error) {
      console.error('Error opening cohort chat:', error);
      // Show error notification to user
    }
  }
  closeChatDrawer(): void {
    this.isChatOpen = false;
    // Optional: Disconnect from the chatroom to save resources
  }

  // openCohortChatroom(cohortId: string): void {
  //   // Navigate to cohort chatroom (to be implemented)
  //   console.log('Opening cohort chatroom for:', cohortId);
  //   // This would typically involve router navigation to the chat feature
  // }

  getProgressColorClass(progress: number): string {
    if (progress >= 75) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 25) return 'bg-yellow-500';
    return 'bg-gray-300';
  }

  // Get progress status text
  getProgressStatus(enrollment: EnrollmentWithDetails): string {
    if (enrollment.completed) {
      return 'Completed';
    } else if (enrollment.progress > 0) {
      return `${enrollment.progress}% complete`;
    } else {
      return 'Not started';
    }
  }
}
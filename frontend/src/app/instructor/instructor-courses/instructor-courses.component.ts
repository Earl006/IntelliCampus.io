import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CourseService } from '../../services/course.service';
import { ChatService } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service'; // Import AuthService
import { CourseComponent } from '../course/course.component';
import { ChatDrawerComponent } from '../../shared/chat-drawer/chat-drawer.component';
import { CourseFormComponent } from '../course-form/course-form.component';
import { trigger, transition, style, animate } from '@angular/animations';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { environment } from '../../../environments/environment'; // Import environment

interface Course {
  id: string;
  title: string;
  description: string;
  instructorId: string;
  price: number;
  isPaid: boolean;
  isPublished: boolean;
  bannerImageUrl?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    enrollments: number;
    materials: number;
    reviews: number;
  };
  statistics?: {
    totalEnrollments: number;
    completionRate: number;
    avgRating: number;
    totalMaterials: number;
    avgProgress: number;
    revenue: number;
  };
  categories?: any[];
  subCategories?: any[];
}

@Component({
  selector: 'app-instructor-courses',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    FormsModule,
    CourseComponent,
    ChatDrawerComponent,
    CourseFormComponent
  ],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ],
  templateUrl: './instructor-courses.component.html',
  styleUrls: ['./instructor-courses.component.css']
})
export class InstructorCoursesComponent implements OnInit, OnDestroy {
  courses: Course[] = [];
  filteredCourses: Course[] = [];
  isLoading = true;
  error: string | null = null;
  
  searchTerm = '';
  statusFilter: 'all' | 'published' | 'draft' = 'all';
  sortOption: 'newest' | 'oldest' | 'popularity' | 'rating' = 'newest';
  
  selectedCourse: Course | null = null;
  showCourseModal = false;
  
  showChatDrawer = false;
  activeChatRoom = {
    id: '',
    type: 'course' as const,
    name: ''
  };
  chatError: string | null = null;
  
  showCourseFormModal = false;
  courseToEdit: Course | null = null;
  
  private destroy$ = new Subject<void>();
  
  constructor(
    private courseService: CourseService,
    private chatService: ChatService,
    private authService: AuthService // Add AuthService
  ) {}

  ngOnInit() {
    this.loadInstructorCourses();
    
    this.chatService.isConnected$
      .pipe(takeUntil(this.destroy$))
      .subscribe(connected => {
        console.log('Chat connection status:', connected);
        if (!connected) {
          this.chatService.connect();
        }
      });
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    
    if (this.showChatDrawer) {
      this.closeChatDrawer();
    }
  }
  
  loadInstructorCourses(): void {
    this.isLoading = true;
    this.error = null;
    
    this.courseService.getInstructorDashboardCourses().subscribe({
      next: (response) => {
        if (response && response.data) {
          this.courses = response.data;
          this.applyFilters();
          this.isLoading = false;
        }
      },
      error: (err) => {
        console.error('Failed to load courses:', err);
        this.error = 'Failed to load your courses. Please try again.';
        this.isLoading = false;
      }
    });
  }
  
  applyFilters(): void {
    let filtered = this.courses;
    
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(course => 
        course.title.toLowerCase().includes(term) || 
        course.description.toLowerCase().includes(term)
      );
    }
    
    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(course => 
        this.statusFilter === 'published' ? course.isPublished : !course.isPublished
      );
    }
    
    filtered = this.sortCourses(filtered, this.sortOption);
    
    this.filteredCourses = filtered;
  }
  
  sortCourses(courses: Course[], option: string): Course[] {
    return [...courses].sort((a, b) => {
      switch(option) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'popularity':
          return (b.statistics?.totalEnrollments || 0) - (a.statistics?.totalEnrollments || 0);
        case 'rating':
          return (b.statistics?.avgRating || 0) - (a.statistics?.avgRating || 0);
        default:
          return 0;
      }
    });
  }
  
  resetFilters(): void {
    this.searchTerm = '';
    this.statusFilter = 'all';
    this.sortOption = 'newest';
    this.applyFilters();
  }
  
  publishCourse(courseId: string, event: Event): void {
    event.stopPropagation();
    
    this.courseService.setCoursePublishStatus(courseId, true).subscribe({
      next: () => {
        const courseIndex = this.courses.findIndex(c => c.id === courseId);
        if (courseIndex !== -1) {
          this.courses[courseIndex].isPublished = true;
          this.applyFilters();
        }
      },
      error: (err) => {
        console.error('Failed to publish course:', err);
      }
    });
  }
  
  viewCourse(course: Course): void {
    this.selectedCourse = null;
    
    this.courseService.getCourseById(course.id).subscribe({
      next: (response) => {
        if (response && response.data) {
          const courseData = response.data;
          
          this.selectedCourse = {
            id: courseData.id,
            title: courseData.title,
            description: courseData.description,
            instructorId: courseData.instructorId,
            price: courseData.price,
            isPaid: Boolean(courseData.isPaid),
            isPublished: Boolean(courseData.isPublished),
            bannerImageUrl: courseData.bannerImageUrl,
            createdAt: typeof courseData.createdAt === 'string' ? 
              courseData.createdAt : 
              new Date(courseData.createdAt).toISOString(),
            updatedAt: typeof courseData.updatedAt === 'string' ? 
              courseData.updatedAt : 
              new Date(courseData.updatedAt).toISOString(),
          };
          
          setTimeout(() => {
            this.showCourseModal = true;
          }, 0);
        }
      },
      error: (err) => {
        console.error('Error loading course details:', err);
      }
    });
  }
  
  closeCourseModal(): void {
    this.showCourseModal = false;
    setTimeout(() => {
      this.selectedCourse = null;
    }, 300);
  }
  
  handleCourseEdit(course: any): void {
    console.log('Editing course from view modal:', course);
    
    this.showCourseModal = false;
    
    setTimeout(() => {
      this.courseToEdit = course;
      this.showCourseFormModal = true;
    }, 300);
  }
  
  handleCourseDelete(courseId: string): void {
    this.courses = this.courses.filter(c => c.id !== courseId);
    this.applyFilters();
    this.closeCourseModal();
  }

  async openChatForCourse(courseId: string, courseName: string, event: Event): Promise<void> {
    event.stopPropagation();
    
    if (!courseId) return;
    
    try {
      // Set loading state if needed
      this.chatError = null;
      
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
      
      // Show the chat drawer
      this.showChatDrawer = true;
    } catch (error) {
      console.error('Error opening course chat:', error);
      this.chatError = 'Failed to open chat room. Please try again.';
    }
  }

  closeChatDrawer(): void {
    console.log('Closing chat drawer');
    this.showChatDrawer = false;
    
    setTimeout(() => {
      this.activeChatRoom = {
        id: '',
        type: 'course',
        name: ''
      };
      this.chatError = null;
    }, 300);
  }
  
  handleChatError(error: string): void {
    console.error('Chat error:', error);
    this.chatError = error;
  }

  openCreateCourseModal(): void {
    this.courseToEdit = null;
    this.showCourseFormModal = true;
  }
  
  openEditCourseModal(course: Course): void {
    this.courseService.getCourseById(course.id).subscribe({
      next: (response) => {
        if (response && response.data) {
          this.courseToEdit = {
            ...response.data,
            createdAt: typeof response.data.createdAt === 'string' ?
              response.data.createdAt :
              new Date(response.data.createdAt).toISOString(),
            updatedAt: typeof response.data.updatedAt === 'string' ?
              response.data.updatedAt :
              new Date(response.data.updatedAt).toISOString()
          };
          this.showCourseFormModal = true;
        }
      },
      error: (err) => {
        console.error('Error loading course details for edit:', err);
      }
    });
  }
  
  closeCourseFormModal(): void {
    this.showCourseFormModal = false;
    setTimeout(() => {
      this.courseToEdit = null;
    }, 300);
  }
  
  handleCourseSaved(response: any): void {
    console.log('Course saved:', response);
    this.loadInstructorCourses();
  }
}
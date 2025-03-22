import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CourseService } from '../../services/course.service';
import { ChatService } from '../../services/chat.service';
import { ChatDrawerComponent } from '../../shared/chat-drawer/chat-drawer.component';
import { trigger, transition, style, animate } from '@angular/animations';

interface Category {
  id: string;
  name: string;
}

interface SubCategory {
  id: string;
  name: string;
  categoryId: string;
}

interface CourseUser {
  id: string;
  firstName: string;
  lastName: string;
}

interface CourseReview {
  id: string;
  courseId: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: string;
  user?: CourseUser;
}

interface CourseEnrollment {
  id: string;
  userId: string;
  courseId: string;
  enrolledAt: string;
  progress: number;
  completed: boolean;
  cohortId: string;
  user?: CourseUser;
}

interface CourseStatistics {
  totalEnrollments: number;
  totalMaterials: number;
  totalReviews: number;
  avgRating: number;
  completionRate: number;
  avgProgress: number;
  revenue: number;
  totalPayments: number;
  isReadyToPublish: boolean; // We'll fix this in code if it's not a boolean
}

interface Course {
  id: string;
  title: string;
  description: string;
  instructorId: string;
  price: number;
  isPaid: boolean;
  isPublished: boolean;
  bannerImageUrl: string;
  createdAt: string;
  updatedAt: string;
  
  _count?: {
    enrollments: number;
    materials: number;
    reviews: number;
  };
  
  reviews?: CourseReview[];
  enrollments?: CourseEnrollment[];
  categories?: Category[];
  subCategories?: SubCategory[];
  instructor?: CourseUser;
  statistics?: CourseStatistics;
}

@Component({
  selector: 'app-courses',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    FormsModule,
    ChatDrawerComponent
  ],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ],
  templateUrl: './courses.component.html',
  styleUrls: ['./courses.component.css']
})
export class InstructorCoursesComponent implements OnInit {
  courses: Course[] = [];
  filteredCourses: Course[] = [];
  isLoading = true;
  error: string | null = null;
  
  // Search and filter
  searchTerm = '';
  statusFilter: 'all' | 'published' | 'draft' = 'all';
  sortOption: 'newest' | 'oldest' | 'popularity' | 'rating' = 'newest';
  
  // Chat drawer
  showChatDrawer = false;
  activeChatRoom: string | null = null;
  activeChatRoomName = '';
  
  constructor(
    private courseService: CourseService,
    private chatService: ChatService
  ) {}

  ngOnInit() {
    this.loadInstructorCourses();
  }

  loadInstructorCourses() {
    this.isLoading = true;
    this.error = null;
    
    this.courseService.getInstructorDashboardCourses().subscribe({
      next: (response) => {
        if (response && response.data && Array.isArray(response.data)) {
          // Log the raw courses
          console.log('Courses received:', response.data);
          
          this.courses = response.data.map((course: Course) => {
            // ONLY handle isPublished field
            if (typeof course.isPublished !== 'boolean') {
              console.warn(`Course ${course.id} has non-boolean isPublished value: ${course.isPublished}`);
              course.isPublished = Boolean(course.isPublished);
            }
            
            // Log the publish status
            console.log(`Course: ${course.title}, isPublished: ${course.isPublished}`);
            
            return course;
          });
          
          // Apply filters after updating
          this.applyFilters();
        } else {
          this.error = 'Invalid response format from server';
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load courses. Please try again later.';
        this.isLoading = false;
        console.error('Error loading instructor courses:', err);
      }
    });
  }

  applyFilters() {
    // Start with all courses
    let result = [...this.courses];
    
    // Apply search filter
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.trim().toLowerCase();
      result = result.filter(course => 
        course.title.toLowerCase().includes(term) || 
        course.description.toLowerCase().includes(term)
      );
    }
    
    // Apply status filter
    if (this.statusFilter !== 'all') {
      result = result.filter(course => {
        if (this.statusFilter === 'published') {
          return course.isPublished;
        } else {
          return !course.isPublished;
        }
      });
    }
    
    // Apply sorting
    result = this.sortCourses(result);
    
    this.filteredCourses = result;
  }

  sortCourses(courses: Course[]): Course[] {
    switch (this.sortOption) {
      case 'newest':
        return [...courses].sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      
      case 'oldest':
        return [...courses].sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      
      case 'popularity':
        return [...courses].sort((a, b) => 
          (b.statistics?.totalEnrollments || 0) - (a.statistics?.totalEnrollments || 0)
        );
      
      case 'rating':
        return [...courses].sort((a, b) => 
          (b.statistics?.avgRating || 0) - (a.statistics?.avgRating || 0)
        );
        
      default:
        return courses;
    }
  }

  publishCourse(courseId: string, event: Event) {
    event.preventDefault();
    event.stopPropagation();
    
    // Show feedback to the user
    this.isLoading = true;
    this.error = null; // Clear any previous errors
    
    console.log(`Attempting to publish course with ID: ${courseId}`);
    
    this.courseService.publishCourseWithValidation(courseId).subscribe({
      next: (response) => {
        console.log('Publish response:', response);
        
        // Update the local course data
        this.courses = this.courses.map(course => {
          if (course.id === courseId) {
            console.log(`Updating course ${course.title} to published state`);
            return { ...course, isPublished: true };
          }
          return course;
        });
        
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to publish course:', err);
        this.error = `Failed to publish course: ${err.message || JSON.stringify(err)}`;
        this.isLoading = false;
      }
    });
  }
  
  formatPercent(value: number): string {
    return `${Math.round(value)}%`;
  }
  
  formatCurrency(value: number): string {
    return `KES ${value.toLocaleString()}`;
  }
  
  openChatForCourse(courseId: string, courseTitle: string, event: Event) {
    event.preventDefault();
    event.stopPropagation();
    
    this.activeChatRoom = courseId;
    this.activeChatRoomName = courseTitle;
    this.showChatDrawer = true;
  }
  
  closeChatDrawer() {
    this.showChatDrawer = false;
  }
  
  // Helper methods
  getInstructorName(course: Course): string {
    return course.instructor?.firstName && course.instructor?.lastName 
      ? `${course.instructor.firstName} ${course.instructor.lastName}`
      : 'Instructor';
  }
  
  getInitials(name: string): string {
    if (!name) return '';
    
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }
  
  resetFilters() {
    this.searchTerm = '';
    this.statusFilter = 'all';
    this.sortOption = 'newest';
    this.applyFilters();
  }
}
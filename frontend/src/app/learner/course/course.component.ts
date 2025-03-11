import {
  Component,
  OnInit
} from '@angular/core';
import {
  ActivatedRoute
} from '@angular/router';
import {
  CommonModule
} from '@angular/common';
import {
  CourseService,
  Course
} from '../../services/course.service';
import { trigger, transition, style, animate } from '@angular/animations';
import { RouterModule } from '@angular/router';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-course',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('400ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ],
  template: `
    <main class="min-h-screen bg-white relative">
      <!-- Background with subtle overlay -->
      <div class="absolute inset-0 z-0">
        <img src="/assets/bg.jpg" alt="background" class="w-full h-full object-cover opacity-5">
      </div>

      <!-- Header Section -->
      <section class="relative py-16 z-10">
        <div class="container mx-auto px-4">
          <div class="flex items-center gap-2 mb-4 mt-10">
            <a routerLink="/courses" class="text-gray-500 hover:text-black flex items-center">
              <svg class="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
              </svg>
              Back to Courses
            </a>
          </div>
          <!-- <h1 class="text-3xl md:text-4xl font-bold text-gray-900">Course Details</h1> -->
        </div>
      </section>

      <section class="relative pb-20 z-10">
        <div class="container mx-auto px-4">
          <!-- Loading State -->
          <div *ngIf="isLoading" class="max-w-4xl mx-auto" @fadeIn>
            <div class="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div class="animate-pulse">
                <!-- Banner Skeleton -->
                <div class="h-64 bg-gray-200"></div>
                
                <!-- Price and Categories -->
                <div class="px-8 py-4 border-b border-gray-100">
                  <div class="flex justify-between items-center mb-3">
                    <div class="h-4 bg-gray-200 rounded w-24"></div>
                    <div class="h-6 bg-gray-200 rounded-full w-20"></div>
                  </div>
                  <div class="flex flex-wrap gap-2">
                    <div class="h-6 bg-gray-200 rounded-full w-16"></div>
                    <div class="h-6 bg-gray-200 rounded-full w-20"></div>
                    <div class="h-6 bg-gray-200 rounded-full w-24"></div>
                  </div>
                </div>
                
                <!-- Content Skeleton -->
                <div class="p-8">
                  <div class="h-8 bg-gray-200 rounded w-3/4 mb-6"></div>
                  <div class="space-y-3 mb-8">
                    <div class="h-4 bg-gray-200 rounded w-full"></div>
                    <div class="h-4 bg-gray-200 rounded w-full"></div>
                    <div class="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                  
                  <div class="flex items-center justify-between py-4 border-t border-gray-100">
                    <div class="flex items-center gap-4">
                      <div class="w-12 h-12 bg-gray-200 rounded-full"></div>
                      <div class="space-y-2">
                        <div class="h-4 bg-gray-200 rounded w-32"></div>
                        <div class="h-3 bg-gray-200 rounded w-24"></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div class="px-8 pb-8">
                  <div class="h-12 bg-gray-200 rounded-xl w-full"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Error State -->
          <div *ngIf="!isLoading && error" class="max-w-4xl mx-auto text-center py-16" @fadeIn>
            <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">Oops! Something went wrong</h3>
            <p class="text-gray-600 mb-6">{{ error }}</p>
            <button (click)="loadCourse()" 
                    class="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-900 transition-all duration-200">
              Try Again
            </button>
          </div>

          <!-- Course Content -->
          <div *ngIf="!isLoading && !error && course" class="max-w-4xl mx-auto" @fadeIn>
            <div class="bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100">
              <!-- Course Banner -->
              <div class="relative h-64 overflow-hidden bg-gradient-to-r" 
                   [ngClass]="course.isPaid ? 'from-purple-500 to-pink-500' : 'from-blue-500 to-teal-500'">
                <img [src]="course.bannerImageUrl || '/assets/course-default.jpg'" 
                     [alt]="course.title" 
                     class="w-full h-full object-cover mix-blend-overlay opacity-90">
                     
                <!-- Price Badge -->
                <div class="absolute top-4 right-4">
                  <span *ngIf="course.isPaid" 
                        class="px-4 py-2 bg-white text-gray-900 rounded-full text-sm font-medium shadow-md">
                    KES {{ course.price }}
                  </span>
                  <span *ngIf="!course.isPaid" 
                        class="px-4 py-2 bg-green-500 text-white rounded-full text-sm font-medium shadow-md">
                    Free
                  </span>
                </div>
              </div>

              <!-- Categories Section -->
              <div class="px-8 py-4 border-b border-gray-100">
                <!-- Category Section -->
                <div class="flex justify-between items-center mb-3">
                  <span class="text-xs uppercase tracking-wider text-gray-500">Categories</span>
                  <span class="text-sm text-gray-500">Last updated: {{ course.updatedAt | date:'mediumDate' }}</span>
                </div>
                
                <!-- Categories Tags -->
                <div class="flex flex-wrap gap-2">
                  <span *ngFor="let category of course.subCategories" 
                        class="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                    {{ category.name }}
                  </span>
                </div>
              </div>

              <!-- Course Details -->
              <div class="p-8">
                <h2 class="text-3xl font-bold text-gray-900 mb-4">
                  {{ course.title }}
                </h2>
                
                <div class="prose prose-gray max-w-none mb-8">
                  <p class="text-gray-600 whitespace-pre-line">{{ course.description }}</p>
                </div>

                <!-- Instructor Info -->
                <div class="mt-8 pt-8 border-t border-gray-100">
                  <h3 class="text-xl font-semibold text-gray-900 mb-4">About the Instructor</h3>
                  <div class="flex items-start gap-4">
                    <!-- Instructor Avatar -->
                    <div class="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-teal-500 flex items-center justify-center text-white shadow-md">
                      <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    
                    <!-- Instructor Details -->
                    <div>
                      <h4 class="text-lg font-semibold text-gray-900">
                        {{ course.instructor.firstName }} {{ course.instructor.lastName }}
                      </h4>
                      <p class="text-gray-600">{{ course.instructor.email }}</p>
                      <p *ngIf="course.instructor.bio" class="text-gray-600 mt-2">{{ course.instructor.bio }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Enroll Button -->
              <div class="px-8 pb-8">
                <button 
                  (click)="enrollInCourse()"
                  class="w-full bg-black text-white py-4 rounded-xl hover:bg-gray-900 transition-all duration-300 flex items-center justify-center gap-2 font-medium">
                  <span>Enroll Now</span>
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  `,
  styles: [`
    .prose {
      line-height: 1.75;
    }
    .prose p {
      margin-bottom: 1.25em;
    }
  `]
})
export class CourseComponent implements OnInit {
  course: Course | null = null;
  isLoading = true;
  error: string | null = null;
  
  constructor(
    private route: ActivatedRoute,
    private courseService: CourseService
  ) {}

  ngOnInit(): void {
    this.loadCourse();
  }

  loadCourse(): void {
    this.isLoading = true;
    this.error = null;
    
    const courseId = this.route.snapshot.paramMap.get('id');
    
    if (!courseId) {
      this.isLoading = false;
      this.error = 'Course ID not found';
      return;
    }
    
    this.courseService.getCourseById(courseId).subscribe({
      next: (response) => {
        if (response.success) {
          this.course = response.data;
        } else {
          this.error = 'Failed to load course details';
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Error loading course. Please try again later.';
        this.isLoading = false;
        console.error('Error loading course:', err);
      }
    });
  }

  enrollInCourse(): void {
    if (!this.course) return;
    
    const courseId = this.course.id;
    this.courseService.enrollInCourse(courseId).subscribe({
      next: (response) => {
        console.log('Successfully enrolled in course', response);
        // Handle successful enrollment (show confirmation, redirect, etc.)
      },
      error: (err) => {
        console.error('Error enrolling in course:', err);
        // Show error message to user
      }
    });
  }
}
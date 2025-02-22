import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CourseService, Course } from '../../services/course.service';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-course',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
 <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100" [@fadeIn]>
      <!-- Main Content -->
      <main class="py-12">
        <div class="max-w-7xl mt-16 mx-auto px-4">
          <!-- Back Navigation -->
          <button routerLink="/courses" 
                  class="group inline-flex items-center text-gray-600 hover:text-black transition-colors mb-8">
            <svg class="w-5 h-5 mr-2 transform group-hover:-translate-x-1 transition-transform" 
                 fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7 7-7"/>
            </svg>
            Back to Courses
          </button>

          <!-- Loading State -->
          <div *ngIf="isLoading" class="flex justify-center items-center h-96">
            <div class="animate-pulse space-y-8">
              <div class="h-64 w-full bg-gray-200 rounded-2xl"></div>
              <div class="space-y-4">
                <div class="h-8 w-3/4 bg-gray-200 rounded-xl"></div>
                <div class="h-4 w-full bg-gray-200 rounded-xl"></div>
                <div class="h-4 w-2/3 bg-gray-200 rounded-xl"></div>
              </div>
            </div>
          </div>

          <!-- Error State -->
          <div *ngIf="error && !isLoading" 
               class="flex flex-col items-center justify-center h-96 bg-white rounded-2xl shadow-lg p-8">
            <svg class="w-16 h-16 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">Unable to Load Course</h3>
            <p class="text-gray-600 text-center">{{ error }}</p>
          </div>

          <!-- Course Content -->
          <div *ngIf="course && !isLoading && !error" 
               class="bg-white rounded-3xl shadow-xl overflow-hidden">
            <!-- Hero Section -->
            <div class="relative h-96">
              <div class="absolute inset-0 bg-gradient-to-r" 
                   [ngClass]="course.isPaid ? 'from-blue-600 to-purple-600' : 'from-teal-500 to-emerald-500'">
              </div>
              <img [src]="course.bannerImageUrl || '/assets/course-default.jpg'" 
                   [alt]="course.title" 
                   class="w-full h-full object-cover mix-blend-multiply opacity-90">
              <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              
              <!-- Course Title Section -->
              <div class="absolute bottom-0 left-0 right-0 p-8 text-white">
                <div class="max-w-3xl">
                  <!-- Categories -->
                  <div class="flex flex-wrap gap-2 mb-4">
                    <span *ngFor="let sub of course.subCategories" 
                          class="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm">
                      {{ sub.name }}
                    </span>
                  </div>
                  
                  <h1 class="text-4xl font-bold mb-4">{{ course.title }}</h1>
                  
                  <!-- Course Meta -->
                  <div class="flex items-center gap-6 text-white/90">
                    <div class="flex items-center">
                      <svg class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      <span>Updated {{ course.updatedAt | date:'mediumDate' }}</span>
                    </div>
                    <div class="flex items-center">
                      <svg class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
                      </svg>
                      <span>{{ course.isPaid ? (course.price | currency:'KES':'symbol-narrow') : 'Free' }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Course Details -->
            <div class="p-8">
              <div class="max-w-3xl mx-auto">
                <!-- Description -->
                <div class="prose prose-lg mb-12">
                  <h2 class="text-2xl font-semibold text-gray-900 mb-4">About this course</h2>
                  <div class="text-gray-600" [class.line-clamp-3]="!showFullDescription">
                    {{ course.description }}
                  </div>
                  <button *ngIf="course.description && course.description.length > 280"
                          (click)="showFullDescription = !showFullDescription"
                          class="mt-4 text-blue-600 hover:text-blue-700 font-medium">
                    {{ showFullDescription ? 'Show less' : 'Read more' }}
                  </button>
                </div>

                <!-- Instructor Section -->
                <div class="bg-white rounded-xl shadow-md p-6 mb-12 border border-gray-100">
                <h1 class="text-3xl font-bold text-center mb-4">Instructor Details</h1>

                  <div class="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                    <div class="w-24 h-24 rounded-full overflow-hidden flex-shrink-0 border-4 border-gray-50">
                      <img [src]="'https://ui-avatars.com/api/?name=' + 
                           (course.instructor.firstName + '+' + course.instructor.lastName)"
                           [alt]="course.instructor.firstName"
                           class="w-full h-full object-cover">
                    </div>
                    <div class="flex-1 text-center sm:text-left">
                      <h3 class="text-xl font-semibold text-gray-900 mb-1">
                        {{ course.instructor.firstName }} {{ course.instructor.lastName }}
                      </h3>
                      <p class="text-gray-500 mb-3">{{ course.instructor.email }}</p>
                      <p class="text-gray-600 mb-4">{{ course.instructor.bio }}</p>
                      <a [routerLink]="['/instructor', course.instructor.id]" 
                         class="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors">
                        View Profile
                        <svg class="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                d="M9 5l7 7-7 7"/>
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>

                <!-- Additional Course Info
                <div class="text-sm text-gray-500 mb-12">
                  <p>Created: {{ course.createdAt | date:'mediumDate' }}</p>
                  <p>Last Updated: {{ course.updatedAt | date:'mediumDate' }}</p>
                </div> -->

                <!-- Enrollment Section -->
                <div class="flex justify-center">
                  <button class="px-12 py-4 bg-black text-white rounded-full font-medium 
                                hover:bg-gray-900 transform transition-all duration-200 
                                hover:scale-[1.02] focus:outline-none focus:ring-2 
                                focus:ring-black focus:ring-offset-2">
                    Enroll Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  `,
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('500ms cubic-bezier(0.4, 0, 0.2, 1)', 
               style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ],
  styles: [`
    .line-clamp-3 {
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    
    :host {
      display: block;
    }
  `]
})
export class CourseComponent implements OnInit {
  courseId: string | null = null;
  course: Course | null = null;
  isLoading = false;
  error: string | null = null;
  showFullDescription = false;

  constructor(
    private route: ActivatedRoute,
    private courseService: CourseService
  ) {}

  ngOnInit(): void {
    this.courseId = this.route.snapshot.paramMap.get('id');
    if (!this.courseId) {
      this.error = 'No valid Course ID provided.';
      return;
    }
    this.loadCourse();
  }

  loadCourse(): void {
    this.isLoading = true;
    this.courseService.getCourseById(this.courseId!)
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response?.success && response.data) {
            this.course = response.data;
          } else {
            this.error = 'Failed to load course information.';
          }
        },
        error: (err) => {
          this.isLoading = false;
          this.error = err || 'Error fetching the course.';
          console.error('Error:', err);
        }
      });
  }
}
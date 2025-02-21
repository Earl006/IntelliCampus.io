import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CourseService, Course } from '../../services/course.service';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-courses',
  standalone: true,
  imports: [CommonModule, RouterModule],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('400ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ],
  template: `
    <main class="min-h-screen bg-gray-50">
      <!-- Header Section -->
      <section class="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 py-20">
        <div class="container mx-auto px-4">
          <h1 class="text-4xl md:text-5xl font-bold text-white text-center mb-6">Explore Our Courses</h1>
          <p class="text-gray-300 text-center max-w-2xl mx-auto">
            Discover a world of knowledge with our carefully curated courses designed to help you succeed
          </p>
        </div>
      </section>

      <!-- Courses Grid Section -->
      <section class="py-12">
        <div class="container mx-auto px-4">
          <!-- Loading State -->
          <div *ngIf="isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div *ngFor="let i of [1,2,3,4,5,6]" class="bg-white rounded-xl shadow-md overflow-hidden" @fadeIn>
              <div class="animate-pulse">
                <div class="h-48 bg-gray-200"></div>
                <div class="p-6 space-y-4">
                  <div class="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div class="h-3 bg-gray-200 rounded w-full"></div>
                  <div class="h-3 bg-gray-200 rounded w-2/3"></div>
                  <div class="flex justify-between items-center pt-4">
                    <div class="h-8 bg-gray-200 rounded w-24"></div>
                    <div class="h-8 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Error State -->
          <div *ngIf="error" class="min-h-[400px] flex items-center justify-center" @fadeIn>
            <div class="text-center">
              <svg class="w-16 h-16 text-gray-400 mb-4 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 class="text-xl font-semibold text-gray-900 mb-2">Oops! Something went wrong</h3>
              <p class="text-gray-600 mb-4">{{ error }}</p>
              <button (click)="loadCourses()" 
                      class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                Try Again
              </button>
            </div>
          </div>

          <!-- No Courses State -->
          <div *ngIf="!isLoading && !error && courses.length === 0" class="min-h-[400px] flex items-center justify-center" @fadeIn>
            <div class="text-center">
              <svg class="w-16 h-16 text-gray-400 mb-4 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <h3 class="text-xl font-semibold text-gray-900 mb-2">No Courses Found</h3>
              <p class="text-gray-600">Check back later for new courses or try refreshing the page.</p>
            </div>
          </div>

          <!-- Courses Grid -->
          <div *ngIf="!isLoading && !error && courses.length > 0" 
               class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div *ngFor="let course of courses" 
                 class="group bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl" 
                 @fadeIn>
              <div class="relative">
                <img [src]="course.bannerImageUrl || 'assets/images/course-placeholder.jpg'" 
                     [alt]="course.title"
                     class="w-full h-48 object-cover">
                <div class="absolute top-4 right-4">
                  <span *ngIf="course.isPaid" 
                        class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white text-gray-900">
                    {{ course.price | currency }}
                  </span>
                </div>
              </div>
              
              <div class="p-6">
                <h3 class="text-xl font-semibold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                  {{ course.title }}
                </h3>
                <p class="text-gray-600 line-clamp-2 mb-4">{{ course.description }}</p>
                
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-2">
                    <img [src]="'https://ui-avatars.com/api/?name=' + course.instructor.email" 
                         [alt]="course.instructor.email"
                         class="w-8 h-8 rounded-full">
                    <span class="text-sm text-gray-600">{{ course.instructor.email }}</span>
                  </div>
                  
                  <a [routerLink]="['/courses', course.id]" 
                     class="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
                    View Course
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  `,
  styles: [`
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `]
})
export class CoursesComponent implements OnInit {
  courses: Course[] = [];
  isLoading = true;
  error: string | null = null;

  constructor(private courseService: CourseService) {}

  ngOnInit() {
    this.loadCourses();
  }

  loadCourses() {
    this.isLoading = true;
    this.error = null;
    
    this.courseService.getCourses().subscribe({
      next: (response) => {
        this.courses = response.data;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load courses. Please try again later.';
        this.isLoading = false;
        console.error('Error loading courses:', err);
      }
    });
  }
}
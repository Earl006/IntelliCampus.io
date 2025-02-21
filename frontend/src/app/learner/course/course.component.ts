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
import {
  style,
  animate,
  transition,
  trigger
} from '@angular/animations';

@Component({
  selector: 'app-course',
  standalone: true,
  imports: [
    CommonModule
  ],
  // You may use a separate HTML file if you prefer. Here, we inline the template and styles for demonstration.
  template: `
    <main class="min-h-screen bg-gray-50" [@fadeIn]>
      <!-- Header Section -->
      <section class="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 py-20">
        <div class="container mx-auto px-4">
          <h1 class="text-4xl md:text-5xl font-bold text-white text-center mb-6">Course Details</h1>
          <p class="text-gray-300 text-center max-w-2xl mx-auto">
            Dive into the specifics of this course and what it has to offer.
          </p>
        </div>
      </section>

      <section class="py-12">
        <div class="container mx-auto px-4">
          <!-- Loading State (Skeleton Loader) -->
          <div *ngIf="isLoading" class="max-w-3xl mx-auto">
            <div class="bg-white rounded-xl shadow-md overflow-hidden animate-pulse" style="transition: all 0.3s;">
              <div class="h-52 bg-gray-200"></div>
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

          <!-- Error State -->
          <div *ngIf="error && !isLoading" class="text-center my-16">
            <svg class="w-16 h-16 text-gray-400 mb-4 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M9 12h6m-3-3v6m9-3c0 4.418-3.582 8-8 8S1 16.418 1 12 4.582 4 9 4s8 3.582 8 8z" />
            </svg>
            <p class="text-gray-600 text-lg">Oops, something went wrong:</p>
            <p class="text-red-500">{{ error }}</p>
          </div>

          <!-- Course Details Card -->
          <div *ngIf="course && !isLoading && !error" class="max-w-3xl mx-auto">
            <div class="bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 border border-gray-100">
              <!-- Course Image Gradient -->
              <div class="relative h-52 overflow-hidden bg-gradient-to-r"
                   [ngClass]="course.isPaid ? 'from-purple-500 to-pink-500' : 'from-blue-500 to-teal-500'">
                <img
                  [src]="course.bannerImageUrl || '/assets/course-default.jpg'"
                  [alt]="course.title"
                  class="w-full h-full object-cover mix-blend-overlay opacity-90">
                <!-- Price Badge -->
                <div class="absolute top-4 right-4">
                  <span *ngIf="course.isPaid"
                        class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white text-gray-900 shadow">
                    {{ course.price | currency:'KES':'symbol-narrow' }}
                  </span>
                  <span *ngIf="!course.isPaid"
                        class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white text-gray-900 shadow">
                    Free
                  </span>
                </div>
              </div>

              <!-- Price and SubCategories Section -->
              <div class="px-8 py-4 border-b border-gray-100">
                <div class="flex flex-wrap gap-2">
                  <span *ngFor="let subCat of course.subCategories"
                        class="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                    {{ subCat.name }}
                  </span>
                </div>
              </div>

              <!-- Course Content -->
              <div class="p-8">
                <h2 class="text-2xl font-bold text-gray-800 mb-3 line-clamp-2">
                  {{ course.title }}
                </h2>
                <p class="text-gray-600 mb-6 whitespace-pre-line">
                  {{ course.description }}
                </p>

                <!-- Instructor Section -->
                <div class="flex items-center space-x-3">
                  <img
                    [src]="'https://ui-avatars.com/api/?name=' + (course.instructor.email || 'Instructor')"
                    alt="Instructor avatar"
                    class="w-10 h-10 rounded-full">
                  <div class="text-sm">
                    <p class="font-medium text-gray-800">
                      {{ course.instructor.firstName || '' }} {{ course.instructor.lastName || '' }}
                    </p>
                    <p class="text-gray-500">{{ course.instructor.email }}</p>
                  </div>
                </div>
              </div>

              <div class="px-8 pb-8">
                <!-- Additional Course Info -->
                <div class="text-sm text-gray-500 mt-2">
                  <p>Created at: {{ course.createdAt | date:'mediumDate' }}</p>
                  <p>Last updated: {{ course.updatedAt | date:'mediumDate' }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  `,
  // Basic fadeIn animation
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('400ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ],
  styles: [`
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `]
})
export class CourseComponent implements OnInit {
  courseId: string | null = null;
  course: Course | null = null;
  isLoading = false;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private courseService: CourseService
  ) {}

  ngOnInit(): void {
    this.courseId = this.route.snapshot.paramMap.get('id');
    if (!this.courseId) {
      this.error = 'No valid Course ID provided';
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
            this.error = 'Failed to load course information';
          }
        },
        error: (err) => {
          this.isLoading = false;
          this.error = err || 'Error fetching the course';
        }
      });
  }
}

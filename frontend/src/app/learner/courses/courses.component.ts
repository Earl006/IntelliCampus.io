import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CourseService, Course } from '../../services/course.service';
import { trigger, transition, style, animate } from '@angular/animations';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-courses',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('400ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ],
  template: `
    <main class="min-h-screen bg-white">
      <!-- Header Section -->
      <section class="relative py-20">
        <div class="absolute inset-0">
          <img src="/assets/bg.jpg" alt="Background" class="w-full h-full object-cover opacity-5">
          <div class="absolute inset-0 bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 opacity-90"></div>
        </div>
        <div class="relative container mx-auto px-4">
          <h1 class="text-4xl md:text-5xl font-bold text-white text-center mb-6">Explore Our Courses</h1>
          <p class="text-gray-300 text-center max-w-2xl mx-auto mb-8">
            Discover a world of knowledge with our carefully curated courses designed to help you succeed
          </p>
          
          <!-- Search and Filter -->
          <div class="max-w-md mx-auto">
            <div class="relative">
              <input 
                type="text" 
                [(ngModel)]="searchTerm" 
                (input)="filterCourses()" 
                placeholder="Search courses..."
                class="w-full px-4 py-3 rounded-lg border-none focus:outline-none focus:ring-2 focus:ring-gray-200"
              >
              <div class="absolute right-3 top-3 text-gray-400">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Courses Grid Section -->
      <section class="py-12">
        <div class="container mx-auto px-4">
          <!-- Category Filters -->
          <div *ngIf="!isLoading && !error && courses.length > 0" class="mb-10 flex flex-wrap gap-3 justify-center">
            <button 
              (click)="filterByCategory('all')" 
              [class.bg-black]="selectedCategory === 'all'"
              [class.text-white]="selectedCategory === 'all'"
              [class.bg-gray-100]="selectedCategory !== 'all'"
              [class.text-gray-700]="selectedCategory !== 'all'"
              class="px-4 py-2 rounded-full text-sm font-medium transition-all duration-200"
            >
              All Courses
            </button>
            <button 
              *ngFor="let category of uniqueCategories" 
              (click)="filterByCategory(category)" 
              [class.bg-black]="selectedCategory === category"
              [class.text-white]="selectedCategory === category"
              [class.bg-gray-100]="selectedCategory !== category"
              [class.text-gray-700]="selectedCategory !== category"
              class="px-4 py-2 rounded-full text-sm font-medium transition-all duration-200"
            >
              {{ category }}
            </button>
          </div>

          <!-- Loading State -->
          <div *ngIf="isLoading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            <div *ngFor="let i of [1,2,3,4,5,6,7,8]" class="bg-white rounded-2xl shadow-lg overflow-hidden" @fadeIn>
              <div class="animate-pulse">
                <div class="h-48 bg-gray-200"></div>
                <div class="p-6 space-y-4">
                  <div class="h-5 bg-gray-200 rounded w-3/4"></div>
                  <div class="h-4 bg-gray-200 rounded w-full"></div>
                  <div class="h-4 bg-gray-200 rounded w-2/3"></div>
                  <div class="flex justify-between items-center pt-4">
                    <div class="flex items-center space-x-2">
                      <div class="h-8 w-8 bg-gray-200 rounded-full"></div>
                      <div class="h-4 bg-gray-200 rounded w-24"></div>
                    </div>
                    <div class="h-9 bg-gray-200 rounded-lg w-24"></div>
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
                      class="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-900 transition-all duration-300">
                Try Again
              </button>
            </div>
          </div>

          <!-- No Courses State -->
          <div *ngIf="!isLoading && !error && filteredCourses.length === 0" class="min-h-[400px] flex items-center justify-center" @fadeIn>
            <div class="text-center">
              <svg class="w-16 h-16 text-gray-400 mb-4 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <h3 class="text-xl font-semibold text-gray-900 mb-2">No Courses Found</h3>
              <p class="text-gray-600">
                {{ courses.length > 0 ? 'Try adjusting your search or filters.' : 'Check back later for new courses or try refreshing the page.' }}
              </p>
              <button *ngIf="searchTerm || selectedCategory !== 'all'" 
                      (click)="resetFilters()" 
                      class="mt-4 px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200">
                Reset Filters
              </button>
            </div>
          </div>

          <!-- Courses Grid -->
          <div *ngIf="!isLoading && !error && filteredCourses.length > 0" 
               class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            <div *ngFor="let course of filteredCourses" 
                 class="group bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl border border-gray-100" 
                 @fadeIn>
              <div class="relative">
                <div class="absolute inset-0 bg-gradient-to-r"
                     [ngClass]="course.isPaid ? 'from-purple-500 to-pink-500' : 'from-blue-500 to-teal-500'">
                </div>
                <img [src]="course.bannerImageUrl || 'assets/images/course-placeholder.jpg'" 
                     [alt]="course.title"
                     class="w-full h-48 object-cover mix-blend-overlay relative">
                <div class="absolute top-4 right-4">
                  <span *ngIf="course.isPaid" 
                        class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white text-gray-900 shadow-md">
                    KES {{ course.price }}
                  </span>
                  <span *ngIf="!course.isPaid" 
                        class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-500 text-white shadow-md">
                    Free
                  </span>
                </div>
              </div>
              
              <div class="p-6">
                <div class="flex flex-wrap gap-2 mb-3">
                  <span *ngFor="let subCat of course.subCategories.slice(0, 2)" 
                        class="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                    {{ subCat.name }}
                  </span>
                  <span *ngIf="course.subCategories.length > 2" 
                        class="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                    +{{ course.subCategories.length - 2 }}
                  </span>
                </div>
                
                <h3 class="text-xl font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-gray-700 transition-colors">
                  {{ course.title }}
                </h3>
                <p class="text-gray-600 line-clamp-2 mb-4 text-sm">{{ course.description }}</p>
                
                <div class="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div class="flex items-center space-x-2">
                    <div class="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-teal-500 flex items-center justify-center text-white text-xs overflow-hidden">
                      {{ course.instructor.email.charAt(0).toUpperCase() }}
                    </div>
                    <span class="text-sm text-gray-600 truncate max-w-[100px]">{{ course.instructor.email }}</span>
                  </div>
                  
                  <a [routerLink]="['/courses', course.id]" 
                     class="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white bg-black hover:bg-gray-900 transition-colors">
                    View
                  </a>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Pagination (if needed) -->
          <div *ngIf="!isLoading && !error && filteredCourses.length > 0" class="mt-12 flex justify-center">
            <div class="flex space-x-2">
              <button 
                [disabled]="currentPage === 1" 
                (click)="changePage(currentPage - 1)"
                [class.opacity-50]="currentPage === 1"
                class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Previous
              </button>
              <div *ngFor="let page of getPageNumbers()" class="hidden sm:block">
                <button 
                  (click)="changePage(page)" 
                  [class.bg-black]="currentPage === page"
                  [class.text-white]="currentPage === page"
                  [class.border-transparent]="currentPage === page"
                  class="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  {{ page }}
                </button>
              </div>
              <button 
                [disabled]="currentPage === totalPages" 
                (click)="changePage(currentPage + 1)"
                [class.opacity-50]="currentPage === totalPages"
                class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Next
              </button>
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
  filteredCourses: Course[] = [];
  isLoading = true;
  error: string | null = null;
  
  // Search and filter
  searchTerm = '';
  selectedCategory = 'all';
  uniqueCategories: string[] = [];
  
  // Pagination
  currentPage = 1;
  pageSize = 8;
  totalPages = 1;

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
        this.extractCategories();
        this.filterCourses();
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load courses. Please try again later.';
        this.isLoading = false;
        console.error('Error loading courses:', err);
      }
    });
  }

  extractCategories() {
    const allCategories: string[] = [];
    
    this.courses.forEach(course => {
      course.subCategories.forEach(subCat => {
        if (!allCategories.includes(subCat.name)) {
          allCategories.push(subCat.name);
        }
      });
    });
    
    this.uniqueCategories = allCategories;
  }

  filterCourses() {
    let result = [...this.courses];
    
    // Apply search filter
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.trim().toLowerCase();
      result = result.filter(course => 
        course.title.toLowerCase().includes(term) || 
        course.description.toLowerCase().includes(term)
      );
    }
    
    // Apply category filter
    if (this.selectedCategory !== 'all') {
      result = result.filter(course => 
        course.subCategories.some(subCat => subCat.name === this.selectedCategory)
      );
    }
    
    // Calculate total pages
    this.totalPages = Math.max(1, Math.ceil(result.length / this.pageSize));
    
    // Apply pagination
    const startIndex = (this.currentPage - 1) * this.pageSize;
    this.filteredCourses = result.slice(startIndex, startIndex + this.pageSize);
  }

  filterByCategory(category: string) {
    this.selectedCategory = category;
    this.currentPage = 1;
    this.filterCourses();
  }

  resetFilters() {
    this.searchTerm = '';
    this.selectedCategory = 'all';
    this.currentPage = 1;
    this.filterCourses();
  }

  changePage(page: number) {
    this.currentPage = page;
    this.filterCourses();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = startPage + maxVisiblePages - 1;
    
    if (endPage > this.totalPages) {
      endPage = this.totalPages;
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }
}
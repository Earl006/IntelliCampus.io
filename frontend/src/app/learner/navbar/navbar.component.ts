import { Component, OnInit, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { CourseService, Course } from '../../services/course.service';
import { trigger, transition, style, animate } from '@angular/animations';
import { jwtDecode } from 'jwt-decode'; // Make sure to install this package

interface DecodedToken {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  exp: number;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ])
    ])
  ]
})
export class NavbarComponent implements OnInit, OnDestroy {
  isLoggedIn = false;
  userInitials = '';
  userName = '';
  userEmail = '';
  userRole = '';
  avatarUrl = '';
  showDropdown = false;
  isMenuOpen = false;
  isSearchOpen = false;
  searchQuery = '';
  searchResults: Course[] = [];
  isSearching = false;
  allCourses: Course[] = [];
  
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(
    public authService: AuthService,
    private courseService: CourseService,
    private router: Router
  ) {}

  ngOnInit() {
    // Check login status and get user info
    this.checkAuthStatus();
    
    // Load all courses for search functionality
    this.loadAllCourses();
    
    // Set up search debounce
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(query => {
      if (query.trim().length > 2) {
        this.performSearch(query.trim().toLowerCase());
      } else {
        this.searchResults = [];
      }
    });
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  checkAuthStatus() {
    const token = this.authService.getToken();
    this.isLoggedIn = !!token;
    
    if (this.isLoggedIn && token) {
      try {
        // Extract user info from token
        const decoded = jwtDecode<DecodedToken>(token);
        this.userEmail = decoded.email || '';
        this.userName = [decoded.firstName, decoded.lastName].filter(Boolean).join(' ');
        this.userRole = decoded.role || '';
        
        // Generate initials
        if (decoded.firstName && decoded.lastName) {
          this.userInitials = (decoded.firstName[0] + decoded.lastName[0]).toUpperCase();
        } else if (decoded.email) {
          this.userInitials = decoded.email[0].toUpperCase();
        } else {
          this.userInitials = 'U';
        }
        
        // Generate an avatar URL using a service like UI Avatars
        // This is better than a "blue blob"
        const name = encodeURIComponent(this.userName || this.userEmail);
        this.avatarUrl = `https://ui-avatars.com/api/?name=${name}&background=random&size=128`;
      } catch (error) {
        console.error('Error decoding token:', error);
        this.userInitials = 'U';
      }
    }
  }

  loadAllCourses() {
    this.courseService.getCourses().subscribe({
      next: (response) => {
        if (response.success) {
          this.allCourses = response.data;
        }
      },
      error: (err) => console.error('Error loading courses:', err)
    });
  }

  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
  }

  closeDropdown() {
    this.showDropdown = false;
  }

  logout() {
    this.authService.logout();
    this.isLoggedIn = false;
    this.userName = '';
    this.userInitials = '';
    this.userEmail = '';
    this.userRole = '';
    this.avatarUrl = '';
    this.router.navigate(['/']);
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  toggleSearch() {
    this.isSearchOpen = !this.isSearchOpen;
    if (!this.isSearchOpen) {
      this.searchQuery = '';
      this.searchResults = [];
    }
  }
  
  onSearchInput(query: string) {
    this.searchSubject.next(query);
  }
  
  performSearch(query: string) {
    this.isSearching = true;
    
    // Client-side search through the cached courses
    setTimeout(() => {
      this.searchResults = this.allCourses
        .filter(course => 
          course.title.toLowerCase().includes(query) || 
          course.description.toLowerCase().includes(query) ||
          course.subCategories.some(cat => cat.name.toLowerCase().includes(query))
        )
        .slice(0, 5); // Limit to 5 results for better UX
      
      this.isSearching = false;
    }, 300);
  }
  
  goToCourse(courseId: string) {
    this.toggleSearch();
    this.router.navigate(['/courses', courseId]);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (this.showDropdown && !target.closest('.dropdown-container')) {
      this.closeDropdown();
    }
    if (this.isSearchOpen && !target.closest('.search-container') && !target.closest('.search-toggle')) {
      this.toggleSearch();
    }
  }
}
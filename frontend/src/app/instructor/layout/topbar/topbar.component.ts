import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { interval, Subscription } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { trigger, transition, style, animate } from '@angular/animations';

interface DecodedToken {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  exp: number;
}

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './topbar.component.html',
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class TopbarComponent implements OnInit, OnDestroy {
  @Output() toggleSidebar = new EventEmitter<void>();
  
  currentTime = new Date();
  userName = '';
  userInitials = '';
  userEmail = '';
  userRole = '';
  showDropdown = false;
  timeSubscription?: Subscription;
  
  constructor(
    public authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Update time every second
    this.timeSubscription = interval(1000).subscribe(() => {
      this.currentTime = new Date();
    });
    
    // Get user details
    this.loadUserDetails();
  }
  
  ngOnDestroy(): void {
    if (this.timeSubscription) {
      this.timeSubscription.unsubscribe();
    }
  }
  
  loadUserDetails(): void {
    const token = this.authService.getToken();
    if (token) {
      try {
        const decoded = jwtDecode<DecodedToken>(token);
        this.userEmail = decoded.email || '';
        this.userName = [decoded.firstName, decoded.lastName].filter(Boolean).join(' ');
        this.userRole = decoded.role || '';
        
        // Generate initials
        if (decoded.firstName && decoded.lastName) {
          this.userInitials = (decoded.firstName[0] + decoded.lastName[0]).toUpperCase();
        } else if (decoded.email) {
          this.userInitials = decoded.email[0].toUpperCase();
        }
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }
  }
  
  toggleUserDropdown(): void {
    this.showDropdown = !this.showDropdown;
  }
  
  closeDropdown(): void {
    this.showDropdown = false;
  }
  
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }
}
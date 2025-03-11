import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';

// Import the User and ApiResponse interfaces from the UserService
import { UserService, User, ApiResponse } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './profile.component.html',
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
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
export class ProfileComponent implements OnInit {
  userProfile: User | null = null;
  isLoading = true;
  isEditing = false;
  isSaving = false;
  successMessage = '';
  errorMessage = '';
  profileForm: FormGroup;
  avatarUrl = '';
  activeTab = 'profile'; // 'profile', 'security', 'preferences'
  
  // Instructor request
  isSubmittingRequest = false;
  requestSuccess = false;
  requestError = '';
  showInstructorConfirmModal: boolean = false;
  
  constructor(
    private authService: AuthService,
    private userService: UserService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      phoneNumber: ['', [Validators.pattern(/^\d{10,15}$/)]],
      bio: ['', [Validators.maxLength(500)]]
    });
  }

  ngOnInit(): void {
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    console.log('Starting profile fetch...');
    
    // Now getProfile() returns an Observable<ApiResponse<User>> from the service
    this.userService.getProfile().subscribe(
      (response: ApiResponse<User>) => {
        console.log('Profile received:', response);
        if (response.success && response.data) {
          this.userProfile = response.data;
          this.initProfileForm();
          this.generateAvatarUrl();
        } else {
          this.errorMessage = 'Failed to load profile data.';
        }
        this.isLoading = false;
      },
      (error) => {
        console.error('Error loading profile:', error);
        this.errorMessage = 'Failed to load profile. Please try again later.';
        this.isLoading = false;
      },
      () => {
        console.log('Profile request completed');
      }
    );
  }

  initProfileForm(): void {
    if (this.userProfile) {
      this.profileForm.patchValue({
        firstName: this.userProfile.firstName || '',
        lastName: this.userProfile.lastName || '',
        phoneNumber: this.userProfile.phoneNumber || '',
        bio: this.userProfile.bio || ''
      });
    }
  }

  generateAvatarUrl(): void {
    if (this.userProfile) {
      const name = encodeURIComponent(
        `${this.userProfile.firstName} ${this.userProfile.lastName}`
      );
      this.avatarUrl = `https://ui-avatars.com/api/?name=${name}&background=random&size=128`;
    }
  }

  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }
    this.isSaving = true;
    this.clearMessages();

    const profileData = this.profileForm.value;

    this.userService.updateProfile(profileData).subscribe(
      (response: ApiResponse<User>) => {
        if (response.success && response.data) {
          this.userProfile = response.data;
          this.isEditing = false;
          this.isSaving = false;
          this.successMessage = 'Profile updated successfully!';
          this.generateAvatarUrl();
          setTimeout(() => this.clearMessages(), 5000);
        } else {
          this.errorMessage = 'Failed to update profile.';
          this.isSaving = false;
        }
      },
      (error) => {
        console.error('Error updating profile:', error);
        this.errorMessage = 'Failed to update profile: ' + (error.message || 'Unknown error');
        this.isSaving = false;
      }
    );
  }

  requestInstructorRole(): void {
    this.showInstructorConfirmModal = true;
  }

  cancelInstructorRequest(): void {
    this.showInstructorConfirmModal = false;
  }

  confirmInstructorRequest(): void {
    // Hide the modal
    this.showInstructorConfirmModal = false;
    this.isSubmittingRequest = true;
    this.clearMessages();

    this.userService.requestInstructorRole().subscribe({
      next: (response: ApiResponse<User>) => {
        if (response.success && response.data) {
          this.userProfile = response.data;
          this.requestSuccess = true;
          this.isSubmittingRequest = false;
          setTimeout(() => this.requestSuccess = false, 5000);
        } else {
          this.requestError = 'Failed to submit instructor request.';
          this.isSubmittingRequest = false;
        }
      },
      error: (error) => {
        console.error('Error requesting instructor role:', error);
        this.requestError = 'Failed to submit request: ' + (error.message || 'Unknown error');
        this.isSubmittingRequest = false;
      }
    });
  }

  changeTab(tab: string): void {
    this.activeTab = tab;
    this.clearMessages();
    if (this.isEditing) {
      this.isEditing = false;
      this.initProfileForm();
    }
  }

  toggleEditMode(): void {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      this.initProfileForm(); // Reset form when canceling edit
    }
    this.clearMessages();
  }

  clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
    this.requestError = '';
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  // Helper getters for template
  get isInstructor(): boolean {
    return this.userProfile?.role === 'INSTRUCTOR';
  }

  get isAdmin(): boolean {
    return this.userProfile?.role === 'ADMIN';
  }

  get canRequestInstructor(): boolean {
    return this.userProfile?.role === 'LEARNER' && 
           (this.userProfile?.instructorStatus === 'NOT_REQUESTED' || 
            this.userProfile?.instructorStatus === 'REJECTED');
  }

  get isRequestPending(): boolean {
    return this.userProfile?.instructorStatus === 'PENDING';
  }

  get isRequestRejected(): boolean {
    return this.userProfile?.instructorStatus === 'REJECTED';
  }

  get userInitials(): string {
    if (!this.userProfile) return '';
    return (
      (this.userProfile.firstName?.charAt(0) || '') +
      (this.userProfile.lastName?.charAt(0) || '')
    ).toUpperCase();
  }

  // Form getters for validation
  get f() { 
    return this.profileForm.controls; 
  }
}
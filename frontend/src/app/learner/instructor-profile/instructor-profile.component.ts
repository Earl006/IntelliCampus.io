import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { User, UserService } from '../../services/user.service';

export interface Course {
  id?: string;
  bannerImageUrl: string;
  title: string;
  description: string;
  isPaid: boolean;
  price: number;
}

export interface Instructor {
  firstName: string;
  lastName: string;
  email: string;
  bio?: string;
  instructorStatus?: string;
  coursesCreated?: Course[];
}

interface InstructorResponse {
  sucess: boolean; // notice: API returns "sucess" (typo)
  data: User;
}

@Component({
  selector: 'app-instructor-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './instructor-profile.component.html',
  styleUrls: ['./instructor-profile.component.css'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('500ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class InstructorProfileComponent implements OnInit {
  instructorId: string | null = null;
  instructor: Instructor | null = null;
  isLoading: boolean = false;
  error: string | null = null;

  constructor(private route: ActivatedRoute, private userService: UserService) {}

  ngOnInit(): void {
    this.instructorId = this.route.snapshot.paramMap.get('id');
    if (!this.instructorId) {
      this.error = 'Invalid instructor ID';
      return;
    }
    this.loadInstructor();
  }

  loadInstructor(): void {
    this.isLoading = true;
    this.userService.getInstructor(this.instructorId!).subscribe({
      next: (response: any) => {
        // Use "sucess" as returned by API
        if (response.sucess && response.data) {
          this.instructor = response.data;
        } else {
          this.error = 'Failed to load instructor details.';
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err || 'Error loading instructor information.';
        this.isLoading = false;
        console.error(err);
      }
    });
  }
}
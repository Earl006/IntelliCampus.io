import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CourseService, Course } from '../../services/course.service';
import { CommentReviewService, Review } from '../../services/comment-review.service';
import { User, UserService } from '../../services/user.service';
import { firstValueFrom } from 'rxjs';
import { NavbarComponent } from "../navbar/navbar.component";
import { FooterComponent } from "../footer/footer.component";

interface ReviewDisplay {
  id: string;
  rating: number;
  comment: string;
  createdAt: Date;
  userName: string;
  course: Course;
}


@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe, NavbarComponent, FooterComponent],
  templateUrl: './hero.component.html',
  styleUrls: ['./hero.component.css']
})
export class HeroComponent implements OnInit, OnDestroy {
  courses: Course[] = [];
  displayReviews: ReviewDisplay[] = [];
  currentReviewIndex = 0;
  isLoading = true;
  error: string | null = null;
  private rotationInterval?: number;

  constructor(
    private courseService: CourseService,
    private reviewService: CommentReviewService,
    private userService: UserService
  ) {}
  ngOnInit(): void {
    this.initScrollAnimations();
    this.loadData();
    this.startReviewRotation();
  }

  async loadData() {
    try {
      this.isLoading = true;
      
      const [coursesResponse, reviewsResponse] = await Promise.all([
        firstValueFrom(this.courseService.getCourses()),
        firstValueFrom(this.reviewService.getAllReviews())
      ]);

      if (coursesResponse?.success && Array.isArray(coursesResponse.data)) {
        this.courses = coursesResponse.data
          .filter(course => course.isPublished)
          .slice(0, 3);
      }

      if (reviewsResponse?.success && Array.isArray(reviewsResponse.data)) {
        this.displayReviews = await Promise.all(
          reviewsResponse.data.map(async (review) => {
            const [userResponse, courseResponse] = await Promise.all([
              firstValueFrom(this.userService.getUserNameById(review.userId)),
              firstValueFrom(this.courseService.getCourseById(review.courseId))
            ]);
            
            if (!userResponse.success || !courseResponse.success) {
              throw new Error('Failed to load review data');
            }
            
            return {
              id: review.id,
              rating: review.rating,
              comment: review.comment || '',
              createdAt: new Date(review.createdAt),
              userName: userResponse.data,
              course: courseResponse.data
            };
          })
        );
      }
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Error loading data';
      console.error('Error:', error);
    } finally {
      this.isLoading = false;
    }
  }

  private startReviewRotation() {
    this.rotationInterval = window.setInterval(() => {
      if (this.displayReviews.length > 0) {
        this.currentReviewIndex = (this.currentReviewIndex + 1) % this.displayReviews.length;
      }
    }, 5000);
  }

  ngOnDestroy() {
    if (this.rotationInterval) {
      clearInterval(this.rotationInterval);
    }
  }

  previousReview() {
    if (this.currentReviewIndex > 0) {
      this.currentReviewIndex--;
    } else {
      this.currentReviewIndex = this.displayReviews.length - 1;
    }
  }
  
  nextReview() {
    if (this.currentReviewIndex < this.displayReviews.length - 1) {
      this.currentReviewIndex++;
    } else {
      this.currentReviewIndex = 0;
    }
  }

  private initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('show');
        }
      });
    });

    const hiddenElements = document.querySelectorAll('.fade-hidden');
    hiddenElements.forEach((el) => observer.observe(el));
  }
}
import { Component, OnInit, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { CourseService } from '../../services/course.service';
import { CourseMaterialService, Material } from '../../services/course-material.service';
import { trigger, transition, style, animate } from '@angular/animations';

interface CourseUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
}

interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  enrolledAt: string;
  progress: number;
  completed: boolean;
  user?: CourseUser;
}

interface Category {
  id: string;
  name: string;
}

interface SubCategory {
  id: string;
  name: string;
  categoryId: string;
}

interface CourseStatistics {
  totalEnrollments: number;
  completionRate: number;
  avgRating: number;
  totalMaterials: number;
  avgProgress: number;
}

interface Course {
  id: string;
  title: string;
  description: string;
  instructorId: string;
  createdAt: string;
  updatedAt: string;
  isPublished: boolean;
  isPaid: boolean;
  price?: number;
  bannerImageUrl?: string;
  categories?: Category[];
  subCategories?: SubCategory[];
  _count?: {
    enrollments: number;
    materials: number;
    reviews: number;
  };
  statistics?: CourseStatistics;
  materials?: Material[];
  enrollments?: Enrollment[];
  instructor?: CourseUser;
}

@Component({
  selector: 'app-course',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './course.component.html',
  styleUrl: './course.component.css',
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.98)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ])
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('400ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('slideUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        style({ opacity: 1, transform: 'translateY(0)' }),
        animate('150ms ease-in', style({ opacity: 0, transform: 'translateY(10px)' }))
      ])
    ])
  ]
})
export class CourseComponent implements OnInit {
  @Input() course!: Course;
  @Input() visible: boolean = false;
  @Output() close = new EventEmitter<void>();
  @Output() edit = new EventEmitter<Course>();
  @Output() delete = new EventEmitter<string>();
  @Output() materialAdded = new EventEmitter<Material>();
  @Output() materialUpdated = new EventEmitter<Material>();
  
  activeTab: 'details' | 'materials' | 'students' | 'analytics' = 'details';
  isLoading: boolean = false;
  error: string | null = null;
  materials: Material[] = [];
  materialTypes = [
    { value: 'VIDEO', label: 'Video', icon: 'videocam' },
    { value: 'DOCUMENT', label: 'Document', icon: 'description' },
    { value: 'QUIZ', label: 'Quiz', icon: 'quiz' },
    { value: 'ASSIGNMENT', label: 'Assignment', icon: 'assignment' }
  ];
  
  // State variables
  confirmingDelete: boolean = false;
  confirmingMaterialDelete: boolean = false;
  currentMaterialId: string | null = null;
  showMaterialDetails: boolean = false;
  selectedMaterial: Material | null = null;
  materialActionLoading: boolean = false;

  // Define tabs with correct typing
  tabs: {id: 'details' | 'materials' | 'students' | 'analytics', label: string, icon: string}[] = [
    {id: 'details', label: 'Details', icon: 'info'},
    {id: 'materials', label: 'Materials', icon: 'library_books'},
    {id: 'students', label: 'Students', icon: 'people'},
    {id: 'analytics', label: 'Analytics', icon: 'analytics'}
  ];
  
  constructor(
    private courseService: CourseService,
    private materialService: CourseMaterialService,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    if (this.visible && this.course) {
      this.loadCourseMaterials();
    }
  }
  
  loadCourseMaterials(): void {
    this.isLoading = true;
    this.materialService.getMaterialsByCourse(this.course.id).subscribe({
      next: (response) => {
        this.materials = response.data;
        // Sort materials by week, day, and order
        this.materials.sort((a, b) => {
          if (a.week !== b.week) return a.week - b.week;
          if (a.day !== b.day) return a.day - b.day;
          return (a.order || 0) - (b.order || 0);
        });
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load course materials';
        this.isLoading = false;
        console.error('Error loading materials:', err);
      }
    });
  }
  
  closeModal(): void {
    this.close.emit();
    this.confirmingDelete = false;
    this.confirmingMaterialDelete = false;
    this.showMaterialDetails = false;
    this.selectedMaterial = null;
  }
  
  editCourse(): void {
    this.edit.emit(this.course);
  }
  
  startDeleteConfirmation(): void {
    this.confirmingDelete = true;
  }
  
  cancelDelete(): void {
    this.confirmingDelete = false;
  }
  
  confirmDelete(): void {
    // this.delete.emit(this.course.id);
    this.courseService.deleteCourse(this.course.id).subscribe({
      next: () => {
        this.delete.emit(this.course.id);
        window.location.reload()
      },
      error: (err) => {
        this.error = 'Failed to delete course';
        console.error('Error deleting course:', err);
      }
    });
    this.closeModal();
  }
  
  // Material management methods
  navigateToMaterialEditor(materialId?: string): void {
    if (materialId) {
      this.router.navigate(['/instructor/materials', materialId, 'edit'], {
        queryParams: { courseId: this.course.id }
      });
    } else {
      this.router.navigate(['/instructor/materials/new'], {
        queryParams: { courseId: this.course.id }
      });
    }
  }
  
  viewMaterialDetails(material: Material): void {
    this.selectedMaterial = material;
    this.showMaterialDetails = true;
  }
  
  closeMaterialDetails(): void {
    this.showMaterialDetails = false;
    this.selectedMaterial = null;
  }
  
  startMaterialDeleteConfirmation(materialId: string, event: Event): void {
    event.stopPropagation();
    this.currentMaterialId = materialId;
    this.confirmingMaterialDelete = true;
  }
  
  cancelMaterialDelete(): void {
    this.confirmingMaterialDelete = false;
    this.currentMaterialId = null;
  }
  
  confirmMaterialDelete(): void {
    if (!this.currentMaterialId) return;
    
    this.materialActionLoading = true;
    this.materialService.deleteMaterial(this.currentMaterialId).subscribe({
      next: () => {
        // Remove material from list
        this.materials = this.materials.filter(m => m.id !== this.currentMaterialId);
        this.materialActionLoading = false;
        this.confirmingMaterialDelete = false;
        this.currentMaterialId = null;
        
        // Update course material count
        if (this.course._count) {
          this.course._count.materials = (this.course._count.materials || 0) - 1;
        }
      },
      error: (err) => {
        this.error = 'Failed to delete material';
        this.materialActionLoading = false;
        console.error('Error deleting material:', err);
      }
    });
  }
  
  switchTab(tab: 'details' | 'materials' | 'students' | 'analytics'): void {
    this.activeTab = tab;
    
    // Load data based on active tab
    if (tab === 'materials' && (!this.materials || this.materials.length === 0)) {
      this.loadCourseMaterials();
    }
  }
  
  getWeekDisplay(material: Material): string {
    return `Week ${material.week}${material.day ? `, Day ${material.day}` : ''}`;
  }
  
  getPublishStatusColor(): string {
    return this.course.isPublished ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
  }
  
  getPublishStatusText(): string {
    return this.course.isPublished ? 'Published' : 'Draft';
  }
  
  getPriceStatusColor(): string {
    return this.course.isPaid ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800';
  }
  
  getPriceStatusText(): string {
    return this.course.isPaid ? `KES ${this.course.price}` : 'Free';
  }

  getFormattedDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }
  
  getTypeIcon(type: string): string {
    const materialType = this.materialTypes.find(t => t.value === type);
    return materialType ? materialType.icon : 'article';
  }
  
  getTypeLabel(type: string): string {
    const materialType = this.materialTypes.find(t => t.value === type);
    return materialType ? materialType.label : 'Unknown';
  }
  
  getMaterialTypeColor(type: string): string {
    switch(type) {
      case 'VIDEO': return 'bg-blue-100 text-blue-800';
      case 'DOCUMENT': return 'bg-yellow-100 text-yellow-800';
      case 'QUIZ': return 'bg-green-100 text-green-800';
      case 'ASSIGNMENT': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
  
  // Close modal when clicking escape key
  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.showMaterialDetails) {
      this.closeMaterialDetails();
    } else if (this.confirmingMaterialDelete) {
      this.cancelMaterialDelete();
    } else if (this.confirmingDelete) {
      this.cancelDelete();
    } else {
      this.closeModal();
    }
  }
}
import { Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CourseService } from '../../services/course.service';
import { CategoryService } from '../../services/category.service';
import { HttpClientModule } from '@angular/common/http';

interface Category {
  id: string;
  name: string;
  subCategories?: SubCategory[];
}

interface SubCategory {
  id: string;
  name: string;
  categoryId: string;
}

interface Course {
  id?: string;
  title: string;
  description: string;
  isPaid: boolean;
  price: number;
  bannerImageUrl?: string;
  categories?: Category[];
  subCategories?: SubCategory[];
}

@Component({
  selector: 'app-course-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './course-form.component.html',
  styleUrl: './course-form.component.css'
})
export class CourseFormComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() course: Course | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<any>();
  @ViewChild('fileInput') fileInput: ElementRef | null = null;
  
  courseForm: FormGroup;
  isSubmitting = false;
  errorMessage = '';
  isEditMode = false;
  
  categories: Category[] = [];
  selectedCategoryIds: string[] = [];
  availableSubCategories: SubCategory[] = [];
  
  imagePreview: string | null = null;
  
  constructor(
      private fb: FormBuilder,
      private courseService: CourseService,
      private categoryService: CategoryService,
      private cdr: ChangeDetectorRef
    ) {
      this.courseForm = this.createForm();
    }

  ngOnInit() {
    this.loadCategories();
    
    // Listen for isPaid changes to toggle price validation
    this.courseForm.get('isPaid')?.valueChanges.subscribe(isPaid => {
      const priceControl = this.courseForm.get('price');
      if (isPaid) {
        priceControl?.setValidators([Validators.required, Validators.min(1)]);
      } else {
        priceControl?.clearValidators();
        priceControl?.setValue(0);
      }
      priceControl?.updateValueAndValidity();
    });
  }
  
  ngOnChanges(changes: SimpleChanges) {
    // Important: Check if the course input changed
    if (changes['course']) {
      this.isEditMode = this.course !== null && this.course.id !== undefined;
      
      if (this.isEditMode && this.course) {
        this.populateForm();
      } else {
        // When course is null (add mode), fully reset the form
        this.fullReset();
      }
    }
    
    // If the modal is newly opened
    if (changes['isOpen'] && this.isOpen) {
      if (this.isEditMode && this.course) {
        this.populateForm();
      } else {
        this.fullReset();
      }
    }
  }
  
  createForm(): FormGroup {
    return this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(1000)]],
      isPaid: [false],
      price: [0],
      categoryIds: [[]],
      subCategoryIds: [[]]
    });
  }
  
  populateForm() {
    if (!this.course) return;
    
    this.courseForm.patchValue({
      title: this.course.title,
      description: this.course.description,
      isPaid: this.course.isPaid,
      price: this.course.isPaid ? this.course.price : 0
    });
    
    // Set category and subcategory selections
    if (this.course.categories) {
      const categoryIds = this.course.categories.map(c => c.id);
      this.courseForm.get('categoryIds')?.setValue(categoryIds);
      this.selectedCategoryIds = categoryIds;
      this.updateAvailableSubcategories();
    }
    
    if (this.course.subCategories) {
      const subCategoryIds = this.course.subCategories.map(s => s.id);
      this.courseForm.get('subCategoryIds')?.setValue(subCategoryIds);
    }
    
    // Set image preview if available
    if (this.course.bannerImageUrl) {
      this.imagePreview = this.course.bannerImageUrl;
    } else {
      this.imagePreview = null;
    }

    // Force change detection
    this.cdr.detectChanges();
  }
  
  loadCategories() {
    this.categoryService.getCategories().subscribe({
      next: (response) => {
        if (response && response.data) {
          this.categories = response.data;
          
          // If in edit mode, update subcategories after categories are loaded
          if (this.isEditMode && this.course) {
            this.updateAvailableSubcategories();
          }
        }
      },
      error: (err) => {
        console.error('Failed to load categories', err);
        this.errorMessage = 'Failed to load categories. Please try again.';
      }
    });
  }
  
  onCategoryChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    const selectedOptions = Array.from(select.selectedOptions);
    this.selectedCategoryIds = selectedOptions.map(option => option.value);
    this.courseForm.get('categoryIds')?.setValue(this.selectedCategoryIds);
    
    this.updateAvailableSubcategories();
    
    // Clear subcategory selection when category changes
    this.courseForm.get('subCategoryIds')?.setValue([]);
  }
  
  updateAvailableSubcategories() {
    this.availableSubCategories = [];
    
    for (const categoryId of this.selectedCategoryIds) {
      const category = this.categories.find(c => c.id === categoryId);
      if (category && category.subCategories) {
        this.availableSubCategories.push(...category.subCategories);
      }
    }
  }
  
  onSubCategoryChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    const selectedOptions = Array.from(select.selectedOptions);
    const subCategoryIds = selectedOptions.map(option => option.value);
    this.courseForm.get('subCategoryIds')?.setValue(subCategoryIds);
  }
  
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      // Clear any previous error
      this.errorMessage = '';
      
      // Validate file type and size
      if (!file.type.match('image.*')) {
        this.errorMessage = 'Please select an image file';
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB max
        this.errorMessage = 'Image size should not exceed 5MB';
        return;
      }
      
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    }
  }
  
  triggerFileInput() {
    this.fileInput?.nativeElement.click();
  }
  
  removeImage() {
    this.imagePreview = null;
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }
  
  onSubmit() {
    if (this.courseForm.invalid) {
      this.markFormGroupTouched(this.courseForm);
      return;
    }
    
    this.isSubmitting = true;
    this.errorMessage = '';
    
    const formData = new FormData();
    const formValue = this.courseForm.value;
    
    // Add form values to FormData
    formData.append('title', formValue.title);
    formData.append('description', formValue.description);
    formData.append('isPaid', String(formValue.isPaid));
    
    if (formValue.isPaid) {
      formData.append('price', String(formValue.price));
    }
    
    // Add categories and subcategories
    formData.append('categoryIds', JSON.stringify(formValue.categoryIds));
    formData.append('subCategoryIds', JSON.stringify(formValue.subCategoryIds));
    
    // Add banner image if selected
    if (this.fileInput && this.fileInput.nativeElement.files && this.fileInput.nativeElement.files.length > 0) {
      formData.append('bannerImage', this.fileInput.nativeElement.files[0]);
    }
    
    // Choose the appropriate service method based on mode
    const request = this.isEditMode && this.course && this.course.id
      ? this.courseService.updateCourse(this.course.id, formData)
      : this.courseService.createCourse(formData);
    
    request.subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.saved.emit(response);
        this.closeModal();
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('Error saving course', err);
        this.errorMessage = err.error?.message || 'Failed to save course. Please try again.';
      }
    });
  }
  
  closeModal() {
    // Just emit close event, parent will handle resetting state
    this.close.emit();
  }
  
  resetForm() {
    // Reset based on mode
    if (this.isEditMode && this.course) {
      this.populateForm();
    } else {
      this.fullReset();
    }
    
    this.errorMessage = '';
    this.isSubmitting = false;
  }
  
  // NEW METHOD: Complete form reset for new courses
  fullReset() {
    // Reset state
    this.isEditMode = false;
    this.imagePreview = null;
    this.selectedCategoryIds = [];
    this.availableSubCategories = [];
    
    // Clear file input
    if (this.fileInput && this.fileInput.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
    
    // Reset form to defaults
    this.courseForm.reset({
      title: '',
      description: '',
      isPaid: false,
      price: 0,
      categoryIds: [],
      subCategoryIds: []
    });
    
    this.errorMessage = '';
    this.isSubmitting = false;
    
    // Force change detection
    this.cdr.detectChanges();
  }
  
  // Helper method to mark all controls as touched
  markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      
      if ((control as any).controls) {
        this.markFormGroupTouched(control as FormGroup);
      }
    });
  }
}
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
  <div class="min-h-screen relative overflow-hidden bg-white">
    <!-- Background with subtle overlay -->
    <div class="absolute inset-0">
      <img src="/assets/bg.jpg" alt="Background" class="w-full h-full object-cover opacity-10">
      <!-- <div class="absolute inset-0 bg-white/10"></div> -->
    </div>
    
    <!-- Two Column Container (Floating effect) -->
    <div class="relative flex items-center justify-center min-h-[calc(100vh-64px)] mt-16 px-4">
      <div class="flex flex-col md:flex-row bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden">
        
        <!-- Left Column: Contact Form -->
        <div class="w-full md:w-3/5 p-10">
          <h2 class="text-3xl font-bold text-gray-900 mb-2">Get in Touch</h2>
          <p class="text-gray-600 mb-8">We'd love to hear from you. Send us a message.</p>
          <form [formGroup]="contactForm" (ngSubmit)="onSubmit()" class="space-y-6">
            <!-- Name Row -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="relative">
                <label class="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input 
                  formControlName="firstName" 
                  type="text" 
                  placeholder="John" 
                  class="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-lg focus:outline-none focus:border-gray-200 focus:ring-2 focus:ring-gray-100 transition duration-200"
                />
                <p *ngIf="isFieldInvalid('firstName')" class="absolute -bottom-5 text-xs text-red-500">
                  First name is required
                </p>
              </div>
              <div class="relative">
                <label class="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input 
                  formControlName="lastName" 
                  type="text" 
                  placeholder="Doe" 
                  class="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-lg focus:outline-none focus:border-gray-200 focus:ring-2 focus:ring-gray-100 transition duration-200"
                />
                <p *ngIf="isFieldInvalid('lastName')" class="absolute -bottom-5 text-xs text-red-500">
                  Last name is required
                </p>
              </div>
            </div>

            <!-- Email -->
            <div class="relative">
              <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input 
                formControlName="email" 
                type="email" 
                placeholder="you@example.com" 
                class="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-lg focus:outline-none focus:border-gray-200 focus:ring-2 focus:ring-gray-100 transition duration-200"
              />
              <p *ngIf="isFieldInvalid('email')" class="absolute -bottom-5 text-xs text-red-500">
                Please enter a valid email
              </p>
            </div>

            <!-- Subject -->
            <div class="relative">
              <label class="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <input 
                formControlName="subject" 
                type="text" 
                placeholder="How can we help you?" 
                class="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-lg focus:outline-none focus:border-gray-200 focus:ring-2 focus:ring-gray-100 transition duration-200"
              />
              <p *ngIf="isFieldInvalid('subject')" class="absolute -bottom-5 text-xs text-red-500">
                Subject is required
              </p>
            </div>

            <!-- Message -->
            <div class="relative">
              <label class="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea 
                formControlName="message" 
                rows="4" 
                placeholder="Your message here..." 
                class="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-lg focus:outline-none focus:border-gray-200 focus:ring-2 focus:ring-gray-100 transition duration-200 resize-none"
              ></textarea>
              <p *ngIf="isFieldInvalid('message')" class="absolute -bottom-5 text-xs text-red-500">
                Message is required
              </p>
            </div>

            <!-- Submit Button -->
            <button 
              type="submit" 
              class="w-full bg-gray-900 text-white py-4 rounded-lg hover:bg-black transform hover:translate-y-[-1px] transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl"
              [disabled]="isLoading">
              <span *ngIf="!isLoading" class="text-sm font-medium">Send Message</span>
              <span *ngIf="isLoading" class="flex items-center">
                <svg class="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                <span class="text-sm font-medium">Sending...</span>
              </span>
            </button>
          </form>
        </div>
        
        <!-- Right Column: Contact Info with Gradient -->
        <div class="hidden md:flex w-full md:w-2/5 bg-gradient-to-br from-gray-800 via-gray-900 to-black p-10 rounded-r-xl flex-col justify-between relative overflow-hidden">
  <!-- Overlay Pattern -->
  <div class="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_1px_1px,#fff_1px,transparent_0)]" style="background-size: 24px 24px;"></div>
  
  <div class="relative">
    <h3 class="text-2xl font-bold text-white mb-8">Contact Information</h3>
    <div class="space-y-8">
      <!-- Location -->
      <div class="flex items-start space-x-4">
        <div class="flex-shrink-0 bg-gray-800 bg-opacity-50 p-3 rounded-xl border border-gray-700">
          <svg class="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
        </div>
        <div>
          <h4 class="text-lg font-medium text-gray-200">Our Location</h4>
          <p class="text-gray-400 mt-1">123 Innovation Street, Tech City, 00100</p>
        </div>
      </div>

      <!-- Phone -->
      <div class="flex items-start space-x-4">
        <div class="flex-shrink-0 bg-gray-800 bg-opacity-50 p-3 rounded-xl border border-gray-700">
          <svg class="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
          </svg>
        </div>
        <div>
          <h4 class="text-lg font-medium text-gray-200">Phone</h4>
          <p class="text-gray-400 mt-1">+254 700 000 000</p>
        </div>
      </div>

      <!-- Email -->
      <div class="flex items-start space-x-4">
        <div class="flex-shrink-0 bg-gray-800 bg-opacity-50 p-3 rounded-xl border border-gray-700">
          <svg class="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
          </svg>
        </div>
        <div>
          <h4 class="text-lg font-medium text-gray-200">Email</h4>
          <p class="text-gray-400 mt-1">support&#64;intellicampus.io</p>
        </div>
      </div>
    </div>
  </div>

  <!-- Social Links -->
  <div class="relative mt-12">
    <h4 class="text-lg font-medium text-gray-200 mb-4">Follow Us</h4>
    <div class="flex space-x-4">
      <a href="#" class="bg-gray-800 bg-opacity-50 p-3 rounded-xl border border-gray-700 hover:bg-gray-700 transition-all duration-200 transform hover:translate-y-[-1px]">
        <svg class="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      </a>
      <a href="#" class="bg-gray-800 bg-opacity-50 p-3 rounded-xl border border-gray-700 hover:bg-gray-700 transition-all duration-200 transform hover:translate-y-[-1px]">
        <svg class="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
        </svg>
      </a>
      <a href="#" class="bg-gray-800 bg-opacity-50 p-3 rounded-xl border border-gray-700 hover:bg-gray-700 transition-all duration-200 transform hover:translate-y-[-1px]">
        <svg class="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      </a>
    </div>
  </div>
</div>
      </div>
    </div>
  </div>
`,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class ContactComponent {
  contactForm: FormGroup;
  error: string | null = null;
  isLoading = false;

  constructor(private fb: FormBuilder) {
    this.contactForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      subject: ['', Validators.required],
      message: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  isFieldInvalid(field: string): boolean {
    const control = this.contactForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  onSubmit(): void {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    // Simulate API call
    setTimeout(() => {
      console.log('Form submitted:', this.contactForm.value);
      this.isLoading = false;
      // Reset form after successful submission
      this.contactForm.reset();
    }, 1500);
  }
}
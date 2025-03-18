import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TopbarComponent } from './topbar/topbar.component';
import { SidebarComponent } from './sidebar/sidebar.component';

@Component({
  selector: 'app-instructor-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, TopbarComponent, SidebarComponent],
  template: `
    <!-- Main Layout -->
    <div class="relative min-h-screen bg-gray-100">
      <!-- Topbar (fixed) -->
      <app-topbar></app-topbar>
      
      <!-- Sidebar (fixed) -->
      <app-sidebar></app-sidebar>
      
      <!-- Main Content (with margin for sidebar) -->
      <main class="ml-24 pt-16 min-h-screen">

       <!-- Background Image with Opacity -->
       <div class="absolute inset-0 z-0">
          <img src="/assets/bg.jpg" alt="background" class="w-full h-full object-cover opacity-10" />
        </div>
        <div class="p-6">
          <!-- Router outlet for child routes -->
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
  `
})
export class InstructorLayoutComponent {
  // No need for toggle functionality with this sidebar design
}
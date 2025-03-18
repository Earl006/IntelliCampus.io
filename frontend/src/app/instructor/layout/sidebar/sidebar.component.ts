import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';

interface NavItem {
  label: string;
  route: string;
  icon: string;
  badge?: number;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside class="fixed left-0 top-16 lg:top-16 bottom-0 bg-gray-900 w-24 
                flex flex-col items-center py-8 transition-all duration-200 shadow-lg z-10">
      <nav class="flex-1 w-full">
        <div class="flex flex-col items-center space-y-6">
          <ng-container *ngFor="let item of navItems">
            <a [routerLink]="item.route"
               routerLinkActive="text-blue-400 border-r-4 border-blue-500"
               class="relative flex flex-col items-center w-full px-2 py-3 text-gray-400
                      hover:text-blue-400 transition-colors group">
              <div class="w-6 h-6" [innerHTML]="getSafeHtml(item.icon)"></div>
              <span class="text-xs mt-1 text-center">{{ item.label }}</span>
              <span *ngIf="item.badge && item.badge > 0"
                    class="absolute -top-0 -right-0 bg-blue-500 text-white text-xs font-bold
                           px-1.5 py-0.5 rounded-full">
                {{ item.badge }}
              </span>
            </a>
          </ng-container>
        </div>
      </nav>
    </aside>
  `,
  styles: [`
    :host {
      display: block;
    }
    
    .router-link-active {
      @apply bg-gray-800;
    }
  `]
})
export class SidebarComponent {
  constructor(private sanitizer: DomSanitizer) {}

  navItems: NavItem[] = [
    {
      label: 'Dashboard',
      route: '/instructor/dashboard',
      icon: `<svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                     d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
             </svg>`
    },
    {
      label: 'Courses',
      route: '/instructor/courses',
      icon: `<svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                     d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
             </svg>`
    },
    {
      label: 'Students',
      route: '/instructor/students',
      icon: `<svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                     d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
             </svg>`
    },
    {
      label: 'Assessments',
      route: '/instructor/assessments',
      icon: `<svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                     d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
             </svg>`
    },
    {
      label: 'Announcements',
      route: '/instructor/announcements',
      icon: `<svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                     d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
             </svg>`
    },
    {
      label: 'Analytics',
      route: '/instructor/analytics',
      icon: `<svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                     d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
             </svg>`
    },
    {
      label: 'Messages',
      route: '/instructor/messages',
      icon: `<svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                     d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
             </svg>`,
      badge: 2  // Example notification count
    }
  ];

  getSafeHtml(svg: string) {
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }
}
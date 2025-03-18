import { FooterComponent } from './../footer/footer.component';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { trigger, transition, style, animate, state } from '@angular/animations';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserModule } from '@angular/platform-browser';
import { NavbarComponent } from "../navbar/navbar.component";

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterModule, FooterComponent, NavbarComponent],
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('600ms cubic-bezier(0.35, 0, 0.25, 1)', 
          style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('scaleIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.95)' }),
        animate('400ms cubic-bezier(0.35, 0, 0.25, 1)', 
          style({ opacity: 1, transform: 'scale(1)' }))
      ])
    ])
  ],
  template: `
  <app-navbar></app-navbar>
    <!-- Modern Banner Section -->
    <section class="relative min-h-[80vh] flex items-center bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900">
      <!-- Animated Background Pattern -->
      <div class="absolute inset-0 overflow-hidden">
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgb(51,65,85,0.1)_1px,transparent_0)] bg-[size:24px_24px]"></div>
        <div class="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-500/10 animate-gradient"></div>
      </div>
      
      <div class="container mx-auto px-4 mt-16 relative z-10" @fadeInUp>
        <div class="max-w-5xl mx-auto">
          <div class="text-center">
            <div class="inline-flex items-center px-6 py-2 mb-6 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
              <span class="text-gray-300 text-sm font-medium tracking-wider">WELCOME TO THE FUTURE OF LEARNING</span>
            </div>
            
            <h1 class="text-5xl md:text-6xl lg:text-7xl mb-6 font-bold text-white leading-tight tracking-tight">
              Where Knowledge Meets
              <span class="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 text-transparent bg-clip-text">
                Opportunity
              </span>
            </h1>
            
            <p class="text-xl text-gray-300 leading-relaxed max-w-3xl mx-auto font-light">
              Connect with expert instructors, access quality courses, and advance your career. Your journey to success starts here with personalized learning experiences.
            </p>
            
            <div class="flex justify-center gap-6 pt-8">
              <a href="/auth/register"
                 class="px-8 py-4 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-all duration-300 font-medium shadow-lg shadow-white/10 hover:-translate-y-1">
                Start Learning
              </a>
              <a href="/courses" 
                 class="px-8 py-4 border border-white/30 text-white rounded-lg hover:bg-white/10 transition-all duration-300">
                Browse Courses
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- Wave Separator -->
      <div class="absolute bottom-0 left-0 right-0 text-white overflow-hidden">
        <svg class="w-full h-24" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path 
            fill="currentColor" 
            fill-opacity="1" 
            d="M0,192L34.3,186.7C68.6,181,137,171,206,186.7C274.3,203,343,245,411,245.3C480,245,549,203,617,197.3C685.7,192,754,224,823,240C891.4,256,960,256,1029,234.7C1097.1,213,1166,171,1234,154.7C1302.9,139,1371,149,1406,154.7L1440,160L1440,320L1405.7,320C1371.4,320,1303,320,1234,320C1165.7,320,1097,320,1029,320C960,320,891,320,823,320C754.3,320,686,320,617,320C548.6,320,480,320,411,320C342.9,320,274,320,206,320C137.1,320,69,320,34,320L0,320Z"
          >
            <animate
              attributeName="d"
              dur="10s"
              repeatCount="indefinite"
              values="
                M0,192L34.3,186.7C68.6,181,137,171,206,186.7C274.3,203,343,245,411,245.3C480,245,549,203,617,197.3C685.7,192,754,224,823,240C891.4,256,960,256,1029,234.7C1097.1,213,1166,171,1234,154.7C1302.9,139,1371,149,1406,154.7L1440,160L1440,320L1405.7,320C1371.4,320,1303,320,1234,320C1165.7,320,1097,320,1029,320C960,320,891,320,823,320C754.3,320,686,320,617,320C548.6,320,480,320,411,320C342.9,320,274,320,206,320C137.1,320,69,320,34,320L0,320Z;
                M0,160L34.3,165.3C68.6,171,137,181,206,197.3C274.3,213,343,235,411,229.3C480,224,549,192,617,181.3C685.7,171,754,181,823,192C891.4,203,960,213,1029,202.7C1097.1,192,1166,160,1234,160C1302.9,160,1371,192,1406,208L1440,224L1440,320L1405.7,320C1371.4,320,1303,320,1234,320C1165.7,320,1097,320,1029,320C960,320,891,320,823,320C754.3,320,686,320,617,320C548.6,320,480,320,411,320C342.9,320,274,320,206,320C137.1,320,69,320,34,320L0,320Z;
                M0,192L34.3,186.7C68.6,181,137,171,206,186.7C274.3,203,343,245,411,245.3C480,245,549,203,617,197.3C685.7,192,754,224,823,240C891.4,256,960,256,1029,234.7C1097.1,213,1166,171,1234,154.7C1302.9,139,1371,149,1406,154.7L1440,160L1440,320L1405.7,320C1371.4,320,1303,320,1234,320C1165.7,320,1097,320,1029,320C960,320,891,320,823,320C754.3,320,686,320,617,320C548.6,320,480,320,411,320C342.9,320,274,320,206,320C137.1,320,69,320,34,320L0,320Z"
            />
          </path>
          <path 
            fill="currentColor" 
            fill-opacity="0.3" 
            d="M0,224L34.3,213.3C68.6,203,137,181,206,192C274.3,203,343,245,411,261.3C480,277,549,267,617,234.7C685.7,203,754,149,823,144C891.4,139,960,181,1029,213.3C1097.1,245,1166,267,1234,277.3C1302.9,288,1371,288,1406,288L1440,288L1440,320L1405.7,320C1371.4,320,1303,320,1234,320C1165.7,320,1097,320,1029,320C960,320,891,320,823,320C754.3,320,686,320,617,320C548.6,320,480,320,411,320C342.9,320,274,320,206,320C137.1,320,69,320,34,320L0,320Z"
          >
            <animate
              attributeName="d"
              dur="8s"
              repeatCount="indefinite"
              values="
                M0,224L34.3,213.3C68.6,203,137,181,206,192C274.3,203,343,245,411,261.3C480,277,549,267,617,234.7C685.7,203,754,149,823,144C891.4,139,960,181,1029,213.3C1097.1,245,1166,267,1234,277.3C1302.9,288,1371,288,1406,288L1440,288L1440,320L1405.7,320C1371.4,320,1303,320,1234,320C1165.7,320,1097,320,1029,320C960,320,891,320,823,320C754.3,320,686,320,617,320C548.6,320,480,320,411,320C342.9,320,274,320,206,320C137.1,320,69,320,34,320L0,320Z;
                M0,288L34.3,261.3C68.6,235,137,181,206,170.7C274.3,160,343,192,411,213.3C480,235,549,245,617,229.3C685.7,213,754,171,823,170.7C891.4,171,960,213,1029,224C1097.1,235,1166,213,1234,202.7C1302.9,192,1371,192,1406,192L1440,192L1440,320L1405.7,320C1371.4,320,1303,320,1234,320C1165.7,320,1097,320,1029,320C960,320,891,320,823,320C754.3,320,686,320,617,320C548.6,320,480,320,411,320C342.9,320,274,320,206,320C137.1,320,69,320,34,320L0,320Z;
                M0,224L34.3,213.3C68.6,203,137,181,206,192C274.3,203,343,245,411,261.3C480,277,549,267,617,234.7C685.7,203,754,149,823,144C891.4,139,960,181,1029,213.3C1097.1,245,1166,267,1234,277.3C1302.9,288,1371,288,1406,288L1440,288L1440,320L1405.7,320C1371.4,320,1303,320,1234,320C1165.7,320,1097,320,1029,320C960,320,891,320,823,320C754.3,320,686,320,617,320C548.6,320,480,320,411,320C342.9,320,274,320,206,320C137.1,320,69,320,34,320L0,320Z"
            />
          </path>
        </svg>
      </div>
    </section>

    <!-- Stats Section with Glass Morphism -->
    <section class="py-20 bg-white relative">
      <div class="max-w-7xl mx-auto px-4" @fadeInUp>
        <div class="grid md:grid-cols-4 gap-8">
          <div class="group backdrop-blur-lg bg-gradient-to-br from-white/80 to-white/60 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
            <p class="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform">
              100+
            </p>
            <p class="text-gray-600">Partner Institutions</p>
          </div>
          
          <div class="group backdrop-blur-lg bg-gradient-to-br from-white/80 to-white/60 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
            <p class="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform">
              98%
            </p>
            <p class="text-gray-600">User Satisfaction</p>
          </div>
          
          <div class="group backdrop-blur-lg bg-gradient-to-br from-white/80 to-white/60 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
            <p class="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform">
              250+
            </p>
            <p class="text-gray-600">Digital Tools</p>
          </div>
          
          <div class="group backdrop-blur-lg bg-gradient-to-br from-white/80 to-white/60 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
            <p class="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform">
              75k+
            </p>
            <p class="text-gray-600">Active Users</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section with Modern Cards -->
    <section class="py-24 relative overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-b from-gray-50/50 to-white/80"></div>
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgb(51,65,85,0.05)_1px,transparent_0)] bg-[size:20px_20px]"></div>
      
      <div class="max-w-7xl mx-auto px-4 relative">
        <div class="text-center mb-16">
          <div class="inline-block bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2 rounded-full">
            <span class="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent font-medium">
              Our Features
            </span>
          </div>
          
          <h2 class="text-4xl font-bold text-gray-900 mt-6 mb-4">Why Choose IntelliCampus.io?</h2>
          <div class="h-1 w-24 mx-auto rounded-full bg-gradient-to-r from-blue-600 to-indigo-600"></div>
        </div>

        <div class="grid md:grid-cols-3 gap-8">
          <!-- Feature Cards with hover effects and animations -->
          <div class="group bg-white p-8 rounded-xl shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl border border-gray-100" @scaleIn>
            <div class="w-16 h-16 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <svg class="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold mb-4 group-hover:text-blue-600 transition-colors">
              Secure Integration
            </h3>
            <p class="text-gray-600 leading-relaxed">
              Enterprise-grade security with seamless integration into existing educational systems.
            </p>
          </div>

          <!-- Smart Learning -->
          <div class="group bg-white p-8 rounded-xl shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl border border-gray-100" @scaleIn>
            <div class="w-16 h-16 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <svg class="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold mb-4 group-hover:text-blue-600 transition-colors">
              Smart Learning
            </h3>
            <p class="text-gray-600 leading-relaxed">
              Access curated course materials, track progress, and learn at your own pace with our intuitive learning platform.
            </p>
          </div>

          <!-- Real-time Collaboration -->
          <div class="group bg-white p-8 rounded-xl shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl border border-gray-100" @scaleIn>
            <div class="w-16 h-16 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <svg class="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold mb-4 group-hover:text-blue-600 transition-colors">
              Real-time Collaboration
            </h3>
            <p class="text-gray-600 leading-relaxed">
              Engage in live discussions, join cohort chat rooms, and collaborate with peers and instructors in real-time.
            </p>
          </div>

          <!-- Instructor Growth -->
          <div class="group bg-white p-8 rounded-xl shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl border border-gray-100" @scaleIn>
            <div class="w-16 h-16 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <svg class="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold mb-4 group-hover:text-blue-600 transition-colors">
              Instructor Growth
            </h3>
            <p class="text-gray-600 leading-relaxed">
              Create and manage courses, build your teaching profile, and reach students globally with our instructor tools.
            </p>
          </div>

          <!-- Interactive Learning -->
          <div class="group bg-white p-8 rounded-xl shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl border border-gray-100" @scaleIn>
            <div class="w-16 h-16 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <svg class="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold mb-4 group-hover:text-blue-600 transition-colors">
              Interactive Learning
            </h3>
            <p class="text-gray-600 leading-relaxed">
              Participate in assessments, receive instant feedback, and track your learning progress with comprehensive analytics.
            </p>
          </div>

          <!-- Secure Platform -->
          <div class="group bg-white p-8 rounded-xl shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl border border-gray-100" @scaleIn>
            <div class="w-16 h-16 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <svg class="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold mb-4 group-hover:text-blue-600 transition-colors">
              Secure Platform
            </h3>
            <p class="text-gray-600 leading-relaxed">
              Enterprise-grade security with protected content delivery and secure payment processing for course enrollments.
            </p>
          </div>

          <!-- Community Learning -->
          <div class="group bg-white p-8 rounded-xl shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl border border-gray-100" @scaleIn>
            <div class="w-16 h-16 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <svg class="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold mb-4 group-hover:text-blue-600 transition-colors">
              Community Learning
            </h3>
            <p class="text-gray-600 leading-relaxed">
              Join a thriving community of learners and educators, share experiences, and grow together through collaborative learning.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Modern Call to Action -->
    <section class="py-24 relative overflow-hidden bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900">
      <div class="absolute inset-0">
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgb(255,255,255,0.1)_1px,transparent_0)] bg-[size:24px_24px]"></div>
      </div>
      
      <div class="max-w-7xl mx-auto px-4 relative">
        <div class="max-w-3xl mx-auto text-center">
          <h2 class="text-4xl font-bold text-white mb-6">Ready to Transform Your Institution?</h2>
          <p class="text-xl text-gray-300 mb-10">Join the future of educational technology today.</p>
          
          <a href="/auth/register" 
             class="inline-flex items-center px-8 py-4 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-all duration-300 group shadow-lg shadow-white/10 hover:-translate-y-1">
            <span class="text-lg font-medium">Get Started Today</span>
            <svg class="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </a>
        </div>
      </div>
    </section>
    <app-footer></app-footer>
  `,
  styles: [`
    @keyframes gradient {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    
    .animate-gradient {
      animation: gradient 15s ease infinite;
      background-size: 400% 400%;
    }
    
    :host {
      display: block;
    }
  `]
})
export class AboutComponent {}
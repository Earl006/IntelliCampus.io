import { LoginComponent } from './auth/login/login.component';
import { Routes } from '@angular/router';
import { SignupComponent } from './auth/signup/signup.component';
import { HeroComponent } from './learner/hero/hero.component';
import { AboutComponent } from './learner/about/about.component';
import { CoursesComponent } from './learner/courses/courses.component';
import { ContactComponent } from './learner/contact/contact.component';
import { CourseComponent } from './learner/course/course.component';
import { InstructorProfileComponent } from './learner/instructor-profile/instructor-profile.component';
import { ProfileComponent } from './auth/profile/profile.component';
import { MyCoursesComponent } from './learner/my-courses/my-courses.component';
import { DashboardComponent } from './instructor/dashboard/dashboard.component';
import { InstructorGuard } from './guards/instructor.guard';
import { InstructorLayoutComponent } from './instructor/layout/layout.component';

export const routes: Routes = [
    {path:'', component: HeroComponent},


    {
        path: 'auth',
        children: [
            {path: 'login', component: LoginComponent},
            {path: 'register', component: SignupComponent}
        ]
    },

    {path: 'about', component: AboutComponent},
    {path: 'courses', component:CoursesComponent},
    {path:'courses/:id', component:CourseComponent},
    {path:'contact', component:ContactComponent},
    {path:'instructor/:id', component:InstructorProfileComponent},
    {path:'profile', component:ProfileComponent},
    {path:'my-courses', component:MyCoursesComponent},

    {
        path: 'trainer',
        component: InstructorLayoutComponent,
        canActivate: [InstructorGuard],
        children: [
            { path: 'dashboard', component: DashboardComponent },
            // { 
            //     path: 'courses', 
            //     loadChildren: () => import('./instructor/courses/courses.routes')
            //         .then(mod => mod.COURSE_ROUTES)
            // },
            // { 
            //     path: 'students', 
            //     loadChildren: () => import('./instructor/students/students.routes')
            //         .then(mod => mod.STUDENT_ROUTES)
            // },
            // { 
            //     path: 'assessments', 
            //     loadChildren: () => import('./instructor/assessments/assessments.routes')
            //         .then(mod => mod.ASSESSMENT_ROUTES)
            // },
            // { 
            //     path: 'announcements', 
            //     loadChildren: () => import('./instructor/announcements/announcements.routes')
            //         .then(mod => mod.ANNOUNCEMENT_ROUTES)
            // },
            // { 
            //     path: 'analytics', 
            //     loadChildren: () => import('./instructor/analytics/analytics.routes')
            //         .then(mod => mod.ANALYTICS_ROUTES) 
            // },
            // {
            //     path: 'messages',
            //     loadChildren: () => import('./instructor/messages/messages.routes')
            //         .then(mod => mod.MESSAGE_ROUTES)
            // }
        ]
    }
];

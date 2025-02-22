import { LoginComponent } from './auth/login/login.component';
import { Routes } from '@angular/router';
import { SignupComponent } from './auth/signup/signup.component';
import { HeroComponent } from './learner/hero/hero.component';
import { AboutComponent } from './learner/about/about.component';
import { CoursesComponent } from './learner/courses/courses.component';
import { ContactComponent } from './learner/contact/contact.component';
import { CourseComponent } from './learner/course/course.component';
import { InstructorProfileComponent } from './learner/instructor-profile/instructor-profile.component';

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
    {path:'instructor/:id', component:InstructorProfileComponent}
];

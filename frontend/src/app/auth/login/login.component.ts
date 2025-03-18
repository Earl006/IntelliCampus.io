import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { jwtDecode } from 'jwt-decode';
import { FooterComponent } from "../../learner/footer/footer.component";
import { NavbarComponent } from "../../learner/navbar/navbar.component";

interface DecodedToken {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  exp: number;
}

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  standalone:true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, FooterComponent, NavbarComponent],
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  error: string | null = null;
  isLoading = false;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
    
    // Check if already logged in on component init
    this.checkLoggedInUser();
  }

  checkLoggedInUser(): void {
    const token = this.authService.getToken();

    if (token) {
      try {
        const decoded = jwtDecode<DecodedToken>(token);
        if (decoded.role === 'INSTRUCTOR') {
          this.router.navigate(['/instructor/dashboard']);
        } else {
          this.router.navigate(['/']);
        }
      } catch (error) {
        this.authService.logout();
      }
    }
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.error = null;
      
      this.authService.login(this.loginForm.value).subscribe({
        next: (res) => {
          console.log('Login successful');
          
          // Save token FIRST
          this.authService.saveToken(res.token);
          
          try {
            // Decode token to check role
            const decoded = jwtDecode<DecodedToken>(res.token);
            console.log('User role:', decoded.role);
            
            // IMPORTANT: Use setTimeout to ensure token is saved before redirection
            setTimeout(() => {
              if (decoded.role === 'INSTRUCTOR' || decoded.role === 'ADMIN') {
                console.log('Redirecting to instructor dashboard');
                this.router.navigateByUrl('/trainer/dashboard');
              } else {
                console.log('Redirecting to home');
                this.router.navigateByUrl('/');
              }
              this.isLoading = false;
            }, 100);
            
          } catch (error) {
            console.error('Token decode error:', error);
            this.router.navigateByUrl('/');
            this.isLoading = false;
          }
        },
        error: (err) => {
          console.error('Login error:', err);
          this.error = err.error?.message || 'Failed to login. Please try again.';
          this.isLoading = false;
        }
      });
    }
  }
}
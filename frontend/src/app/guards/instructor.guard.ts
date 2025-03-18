import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
  id: string;
  email: string;
  role: string;
  exp: number;
}

@Injectable({
  providedIn: 'root'
})
export class InstructorGuard implements CanActivate {
  
  constructor(private authService: AuthService, private router: Router) {}
  
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    console.log('InstructorGuard checking authorization...');
    const token = this.authService.getToken();
    
    if (!token) {
      console.log('No token found, redirecting to login');
      this.router.navigate(['/auth/login']);
      return false;
    }
    
    try {
      const decoded = jwtDecode<DecodedToken>(token);
      console.log('User role from token:', decoded.role);
      
      // Check expiration
      const currentTime = Date.now() / 1000;
      if (decoded.exp < currentTime) {
        console.log('Token expired, redirecting to login');
        this.authService.logout();
        this.router.navigate(['/auth/login']);
        return false;
      }
      
      // Check role
      if (decoded.role === 'INSTRUCTOR' || decoded.role === 'ADMIN') {
        console.log('User is instructor, allowing access');
        return true;
      } else {
        console.log('User is not instructor, redirecting to home');
        this.router.navigate(['/']);
        return false;
      }
    } catch (error) {
      console.error('Error decoding token:', error);
      this.authService.logout();
      this.router.navigate(['/auth/login']);
      return false;
    }
  }
}
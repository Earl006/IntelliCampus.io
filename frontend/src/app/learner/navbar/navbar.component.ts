import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit {
  isLoggedIn = false;
  userInitials = '';
  showDropdown = false;
  isMenuOpen = false;
  isSearchOpen = false;

  // constructor(private authService: AuthService) {}

  ngOnInit() {
    // this.authService.currentUser$.subscribe(user => {
    //   this.isLoggedIn = !!user;
    //   if (user) {
    //     this.userInitials = `${user.firstName[0]}${user.lastName[0]}`;
    //   }
    // });
  }

  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
  }

  logout() {
    // this.authService.logout();
  }
  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  toggleSearch() {
    this.isSearchOpen = !this.isSearchOpen;
  }
}
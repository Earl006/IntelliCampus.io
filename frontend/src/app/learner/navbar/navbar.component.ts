import { Component, OnInit, HostListener } from '@angular/core';
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
  userInitials = 'IC';
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

  closeDropdown() {
    this.showDropdown = false;
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

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    // if the click is outside the dropdown container, close it
    if (this.showDropdown && !target.closest('.dropdown-container')) {
      this.closeDropdown();
    }
  }
}
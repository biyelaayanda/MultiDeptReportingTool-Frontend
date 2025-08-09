import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from './core/services/auth.service';
import { User } from './core/models/user.model';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: true,
  imports: [
    RouterModule,
    CommonModule,
    FormsModule,
    HttpClientModule
  ]
})
export class AppComponent implements OnInit {
  title = 'MultiDeptReportingTool';
  currentUser: User | null = null;
  isLoading = true;

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) { }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.isLoading = false;
      
      // Handle initial navigation after authentication state is determined
      if (user && this.router.url === '/auth') {
        this.redirectToRoleDashboard(user.role);
      }
    });

    // Listen to route changes to handle navigation
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event) => {
      const navigationEnd = event as NavigationEnd;
      // If user is authenticated but on auth page, redirect to appropriate dashboard
      if (this.authService.isAuthenticated() && navigationEnd.url === '/auth') {
        const userRole = this.authService.getUserRole();
        if (userRole) {
          this.redirectToRoleDashboard(userRole);
        }
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth']);
  }

  isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  private redirectToRoleDashboard(role: string): void {
    switch (role.toLowerCase()) {
      case 'admin':
        this.router.navigate(['/dashboard']);
        break;
      case 'departmentlead':
      case 'department-lead':
        this.router.navigate(['/department-lead']);
        break;
      case 'executive':
        this.router.navigate(['/executive']);
        break;
      case 'staff':
        this.router.navigate(['/staff-user']);
        break;
      default:
        this.router.navigate(['/reporting']);
    }
  }
}

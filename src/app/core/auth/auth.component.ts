import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { LoginRequest } from '../models/user.model';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css']
})
export class AuthComponent implements OnInit {
  loginForm: LoginRequest = {
    username: '',
    password: '',
    role: ''
  };

  isLoading = false;
  error = '';

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) { }

  ngOnInit(): void {
    // If already authenticated, redirect to appropriate dashboard
    if (this.authService.isAuthenticated()) {
      this.redirectToRoleDashboard(this.authService.getUserRole()!);
    }
  }

  onSubmit(): void {
    if (!this.loginForm.username || !this.loginForm.password || !this.loginForm.role) {
      this.error = 'Please fill in all fields';
      return;
    }

    this.isLoading = true;
    this.error = '';

    this.authService.login(this.loginForm).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.redirectToRoleDashboard(response.role);
      },
      error: (error) => {
        this.isLoading = false;
        this.error = error.error?.message || 'Login failed. Please check your credentials.';
      }
    });
  }

  private redirectToRoleDashboard(role: string): void {
    switch (role) {
      case 'admin':
        this.router.navigate(['/dashboard']);
        break;
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
        this.router.navigate(['/dashboard']);
    }
  }

  goToRegister(): void {
    this.router.navigate(['/register']);
  }
}

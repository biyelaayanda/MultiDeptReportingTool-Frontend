import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { LoginRequest } from '../models/user.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css']
})
export class AuthComponent implements OnInit, OnDestroy {
  loginForm: LoginRequest = {
    username: '',
    password: ''
  };

  isLoading = false;
  error = '';
  private authSubscription?: Subscription;

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) { }

  ngOnInit(): void {
    console.log('AuthComponent ngOnInit - checking authentication');
    
    // If already authenticated, redirect to appropriate dashboard immediately
    if (this.authService.isAuthenticated()) {
      const userRole = this.authService.getUserRole();
      console.log('Already authenticated with role:', userRole);
      if (userRole) {
        this.redirectToRoleDashboard(userRole);
        return;
      }
    }

    // Subscribe to authentication changes
    this.authSubscription = this.authService.currentUser$.subscribe(user => {
      console.log('AuthService currentUser$ subscription triggered:', user);
      if (user) {
        this.redirectToRoleDashboard(user.role);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  onSubmit(): void {
    if (!this.loginForm.username || !this.loginForm.password) {
      this.error = 'Please fill in username and password';
      return;
    }

    this.isLoading = true;
    this.error = '';

    // Remove role requirement from login form
    const loginRequest = {
      username: this.loginForm.username,
      password: this.loginForm.password
    };

    this.authService.login(loginRequest).subscribe({
      next: (response) => {
        console.log('Login successful:', response);
        this.isLoading = false;
        // Navigation will be handled by the subscription in ngOnInit
      },
      error: (error) => {
        console.error('Login error:', error);
        this.isLoading = false;
        this.error = error.error?.message || 'Login failed. Please check your credentials.';
      }
    });
  }

  private redirectToRoleDashboard(role: string): void {
    console.log('User role:', role, 'Redirecting to appropriate dashboard');
    const route = this.authService.getDefaultRouteForRole();
    console.log('Redirecting to:', route);
    this.router.navigate([route]);
  }

  goToRegister(): void {
    this.router.navigate(['/register']);
  }
}

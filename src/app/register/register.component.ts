import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../core/services/auth.service';
import { RegisterRequest } from '../core/models/user.model';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent implements OnInit {
  registerForm: RegisterRequest = {
    username: '',
    email: '',
    password: '',
    role: '',
    department: ''
  };

  confirmPassword = '';
  isLoading = false;
  error = '';
  success = '';

  // Department options based on role
  departmentOptions: { [key: string]: string[] } = {
    'admin': ['IT', 'Management', 'Operations'],
    'department-lead': ['Sales', 'Marketing', 'Operations', 'Finance', 'HR'],
    'executive': ['Management', 'Strategy', 'Operations'],
    'staff': ['Sales', 'Marketing', 'Operations', 'Finance', 'HR', 'IT', 'Support']
  };

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

  onRoleChange(): void {
    // Reset department when role changes
    this.registerForm.department = '';
  }

  getDepartmentOptions(): string[] {
    return this.departmentOptions[this.registerForm.role] || [];
  }

  onSubmit(): void {
    this.error = '';
    this.success = '';

    // Validation
    if (!this.registerForm.username || !this.registerForm.email || 
        !this.registerForm.password || !this.registerForm.role || 
        !this.registerForm.department) {
      this.error = 'Please fill in all fields';
      return;
    }

    if (this.registerForm.password !== this.confirmPassword) {
      this.error = 'Passwords do not match';
      return;
    }

    if (this.registerForm.password.length < 6) {
      this.error = 'Password must be at least 6 characters long';
      return;
    }

    if (!this.isValidEmail(this.registerForm.email)) {
      this.error = 'Please enter a valid email address';
      return;
    }

    this.isLoading = true;

    this.authService.register(this.registerForm).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.success = 'Registration successful! You can now login with your credentials.';
        this.resetForm();
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          this.router.navigate(['/auth']);
        }, 2000);
      },
      error: (error) => {
        this.isLoading = false;
        this.error = error.error?.message || 'Registration failed. Please try again.';
      }
    });
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private resetForm(): void {
    this.registerForm = {
      username: '',
      email: '',
      password: '',
      role: '',
      department: ''
    };
    this.confirmPassword = '';
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

  goToLogin(): void {
    this.router.navigate(['/auth']);
  }
}

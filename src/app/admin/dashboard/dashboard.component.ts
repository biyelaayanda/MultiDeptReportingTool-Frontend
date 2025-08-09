import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule
  ]
})
export class DashboardComponent implements OnInit {
  
  // Dashboard metrics
  totalReports = 1247;
  activeUsers = 89;
  departments = 5;
  aiInsights = 24;

  constructor() { }

  ngOnInit() {
    // Load dashboard data
    this.loadDashboardMetrics();
  }

  private loadDashboardMetrics(): void {
    // This would typically make API calls to get real data
    // For now, using mock data to show the dashboard structure
    console.log('Dashboard metrics loaded');
  }
}

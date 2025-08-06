import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../core/services/auth.service';
import { ExportService } from '../core/services/export.service';
import { environment } from '../../environments/environment';
import { ExportFormat } from '../core/models/export.model';

// Department Lead Dashboard Interfaces
interface DepartmentDashboardData {
  departmentName: string;
  totalReports: number;
  completedReports: number;
  pendingReports: number;
  overdueReports: number;
  completionRate: number;
  averageResponseTime: number;
  efficiency: number;
  currentPeriodMetrics: any;
  previousPeriodMetrics: any;
  trends: any[];
  topPerformers: any[];
  recentActivity: any[];
  upcomingDeadlines: any[];
  alerts: any[];
  lastUpdated?: Date;
}

interface DepartmentAnalytics {
  departmentName: string;
  metrics: any[];
  trends: any[];
  kpis: any[];
  predictions: any[];
  benchmarks: any[];
}

interface DepartmentReport {
  id: number;
  title: string;
  status: string;
  dueDate: Date;
  assignedTo: string;
  priority: string;
  completionPercentage: number;
  lastUpdate: Date;
}

@Component({
  selector: 'app-department-lead',
  templateUrl: './department-lead.component.html',
  styleUrls: ['./department-lead.component.css']
})
export class DepartmentLeadComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  // Core Data
  dashboardData: DepartmentDashboardData | null = null;
  analyticsData: DepartmentAnalytics | null = null;
  reportsData: DepartmentReport[] = [];
  
  // User Info
  currentUser: any = null;
  userDepartment: string = '';
  
  // UI State
  isLoading = true;
  error: string | null = null;
  selectedTimeframe = '30d';
  selectedView = 'overview'; // overview, reports, analytics, team
  
  // Charts
  performanceChart: any = null;
  trendsChart: any = null;
  reportsStatusChart: any = null;
  
  // Export
  isExporting = false;
  exportingFormat = '';
  exportNotification: { type: 'success' | 'error' | 'info', message: string } | null = null;
  
  // Pagination for reports
  currentPage = 1;
  pageSize = 10;
  totalReports = 0;
  
  // Filters
  reportStatusFilter = 'all';
  reportPriorityFilter = 'all';
  
  // Enums for template
  ExportFormat = ExportFormat;
  readonly ExportFormats = ExportFormat;
  Math = Math; // For template access

  constructor(
    private readonly http: HttpClient,
    private readonly authService: AuthService,
    private readonly exportService: ExportService
  ) { }

  ngOnInit(): void {
    this.getCurrentUser();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getCurrentUser() {
    this.currentUser = this.authService.getCurrentUser();
    if (this.currentUser?.department) {
      this.userDepartment = this.currentUser.department;
      this.loadDashboardData();
    } else {
      // Fallback: determine department from token or ask user
      this.determineDepartment();
    }
  }

  determineDepartment() {
    // For development: use IT as default
    // In production, this should come from user profile/JWT token
    this.userDepartment = 'IT'; // Default for testing
    this.loadDashboardData();
  }

  loadDashboardData() {
    this.isLoading = true;
    this.error = null;

    const { startDate, endDate } = this.calculateDateRange();
    
    // Load dashboard, analytics, and reports data in parallel
    const dashboard$ = this.http.get(`${environment.apiUrl}/api/${this.userDepartment}/dashboard`);
    const analytics$ = this.http.get(`${environment.apiUrl}/api/${this.userDepartment}/analytics`, {
      params: {
        fromDate: startDate.toISOString(),
        toDate: endDate.toISOString()
      }
    });
    const reports$ = this.http.get(`${environment.apiUrl}/api/${this.userDepartment}/reports`, {
      params: {
        page: this.currentPage.toString(),
        pageSize: this.pageSize.toString(),
        status: this.reportStatusFilter !== 'all' ? this.reportStatusFilter : ''
      }
    });

    forkJoin({
      dashboard: dashboard$,
      analytics: analytics$,
      reports: reports$
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (responses) => {
        console.log('Department data loaded:', responses);
        this.processDashboardData(responses.dashboard);
        this.processAnalyticsData(responses.analytics);
        this.processReportsData(responses.reports);
        this.createCharts();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading department data:', err);
        this.error = 'Failed to load department dashboard data';
        this.isLoading = false;
        
        // Load mock data as fallback
        this.loadMockData();
      }
    });
  }

  processDashboardData(data: any) {
    console.log('Processing dashboard data:', data);
    this.dashboardData = {
      departmentName: this.userDepartment,
      totalReports: data.totalReports || 15,
      completedReports: data.completedReports || 10,
      pendingReports: data.pendingReports || 3,
      overdueReports: data.overdueReports || 2,
      completionRate: data.completionRate || 66.7,
      averageResponseTime: data.averageResponseTime || 4.2,
      efficiency: data.efficiency || 78.5,
      currentPeriodMetrics: data.currentPeriodMetrics || {},
      previousPeriodMetrics: data.previousPeriodMetrics || {},
      trends: data.trends || [],
      topPerformers: data.topPerformers || [],
      recentActivity: data.recentActivity || [],
      upcomingDeadlines: data.upcomingDeadlines || [],
      alerts: data.alerts || []
    };
  }

  processAnalyticsData(data: any) {
    console.log('Processing analytics data:', data);
    this.analyticsData = {
      departmentName: this.userDepartment,
      metrics: data.metrics || [],
      trends: data.trends || [],
      kpis: data.kpis || [],
      predictions: data.predictions || [],
      benchmarks: data.benchmarks || []
    };
  }

  processReportsData(data: any) {
    console.log('Processing reports data:', data);
    this.reportsData = data.reports || data || [];
    this.totalReports = data.totalCount || this.reportsData.length;
  }

  loadMockData() {
    // Mock data for development and fallback
    this.dashboardData = {
      departmentName: this.userDepartment,
      totalReports: 15,
      completedReports: 10,
      pendingReports: 3,
      overdueReports: 2,
      completionRate: 66.7,
      averageResponseTime: 4.2,
      efficiency: 78.5,
      currentPeriodMetrics: {
        reportsCompleted: 10,
        avgCompletionTime: 4.2,
        qualityScore: 85.3
      },
      previousPeriodMetrics: {
        reportsCompleted: 8,
        avgCompletionTime: 5.1,
        qualityScore: 82.1
      },
      trends: [
        { metric: 'Completion Rate', value: 66.7, change: 8.3, direction: 'up' },
        { metric: 'Response Time', value: 4.2, change: -17.6, direction: 'down' },
        { metric: 'Quality Score', value: 85.3, change: 3.9, direction: 'up' }
      ],
      topPerformers: [
        { name: 'John Smith', completedReports: 5, efficiency: 92.3 },
        { name: 'Sarah Johnson', completedReports: 3, efficiency: 88.7 },
        { name: 'Mike Wilson', completedReports: 2, efficiency: 85.1 }
      ],
      recentActivity: [
        { type: 'report_completed', message: 'Monthly IT Report completed by John Smith', time: '2 hours ago' },
        { type: 'deadline_approaching', message: 'Security Audit Report due in 3 days', time: '4 hours ago' },
        { type: 'report_assigned', message: 'Infrastructure Review assigned to Sarah Johnson', time: '1 day ago' }
      ],
      upcomingDeadlines: [
        { reportTitle: 'Security Audit Report', dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), assignee: 'Mike Wilson' },
        { reportTitle: 'Infrastructure Review', dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), assignee: 'Sarah Johnson' }
      ],
      alerts: [
        { type: 'warning', message: '2 reports are overdue', severity: 'medium' },
        { type: 'info', message: 'Team efficiency improved by 8.3%', severity: 'low' }
      ]
    };

    this.analyticsData = {
      departmentName: this.userDepartment,
      metrics: [
        { name: 'Efficiency Score', value: 78.5, target: 85, unit: '%' },
        { name: 'Quality Rating', value: 85.3, target: 90, unit: '%' },
        { name: 'Response Time', value: 4.2, target: 3.5, unit: 'days' }
      ],
      trends: [
        { period: 'Week 1', efficiency: 75, quality: 82, responseTime: 5.1 },
        { period: 'Week 2', efficiency: 77, quality: 84, responseTime: 4.8 },
        { period: 'Week 3', efficiency: 76, quality: 83, responseTime: 4.5 },
        { period: 'Week 4', efficiency: 78.5, quality: 85.3, responseTime: 4.2 }
      ],
      kpis: [],
      predictions: [],
      benchmarks: []
    };

    this.reportsData = [
      {
        id: 1,
        title: 'Monthly IT Security Report',
        status: 'In Progress',
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        assignedTo: 'John Smith',
        priority: 'High',
        completionPercentage: 75,
        lastUpdate: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },
      {
        id: 2,
        title: 'Infrastructure Review Q4',
        status: 'Pending',
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        assignedTo: 'Sarah Johnson',
        priority: 'Medium',
        completionPercentage: 25,
        lastUpdate: new Date(Date.now() - 24 * 60 * 60 * 1000)
      },
      {
        id: 3,
        title: 'Network Performance Analysis',
        status: 'Completed',
        dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        assignedTo: 'Mike Wilson',
        priority: 'Low',
        completionPercentage: 100,
        lastUpdate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      }
    ];

    this.createCharts();
    this.isLoading = false;
  }

  createCharts() {
    if (!this.dashboardData || !this.analyticsData) return;

    // Reports Status Chart
    this.reportsStatusChart = {
      type: 'doughnut',
      data: {
        labels: ['Completed', 'In Progress', 'Overdue'],
        datasets: [{
          data: [
            this.dashboardData.completedReports,
            this.dashboardData.pendingReports,
            this.dashboardData.overdueReports
          ],
          backgroundColor: ['#28a745', '#ffc107', '#dc3545'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    };

    // Performance Trends Chart
    this.trendsChart = {
      type: 'line',
      data: {
        labels: this.analyticsData.trends.map(t => t.period),
        datasets: [
          {
            label: 'Efficiency (%)',
            data: this.analyticsData.trends.map(t => t.efficiency),
            borderColor: '#007bff',
            backgroundColor: 'rgba(0, 123, 255, 0.1)',
            tension: 0.4
          },
          {
            label: 'Quality (%)',
            data: this.analyticsData.trends.map(t => t.quality),
            borderColor: '#28a745',
            backgroundColor: 'rgba(40, 167, 69, 0.1)',
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            max: 100
          }
        }
      }
    };

    // Department Performance Chart
    this.performanceChart = {
      type: 'bar',
      data: {
        labels: this.analyticsData.metrics.map(m => m.name),
        datasets: [{
          label: 'Current Value',
          data: this.analyticsData.metrics.map(m => m.value),
          backgroundColor: '#007bff'
        }, {
          label: 'Target',
          data: this.analyticsData.metrics.map(m => m.target),
          backgroundColor: '#28a745'
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    };
  }

  onTimeframeChange() {
    this.loadDashboardData();
  }

  onViewChange(view: string) {
    this.selectedView = view;
  }

  onReportStatusFilterChange() {
    this.currentPage = 1; // Reset to first page
    this.loadDashboardData();
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.loadDashboardData();
  }

  private calculateDateRange(): { startDate: Date, endDate: Date } {
    const endDate = new Date();
    const startDate = new Date();

    switch (this.selectedTimeframe) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    return { startDate, endDate };
  }

  exportDashboard(format: ExportFormat) {
    this.isExporting = true;
    this.exportingFormat = this.getFormatDisplayName(format);
    this.showNotification('info', `Preparing ${this.exportingFormat} export...`);

    const { startDate, endDate } = this.calculateDateRange();

    const exportRequest = {
      ReportType: 'department-dashboard',
      Format: format.toLowerCase(),
      StartDate: startDate.toISOString(),
      EndDate: endDate.toISOString(),
      Departments: [this.userDepartment],
      IncludeFields: [],
      IncludeCharts: true,
      IncludeSummary: true,
      FileName: `${this.userDepartment.toLowerCase()}-dashboard-${new Date().toISOString().split('T')[0]}.${format.toLowerCase()}`,
      CustomFilters: {
        department: this.userDepartment,
        timeframe: this.selectedTimeframe
      }
    };

    this.http.post(`${environment.apiUrl}/api/export/generate`, exportRequest, {
      responseType: 'blob'
    }).subscribe({
      next: (blob: Blob) => {
        if (blob && blob.size > 0) {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = exportRequest.FileName;
          a.click();
          window.URL.revokeObjectURL(url);
          this.showNotification('success', `${this.exportingFormat} export completed successfully!`);
        } else {
          this.showNotification('error', 'Export failed: Empty file received');
        }
        this.isExporting = false;
        this.exportingFormat = '';
      },
      error: (err) => {
        console.error('Export failed:', err);
        this.showNotification('error', `${this.exportingFormat} export failed. Please try again.`);
        this.isExporting = false;
        this.exportingFormat = '';
      }
    });
  }

  refreshDashboard() {
    this.loadDashboardData();
  }

  getStatusBadgeClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'completed': return 'badge bg-success';
      case 'in progress': return 'badge bg-warning';
      case 'pending': return 'badge bg-info';
      case 'overdue': return 'badge bg-danger';
      default: return 'badge bg-secondary';
    }
  }

  getPriorityBadgeClass(priority: string): string {
    switch (priority.toLowerCase()) {
      case 'high': return 'badge bg-danger';
      case 'medium': return 'badge bg-warning';
      case 'low': return 'badge bg-success';
      default: return 'badge bg-secondary';
    }
  }

  getChangeIcon(direction: string): string {
    switch (direction) {
      case 'up': return 'fas fa-arrow-up text-success';
      case 'down': return 'fas fa-arrow-down text-danger';
      default: return 'fas fa-minus text-secondary';
    }
  }

  showNotification(type: 'success' | 'error' | 'info', message: string) {
    this.exportNotification = { type, message };
    
    if (type === 'success' || type === 'info') {
      setTimeout(() => {
        this.clearNotification();
      }, 5000);
    }
  }

  clearNotification() {
    this.exportNotification = null;
  }

  getFormatDisplayName(format: ExportFormat): string {
    switch (format) {
      case ExportFormat.PDF:
        return 'PDF';
      case ExportFormat.CSV:
        return 'CSV';
      case ExportFormat.JSON:
        return 'JSON';
      case ExportFormat.PowerPoint:
        return 'PowerPoint';
      default:
        return 'PDF';
    }
  }

  isOverdue(dueDate: Date): boolean {
    const today = new Date();
    const due = new Date(dueDate);
    return due < today;
  }
}

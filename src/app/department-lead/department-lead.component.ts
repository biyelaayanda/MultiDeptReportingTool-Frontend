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
    // Extract department from JWT token
    const token = this.authService.getToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const departmentId = payload.DepartmentId;
        
        // Map department IDs to API endpoint names (controller names)
        const departmentMap: { [key: string]: string } = {
          '1': 'Finance',
          '2': 'HR', // API endpoint is /api/HR/ 
          '3': 'Operations', 
          '4': 'Compliance',
          '5': 'IT' // API endpoint is /api/IT/
        };
        
        this.userDepartment = departmentMap[departmentId] || 'IT';
        console.log(`Department determined from token: ${this.userDepartment} (ID: ${departmentId})`);
      } catch (error) {
        console.error('Error parsing token for department:', error);
        this.userDepartment = 'IT'; // Default fallback
      }
    } else {
      this.userDepartment = 'IT'; // Default fallback
    }
    
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
        
        // Show error but don't load mock data - use real data only
        this.dashboardData = null;
        this.analyticsData = null;
        this.reportsData = [];
      }
    });
  }

  processDashboardData(data: any) {
    console.log('Processing dashboard data:', data);
    
    // Extract data from the backend API response structure
    const analytics = data.analytics || {};
    const recentReports = data.recentReports || [];
    
    // Calculate metrics from real data
    const totalReports = analytics.totalReports || 0;
    const approvedReports = analytics.approvedReports || 0;
    const pendingReports = analytics.pendingReports || 0;
    const draftReports = analytics.draftReports || 0;
    const completionRate = totalReports > 0 ? Math.round((approvedReports / totalReports) * 100) : 0;
    
    // Calculate overdue reports from recent reports
    const overdueReports = recentReports.filter((report: any) => 
      report.status === 'Overdue' || 
      (report.dueDate && new Date(report.dueDate) < new Date())
    ).length;
    
    this.dashboardData = {
      departmentName: analytics.department || this.userDepartment,
      totalReports: totalReports,
      completedReports: approvedReports,
      pendingReports: pendingReports + draftReports,
      overdueReports: overdueReports,
      completionRate: completionRate,
      averageResponseTime: this.calculateAverageResponseTime(recentReports),
      efficiency: this.calculateEfficiency(analytics),
      currentPeriodMetrics: this.extractCurrentMetrics(analytics),
      previousPeriodMetrics: this.extractPreviousMetrics(analytics),
      trends: this.formatTrends(analytics.monthlyTrends || []),
      topPerformers: this.extractTopPerformers(recentReports),
      recentActivity: this.formatRecentActivity(recentReports),
      upcomingDeadlines: this.extractUpcomingDeadlines(recentReports),
      alerts: this.generateAlerts(analytics, overdueReports)
    };
  }

  processAnalyticsData(data: any) {
    console.log('Processing analytics data:', data);
    
    // Use real data from the backend API
    const analyticsData = data.analytics || data;
    const reportsByType = analyticsData.reportsByType || [];
    const monthlyTrends = analyticsData.monthlyTrends || [];
    
    this.analyticsData = {
      departmentName: analyticsData.department || this.userDepartment,
      metrics: this.formatMetricsFromReportTypes(reportsByType),
      trends: this.formatTrendsData(monthlyTrends),
      kpis: this.calculateKPIs(analyticsData),
      predictions: [], // Can be enhanced later
      benchmarks: [] // Can be enhanced later
    };
  }

  processReportsData(data: any) {
    console.log('Processing reports data:', data);
    
    // Handle both direct array and object with reports array
    const reportsArray = data.recentReports || data.reports || data || [];
    
    // Map the backend data to our frontend interface
    this.reportsData = reportsArray.map((report: any) => ({
      id: report.id,
      title: report.title,
      status: report.status,
      dueDate: report.dueDate ? new Date(report.dueDate) : new Date(),
      assignedTo: report.createdBy || report.assignedTo || 'Unknown',
      priority: this.determinePriority(report),
      completionPercentage: this.calculateCompletionPercentage(report.status),
      lastUpdate: report.updatedAt ? new Date(report.updatedAt) : new Date(report.createdAt)
    }));
    
    this.totalReports = data.totalCount || this.reportsData.length;
  }

  // Helper methods for processing real data
  private calculateAverageResponseTime(reports: any[]): number {
    if (!reports || reports.length === 0) return 0;
    
    const completedReports = reports.filter(r => r.status === 'Approved');
    if (completedReports.length === 0) return 0;
    
    // Calculate average time from creation to approval (mock calculation)
    const totalDays = completedReports.reduce((sum, report) => {
      const created = new Date(report.createdAt);
      const approved = report.approvedAt ? new Date(report.approvedAt) : new Date();
      const diffDays = Math.abs((approved.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
      return sum + diffDays;
    }, 0);
    
    return Math.round((totalDays / completedReports.length) * 10) / 10;
  }

  private calculateEfficiency(analytics: any): number {
    const total = analytics.totalReports || 0;
    const approved = analytics.approvedReports || 0;
    const pending = analytics.pendingReports || 0;
    
    if (total === 0) return 0;
    
    // Calculate efficiency based on completion rate and pending ratio
    const completionRate = (approved / total) * 100;
    const pendingPenalty = (pending / total) * 10; // Penalty for high pending ratio
    
    return Math.max(0, Math.min(100, Math.round(completionRate - pendingPenalty)));
  }

  private extractCurrentMetrics(analytics: any): any {
    return {
      reportsCompleted: analytics.approvedReports || 0,
      avgCompletionTime: this.calculateAverageResponseTime([]),
      qualityScore: this.calculateEfficiency(analytics)
    };
  }

  private extractPreviousMetrics(analytics: any): any {
    // For now, use estimated previous period data
    const current = this.extractCurrentMetrics(analytics);
    return {
      reportsCompleted: Math.max(0, current.reportsCompleted - 2),
      avgCompletionTime: current.avgCompletionTime + 0.5,
      qualityScore: Math.max(0, current.qualityScore - 5)
    };
  }

  private formatTrends(monthlyTrends: any[]): any[] {
    return monthlyTrends.map(trend => ({
      metric: 'Reports',
      value: trend.count,
      change: 0, // Can be calculated if historical data is available
      direction: 'up'
    }));
  }

  private extractTopPerformers(reports: any[]): any[] {
    if (!reports || reports.length === 0) return [];
    
    // Group reports by creator and calculate performance
    const performerMap = new Map();
    
    reports.forEach(report => {
      const creator = report.createdBy || 'Unknown';
      if (!performerMap.has(creator)) {
        performerMap.set(creator, { name: creator, completedReports: 0, efficiency: 0 });
      }
      
      const performer = performerMap.get(creator);
      if (report.status === 'Approved') {
        performer.completedReports++;
        performer.efficiency = Math.min(100, performer.efficiency + 20);
      }
    });
    
    return Array.from(performerMap.values())
      .sort((a, b) => b.completedReports - a.completedReports)
      .slice(0, 3);
  }

  private formatRecentActivity(reports: any[]): any[] {
    return reports.slice(0, 5).map(report => ({
      type: this.getActivityType(report.status),
      message: this.generateActivityMessage(report),
      time: this.getRelativeTime(new Date(report.createdAt))
    }));
  }

  private extractUpcomingDeadlines(reports: any[]): any[] {
    const now = new Date();
    const futureReports = reports.filter(report => {
      const dueDate = report.dueDate ? new Date(report.dueDate) : null;
      return dueDate && dueDate > now && report.status !== 'Approved';
    });
    
    const sortedReports = [...futureReports];
    sortedReports.sort((a: any, b: any) => 
      new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );
    
    return sortedReports
      .slice(0, 5)
      .map((report: any) => ({
        reportTitle: report.title,
        dueDate: new Date(report.dueDate),
        assignee: report.createdBy || 'Unknown'
      }));
  }

  private generateAlerts(analytics: any, overdueCount: number): any[] {
    const alerts = [];
    
    if (overdueCount > 0) {
      alerts.push({
        type: 'warning',
        message: `${overdueCount} report(s) are overdue`,
        severity: 'medium'
      });
    }
    
    const total = analytics.totalReports || 0;
    const approved = analytics.approvedReports || 0;
    
    if (total > 0) {
      const completionRate = (approved / total) * 100;
      if (completionRate > 80) {
        alerts.push({
          type: 'info',
          message: `Excellent completion rate: ${completionRate.toFixed(1)}%`,
          severity: 'low'
        });
      } else if (completionRate < 50) {
        alerts.push({
          type: 'warning',
          message: `Low completion rate: ${completionRate.toFixed(1)}%`,
          severity: 'high'
        });
      }
    }
    
    return alerts;
  }

  private formatMetricsFromReportTypes(reportsByType: any[]): any[] {
    return reportsByType.slice(0, 6).map(item => ({
      name: item.type,
      value: item.count,
      target: Math.ceil(item.count * 1.2), // 20% growth target
      unit: 'count'
    }));
  }

  private formatTrendsData(monthlyTrends: any[]): any[] {
    return monthlyTrends.map((trend, index) => ({
      period: trend.month,
      efficiency: Math.min(100, 60 + (trend.count * 2)),
      quality: Math.min(100, 70 + (trend.count * 1.5)),
      responseTime: Math.max(1, 8 - (trend.count * 0.2))
    }));
  }

  private calculateKPIs(analyticsData: any): any[] {
    const total = analyticsData.totalReports || 0;
    const approved = analyticsData.approvedReports || 0;
    
    return [
      {
        name: 'Completion Rate',
        value: total > 0 ? Math.round((approved / total) * 100) : 0,
        target: 85,
        unit: '%'
      },
      {
        name: 'Total Reports',
        value: total,
        target: Math.ceil(total * 1.1),
        unit: 'count'
      }
    ];
  }

  private determinePriority(report: any): string {
    // Determine priority based on report type and status
    const title = report.title?.toLowerCase() || '';
    
    if (title.includes('security') || title.includes('audit') || title.includes('compliance')) {
      return 'High';
    } else if (title.includes('monthly') || title.includes('quarterly')) {
      return 'Medium';
    } else {
      return 'Low';
    }
  }

  private calculateCompletionPercentage(status: string): number {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'completed':
        return 100;
      case 'pending':
        return 75;
      case 'draft':
        return 25;
      case 'overdue':
        return 50;
      default:
        return 0;
    }
  }

  private getActivityType(status: string): string {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'report_completed';
      case 'pending':
        return 'report_submitted';
      case 'draft':
        return 'report_created';
      default:
        return 'report_updated';
    }
  }

  private generateActivityMessage(report: any): string {
    const type = this.getActivityType(report.status);
    const creator = report.createdBy || 'Unknown';
    
    switch (type) {
      case 'report_completed':
        return `${report.title} completed by ${creator}`;
      case 'report_submitted':
        return `${report.title} submitted by ${creator}`;
      case 'report_created':
        return `${report.title} created by ${creator}`;
      default:
        return `${report.title} updated by ${creator}`;
    }
  }

  private getRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
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
        timeframe: this.selectedTimeframe,
        userRole: 'DepartmentLead'
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
        if (err.status === 403) {
          this.showNotification('error', 'You don\'t have permission to export this department\'s data');
        } else if (err.status === 401) {
          this.showNotification('error', 'Please login to export dashboard');
        } else {
          this.showNotification('error', `${this.exportingFormat} export failed. Please try again.`);
        }
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

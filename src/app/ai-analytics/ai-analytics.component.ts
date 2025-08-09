import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { AdvancedAnalyticsService } from '../core/services/advanced-analytics.service';
import { AuthService } from '../core/services/auth.service';
import {
  AIInsightsDashboardDto,
  PredictionResultDto,
  AnomalyDto,
  AIRecommendationDto,
  DataQualityAssessmentDto,
  DepartmentClusterDto
} from '../core/models/ai-analytics.model';

@Component({
  selector: 'app-ai-analytics',
  templateUrl: './ai-analytics.component.html',
  styleUrls: ['./ai-analytics.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule]
})
export class AiAnalyticsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Dashboard Data
  dashboardData: AIInsightsDashboardDto | null = null;
  predictions: PredictionResultDto[] = [];
  anomalies: AnomalyDto[] = [];
  recommendations: AIRecommendationDto[] = [];
  dataQuality: DataQualityAssessmentDto | null = null;
  departmentClusters: DepartmentClusterDto[] = [];
  
  // Loading States
  loading = {
    dashboard: false,
    predictions: false,
    anomalies: false,
    recommendations: false,
    dataQuality: false,
    clusters: false
  };
  
  // Error States
  errors: { [key: string]: string } = {};
  
  // UI State
  selectedTab = 'dashboard';
  selectedDepartment = 'all';
  selectedTimeframe = '30';
  
  // Chart Data (for future Chart.js integration)
  predictionChartData: any = null;
  anomalyChartData: any = null;

  constructor(
    private advancedAnalyticsService: AdvancedAnalyticsService,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Check for query parameter to set initial tab
    this.route.queryParams.subscribe(params => {
      if (params['tab']) {
        this.selectedTab = params['tab'];
      }
    });
    
    this.loadDashboardData();
    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDashboardData(): void {
    this.loading.dashboard = true;
    this.advancedAnalyticsService.getAIInsightsDashboard()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.dashboardData = data;
          this.loading.dashboard = false;
        },
        error: (error) => {
          this.errors['dashboard'] = 'Failed to load AI dashboard';
          this.loading.dashboard = false;
          console.error('Dashboard error:', error);
        }
      });
  }

  loadInitialData(): void {
    // Load all initial data in parallel
    const requests = forkJoin({
      recommendations: this.advancedAnalyticsService.getAIRecommendations(),
      dataQuality: this.advancedAnalyticsService.assessDataQuality('reports'),
      clusters: this.advancedAnalyticsService.getDepartmentClusters(),
      anomalies: this.advancedAnalyticsService.detectAnomalies('efficiency')
    });

    requests.pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.recommendations = data.recommendations;
          this.dataQuality = data.dataQuality;
          this.departmentClusters = data.clusters;
          this.anomalies = data.anomalies;
        },
        error: (error) => {
          console.error('Error loading initial data:', error);
        }
      });
  }

  loadPredictions(): void {
    this.loading.predictions = true;
    const request = {
      departments: this.selectedDepartment === 'all' ? [] : [this.selectedDepartment],
      metrics: ['performance', 'efficiency', 'budget'],
      timeframe: parseInt(this.selectedTimeframe),
      confidenceLevel: 0.85
    };

    this.advancedAnalyticsService.getAdvancedPredictions(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.predictions = data;
          this.loading.predictions = false;
          this.preparePredictionChart();
        },
        error: (error) => {
          this.errors['predictions'] = 'Failed to load predictions';
          this.loading.predictions = false;
        }
      });
  }

  detectAnomalies(metric: string): void {
    this.loading.anomalies = true;
    this.advancedAnalyticsService.detectAnomalies(metric)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.anomalies = data;
          this.loading.anomalies = false;
          this.prepareAnomalyChart();
        },
        error: (error) => {
          this.errors['anomalies'] = 'Failed to detect anomalies';
          this.loading.anomalies = false;
        }
      });
  }

  refreshDashboard(): void {
    this.loadDashboardData();
    this.loadInitialData();
    if (this.selectedTab === 'predictions') {
      this.loadPredictions();
    }
  }

  selectTab(tab: string): void {
    this.selectedTab = tab;
    
    // Load data for specific tabs
    switch (tab) {
      case 'predictions':
        if (this.predictions.length === 0) {
          this.loadPredictions();
        }
        break;
      case 'anomalies':
        if (this.anomalies.length === 0) {
          this.detectAnomalies('efficiency');
        }
        break;
    }
  }

  onDepartmentChange(): void {
    if (this.selectedTab === 'predictions') {
      this.loadPredictions();
    }
  }

  onTimeframeChange(): void {
    if (this.selectedTab === 'predictions') {
      this.loadPredictions();
    }
  }

  getSeverityClass(severity: string): string {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'badge-danger';
      case 'high': return 'badge-warning';
      case 'medium': return 'badge-info';
      case 'low': return 'badge-secondary';
      default: return 'badge-secondary';
    }
  }

  getPriorityClass(priority: string): string {
    switch (priority?.toLowerCase()) {
      case 'critical': return 'text-danger';
      case 'high': return 'text-warning';
      case 'medium': return 'text-info';
      case 'low': return 'text-secondary';
      default: return 'text-secondary';
    }
  }

  getQualityScoreClass(score: number): string {
    if (score >= 0.9) return 'text-success';
    if (score >= 0.7) return 'text-warning';
    return 'text-danger';
  }

  getPerformanceLevelClass(level: string): string {
    switch (level?.toLowerCase()) {
      case 'high': return 'text-success';
      case 'medium': return 'text-warning';
      case 'low': return 'text-danger';
      default: return 'text-secondary';
    }
  }

  getTrendIcon(trend: string): string {
    switch (trend?.toLowerCase()) {
      case 'improving': return 'fa-arrow-up';
      case 'declining': return 'fa-arrow-down';
      case 'stable': return 'fa-arrow-right';
      default: return 'fa-minus';
    }
  }

  getTrendClass(trend: string): string {
    switch (trend?.toLowerCase()) {
      case 'improving': return 'text-success';
      case 'declining': return 'text-danger';
      case 'stable': return 'text-info';
      default: return 'text-secondary';
    }
  }

  private preparePredictionChart(): void {
    // Prepare data for Chart.js (implementation can be added later)
    if (this.predictions.length > 0) {
      this.predictionChartData = {
        labels: this.predictions.map((_, index) => `Day ${index + 1}`),
        datasets: [{
          label: 'Predicted Values',
          data: this.predictions.map(p => p.predictedValue),
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.1
        }]
      };
    }
  }

  private prepareAnomalyChart(): void {
    // Prepare data for Chart.js (implementation can be added later)
    if (this.anomalies.length > 0) {
      this.anomalyChartData = {
        labels: this.anomalies.map(a => a.timestamp.toString()),
        datasets: [{
          label: 'Anomaly Deviation',
          data: this.anomalies.map(a => a.deviation),
          backgroundColor: this.anomalies.map(a => 
            a.severity === 'Critical' ? 'rgba(255, 99, 132, 0.6)' :
            a.severity === 'High' ? 'rgba(255, 159, 64, 0.6)' :
            a.severity === 'Medium' ? 'rgba(255, 205, 86, 0.6)' :
            'rgba(54, 162, 235, 0.6)'
          )
        }]
      };
    }
  }

  exportData(format: 'pdf' | 'excel'): void {
    this.advancedAnalyticsService.exportAIAnalytics(format, {
      includeCharts: true,
      includePredictions: true,
      includeAnomalies: true,
      includeRecommendations: true
    }).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai-analytics-${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Export error:', error);
      }
    });
  }

  navigateBackToDashboard(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    // Navigate based on user role
    switch (currentUser.role?.toLowerCase()) {
      case 'admin':
        this.router.navigate(['/admin']);
        break;
      case 'executive':
        this.router.navigate(['/executive']);
        break;
      case 'departmentlead':
      case 'department lead':
        this.router.navigate(['/department-lead']);
        break;
      default:
        this.router.navigate(['/dashboard']);
        break;
    }
  }
}

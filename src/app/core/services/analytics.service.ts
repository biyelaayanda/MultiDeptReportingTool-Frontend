import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ExecutiveDashboardDto,
  BusinessIntelligenceDto,
  KpiMetricDto,
  DepartmentPerformanceDto,
  DataPointDto,
  AlertDto,
  TrendAnalysisDto,
  UserPerformanceDto,
  SystemHealthDto
} from '../models/analytics.model';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private readonly apiUrl = `${environment.apiUrl}/api/analytics`;

  constructor(private http: HttpClient) {}

  // Executive Dashboard
  getExecutiveDashboard(startDate?: Date, endDate?: Date): Observable<ExecutiveDashboardDto> {
    let params = new HttpParams();
    if (startDate) {
      params = params.set('startDate', startDate.toISOString());
    }
    if (endDate) {
      params = params.set('endDate', endDate.toISOString());
    }
    return this.http.get<ExecutiveDashboardDto>(`${this.apiUrl}/dashboard`, { params });
  }

  // Business Intelligence
  getBusinessIntelligence(timeframe?: string): Observable<BusinessIntelligenceDto> {
    let params = new HttpParams();
    if (timeframe) {
      params = params.set('timeframe', timeframe);
    }
    return this.http.get<BusinessIntelligenceDto>(`${this.apiUrl}/business-intelligence`, { params });
  }

  // KPI Metrics
  getKpiMetrics(): Observable<KpiMetricDto[]> {
    return this.http.get<KpiMetricDto[]>(`${this.apiUrl}/kpi-metrics`);
  }

  getKpiMetric(metricName: string): Observable<KpiMetricDto> {
    return this.http.get<KpiMetricDto>(`${this.apiUrl}/kpi-metrics/${metricName}`);
  }

  // Department Performance
  getDepartmentPerformance(): Observable<DepartmentPerformanceDto[]> {
    return this.http.get<DepartmentPerformanceDto[]>(`${this.apiUrl}/department-performance`);
  }

  getDepartmentPerformanceById(departmentId: number): Observable<DepartmentPerformanceDto> {
    return this.http.get<DepartmentPerformanceDto>(`${this.apiUrl}/department-performance/${departmentId}`);
  }

  // Trends and Analytics
  getTrendAnalysis(metric: string, timeframe?: string): Observable<TrendAnalysisDto> {
    let params = new HttpParams();
    if (timeframe) {
      params = params.set('timeframe', timeframe);
    }
    return this.http.get<TrendAnalysisDto>(`${this.apiUrl}/trends/${metric}`, { params });
  }

  getReportingTrends(timeframe?: string): Observable<DataPointDto[]> {
    let params = new HttpParams();
    if (timeframe) {
      params = params.set('timeframe', timeframe);
    }
    return this.http.get<DataPointDto[]>(`${this.apiUrl}/reporting-trends`, { params });
  }

  getCompletionTrends(timeframe?: string): Observable<DataPointDto[]> {
    let params = new HttpParams();
    if (timeframe) {
      params = params.set('timeframe', timeframe);
    }
    return this.http.get<DataPointDto[]>(`${this.apiUrl}/completion-trends`, { params });
  }

  // Alerts and Notifications
  getAlerts(): Observable<AlertDto[]> {
    return this.http.get<AlertDto[]>(`${this.apiUrl}/alerts`);
  }

  getCriticalAlerts(): Observable<AlertDto[]> {
    return this.http.get<AlertDto[]>(`${this.apiUrl}/alerts/critical`);
  }

  markAlertAsRead(alertId: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/alerts/${alertId}/read`, {});
  }

  // User Performance
  getUserPerformance(): Observable<UserPerformanceDto[]> {
    return this.http.get<UserPerformanceDto[]>(`${this.apiUrl}/user-performance`);
  }

  getTopPerformers(limit?: number): Observable<UserPerformanceDto[]> {
    let params = new HttpParams();
    if (limit) {
      params = params.set('limit', limit.toString());
    }
    return this.http.get<UserPerformanceDto[]>(`${this.apiUrl}/top-performers`, { params });
  }

  // System Health
  getSystemHealth(): Observable<SystemHealthDto> {
    return this.http.get<SystemHealthDto>(`${this.apiUrl}/system-health`);
  }

  // Predictive Analytics
  getPredictiveAnalytics(metric: string, timeframe?: string): Observable<DataPointDto[]> {
    let params = new HttpParams();
    if (timeframe) {
      params = params.set('timeframe', timeframe);
    }
    return this.http.get<DataPointDto[]>(`${this.apiUrl}/predictions/${metric}`, { params });
  }

  // Advanced Analytics
  getReportingPatterns(): Observable<any> {
    return this.http.get(`${this.apiUrl}/reporting-patterns`);
  }

  getDepartmentComparison(): Observable<any> {
    return this.http.get(`${this.apiUrl}/department-comparison`);
  }

  getEfficiencyMetrics(): Observable<any> {
    return this.http.get(`${this.apiUrl}/efficiency-metrics`);
  }

  getCustomAnalytics(query: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/custom-analytics`, query);
  }

  // Real-time Data
  getRealTimeMetrics(): Observable<any> {
    return this.http.get(`${this.apiUrl}/real-time-metrics`);
  }

  // Export Analytics Data
  exportAnalyticsData(format: string, options?: any): Observable<Blob> {
    let params = new HttpParams();
    if (options) {
      Object.keys(options).forEach(key => {
        params = params.set(key, options[key]);
      });
    }
    return this.http.get(`${this.apiUrl}/export/${format}`, { 
      params, 
      responseType: 'blob' 
    });
  }

  // Refresh Analytics Cache
  refreshAnalyticsCache(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/refresh-cache`, {});
  }

  // Historical Data
  getHistoricalData(metric: string, startDate: Date, endDate: Date): Observable<DataPointDto[]> {
    const params = new HttpParams()
      .set('metric', metric)
      .set('startDate', startDate.toISOString())
      .set('endDate', endDate.toISOString());
    
    return this.http.get<DataPointDto[]>(`${this.apiUrl}/historical-data`, { params });
  }
}

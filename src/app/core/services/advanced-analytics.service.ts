import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  PredictionResultDto,
  AnomalyDto,
  SentimentAnalysisDto,
  CorrelationAnalysisDto,
  ScenarioAnalysisDto,
  ResourceOptimizationDto,
  AIInsightsDashboardDto,
  AIRecommendationDto,
  DataQualityAssessmentDto,
  DepartmentClusterDto,
  DocumentSummaryDto,
  BusinessInsightDto,
  MultivariateAnalysisDto
} from '../models/ai-analytics.model';

@Injectable({
  providedIn: 'root'
})
export class AdvancedAnalyticsService {
  private readonly apiUrl = `${environment.apiUrl}/api/AdvancedAnalytics`;

  constructor(private http: HttpClient) {}

  // AI Predictions
  getAdvancedPredictions(request: any): Observable<PredictionResultDto[]> {
    return this.http.post<PredictionResultDto[]>(`${this.apiUrl}/predictions/batch`, request);
  }

  getDepartmentPerformancePrediction(request: any): Observable<PredictionResultDto[]> {
    return this.http.post<PredictionResultDto[]>(`${this.apiUrl}/predictions/department-performance`, request);
  }

  getBudgetForecast(department: string): Observable<PredictionResultDto[]> {
    return this.http.get<PredictionResultDto[]>(`${this.apiUrl}/predictions/budget-forecast/${department}`);
  }

  getResourceRequirements(department: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/predictions/resource-requirements/${department}`);
  }

  // Anomaly Detection
  detectAnomalies(metric: string): Observable<AnomalyDto[]> {
    return this.http.get<AnomalyDto[]>(`${this.apiUrl}/anomalies/detect/${metric}`);
  }

  getAnomalyAlerts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/anomalies/alerts`);
  }

  // Data Quality
  assessDataQuality(dataSource: string): Observable<DataQualityAssessmentDto> {
    return this.http.get<DataQualityAssessmentDto>(`${this.apiUrl}/data-quality/assess/${dataSource}`);
  }

  // Pattern Recognition
  getSeasonalPatterns(metric: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/patterns/seasonal/${metric}`);
  }

  analyzeCorrelations(request: any): Observable<CorrelationAnalysisDto> {
    return this.http.post<CorrelationAnalysisDto>(`${this.apiUrl}/patterns/correlations`, request);
  }

  getDepartmentClusters(): Observable<DepartmentClusterDto[]> {
    return this.http.get<DepartmentClusterDto[]>(`${this.apiUrl}/patterns/department-clusters`);
  }

  // Natural Language Processing
  analyzeSentiment(request: any): Observable<SentimentAnalysisDto> {
    return this.http.post<SentimentAnalysisDto>(`${this.apiUrl}/nlp/sentiment-analysis`, request);
  }

  extractInsights(request: any): Observable<BusinessInsightDto[]> {
    return this.http.post<BusinessInsightDto[]>(`${this.apiUrl}/nlp/extract-insights`, request);
  }

  generateSummary(request: any): Observable<DocumentSummaryDto> {
    return this.http.post<DocumentSummaryDto>(`${this.apiUrl}/nlp/generate-summary`, request);
  }

  // Advanced Analytics
  performMultivariateAnalysis(request: any): Observable<MultivariateAnalysisDto> {
    return this.http.post<MultivariateAnalysisDto>(`${this.apiUrl}/advanced/multivariate-analysis`, request);
  }

  performScenarioAnalysis(request: any): Observable<ScenarioAnalysisDto> {
    return this.http.post<ScenarioAnalysisDto>(`${this.apiUrl}/advanced/scenario-analysis`, request);
  }

  optimizeResources(request: any): Observable<ResourceOptimizationDto> {
    return this.http.post<ResourceOptimizationDto>(`${this.apiUrl}/advanced/optimize-resources`, request);
  }

  // AI Dashboard
  getAIInsightsDashboard(): Observable<AIInsightsDashboardDto> {
    return this.http.get<AIInsightsDashboardDto>(`${this.apiUrl}/dashboard/ai-insights`);
  }

  getAIRecommendations(): Observable<AIRecommendationDto[]> {
    return this.http.get<AIRecommendationDto[]>(`${this.apiUrl}/recommendations/ai-generated`);
  }

  // Utility Methods
  refreshAIModels(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/models/refresh`, {});
  }

  getModelPerformance(): Observable<any> {
    return this.http.get(`${this.apiUrl}/models/performance`);
  }

  exportAIAnalytics(format: string, options?: any): Observable<Blob> {
    const headers = new HttpHeaders({
      'Accept': format === 'pdf' ? 'application/pdf' : 'application/json'
    });
    
    return this.http.post(`${this.apiUrl}/export/${format}`, options || {}, {
      headers,
      responseType: 'blob'
    });
  }
}

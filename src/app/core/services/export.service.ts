import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ExportRequestDto,
  ExportResultDto,
  ExportHistoryDto,
  ExportTemplateDto,
  EmailNotificationDto,
  ScheduledReportDto,
  ChartConfigurationDto,
  ExportFormat
} from '../models/export.model';

@Injectable({
  providedIn: 'root'
})
export class ExportService {
  private readonly apiUrl = `${environment.apiUrl}/api/export`;

  constructor(private http: HttpClient) {}

  // Export Generation
  generateExport(request: ExportRequestDto): Observable<ExportResultDto> {
    return this.http.post<ExportResultDto>(`${this.apiUrl}/generate`, request);
  }

  downloadExport(exportId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/download/${exportId}`, { responseType: 'blob' });
  }

  getExportStatus(exportId: string): Observable<ExportResultDto> {
    return this.http.get<ExportResultDto>(`${this.apiUrl}/status/${exportId}`);
  }

  // Export Formats
  getSupportedFormats(): Observable<ExportFormat[]> {
    return this.http.get<ExportFormat[]>(`${this.apiUrl}/supported-formats`);
  }

  // Export History
  getExportHistory(): Observable<ExportHistoryDto[]> {
    return this.http.get<ExportHistoryDto[]>(`${this.apiUrl}/history`);
  }

  deleteExportHistory(exportId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/history/${exportId}`);
  }

  // Export Templates
  getExportTemplates(): Observable<ExportTemplateDto[]> {
    return this.http.get<ExportTemplateDto[]>(`${this.apiUrl}/templates`);
  }

  getExportTemplate(templateId: number): Observable<ExportTemplateDto> {
    return this.http.get<ExportTemplateDto>(`${this.apiUrl}/templates/${templateId}`);
  }

  createExportTemplate(template: ExportTemplateDto): Observable<ExportTemplateDto> {
    return this.http.post<ExportTemplateDto>(`${this.apiUrl}/templates`, template);
  }

  updateExportTemplate(templateId: number, template: ExportTemplateDto): Observable<ExportTemplateDto> {
    return this.http.put<ExportTemplateDto>(`${this.apiUrl}/templates/${templateId}`, template);
  }

  deleteExportTemplate(templateId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/templates/${templateId}`);
  }

  // Email Notifications
  sendEmailNotification(notification: EmailNotificationDto): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/email/send`, notification);
  }

  testEmailConfiguration(emailAddress: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/email/test`, { emailAddress });
  }

  getEmailTemplates(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/email/templates`);
  }

  // Scheduled Reports
  getScheduledReports(): Observable<ScheduledReportDto[]> {
    return this.http.get<ScheduledReportDto[]>(`${this.apiUrl}/scheduled-reports`);
  }

  getScheduledReport(reportId: number): Observable<ScheduledReportDto> {
    return this.http.get<ScheduledReportDto>(`${this.apiUrl}/scheduled-reports/${reportId}`);
  }

  createScheduledReport(report: ScheduledReportDto): Observable<ScheduledReportDto> {
    return this.http.post<ScheduledReportDto>(`${this.apiUrl}/scheduled-reports`, report);
  }

  updateScheduledReport(reportId: number, report: ScheduledReportDto): Observable<ScheduledReportDto> {
    return this.http.put<ScheduledReportDto>(`${this.apiUrl}/scheduled-reports/${reportId}`, report);
  }

  deleteScheduledReport(reportId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/scheduled-reports/${reportId}`);
  }

  enableScheduledReport(reportId: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/scheduled-reports/${reportId}/enable`, {});
  }

  disableScheduledReport(reportId: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/scheduled-reports/${reportId}/disable`, {});
  }

  runScheduledReportNow(reportId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/scheduled-reports/${reportId}/run-now`, {});
  }

  // Chart Generation
  generateChart(config: ChartConfigurationDto): Observable<string> {
    return this.http.post(`${this.apiUrl}/charts/generate`, config, { responseType: 'text' });
  }

  getChartTypes(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/charts/types`);
  }

  getChartTemplates(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/charts/templates`);
  }

  // Bulk Operations
  exportMultipleReports(reportIds: number[], format: ExportFormat): Observable<ExportResultDto> {
    const request: ExportRequestDto = {
      reportIds,
      format,
      includeCharts: true,
      includeRawData: true
    };
    return this.generateExport(request);
  }

  bulkEmailExports(exports: { exportId: string; recipients: string[] }[]): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/bulk-email`, exports);
  }

  // Advanced Export Features
  exportWithCustomFilters(filters: any, format: ExportFormat): Observable<ExportResultDto> {
    const request: ExportRequestDto = {
      reportIds: [],
      format,
      includeCharts: true,
      includeRawData: true,
      filters
    };
    return this.generateExport(request);
  }

  previewExport(request: ExportRequestDto): Observable<any> {
    return this.http.post(`${this.apiUrl}/preview`, request);
  }

  validateExportRequest(request: ExportRequestDto): Observable<{ isValid: boolean; errors: string[] }> {
    return this.http.post<{ isValid: boolean; errors: string[] }>(`${this.apiUrl}/validate`, request);
  }

  // Export Statistics
  getExportStatistics(): Observable<any> {
    return this.http.get(`${this.apiUrl}/statistics`);
  }

  getUserExportQuota(): Observable<{ used: number; limit: number; remaining: number }> {
    return this.http.get<{ used: number; limit: number; remaining: number }>(`${this.apiUrl}/quota`);
  }

  // File Management
  cleanupExpiredExports(): Observable<{ deletedCount: number }> {
    return this.http.post<{ deletedCount: number }>(`${this.apiUrl}/cleanup`, {});
  }

  extendExportExpiry(exportId: string, days: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/extend-expiry/${exportId}`, { days });
  }
}

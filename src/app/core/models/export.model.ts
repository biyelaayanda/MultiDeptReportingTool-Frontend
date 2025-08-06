export interface ExportRequestDto {
  reportIds: number[];
  format: ExportFormat;
  includeCharts: boolean;
  includeRawData: boolean;
  dateRange?: DateRangeDto;
  filters?: ExportFiltersDto;
  customization?: ExportCustomizationDto;
  scheduledExport?: ScheduledExportConfigDto;
}

export interface DateRangeDto {
  startDate: Date;
  endDate: Date;
}

export interface ExportFiltersDto {
  departments: number[];
  users: number[];
  reportTypes: string[];
  statuses: string[];
  customFilters: { [key: string]: any };
}

export interface ExportCustomizationDto {
  includeExecutiveSummary: boolean;
  includeTrendAnalysis: boolean;
  includeRecommendations: boolean;
  logoUrl?: string;
  headerText?: string;
  footerText?: string;
  colorScheme?: string;
  pageOrientation: PageOrientation;
  pageSize: PageSize;
}

export interface ScheduledExportConfigDto {
  frequency: ExportFrequency;
  dayOfWeek?: DayOfWeek;
  dayOfMonth?: number;
  time: string;
  timezone: string;
  emailRecipients: string[];
  isActive: boolean;
  startDate: Date;
  endDate?: Date;
}

export interface EmailNotificationDto {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  isHtml: boolean;
  attachments: EmailAttachmentDto[];
  priority: EmailPriority;
  templateName?: string;
  templateData?: { [key: string]: any };
}

export interface EmailAttachmentDto {
  fileName: string;
  content: string;
  contentType: string;
  size: number;
}

export interface ScheduledReportDto {
  id: number;
  name: string;
  description: string;
  reportConfiguration: ExportRequestDto;
  schedule: ScheduledExportConfigDto;
  createdBy: number;
  createdAt: Date;
  lastRunAt?: Date;
  nextRunAt: Date;
  isActive: boolean;
  runCount: number;
  lastStatus: ScheduleStatus;
  errorMessage?: string;
}

export interface ChartConfigurationDto {
  type: ChartType;
  title: string;
  width: number;
  height: number;
  data: ChartDataPointDto[];
  xAxisLabel: string;
  yAxisLabel: string;
  colors: string[];
  showLegend: boolean;
  showGrid: boolean;
  isInteractive: boolean;
  theme: ChartTheme;
}

export interface ChartDataPointDto {
  label: string;
  value: number;
  category?: string;
  color?: string;
  metadata?: { [key: string]: any };
}

export interface ExportResultDto {
  id: string;
  fileName: string;
  format: ExportFormat;
  size: number;
  downloadUrl: string;
  expiresAt: Date;
  createdAt: Date;
  isReady: boolean;
  errorMessage?: string;
}

export interface ExportHistoryDto {
  id: number;
  fileName: string;
  format: ExportFormat;
  size: number;
  createdBy: number;
  createdByName: string;
  createdAt: Date;
  downloadCount: number;
  lastDownloadAt?: Date;
  isExpired: boolean;
  reportCount: number;
}

export interface ExportTemplateDto {
  id: number;
  name: string;
  description: string;
  format: ExportFormat;
  configuration: ExportRequestDto;
  isDefault: boolean;
  isShared: boolean;
  createdBy: number;
  createdAt: Date;
  lastUsed?: Date;
  useCount: number;
}

// Enums
export enum ExportFormat {
  PDF = 'PDF',
  Excel = 'Excel',
  CSV = 'CSV',
  JSON = 'JSON',
  PowerPoint = 'PowerPoint',
  Word = 'Word'
}

export enum PageOrientation {
  Portrait = 'Portrait',
  Landscape = 'Landscape'
}

export enum PageSize {
  A4 = 'A4',
  Letter = 'Letter',
  Legal = 'Legal',
  A3 = 'A3'
}

export enum ExportFrequency {
  Daily = 'Daily',
  Weekly = 'Weekly',
  Monthly = 'Monthly',
  Quarterly = 'Quarterly',
  Yearly = 'Yearly'
}

export enum DayOfWeek {
  Monday = 1,
  Tuesday = 2,
  Wednesday = 3,
  Thursday = 4,
  Friday = 5,
  Saturday = 6,
  Sunday = 0
}

export enum EmailPriority {
  Low = 'Low',
  Normal = 'Normal',
  High = 'High'
}

export enum ScheduleStatus {
  Success = 'Success',
  Failed = 'Failed',
  Running = 'Running',
  Pending = 'Pending'
}

export enum ChartType {
  Bar = 'Bar',
  Line = 'Line',
  Pie = 'Pie',
  Doughnut = 'Doughnut',
  Area = 'Area',
  Scatter = 'Scatter',
  Bubble = 'Bubble',
  Radar = 'Radar'
}

export enum ChartTheme {
  Default = 'Default',
  Dark = 'Dark',
  Light = 'Light',
  Corporate = 'Corporate',
  Colorful = 'Colorful'
}

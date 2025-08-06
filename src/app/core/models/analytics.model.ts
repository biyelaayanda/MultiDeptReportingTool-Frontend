export interface ExecutiveDashboardDto {
  companyOverview: CompanyOverviewDto;
  kpiMetrics: KpiMetricDto[];
  alerts: AlertDto[];
  recentTrends: DataPointDto[];
  departmentPerformance: DepartmentPerformanceDto[];
  topPerformers: UserPerformanceDto[];
  upcomingDeadlines: DeadlineDto[];
  systemHealth: SystemHealthDto;
  generatedAt: Date;
  lastUpdated: Date;
}

export interface CompanyOverviewDto {
  totalReports: number;
  completedReports: number;
  pendingReports: number;
  overdueReports: number;
  completionRate: number;
  overallEfficiency: number;
  averageCompletionTime: number;
  totalDepartments: number;
  activeDepartments: number;
  totalUsers: number;
  activeUsers: number;
  totalRevenue: number;
  pendingApprovals: number;
  criticalIssues: number;
}

export interface KpiMetricDto {
  name: string;
  value: number;
  unit: string;
  previousValue: number;
  changePercentage: number;
  trend: TrendDirection;
  target: number;
  category: string;
  description: string;
  isHealthy: boolean;
}

export interface AlertDto {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  department: string;
  createdAt: Date;
  isRead: boolean;
  actionRequired: boolean;
  relatedReportId?: number;
  relatedUserId?: number;
}

export interface DataPointDto {
  label: string;
  value: number;
  date: Date;
  category: string;
  metadata: { [key: string]: any };
}

export interface DepartmentPerformanceDto {
  departmentId: number;
  departmentName: string;
  completionRate: number;
  averageResponseTime: number;
  totalReports: number;
  completedReports: number;
  pendingReports: number;
  overdueReports: number;
  efficiency: number;
  trend: TrendDirection;
  lastUpdate: Date;
}

export interface UserPerformanceDto {
  userId: number;
  userName: string;
  departmentName: string;
  completedReports: number;
  averageCompletionTime: number;
  efficiency: number;
  rank: number;
  trend: TrendDirection;
}

export interface DeadlineDto {
  reportId: number;
  reportTitle: string;
  departmentName: string;
  assignedTo: string;
  dueDate: Date;
  daysRemaining: number;
  priority: Priority;
  status: string;
}

export interface SystemHealthDto {
  overallHealth: HealthStatus;
  databaseHealth: HealthStatus;
  apiHealth: HealthStatus;
  emailServiceHealth: HealthStatus;
  lastHealthCheck: Date;
  uptime: number;
  responseTime: number;
  errorRate: number;
}

export interface BusinessIntelligenceDto {
  summary: BusinessSummaryDto;
  insights: InsightDto[];
  recommendations: RecommendationDto[];
  predictions: PredictionDto[];
  trends: TrendAnalysisDto[];
  benchmarks: BenchmarkDto[];
  generatedAt: Date;
}

export interface BusinessSummaryDto {
  period: string;
  keyMetrics: { [key: string]: number };
  highlights: string[];
  concerns: string[];
  overallScore: number;
  performanceGrade: string;
}

export interface InsightDto {
  id: string;
  category: string;
  title: string;
  description: string;
  impact: ImpactLevel;
  confidence: number;
  supportingData: DataPointDto[];
  createdAt: Date;
}

export interface RecommendationDto {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  expectedImpact: string;
  implementationEffort: EffortLevel;
  category: string;
  targetDepartment?: string;
  estimatedCompletion: number;
}

export interface PredictionDto {
  metric: string;
  currentValue: number;
  predictedValue: number;
  timeframe: string;
  confidence: number;
  factors: string[];
  methodology: string;
}

export interface TrendAnalysisDto {
  metric: string;
  trend: TrendDirection;
  changeRate: number;
  seasonality: boolean;
  anomalies: AnomalyDto[];
  forecast: DataPointDto[];
}

export interface BenchmarkDto {
  metric: string;
  currentValue: number;
  industryAverage: number;
  bestInClass: number;
  percentile: number;
  comparison: ComparisonResult;
}

export interface AnomalyDto {
  date: Date;
  metric: string;
  expectedValue: number;
  actualValue: number;
  deviation: number;
  severity: AlertSeverity;
  explanation: string;
}

// Enums
export enum TrendDirection {
  Up = 'Up',
  Down = 'Down',
  Stable = 'Stable',
  Volatile = 'Volatile'
}

export enum AlertType {
  Warning = 'Warning',
  Error = 'Error',
  Info = 'Info',
  Success = 'Success',
  Critical = 'Critical'
}

export enum AlertSeverity {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
  Critical = 'Critical'
}

export enum Priority {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
  Critical = 'Critical'
}

export enum HealthStatus {
  Healthy = 'Healthy',
  Warning = 'Warning',
  Critical = 'Critical',
  Unknown = 'Unknown'
}

export enum ImpactLevel {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
  Critical = 'Critical'
}

export enum EffortLevel {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High'
}

export enum ComparisonResult {
  Below = 'Below',
  Average = 'Average',
  Above = 'Above',
  Excellent = 'Excellent'
}

// Chart Data Models
export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
  fill?: boolean;
}

export interface ChartOptions {
  responsive: boolean;
  plugins: {
    legend: {
      display: boolean;
      position?: string;
    };
    title: {
      display: boolean;
      text?: string;
    };
  };
  scales?: any;
}

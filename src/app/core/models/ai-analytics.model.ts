// AI Analytics Models - Matching Backend Phase 3 DTOs

export interface PredictionResultDto {
  algorithm: string;
  predictedValue: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  confidenceLevel: number;
  predictionDate: Date;
  dataPoints: number;
  modelAccuracy: number;
  seasonalFactors: { [key: string]: number };
  trendDirection: string;
  riskScore: number;
  recommendations: string[];
}

export interface AnomalyDto {
  dataPoint: number;
  expectedValue: number;
  deviation: number;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  detectionMethod: string;
  timestamp: Date;
  affectedMetric: string;
  possibleCauses: string[];
  recommendedActions: string[];
  confidence: number;
}

export interface SentimentAnalysisDto {
  overallSentiment: 'Positive' | 'Negative' | 'Neutral';
  sentimentScore: number;
  confidenceLevel: number;
  positivePercentage: number;
  negativePercentage: number;
  neutralPercentage: number;
  keyPhrases: string[];
  emotionalTone: string;
  textSamples: TextSentimentDto[];
  analysisTimestamp: Date;
}

export interface TextSentimentDto {
  text: string;
  sentiment: 'Positive' | 'Negative' | 'Neutral';
  score: number;
  confidence: number;
}

export interface CorrelationAnalysisDto {
  correlationMatrix: { [key: string]: { [key: string]: number } };
  strongCorrelations: CorrelationPairDto[];
  insights: string[];
  analysisDate: Date;
  dataPointsAnalyzed: number;
  statisticalSignificance: number;
}

export interface CorrelationPairDto {
  variable1: string;
  variable2: string;
  correlationCoefficient: number;
  significance: 'Low' | 'Medium' | 'High';
  interpretation: string;
}

export interface ScenarioAnalysisDto {
  scenarios: ScenarioDto[];
  recommendedScenario: string;
  riskFactors: string[];
  opportunities: string[];
  analysisDate: Date;
  timeHorizon: string;
  confidenceLevel: number;
}

export interface ScenarioDto {
  name: string;
  description: string;
  probability: number;
  projectedOutcomes: { [key: string]: number };
  keyAssumptions: string[];
  riskLevel: 'Low' | 'Medium' | 'High';
  requiredActions: string[];
}

export interface ResourceOptimizationDto {
  optimalAllocation: { [key: string]: number };
  expectedImprovement: number;
  costSavings: { [key: string]: number };
  reallocationSuggestions: string[];
  implementationComplexity: number;
  recommendedTimeline: string;
}

export interface AIInsightsDashboardDto {
  generatedAt: Date;
  dateRange: any;
  keyPredictions: DepartmentPerformancePredictionDto[];
  recentAnomalies: AnomalyDto[];
  seasonalInsights: any;
  departmentClusters: DepartmentClusterDto[];
  aiRecommendations: AIRecommendationDto[];
  dataQualityScores: { [key: string]: number };
}

export interface DepartmentPerformancePredictionDto {
  departmentName: string;
  performanceProjection: any[];
  predictedEfficiency: number;
  budgetUtilizationForecast: number;
  riskScore: number;
  recommendedActions: string[];
  keyMetricsPrediction: { [key: string]: number };
}

export interface SeasonalPatternDto {
  pattern: string;
  strength: number;
  peaks: SeasonalPeakDto[];
  valleys: SeasonalPeakDto[];
  cycleLengthDays: number;
  nextPeakDate: Date;
  confidence: number;
}

export interface SeasonalPeakDto {
  date: Date;
  value: number;
  type: 'Peak' | 'Valley';
  significance: number;
}

export interface AIRecommendationDto {
  title: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  category: string;
  department: string;
  confidenceScore: number;
  expectedImpact: 'Low' | 'Medium' | 'High';
  actionItems: string[];
  generatedAt: Date;
}

export interface AlertsSummaryDto {
  totalAlerts: number;
  criticalAlerts: number;
  highPriorityAlerts: number;
  recentAlertsCount: number;
  alertCategories: { [key: string]: number };
}

export interface DataQualityAssessmentDto {
  dataSource: string;
  overallQualityScore: number;
  qualityMetrics: QualityMetricsDto;
  issuesFound: string[];
  improvementSuggestions: string[];
  assessedAt: Date;
}

export interface QualityMetricsDto {
  completeness: number;
  accuracy: number;
  consistency: number;
  timeliness: number;
}

export interface DepartmentClusterDto {
  clusterName: string;
  departments: string[];
  clusterCharacteristics: { [key: string]: number };
  performanceLevel: 'Low' | 'Medium' | 'High';
  commonTraits: string[];
  improvementOpportunities: string[];
}

export interface BusinessInsightDto {
  title: string;
  description: string;
  category: string;
  importanceScore: number;
  supportingEvidence: string[];
  actionableRecommendations: string[];
}

export interface DocumentSummaryDto {
  summary: string;
  keyPoints: string[];
  sentiment: 'Positive' | 'Negative' | 'Neutral';
  topics: string[];
  readingTime: number;
  confidence: number;
  generatedAt: Date;
}

export interface MultivariateAnalysisDto {
  variables: string[];
  correlationMatrix: { [key: string]: { [key: string]: number } };
  principalComponents: PrincipalComponentDto[];
  regressionResults: RegressionResultDto;
  clusterAnalysis: ClusterResultDto[];
  insights: string[];
  statisticalSignificance: number;
}

export interface PrincipalComponentDto {
  component: string;
  varianceExplained: number;
  loadings: { [key: string]: number };
}

export interface RegressionResultDto {
  dependentVariable: string;
  coefficients: { [key: string]: number };
  rSquared: number;
  pValues: { [key: string]: number };
  confidenceIntervals: { [key: string]: { lower: number; upper: number } };
}

export interface ClusterResultDto {
  clusterId: number;
  centerCoordinates: { [key: string]: number };
  dataPoints: number;
  characteristics: string[];
}

// Request DTOs for API calls
export interface PredictionRequestDto {
  departments: string[];
  metrics: string[];
  timeframe: number;
  algorithm?: string;
  confidenceLevel?: number;
}

export interface AnomalyDetectionRequestDto {
  metric: string;
  sensitivity: number;
  timeWindow: number;
}

export interface SentimentAnalysisRequestDto {
  textSamples: string[];
  includeKeyPhrases: boolean;
  language?: string;
}

export interface CorrelationAnalysisRequestDto {
  variables: string[];
  method: 'Pearson' | 'Spearman' | 'Kendall';
  significanceLevel: number;
}

export interface ScenarioAnalysisRequestDto {
  baselineData: { [key: string]: number };
  variationFactors: { [key: string]: number };
  timeHorizon: number;
  scenarios: string[];
}

export interface ResourceOptimizationRequestDto {
  departments: string[];
  constraints: { [key: string]: number };
}

export interface DocumentAnalysisRequestDto {
  documents: string[];
  analysisType: 'Summary' | 'Insights' | 'Sentiment';
  maxSummaryLength?: number;
}

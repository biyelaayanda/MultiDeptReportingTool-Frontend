import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdvancedAnalyticsService } from '../core/services/advanced-analytics.service';

@Component({
  selector: 'app-ai-test',
  template: `
    <div class="container mt-4">
      <h2>🧠 AI Analytics Test</h2>
      <div class="row mt-4">
        <div class="col-md-6">
          <div class="card">
            <div class="card-header">
              <h5>AI Dashboard Test</h5>
            </div>
            <div class="card-body">
              <button class="btn btn-primary" (click)="testAIDashboard()" [disabled]="loading">
                {{ loading ? 'Loading...' : 'Test AI Dashboard' }}
              </button>
              <div *ngIf="dashboardResult" class="mt-3">
                <h6>✅ AI Dashboard Response:</h6>
                <pre class="bg-light p-2">{{ dashboardResult | json }}</pre>
              </div>
              <div *ngIf="error" class="alert alert-danger mt-3">
                ❌ Error: {{ error }}
              </div>
            </div>
          </div>
        </div>
        
        <div class="col-md-6">
          <div class="card">
            <div class="card-header">
              <h5>AI Recommendations Test</h5>
            </div>
            <div class="card-body">
              <button class="btn btn-success" (click)="testRecommendations()" [disabled]="loading">
                {{ loading ? 'Loading...' : 'Test AI Recommendations' }}
              </button>
              <div *ngIf="recommendationsResult" class="mt-3">
                <h6>✅ AI Recommendations:</h6>
                <div *ngFor="let rec of recommendationsResult" class="border p-2 mb-2">
                  <strong>{{ rec.title }}</strong>
                  <p class="small">{{ rec.description }}</p>
                  <span class="badge badge-info">{{ rec.priority }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="row mt-4">
        <div class="col-md-12">
          <div class="card">
            <div class="card-header">
              <h5>🔮 Advanced Predictions Test</h5>
            </div>
            <div class="card-body">
              <button class="btn btn-warning" (click)="testPredictions()" [disabled]="loading">
                {{ loading ? 'Loading...' : 'Test AI Predictions' }}
              </button>
              <div *ngIf="predictionsResult" class="mt-3">
                <h6>✅ AI Predictions:</h6>
                <div class="row">
                  <div class="col-md-4" *ngFor="let pred of predictionsResult">
                    <div class="border p-3 mb-2">
                      <h6>{{ pred.algorithm }}</h6>
                      <p><strong>Predicted Value:</strong> {{ pred.predictedValue | number:'1.2-2' }}</p>
                      <p><strong>Confidence:</strong> {{ pred.confidenceLevel * 100 | number:'1.0-0' }}%</p>
                      <p><strong>Trend:</strong> {{ pred.trendDirection }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .card { margin-bottom: 20px; }
    .badge-info { background-color: #17a2b8; }
    pre { max-height: 200px; overflow-y: auto; }
  `],
  standalone: true,
  imports: [CommonModule]
})
export class AiTestComponent implements OnInit {
  loading = false;
  error: string | null = null;
  dashboardResult: any = null;
  recommendationsResult: any = null;
  predictionsResult: any = null;

  constructor(private advancedAnalyticsService: AdvancedAnalyticsService) {}

  ngOnInit(): void {
    console.log('AI Test Component initialized');
  }

  testAIDashboard(): void {
    this.loading = true;
    this.error = null;
    this.dashboardResult = null;
    
    this.advancedAnalyticsService.getAIInsightsDashboard()
      .subscribe({
        next: (data) => {
          this.dashboardResult = data;
          this.loading = false;
          console.log('AI Dashboard Success:', data);
        },
        error: (error) => {
          this.error = error.message || 'Failed to load AI dashboard';
          this.loading = false;
          console.error('AI Dashboard Error:', error);
        }
      });
  }

  testRecommendations(): void {
    this.loading = true;
    this.error = null;
    this.recommendationsResult = null;
    
    this.advancedAnalyticsService.getAIRecommendations()
      .subscribe({
        next: (data) => {
          this.recommendationsResult = data;
          this.loading = false;
          console.log('AI Recommendations Success:', data);
        },
        error: (error) => {
          this.error = error.message || 'Failed to load AI recommendations';
          this.loading = false;
          console.error('AI Recommendations Error:', error);
        }
      });
  }

  testPredictions(): void {
    this.loading = true;
    this.error = null;
    this.predictionsResult = null;
    
    const request = {
      departments: ['Sales', 'Marketing', 'Operations'],
      metrics: ['performance', 'efficiency'],
      timeframe: 30,
      confidenceLevel: 0.85
    };
    
    this.advancedAnalyticsService.getAdvancedPredictions(request)
      .subscribe({
        next: (data) => {
          this.predictionsResult = data;
          this.loading = false;
          console.log('AI Predictions Success:', data);
        },
        error: (error) => {
          this.error = error.message || 'Failed to load AI predictions';
          this.loading = false;
          console.error('AI Predictions Error:', error);
        }
      });
  }
}

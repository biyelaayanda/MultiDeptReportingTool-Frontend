import { Component, Input, OnInit, ViewChild, ElementRef, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, RadialLinearScale } from 'chart.js';
import { EnhancedChartOptions } from './base-chart.component';

// Register radar chart components
Chart.register(RadialLinearScale);

export interface RadarDataset {
  label: string;
  data: number[];
  borderColor?: string;
  backgroundColor?: string;
  pointBackgroundColor?: string;
  pointBorderColor?: string;
  borderWidth?: number;
}

@Component({
  selector: 'app-radar-chart',
  template: `
    <div class="radar-chart-container">
      <div class="chart-header" *ngIf="options?.title">
        <h4 class="chart-title">{{ options?.title }}</h4>
        <p class="chart-subtitle" *ngIf="options?.subtitle">{{ options?.subtitle }}</p>
      </div>
      <div class="chart-wrapper" [style.height]="height">
        <canvas #chartCanvas></canvas>
      </div>
      <div class="chart-loading" *ngIf="isLoading">
        <div class="spinner-border text-primary" role="status"></div>
      </div>
      <div class="radar-legend" *ngIf="showLegend">
        <div class="legend-item" *ngFor="let dataset of datasets; let i = index">
          <span class="legend-color" [style.background-color]="getDatasetColor(i)"></span>
          <span class="legend-label">{{ dataset.label }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .radar-chart-container {
      background: var(--bs-white);
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      transition: all 0.3s ease;
    }

    .chart-header {
      margin-bottom: 1rem;
      text-align: center;
    }

    .chart-title {
      color: var(--primary-800);
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0;
    }

    .chart-subtitle {
      color: var(--text-muted);
      font-size: 0.875rem;
      margin: 0.5rem 0 0 0;
    }

    .chart-wrapper {
      position: relative;
      width: 100%;
      min-height: 400px;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .chart-loading {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }

    .radar-legend {
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 1rem;
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border-color);
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .legend-color {
      width: 12px;
      height: 12px;
      border-radius: 2px;
    }

    .legend-label {
      font-size: 0.875rem;
      color: var(--text-color);
    }

    @media (max-width: 768px) {
      .chart-wrapper {
        min-height: 300px;
      }
      
      .radar-legend {
        flex-direction: column;
        align-items: center;
      }
    }
  `],
  standalone: true,
  imports: [CommonModule]
})
export class RadarChartComponent implements OnInit {
  @ViewChild('chartCanvas', { static: true }) chartCanvas!: ElementRef<HTMLCanvasElement>;
  
  @Input() datasets: RadarDataset[] = [];
  @Input() labels: string[] = [];
  @Input() height: string = '450px';
  @Input() options?: EnhancedChartOptions;
  @Input() showLegend: boolean = true;
  @Input() isLoading: boolean = false;
  @Input() maxValue: number = 100;
  @Input() enableComparison: boolean = true;
  
  @Output() chartReady = new EventEmitter<Chart>();
  @Output() dataPointClick = new EventEmitter<{dataset: string, label: string, value: number}>();

  private chart: Chart | null = null;

  ngOnInit() {
    if (this.datasets && this.datasets.length > 0 && this.labels.length > 0) {
      this.createChart();
    }
  }

  private createChart() {
    if (this.chart) {
      this.chart.destroy();
    }

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const config = this.buildRadarConfiguration();
    this.chart = new Chart(ctx, config);
    this.chartReady.emit(this.chart);
  }

  private buildRadarConfiguration(): ChartConfiguration {
    return {
      type: 'radar',
      data: {
        labels: this.labels,
        datasets: this.datasets.map((dataset, index) => ({
          label: dataset.label,
          data: dataset.data,
          borderColor: dataset.borderColor || this.generateColors()[index],
          backgroundColor: dataset.backgroundColor || this.generateBackgroundColors()[index],
          pointBackgroundColor: dataset.pointBackgroundColor || this.generateColors()[index],
          pointBorderColor: dataset.pointBorderColor || '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          borderWidth: dataset.borderWidth || 2,
          fill: true
        }))
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: '#3b82f6',
            borderWidth: 1,
            cornerRadius: 8,
            callbacks: {
              title: (context) => {
                return context[0]?.label || '';
              },
              label: (context) => {
                return `${context.dataset.label}: ${context.parsed.r}%`;
              }
            }
          },
          legend: {
            display: false // We use custom legend
          }
        },
        scales: {
          r: {
            beginAtZero: true,
            max: this.maxValue,
            grid: {
              color: 'rgba(0, 0, 0, 0.1)'
            },
            angleLines: {
              color: 'rgba(0, 0, 0, 0.1)'
            },
            pointLabels: {
              font: {
                size: 12,
                weight: 500
              },
              color: '#374151'
            },
            ticks: {
              stepSize: 20,
              font: {
                size: 10
              },
              color: '#6b7280',
              backdropColor: 'rgba(255, 255, 255, 0.8)',
              backdropPadding: 2
            }
          }
        },
        onClick: (event, elements) => {
          if (elements && elements.length > 0) {
            const element = elements[0];
            const datasetIndex = element.datasetIndex;
            const dataIndex = element.index;
            const dataset = this.datasets[datasetIndex];
            const label = this.labels[dataIndex];
            const value = dataset.data[dataIndex];
            
            this.dataPointClick.emit({
              dataset: dataset.label,
              label: label,
              value: value
            });
          }
        },
        animation: {
          duration: 1200,
          easing: 'easeInOutQuart'
        }
      }
    };
  }

  private generateColors(): string[] {
    return [
      '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
      '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
    ];
  }

  private generateBackgroundColors(): string[] {
    return [
      'rgba(59, 130, 246, 0.2)', 'rgba(16, 185, 129, 0.2)', 'rgba(245, 158, 11, 0.2)',
      'rgba(239, 68, 68, 0.2)', 'rgba(139, 92, 246, 0.2)', 'rgba(6, 182, 212, 0.2)',
      'rgba(132, 204, 22, 0.2)', 'rgba(249, 115, 22, 0.2)', 'rgba(236, 72, 153, 0.2)',
      'rgba(99, 102, 241, 0.2)'
    ];
  }

  public getDatasetColor(index: number): string {
    return this.generateColors()[index % this.generateColors().length];
  }

  public updateData(newDatasets: RadarDataset[], newLabels?: string[]) {
    this.datasets = newDatasets;
    if (newLabels) {
      this.labels = newLabels;
    }
    this.createChart();
  }

  public addDataset(dataset: RadarDataset) {
    this.datasets.push(dataset);
    this.createChart();
  }

  public removeDataset(index: number) {
    this.datasets.splice(index, 1);
    this.createChart();
  }

  public highlightDataset(index: number) {
    if (this.chart && this.chart.data.datasets[index]) {
      // Make other datasets more transparent
      this.chart.data.datasets.forEach((ds, i) => {
        if (i !== index) {
          ds.backgroundColor = 'rgba(0, 0, 0, 0.1)';
        }
      });
      
      this.chart.update();
      
      // Reset after 2 seconds
      setTimeout(() => {
        if (this.chart) {
          this.chart.data.datasets.forEach((ds, i) => {
            ds.backgroundColor = this.generateBackgroundColors()[i];
          });
          this.chart.update();
        }
      }, 2000);
    }
  }
}

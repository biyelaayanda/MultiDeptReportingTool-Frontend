import { Component, Input, OnInit, ViewChild, ElementRef, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration } from 'chart.js';
import { ChartDataPoint, EnhancedChartOptions } from './base-chart.component';

export interface LineChartDataset {
  label: string;
  data: ChartDataPoint[];
  borderColor?: string;
  backgroundColor?: string;
  fill?: boolean;
  tension?: number;
}

@Component({
  selector: 'app-line-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="line-chart-container">
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
    </div>
  `,
  styles: [`
    .line-chart-container {
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
      min-height: 300px;
    }

    .chart-loading {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }
  `]
})
export class LineChartComponent implements OnInit {
  @ViewChild('chartCanvas', { static: true }) chartCanvas!: ElementRef<HTMLCanvasElement>;
  
  @Input() datasets: LineChartDataset[] = [];
  @Input() height: string = '400px';
  @Input() options?: EnhancedChartOptions;
  @Input() showAreaFill: boolean = false;
  @Input() smooth: boolean = true;
  @Input() showDataPoints: boolean = true;
  @Input() isLoading: boolean = false;
  
  @Output() chartReady = new EventEmitter<Chart>();

  private chart: Chart | null = null;

  ngOnInit() {
    if (this.datasets && this.datasets.length > 0) {
      this.createChart();
    }
  }

  private createChart() {
    if (this.chart) {
      this.chart.destroy();
    }

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const config = this.buildChartConfiguration();
    this.chart = new Chart(ctx, config);
    this.chartReady.emit(this.chart);
  }

  private buildChartConfiguration(): ChartConfiguration {
    return {
      type: 'line',
      data: {
        labels: this.datasets[0]?.data.map(d => d.label) || [],
        datasets: this.datasets.map((dataset, index) => ({
          label: dataset.label,
          data: dataset.data.map(d => d.value),
          borderColor: dataset.borderColor || this.generateLineColors()[index],
          backgroundColor: dataset.backgroundColor || (this.showAreaFill ? this.generateAreaColors()[index] : 'transparent'),
          borderWidth: 3,
          fill: dataset.fill !== undefined ? dataset.fill : this.showAreaFill,
          tension: this.smooth ? (dataset.tension || 0.4) : 0,
          pointRadius: this.showDataPoints ? 4 : 0,
          pointHoverRadius: this.showDataPoints ? 6 : 0,
          pointBackgroundColor: dataset.borderColor || this.generateLineColors()[index],
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        }))
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        scales: {
          x: {
            display: true,
            grid: {
              display: true,
              color: 'rgba(0, 0, 0, 0.05)'
            }
          },
          y: {
            display: true,
            beginAtZero: true,
            grid: {
              display: true,
              color: 'rgba(0, 0, 0, 0.05)'
            }
          }
        },
        plugins: {
          tooltip: {
            mode: 'index',
            intersect: false,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: '#3b82f6',
            borderWidth: 1,
            cornerRadius: 8
          },
          legend: {
            display: this.datasets.length > 1,
            position: 'bottom',
            labels: {
              padding: 20,
              usePointStyle: true
            }
          }
        },
        animation: {
          duration: 1000,
          easing: 'easeInOutQuart'
        }
      }
    };
  }

  private generateLineColors(): string[] {
    return [
      '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
      '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
    ];
  }

  private generateAreaColors(): string[] {
    return [
      'rgba(59, 130, 246, 0.1)', 'rgba(16, 185, 129, 0.1)', 'rgba(245, 158, 11, 0.1)',
      'rgba(239, 68, 68, 0.1)', 'rgba(139, 92, 246, 0.1)', 'rgba(6, 182, 212, 0.1)',
      'rgba(132, 204, 22, 0.1)', 'rgba(249, 115, 22, 0.1)', 'rgba(236, 72, 153, 0.1)',
      'rgba(99, 102, 241, 0.1)'
    ];
  }

  public updateDatasets(newDatasets: LineChartDataset[]) {
    this.datasets = newDatasets;
    this.createChart();
  }
}

import { Component, Input, OnInit, ViewChild, ElementRef, Output, EventEmitter } from '@angular/core';
import { Chart, ChartConfiguration } from 'chart.js';
import { ChartDataPoint, EnhancedChartOptions } from './base-chart.component';

export interface BarChartDataset {
  label: string;
  data: ChartDataPoint[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
  borderRadius?: number;
}

@Component({
  selector: 'app-bar-chart',
  template: `
    <div class="bar-chart-container">
      <div class="chart-header" *ngIf="options?.title">
        <h4 class="chart-title">{{ options?.title }}</h4>
        <p class="chart-subtitle" *ngIf="options?.subtitle">{{ options?.subtitle }}</p>
      </div>
      <div class="chart-controls" *ngIf="enableDrillDown">
        <button class="btn btn-sm btn-outline-primary" 
                *ngIf="drillDownLevel > 0"
                (click)="goBack()">
          <i class="fas fa-arrow-left"></i> Back
        </button>
        <span class="drill-level" *ngIf="drillDownLevel > 0">
          Level {{ drillDownLevel + 1 }}
        </span>
      </div>
      <div class="chart-wrapper" [style.height]="height">
        <canvas #chartCanvas></canvas>
      </div>
      <div class="chart-loading" *ngIf="isLoading">
        <div class="spinner-border text-primary" role="status"></div>
      </div>
      <div class="chart-actions" *ngIf="showActions">
        <button class="btn btn-sm btn-outline-secondary" (click)="toggleOrientation()">
          <i class="fas fa-exchange-alt"></i> 
          {{ isHorizontal ? 'Vertical' : 'Horizontal' }}
        </button>
        <button class="btn btn-sm btn-outline-secondary" (click)="toggleAnimations()">
          <i class="fas fa-play"></i> 
          {{ animationsEnabled ? 'Disable' : 'Enable' }} Animations
        </button>
      </div>
    </div>
  `,
  styles: [`
    .bar-chart-container {
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

    .chart-controls {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      padding: 0.5rem 0;
    }

    .drill-level {
      font-size: 0.875rem;
      color: var(--text-muted);
      font-weight: 500;
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

    .chart-actions {
      display: flex;
      justify-content: center;
      gap: 0.5rem;
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border-color);
    }

    .btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.2s ease;
    }

    .btn:hover {
      transform: translateY(-1px);
    }

    @media (max-width: 768px) {
      .chart-actions {
        flex-direction: column;
        align-items: center;
      }
      
      .chart-controls {
        flex-direction: column;
        gap: 0.5rem;
      }
    }
  `]
})
export class BarChartComponent implements OnInit {
  @ViewChild('chartCanvas', { static: true }) chartCanvas!: ElementRef<HTMLCanvasElement>;
  
  @Input() datasets: BarChartDataset[] = [];
  @Input() height: string = '400px';
  @Input() options?: EnhancedChartOptions;
  @Input() isLoading: boolean = false;
  @Input() enableDrillDown: boolean = true;
  @Input() showActions: boolean = true;
  @Input() isHorizontal: boolean = false;
  @Input() showDataLabels: boolean = false;
  
  @Output() chartReady = new EventEmitter<Chart>();
  @Output() barClick = new EventEmitter<{dataPoint: ChartDataPoint, drillDown?: any}>();
  @Output() drillDownChange = new EventEmitter<{level: number, data: any}>();

  private chart: Chart | null = null;
  public drillDownLevel: number = 0;
  private drillDownHistory: any[] = [];
  public animationsEnabled: boolean = true;

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

    const config = this.buildBarConfiguration();
    this.chart = new Chart(ctx, config);
    this.chartReady.emit(this.chart);
  }

  private buildBarConfiguration(): ChartConfiguration {
    const flatData = this.datasets[0]?.data || [];
    
    return {
      type: 'bar' as const,
      data: {
        labels: flatData.map(d => d.label),
        datasets: this.datasets.map((dataset, index) => ({
          label: dataset.label,
          data: dataset.data.map(d => d.value),
          backgroundColor: Array.isArray(dataset.backgroundColor) 
            ? dataset.backgroundColor 
            : (dataset.backgroundColor || this.generateColors()),
          borderColor: Array.isArray(dataset.borderColor)
            ? dataset.borderColor
            : (dataset.borderColor || this.generateBorderColors()),
          borderWidth: dataset.borderWidth || 2,
          borderRadius: dataset.borderRadius || 4,
          borderSkipped: false,
        }))
      },
      options: {
        indexAxis: this.isHorizontal ? 'y' : 'x',
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
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
                const dataPoint = flatData[context.dataIndex];
                let label = `${context.dataset.label}: ${context.parsed.y || context.parsed.x}`;
                
                if (dataPoint.metadata) {
                  Object.keys(dataPoint.metadata).forEach(key => {
                    label += `\n${key}: ${dataPoint.metadata[key]}`;
                  });
                }
                
                return label;
              },
              afterLabel: (context) => {
                if (this.enableDrillDown) {
                  return 'Click to drill down';
                }
                return '';
              }
            }
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
        scales: {
          x: {
            grid: {
              display: !this.isHorizontal,
              color: 'rgba(0, 0, 0, 0.05)'
            },
            ticks: {
              font: {
                size: 11
              }
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              display: this.isHorizontal,
              color: 'rgba(0, 0, 0, 0.05)'
            },
            ticks: {
              font: {
                size: 11
              }
            }
          }
        },
        onClick: (event, elements) => {
          if (elements && elements.length > 0) {
            const element = elements[0];
            const dataPoint = flatData[element.index];
            
            this.barClick.emit({
              dataPoint: dataPoint,
              drillDown: dataPoint.metadata?.drillDown
            });
            
            if (this.enableDrillDown && dataPoint.metadata?.drillDown) {
              this.performDrillDown(dataPoint);
            }
          }
        },
        onHover: (event, elements) => {
          const canvas = event.native?.target as HTMLCanvasElement;
          if (canvas) {
            canvas.style.cursor = elements && elements.length > 0 ? 'pointer' : 'default';
          }
        },
        animation: {
          duration: this.animationsEnabled ? 1000 : 0,
          easing: 'easeInOutQuart'
        }
      }
    };
  }

  private generateColors(): string[] {
    const colors = [
      '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
      '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
    ];
    
    return this.datasets[0]?.data.map((_, index) => 
      colors[index % colors.length]
    ) || [];
  }

  private generateBorderColors(): string[] {
    const borderColors = [
      '#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed',
      '#0891b2', '#65a30d', '#ea580c', '#db2777', '#4f46e5'
    ];
    
    return this.datasets[0]?.data.map((_, index) => 
      borderColors[index % borderColors.length]
    ) || [];
  }

  private performDrillDown(dataPoint: ChartDataPoint) {
    // Save current state
    this.drillDownHistory.push({
      level: this.drillDownLevel,
      datasets: [...this.datasets],
      title: this.options?.title
    });
    
    this.drillDownLevel++;
    
    // Simulate drill down data (in real implementation, this would come from API)
    const drillDownData = this.generateDrillDownData(dataPoint);
    this.datasets = [drillDownData];
    
    // Update title
    if (this.options) {
      this.options.title = `${dataPoint.label} - Detailed View`;
    }
    
    this.createChart();
    
    this.drillDownChange.emit({
      level: this.drillDownLevel,
      data: dataPoint
    });
  }

  private generateDrillDownData(parentDataPoint: ChartDataPoint): BarChartDataset {
    // This is a mock implementation - in real app, this would fetch from API
    const mockDrillDownData = [
      { label: 'Q1', value: Math.random() * 100, category: 'quarter' },
      { label: 'Q2', value: Math.random() * 100, category: 'quarter' },
      { label: 'Q3', value: Math.random() * 100, category: 'quarter' },
      { label: 'Q4', value: Math.random() * 100, category: 'quarter' }
    ];
    
    return {
      label: `${parentDataPoint.label} Breakdown`,
      data: mockDrillDownData,
      backgroundColor: this.generateColors().slice(0, 4),
      borderColor: this.generateBorderColors().slice(0, 4)
    };
  }

  public goBack() {
    if (this.drillDownHistory.length > 0) {
      const previousState = this.drillDownHistory.pop();
      this.drillDownLevel = previousState.level;
      this.datasets = previousState.datasets;
      
      if (this.options) {
        this.options.title = previousState.title;
      }
      
      this.createChart();
      
      this.drillDownChange.emit({
        level: this.drillDownLevel,
        data: null
      });
    }
  }

  public toggleOrientation() {
    this.isHorizontal = !this.isHorizontal;
    this.createChart();
  }

  public toggleAnimations() {
    this.animationsEnabled = !this.animationsEnabled;
    this.createChart();
  }

  public updateData(newDatasets: BarChartDataset[]) {
    this.datasets = newDatasets;
    this.createChart();
  }

  public resetDrillDown() {
    this.drillDownLevel = 0;
    this.drillDownHistory = [];
    // Reset to original data if needed
  }
}

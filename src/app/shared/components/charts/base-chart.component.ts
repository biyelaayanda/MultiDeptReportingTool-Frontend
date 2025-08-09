import { Component, Input, OnInit, OnDestroy, ViewChild, ElementRef, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, ChartType, Plugin, TooltipItem } from 'chart.js';

// Register Chart.js components
import {
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  ArcElement,
  RadialLinearScale,
  Filler
} from 'chart.js';

Chart.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  ArcElement,
  RadialLinearScale,
  Filler
);

export interface ChartDataPoint {
  label: string;
  value: number;
  category?: string;
  metadata?: any;
}

export interface ChartClickEvent {
  dataPoint: ChartDataPoint;
  chartElement: any;
  event: any;
}

export interface EnhancedChartOptions {
  title?: string;
  subtitle?: string;
  enableDrillDown?: boolean;
  enableZoom?: boolean;
  enableAnimation?: boolean;
  showDataLabels?: boolean;
  customTooltip?: boolean;
  theme?: 'light' | 'dark';
  interactive?: boolean;
}

@Component({
  selector: 'app-base-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart-container" [class.interactive]="options?.interactive">
      <div class="chart-header" *ngIf="options?.title || options?.subtitle">
        <h4 class="chart-title" *ngIf="options?.title">{{ options?.title }}</h4>
        <p class="chart-subtitle" *ngIf="options?.subtitle">{{ options?.subtitle }}</p>
      </div>
      <div class="chart-wrapper" [style.height]="height">
        <canvas #chartCanvas 
                [attr.aria-label]="options?.title || 'Interactive Chart'"
                role="img">
        </canvas>
      </div>
      <div class="chart-loading" *ngIf="isLoading">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading chart...</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .chart-container {
      background: var(--bs-white);
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
    }

    .chart-container.interactive:hover {
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
      transform: translateY(-2px);
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
      line-height: 1.4;
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
      z-index: 10;
    }

    canvas {
      max-width: 100%;
      height: auto !important;
    }

    /* Enhanced animations */
    .chart-container {
      animation: fadeInUp 0.6s ease-out;
    }

    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* Responsive adjustments */
    @media (max-width: 768px) {
      .chart-container {
        padding: 1rem;
        margin-bottom: 1rem;
      }
      
      .chart-title {
        font-size: 1.1rem;
      }
      
      .chart-wrapper {
        min-height: 250px;
      }
    }
  `]
})
export class BaseChartComponent implements OnInit, OnDestroy {
  @ViewChild('chartCanvas', { static: true }) chartCanvas!: ElementRef<HTMLCanvasElement>;
  
  @Input() type: ChartType = 'bar';
  @Input() data: ChartDataPoint[] = [];
  @Input() height: string = '400px';
  @Input() options?: EnhancedChartOptions;
  @Input() customConfig?: Partial<ChartConfiguration>;
  @Input() isLoading: boolean = false;
  
  @Output() chartClick = new EventEmitter<ChartClickEvent>();
  @Output() chartHover = new EventEmitter<ChartDataPoint | null>();
  @Output() chartReady = new EventEmitter<Chart>();

  protected chart: Chart | null = null;

  ngOnInit() {
    if (this.data && this.data.length > 0) {
      this.createChart();
    }
  }

  ngOnDestroy() {
    if (this.chart) {
      this.chart.destroy();
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
    const baseConfig: ChartConfiguration = {
      type: this.type,
      data: {
        labels: this.data.map(d => d.label),
        datasets: [{
          label: this.options?.title || 'Data',
          data: this.data.map(d => d.value),
          backgroundColor: this.generateColors(),
          borderColor: this.generateBorderColors(),
          borderWidth: 2,
          borderRadius: 4,
          borderSkipped: false,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          title: {
            display: !!this.options?.title,
            text: this.options?.title || '',
            font: {
              size: 16,
              weight: 'bold'
            },
            color: '#1e40af'
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: '#3b82f6',
            borderWidth: 1,
            cornerRadius: 8,
            callbacks: this.options?.customTooltip ? this.getCustomTooltipCallbacks() : undefined
          },
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              padding: 20,
              usePointStyle: true,
              font: {
                size: 12
              }
            }
          }
        },
        scales: this.getScaleConfiguration(),
        onClick: (event, elements) => {
          if (elements && elements.length > 0 && this.options?.enableDrillDown) {
            const element = elements[0];
            const dataPoint = this.data[element.index];
            this.chartClick.emit({
              dataPoint,
              chartElement: element,
              event: event
            });
          }
        },
        onHover: (event, elements) => {
          const canvas = event.native?.target as HTMLCanvasElement;
          if (canvas) {
            canvas.style.cursor = elements && elements.length > 0 ? 'pointer' : 'default';
          }
          
          if (elements && elements.length > 0) {
            const dataPoint = this.data[elements[0].index];
            this.chartHover.emit(dataPoint);
          } else {
            this.chartHover.emit(null);
          }
        },
        animation: {
          duration: this.options?.enableAnimation !== false ? 1000 : 0,
          easing: 'easeInOutQuart'
        }
      }
    };

    // Merge with custom configuration
    if (this.customConfig) {
      return this.mergeDeep(baseConfig, this.customConfig) as ChartConfiguration;
    }

    return baseConfig;
  }

  private generateColors(): string[] {
    const primaryColors = [
      '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
      '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
    ];
    
    return this.data.map((_, index) => 
      primaryColors[index % primaryColors.length]
    );
  }

  private generateBorderColors(): string[] {
    const borderColors = [
      '#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed',
      '#0891b2', '#65a30d', '#ea580c', '#db2777', '#4f46e5'
    ];
    
    return this.data.map((_, index) => 
      borderColors[index % borderColors.length]
    );
  }

  private getScaleConfiguration(): any {
    if (this.type === 'pie' || this.type === 'doughnut') {
      return {};
    }

    return {
      x: {
        grid: {
          display: false
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
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          font: {
            size: 11
          }
        }
      }
    };
  }

  private getCustomTooltipCallbacks() {
    return {
      title: (context: TooltipItem<any>[]) => {
        return context[0]?.label || '';
      },
      label: (context: TooltipItem<any>) => {
        const dataPoint = this.data[context.dataIndex];
        let label = `${context.dataset.label}: ${context.parsed.y || context.parsed}`;
        
        if (dataPoint.metadata) {
          Object.keys(dataPoint.metadata).forEach(key => {
            label += `\n${key}: ${dataPoint.metadata[key]}`;
          });
        }
        
        return label;
      }
    };
  }

  private mergeDeep(target: any, source: any): any {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.mergeDeep(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  // Public methods for external control
  public updateData(newData: ChartDataPoint[]) {
    this.data = newData;
    if (this.chart) {
      this.chart.data.labels = newData.map(d => d.label);
      this.chart.data.datasets[0].data = newData.map(d => d.value);
      this.chart.update('active');
    }
  }

  public updateOptions(newOptions: EnhancedChartOptions) {
    this.options = { ...this.options, ...newOptions };
    if (this.chart) {
      this.createChart(); // Recreate chart with new options
    }
  }

  public exportChart(): string | undefined {
    return this.chart?.toBase64Image();
  }

  public resizeChart() {
    if (this.chart) {
      this.chart.resize();
    }
  }
}

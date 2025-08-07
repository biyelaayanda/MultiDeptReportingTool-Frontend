import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

// Import Chart.js and register components
import {
  Chart,
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

// Register Chart.js components globally
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

// Import our chart components
import { BaseChartComponent } from './base-chart.component';
import { LineChartComponent } from './line-chart.component';
import { BarChartComponent } from './bar-chart.component';
import { RadarChartComponent } from './radar-chart.component';

@NgModule({
  declarations: [
    BaseChartComponent,
    LineChartComponent,
    BarChartComponent,
    RadarChartComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [
    BaseChartComponent,
    LineChartComponent,
    BarChartComponent,
    RadarChartComponent
  ]
})
export class ChartsModule { }

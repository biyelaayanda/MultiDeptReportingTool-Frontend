import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DashboardComponent } from './admin/dashboard/dashboard.component';
import { DepartmentLeadComponent } from './department-lead/department-lead.component';
import { ExecutiveComponent } from './executive/executive.component';
import { ReportingComponent } from './reporting/reporting.component';
import { StaffUserComponent } from './staff-user/staff-user.component';
import { AuthComponent } from './core/auth/auth.component';
import { ChartComponent } from './shared/components/chart.component';

// Import the new Charts Module
import { ChartsModule } from './shared/components/charts/charts.module';

// Services and Interceptors
import { AuthService } from './core/services/auth.service';
import { AnalyticsService } from './core/services/analytics.service';
import { ExportService } from './core/services/export.service';
import { TokenInterceptor } from './core/services/token.interceptor';

@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    DepartmentLeadComponent,
    ExecutiveComponent,
    ReportingComponent,
    StaffUserComponent,
    AuthComponent,
    ChartComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    ChartsModule
  ],
  providers: [
    AuthService,
    AnalyticsService,
    ExportService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: TokenInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

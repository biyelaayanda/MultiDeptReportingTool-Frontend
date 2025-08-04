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

// Services and Interceptors
import { AuthService } from './core/services/auth.service';
import { TokenInterceptor } from './core/services/token.interceptor';

@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    DepartmentLeadComponent,
    ExecutiveComponent,
    ReportingComponent,
    StaffUserComponent,
    AuthComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule
  ],
  providers: [
    AuthService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: TokenInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

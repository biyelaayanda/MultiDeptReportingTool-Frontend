import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './admin/dashboard/dashboard.component';
import { DepartmentLeadComponent } from './department-lead/department-lead.component';
import { ExecutiveComponent } from './executive/executive.component';
import { ReportingComponent } from './reporting/reporting.component';
import { StaffUserComponent } from './staff-user/staff-user.component';
import { AuthComponent } from './core/auth/auth.component';
import { RegisterComponent } from './register/register.component';
import { AuthGuard } from './core/guards/auth.guard';

const routes: Routes = [
  { path: '', redirectTo: '/auth', pathMatch: 'full' },
  { path: 'auth', component: AuthComponent },
  { path: 'register', component: RegisterComponent },
  { 
    path: 'dashboard', 
    component: DashboardComponent, 
    canActivate: [AuthGuard],
    data: { role: 'Admin' }
  },
  { 
    path: 'department-lead', 
    component: DepartmentLeadComponent, 
    canActivate: [AuthGuard],
    data: { role: 'DepartmentLead' }
  },
  { 
    path: 'executive', 
    component: ExecutiveComponent, 
    canActivate: [AuthGuard],
    data: { role: 'Executive' }
  },
  { 
    path: 'reporting', 
    component: ReportingComponent, 
    canActivate: [AuthGuard]
  },
  { 
    path: 'staff-user', 
    component: StaffUserComponent, 
    canActivate: [AuthGuard],
    data: { role: 'Staff' }
  },
  { path: '**', redirectTo: '/auth' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

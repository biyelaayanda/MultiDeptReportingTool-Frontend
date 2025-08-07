import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, map, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface StaffStats {
  totalReports: number;
  completedReports: number;
  pendingReports: number;
  draftReports: number;
  completionRate: number;
  thisMonthSubmissions: number;
  averageCompletionTime: number;
  lastSubmissionDate: Date | null;
}

export interface StaffNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'deadline' | 'feedback';
  timestamp: Date;
  isRead: boolean;
  relatedReportId?: number;
  actionUrl?: string;
}

export interface StaffActivity {
  id: string;
  action: string;
  details: string;
  timestamp: Date;
  type: 'submission' | 'feedback' | 'deadline' | 'meeting' | 'approval' | 'edit';
  relatedReportId?: number;
  status?: string;
}

export interface UserReport {
  id: number;
  title: string;
  description: string;
  status: string;
  createdAt: Date;
  submittedAt?: Date;
  approvedAt?: Date;
  departmentId: number;
  departmentName: string;
  reportType: string;
  priority: string;
  feedbackComments?: string;
  lastModifiedAt: Date;
}

export interface StaffDashboardData {
  userInfo: {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    department: string;
    role: string;
    joinDate: Date;
  };
  stats: StaffStats;
  notifications: StaffNotification[];
  recentActivities: StaffActivity[];
  recentReports: UserReport[];
  upcomingDeadlines: any[];
  departmentGoals: {
    monthlyTarget: number;
    currentProgress: number;
    daysRemaining: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class StaffService {
  private readonly apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  // Get comprehensive staff dashboard data
  getStaffDashboardData(): Observable<StaffDashboardData> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    // Make parallel requests for all staff data
    return forkJoin({
      userProfile: this.getUserProfile(),
      stats: this.getStaffStats(),
      notifications: this.getStaffNotifications(),
      recentActivities: this.getRecentActivities(),
      recentReports: this.getUserReports(5), // Get last 5 reports
      upcomingDeadlines: this.getUpcomingDeadlines(),
      departmentGoals: this.getDepartmentGoals()
    }).pipe(
      map(data => ({
        userInfo: data.userProfile,
        stats: data.stats,
        notifications: data.notifications,
        recentActivities: data.recentActivities,
        recentReports: data.recentReports,
        upcomingDeadlines: data.upcomingDeadlines,
        departmentGoals: data.departmentGoals
      }))
    );
  }

  // Get user profile information
  getUserProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/auth/profile`).pipe(
      map((profile: any) => ({
        id: profile.id || 0,
        username: profile.username || '',
        firstName: profile.firstName || profile.username || 'Staff',
        lastName: profile.lastName || 'Member',
        email: profile.email || '',
        department: profile.department || 'Unknown',
        role: profile.role || 'Staff',
        joinDate: profile.joinDate ? new Date(profile.joinDate) : new Date()
      })),
      catchError(error => {
        console.error('Error fetching user profile:', error);
        const currentUser = this.authService.getCurrentUser();
        return of({
          id: currentUser?.id || 1,
          username: currentUser?.username || 'Staff',
          firstName: currentUser?.username || 'Staff',
          lastName: 'Member',
          email: currentUser?.email || '',
          department: currentUser?.department || 'Unknown',
          role: currentUser?.role || 'Staff',
          joinDate: new Date()
        });
      })
    );
  }

  // Get staff statistics
  getStaffStats(): Observable<StaffStats> {
    const currentUser = this.authService.getCurrentUser();
    const userId = currentUser?.id;
    
    if (!userId) {
      console.warn('No user ID available, returning fallback stats');
      return of(this.getFallbackStats());
    }

    const params = new HttpParams().set('userId', userId.toString());
    
    return this.http.get<any>(`${this.apiUrl}/Reports/user-stats`, { params }).pipe(
      map(stats => ({
        totalReports: stats.totalReports || 0,
        completedReports: stats.completedReports || 0,
        pendingReports: stats.pendingReports || 0,
        draftReports: stats.draftReports || 0,
        completionRate: stats.completionRate || 0,
        thisMonthSubmissions: stats.thisMonthSubmissions || 0,
        averageCompletionTime: stats.averageCompletionTime || 0,
        lastSubmissionDate: stats.lastSubmissionDate ? new Date(stats.lastSubmissionDate) : null
      })),
      catchError(error => {
        console.error('Error fetching staff stats:', error);
        return of(this.getFallbackStats());
      })
    );
  }

  // Get user-specific notifications
  getStaffNotifications(): Observable<StaffNotification[]> {
    return this.http.get<any[]>(`${this.apiUrl}/notifications/user`).pipe(
      map(notifications => notifications.map(notif => ({
        id: notif.id || Math.random().toString(36),
        title: notif.title || 'Notification',
        message: notif.message || '',
        type: notif.type || 'info',
        timestamp: notif.timestamp ? new Date(notif.timestamp) : new Date(),
        isRead: notif.isRead || false,
        relatedReportId: notif.relatedReportId,
        actionUrl: notif.actionUrl
      }))),
      catchError((error: any) => {
        console.error('Error fetching notifications:', error);
        return of(this.getFallbackNotifications());
      })
    );
  }

  // Get recent activities for the user
  getRecentActivities(): Observable<StaffActivity[]> {
    const params = new HttpParams().set('limit', '10');
    return this.http.get<any[]>(`${this.apiUrl}/activities/user`, { params }).pipe(
      map(activities => activities.map(activity => ({
        id: activity.id || Math.random().toString(36),
        action: activity.action || 'Activity',
        details: activity.details || '',
        timestamp: activity.timestamp ? new Date(activity.timestamp) : new Date(),
        type: activity.type || 'submission',
        relatedReportId: activity.relatedReportId,
        status: activity.status
      }))),
      catchError((error: any) => {
        console.error('Error fetching activities:', error);
        return of(this.getFallbackActivities());
      })
    );
  }

  // Get user's reports
  getUserReports(limit?: number): Observable<UserReport[]> {
    let params = new HttpParams();
    if (limit) {
      params = params.set('limit', limit.toString());
    }
    
    return this.http.get<any[]>(`${this.apiUrl}/Reports/user`, { params }).pipe(
      map(reports => reports.map(report => ({
        id: report.id,
        title: report.title || 'Untitled Report',
        description: report.description || '',
        status: report.status || 'Draft',
        createdAt: new Date(report.createdAt),
        submittedAt: report.submittedAt ? new Date(report.submittedAt) : undefined,
        approvedAt: report.approvedAt ? new Date(report.approvedAt) : undefined,
        departmentId: report.departmentId || 0,
        departmentName: report.departmentName || 'Unknown',
        reportType: report.reportType || 'General',
        priority: report.priority || 'Normal',
        feedbackComments: report.feedbackComments,
        lastModifiedAt: new Date(report.lastModifiedAt || report.createdAt)
      }))),
      catchError((error: any) => {
        console.error('Error fetching user reports:', error);
        return of([]);
      })
    );
  }

  // Get upcoming deadlines
  getUpcomingDeadlines(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/Reports/deadlines/upcoming`).pipe(
      map(deadlines => deadlines.map(deadline => ({
        id: deadline.id,
        title: deadline.title || 'Report Deadline',
        dueDate: new Date(deadline.dueDate),
        priority: deadline.priority || 'Normal',
        description: deadline.description || '',
        daysRemaining: Math.ceil((new Date(deadline.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      }))),
      catchError((error: any) => {
        console.error('Error fetching deadlines:', error);
        return of([]);
      })
    );
  }

  // Get department goals and targets
  getDepartmentGoals(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/departments/goals/current`).pipe(
      map(goals => ({
        monthlyTarget: goals.monthlyTarget || 10,
        currentProgress: goals.currentProgress || 0,
        daysRemaining: goals.daysRemaining || 0
      })),
      catchError((error: any) => {
        console.error('Error fetching department goals:', error);
        return of({
          monthlyTarget: 10,
          currentProgress: 3,
          daysRemaining: 15
        });
      })
    );
  }

  // Mark notification as read
  markNotificationAsRead(notificationId: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/api/notifications/${notificationId}/read`, {});
  }

  // Dismiss notification
  dismissNotification(notificationId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/api/notifications/${notificationId}`);
  }

  // Get report templates
  getReportTemplates(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/Reports/templates`);
  }

  // Create new report from template
  createReportFromTemplate(templateId: number, title: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/Reports/from-template`, {
      templateId,
      title
    });
  }

  // Get user performance metrics
  getUserPerformanceMetrics(timeframe: string = '30d'): Observable<any> {
    const params = new HttpParams().set('timeframe', timeframe);
    return this.http.get(`${this.apiUrl}/api/analytics/user-performance`, { params });
  }

  // Get department leaderboard
  getDepartmentLeaderboard(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/analytics/department-leaderboard`);
  }

  // Submit feedback
  submitFeedback(feedback: { type: string; message: string; rating?: number }): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/api/feedback`, feedback);
  }

  // Get help articles
  getHelpArticles(category?: string): Observable<any[]> {
    let params = new HttpParams();
    if (category) {
      params = params.set('category', category);
    }
    return this.http.get<any[]>(`${this.apiUrl}/api/help/articles`, { params });
  }

  // Search reports
  searchUserReports(query: string): Observable<UserReport[]> {
    const params = new HttpParams().set('query', query);
    return this.http.get<any[]>(`${this.apiUrl}/api/Reports/search`, { params }).pipe(
      map(reports => reports.map(report => ({
        id: report.id,
        title: report.title || 'Untitled Report',
        description: report.description || '',
        status: report.status || 'Draft',
        createdAt: new Date(report.createdAt),
        submittedAt: report.submittedAt ? new Date(report.submittedAt) : undefined,
        approvedAt: report.approvedAt ? new Date(report.approvedAt) : undefined,
        departmentId: report.departmentId || 0,
        departmentName: report.departmentName || 'Unknown',
        reportType: report.reportType || 'General',
        priority: report.priority || 'Normal',
        feedbackComments: report.feedbackComments,
        lastModifiedAt: new Date(report.lastModifiedAt || report.createdAt)
      })))
    );
  }

  // Refresh dashboard data
  refreshDashboardData(): Observable<StaffDashboardData> {
    return this.getStaffDashboardData();
  }

  // Fallback methods for when APIs are not available
  private getFallbackStats(): StaffStats {
    return {
      totalReports: 12,
      completedReports: 10,
      pendingReports: 2,
      draftReports: 1,
      completionRate: 83.3,
      thisMonthSubmissions: 5,
      averageCompletionTime: 2.5,
      lastSubmissionDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    };
  }

  private getFallbackNotifications(): StaffNotification[] {
    return [
      {
        id: '1',
        title: 'Report Deadline',
        message: 'Q3 Performance Report due tomorrow',
        type: 'deadline',
        timestamp: new Date(),
        isRead: false
      },
      {
        id: '2',
        title: 'Feedback Available',
        message: 'Your manager has provided feedback on Project Alpha report',
        type: 'feedback',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        isRead: false
      }
    ];
  }

  private getFallbackActivities(): StaffActivity[] {
    return [
      {
        id: '1',
        action: 'Report Submitted',
        details: '"Monthly Sales Analysis" submitted successfully',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
        type: 'submission'
      },
      {
        id: '2',
        action: 'Report Approved',
        details: '"Q2 Performance Review" has been approved',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        type: 'approval'
      },
      {
        id: '3',
        action: 'Draft Created',
        details: 'Started working on "Team Productivity Report"',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        type: 'edit'
      }
    ];
  }
}

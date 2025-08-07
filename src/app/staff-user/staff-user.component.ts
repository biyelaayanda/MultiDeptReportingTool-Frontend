import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { StaffService, StaffDashboardData, StaffNotification } from '../core/services/staff.service';
import { Subject, interval, takeUntil, catchError, of, finalize } from 'rxjs';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  route?: string;
  action?: () => void;
}

@Component({
  selector: 'app-staff-user',
  templateUrl: './staff-user.component.html',
  styleUrls: ['./staff-user.component.css']
})
export class StaffUserComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  
  // User and dashboard data
  currentUser: any = null;
  dashboardData: StaffDashboardData | null = null;
  currentTime: Date = new Date();
  dailyTip: string = '';
  
  // Loading and error states
  isLoading = true;
  isRefreshing = false;
  error: string | null = null;

  // Quick actions for staff
  quickActions: QuickAction[] = [
    {
      id: 'submit-report',
      title: 'Submit New Report',
      description: 'Create and submit a new report',
      icon: 'fas fa-plus-circle',
      color: 'primary',
      route: '/reporting'
    },
    {
      id: 'view-reports',
      title: 'My Reports',
      description: 'View all your submitted reports',
      icon: 'fas fa-file-alt',
      color: 'info',
      action: () => this.viewMyReports()
    },
    {
      id: 'track-progress',
      title: 'Track Progress',
      description: 'Monitor your performance',
      icon: 'fas fa-chart-line',
      color: 'success',
      action: () => this.viewProgress()
    },
    {
      id: 'get-help',
      title: 'Get Help',
      description: 'Access help and support',
      icon: 'fas fa-question-circle',
      color: 'warning',
      action: () => this.getHelp()
    }
  ];

  // Daily tips array
  dailyTips: string[] = [
    "📝 Tip: Use clear, concise language in your reports for better impact!",
    "🎯 Remember: Quality over quantity - focus on accurate data!",
    "💡 Pro tip: Save your reports as drafts to continue later!",
    "🌟 Today's focus: Double-check your data before submitting!",
    "📊 Success tip: Include relevant charts to make your reports more engaging!",
    "⚡ Quick tip: Use templates to save time on recurring reports!",
    "🔍 Quality check: Review your report one more time before submission!"
  ];

  constructor(
    private readonly authService: AuthService,
    private readonly staffService: StaffService,
    private readonly router: Router
  ) { }

  ngOnInit(): void {
    this.initializeComponent();
    this.startTimeUpdate();
    this.setDailyTip();
    this.setupAutoRefresh();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeComponent(): void {
    // Get current user
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
        if (user) {
          this.loadDashboardData();
        } else {
          this.router.navigate(['/auth']);
        }
      });
  }

  private loadDashboardData(): void {
    this.isLoading = true;
    this.error = null;

    this.staffService.getStaffDashboardData()
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error('Error loading dashboard data:', error);
          this.error = 'Failed to load dashboard data. Please try again.';
          
          // Return fallback data
          return of(this.getFallbackDashboardData());
        }),
        finalize(() => {
          this.isLoading = false;
          this.isRefreshing = false;
        })
      )
      .subscribe(data => {
        this.dashboardData = data;
        this.updateCurrentUserInfo(data.userInfo);
      });
  }

  private getFallbackDashboardData(): StaffDashboardData {
    const currentUser = this.authService.getCurrentUser();
    return {
      userInfo: {
        id: currentUser?.id || 0,
        username: currentUser?.username || 'User',
        firstName: currentUser?.username || 'Staff',
        lastName: 'Member',
        email: currentUser?.email || '',
        department: currentUser?.department || 'General',
        role: currentUser?.role || 'Staff',
        joinDate: new Date()
      },
      stats: {
        totalReports: 12,
        completedReports: 10,
        pendingReports: 2,
        draftReports: 1,
        completionRate: 83.3,
        thisMonthSubmissions: 5,
        averageCompletionTime: 2.5,
        lastSubmissionDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      notifications: [
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
      ],
      recentActivities: [
        {
          id: '1',
          action: 'Report Submitted',
          details: '"Monthly Sales Analysis" submitted successfully',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
          type: 'submission'
        },
        {
          id: '2',
          action: 'Feedback Received',
          details: 'Positive feedback on "Customer Survey Report"',
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          type: 'feedback'
        }
      ],
      recentReports: [],
      upcomingDeadlines: [],
      departmentGoals: {
        monthlyTarget: 10,
        currentProgress: 5,
        daysRemaining: 15
      }
    };
  }

  private updateCurrentUserInfo(userInfo: any): void {
    if (userInfo) {
      this.currentUser = {
        ...this.currentUser,
        ...userInfo
      };
    }
  }

  private setDailyTip(): void {
    const today = new Date().getDay();
    this.dailyTip = this.dailyTips[today % this.dailyTips.length];
  }

  private startTimeUpdate(): void {
    interval(60000) // Update every minute
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.currentTime = new Date();
      });
  }

  private setupAutoRefresh(): void {
    // Refresh dashboard data every 5 minutes
    interval(5 * 60 * 1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (!this.isLoading && !this.isRefreshing) {
          this.refreshDashboard(false);
        }
      });
  }

  // Getters for template
  get staffStats() {
    return this.dashboardData?.stats || {
      totalReports: 0,
      completedReports: 0,
      pendingReports: 0,
      draftReports: 0,
      completionRate: 0,
      thisMonthSubmissions: 0,
      averageCompletionTime: 0,
      lastSubmissionDate: null
    };
  }

  get notifications() {
    return this.dashboardData?.notifications || [];
  }

  get recentActivities() {
    return this.dashboardData?.recentActivities || [];
  }

  get departmentGoals() {
    return this.dashboardData?.departmentGoals || {
      monthlyTarget: 10,
      currentProgress: 0,
      daysRemaining: 0
    };
  }

  // Action handlers
  executeQuickAction(action: QuickAction): void {
    if (action.route) {
      this.router.navigate([action.route]);
    } else if (action.action) {
      action.action();
    }
  }

  viewMyReports(): void {
    this.router.navigate(['/reporting'], { queryParams: { filter: 'my-reports' } });
  }

  viewProgress(): void {
    // Navigate to progress/analytics page or show modal
    console.log('Viewing progress...');
    // You can implement a modal or navigate to a dedicated progress page
  }

  getHelp(): void {
    // Open help modal or navigate to help page
    console.log('Getting help...');
    // You can implement a help modal or navigate to a help center
  }

  markNotificationAsRead(notification: StaffNotification): void {
    if (!notification.isRead) {
      this.staffService.markNotificationAsRead(notification.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            notification.isRead = true;
          },
          error: (error) => {
            console.error('Error marking notification as read:', error);
          }
        });
    }
  }

  dismissNotification(notificationId: string): void {
    this.staffService.dismissNotification(notificationId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          if (this.dashboardData) {
            this.dashboardData.notifications = this.dashboardData.notifications
              .filter(n => n.id !== notificationId);
          }
        },
        error: (error) => {
          console.error('Error dismissing notification:', error);
        }
      });
  }

  getUnreadNotificationsCount(): number {
    return this.notifications.filter(n => !n.isRead).length;
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }

  getActivityIcon(type: string): string {
    switch (type) {
      case 'submission': return 'fas fa-upload text-success';
      case 'feedback': return 'fas fa-comment text-info';
      case 'deadline': return 'fas fa-clock text-warning';
      case 'meeting': return 'fas fa-users text-primary';
      case 'approval': return 'fas fa-check-circle text-success';
      case 'edit': return 'fas fa-edit text-info';
      default: return 'fas fa-info-circle text-muted';
    }
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'deadline': return 'fas fa-exclamation-triangle text-warning';
      case 'info': return 'fas fa-info-circle text-info';
      case 'success': return 'fas fa-check-circle text-success';
      case 'warning': return 'fas fa-exclamation-circle text-warning';
      case 'feedback': return 'fas fa-comment text-info';
      default: return 'fas fa-bell text-muted';
    }
  }

  refreshDashboard(showLoader: boolean = true): void {
    if (showLoader) {
      this.isLoading = true;
    } else {
      this.isRefreshing = true;
    }
    
    this.loadDashboardData();
  }

  retryLoad(): void {
    this.error = null;
    this.loadDashboardData();
  }

  // Utility methods for template
  getProgressPercentage(): number {
    if (!this.departmentGoals.monthlyTarget) return 0;
    return (this.departmentGoals.currentProgress / this.departmentGoals.monthlyTarget) * 100;
  }

  getCompletionRateColor(): string {
    const rate = this.staffStats.completionRate;
    if (rate >= 90) return 'success';
    if (rate >= 70) return 'warning';
    return 'danger';
  }

  formatTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} minutes ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else {
      return `${diffDays} days ago`;
    }
  }
}

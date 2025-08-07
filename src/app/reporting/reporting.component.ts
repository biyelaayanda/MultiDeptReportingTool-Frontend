import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { ExportService } from '../core/services/export.service';
import { environment } from '../../environments/environment';
import { ExportFormat } from '../core/models/export.model';

// Report Management Interfaces
interface Report {
  id: number;
  title: string;
  description: string;
  reportType: string;
  status: 'Draft' | 'Pending' | 'Approved' | 'Overdue';
  departmentId: number;
  departmentName: string;
  createdByUserId: number;
  createdBy: string;
  reportPeriodStart: Date;
  reportPeriodEnd: Date;
  createdAt: Date;
  submittedAt?: Date;
  approvedAt?: Date;
  approvedByUserId?: number;
  approvedBy?: string;
  comments?: string;
  reportData?: ReportDataField[];
}

interface ReportDataField {
  id?: number;
  reportId: number;
  fieldName: string;
  fieldType: 'Text' | 'Number' | 'Currency' | 'Date' | 'Boolean';
  fieldValue: string;
  numericValue?: number;
  dateValue?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

interface CreateReportRequest {
  title: string;
  description: string;
  reportType: string;
  departmentId: number;
  reportPeriodStart: Date;
  reportPeriodEnd: Date;
  reportData: Omit<ReportDataField, 'id' | 'reportId' | 'createdAt' | 'updatedAt'>[];
}

interface Department {
  id: number;
  name: string;
  description: string;
}

@Component({
  selector: 'app-reporting',
  templateUrl: './reporting.component.html',
  styleUrls: ['./reporting.component.css']
})
export class ReportingComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  // Data
  reports: Report[] = [];
  departments: Department[] = [];
  reportTypes: string[] = [];
  filteredReports: Report[] = [];
  paginatedReports: Report[] = []; // New: reports for current page only
  
  // User Context
  currentUser: any = null;
  userDepartment: string = '';
  userDepartmentId: number = 0;
  isAdmin = false;
  isDepartmentLead = false;
  isExecutive = false;
  
  // UI State
  isLoading = true;
  error: string | null = null;
  selectedView = 'list'; // list, create, edit, details
  
  // Filters and Search
  searchTerm = '';
  statusFilter = 'all';
  typeFilter = 'all';
  departmentFilter = 'all';
  dateRangeFilter = 'all'; // Changed from '30d' to 'all' to show all reports by default
  
  // Pagination - Simple client-side approach
  currentPage = 1;
  pageSize = 10;
  totalReports = 0;
  totalPages = 0;
  
  // Selected Report
  selectedReport: Report | null = null;
  
  // Create/Edit Report
  reportForm: CreateReportRequest = {
    title: '',
    description: '',
    reportType: '',
    departmentId: 0,
    reportPeriodStart: new Date(),
    reportPeriodEnd: new Date(),
    reportData: []
  };
  
  // Report Data Management
  newDataField: Omit<ReportDataField, 'id' | 'reportId' | 'createdAt' | 'updatedAt'> = {
    fieldName: '',
    fieldType: 'Text',
    fieldValue: '',
    numericValue: undefined,
    dateValue: undefined
  };
  
  // Export
  isExporting = false;
  exportFormat: ExportFormat = ExportFormat.PDF;
  ExportFormat = ExportFormat;
  
  // Notifications
  notification: { type: 'success' | 'error' | 'info' | 'warning', message: string } | null = null;
  
  // Validation
  formErrors: { [key: string]: string } = {};
  
  // Math for template
  Math = Math;

  constructor(
    private readonly http: HttpClient,
    private readonly authService: AuthService,
    private readonly exportService: ExportService,
    private readonly router: Router
  ) { }

  ngOnInit(): void {
    this.getCurrentUser();
    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getCurrentUser() {
    this.currentUser = this.authService.getCurrentUser();
    
    if (this.currentUser) {
      // Detect all roles (case-insensitive)
      const userRole = this.currentUser.role?.toLowerCase() || '';
      this.isAdmin = userRole === 'admin';
      this.isDepartmentLead = userRole === 'departmentlead' || userRole === 'department-lead';
      this.isExecutive = userRole === 'executive';
      
      console.log('User Role:', this.currentUser.role, {
        isAdmin: this.isAdmin,
        isDepartmentLead: this.isDepartmentLead,
        isExecutive: this.isExecutive,
        isStaff: userRole === 'staff'
      });
      
      // Extract department info from token
      const token = this.authService.getToken();
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          this.userDepartmentId = parseInt(payload.DepartmentId) || 0;
          
          // Also extract user ID for staff filtering
          const userId = parseInt(payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']) || 0;
          if (this.currentUser) {
            this.currentUser.id = userId;
          }
          
          console.log('User details:', {
            userId: userId,
            departmentId: this.userDepartmentId,
            role: userRole
          });
          
          // Map department IDs to names
          const departmentMap: { [key: string]: string } = {
            '1': 'Finance',
            '2': 'Human Resources',
            '3': 'Operations',
            '4': 'Compliance',
            '5': 'Information Technology'
          };
          
          this.userDepartment = departmentMap[payload.DepartmentId] || 'Unknown';
        } catch (error) {
          console.error('Error parsing token:', error);
        }
      }
    }
  }

  loadInitialData() {
    this.isLoading = true;
    this.error = null;

    // Check if user is authenticated
    if (!this.authService.isAuthenticated()) {
      console.log('User not authenticated, redirecting to login');
      this.router.navigate(['/auth']);
      return;
    }

    // Load departments, report types, and reports
    const departments$ = this.http.get<Department[]>(`${environment.apiUrl}/api/Departments`);
    const reportTypes$ = this.http.get<string[]>(`${environment.apiUrl}/api/Reports/types`);
    const reports$ = this.loadReports();

    forkJoin({
      departments: departments$,
      reportTypes: reportTypes$,
      reports: reports$
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (data) => {
        console.log('=== API RESPONSE RECEIVED ===');
        console.log('Raw API response:', data);
        
        // Ensure departments is always an array
        this.departments = Array.isArray(data.departments) ? data.departments : [];
        
        // Ensure reportTypes is always an array  
        this.reportTypes = Array.isArray(data.reportTypes) ? data.reportTypes : [];
        
        // Process reports data
        this.processReportsData(data.reports);
        
        console.log('Processed reports count:', this.reports.length);
        console.log('First few reports:', this.reports.slice(0, 3));
        
        this.isLoading = false;
      },
      error: (err) => {
        console.error('=== API ERROR ===');
        console.error('Error loading initial data:', err);
        console.error('Error status:', err.status);
        console.error('Error message:', err.message);
        console.error('Full error object:', err);
        
        this.error = 'Failed to load reports data. Please ensure you are logged in.';
        this.isLoading = false;
        
        // If authentication error, redirect to login
        if (err.status === 401) {
          console.log('Authentication error, redirecting to login');
          this.router.navigate(['/auth']);
        } else {
          // Load mock data for development
          console.log('Loading mock data due to error');
          this.loadMockDataForTesting();
        }
      }
    });
  }

  loadReports() {
    // For client-side pagination, we need to fetch ALL reports
    // The backend now handles role-based filtering automatically based on JWT token
    const params: any = {
      pageSize: 1000, // Large number to get all reports for the current user's role
      page: 1
    };

    // Only apply department filter if explicitly selected by admin/executive
    if ((this.isAdmin || this.isExecutive) && this.departmentFilter !== 'all') {
      params.departmentId = this.departmentFilter;
    }

    console.log('=== DEBUGGING REPORTS LOAD ===');
    console.log('User authenticated:', this.authService.isAuthenticated());
    console.log('JWT Token exists:', !!this.authService.getToken());
    console.log('Current user:', this.authService.getCurrentUser());
    console.log('Loading reports with role-based filtering handled by backend');
    console.log('API Request params:', params);
    console.log('Making request to:', `${environment.apiUrl}/api/Reports`);
    
    return this.http.get(`${environment.apiUrl}/api/Reports`, { params });
  }

  processReportsData(data: any) {
    console.log('=== PROCESSING REPORTS DATA ===');
    console.log('Input data:', data);
    
    // Handle different response formats
    let reportsArray = [];
    
    if (data?.success && data?.data) {
      // Backend returns {success, data, totalCount} format
      reportsArray = Array.isArray(data.data) ? data.data : [];
      console.log('Found backend format with success flag, reports count:', reportsArray.length);
    } else if (Array.isArray(data)) {
      // Direct array response
      reportsArray = data;
      console.log('Found direct array format, reports count:', reportsArray.length);
    } else {
      console.warn('Unexpected data format:', data);
      reportsArray = [];
    }
    
    console.log('Reports array before mapping:', reportsArray);
    
    this.reports = reportsArray.map((report: any) => ({
      id: report.id,
      title: report.title,
      description: report.description || '',
      reportType: report.reportType,
      status: report.status,
      departmentId: report.departmentId,
      departmentName: report.departmentName || this.getDepartmentName(report.departmentId),
      createdByUserId: report.createdByUserId,
      createdBy: report.createdByUserName || report.createdBy || 'Unknown',
      reportPeriodStart: new Date(report.reportPeriodStart),
      reportPeriodEnd: new Date(report.reportPeriodEnd),
      createdAt: new Date(report.createdAt),
      submittedAt: report.submittedAt ? new Date(report.submittedAt) : undefined,
      approvedAt: report.approvedAt ? new Date(report.approvedAt) : undefined,
      approvedByUserId: report.approvedByUserId,
      approvedBy: report.approvedByUserName || report.approvedBy,
      comments: report.comments,
      reportData: report.reportData || []
    }));

    console.log('Processed reports:', this.reports.length);
    
    // Apply filters and pagination
    this.applyFilters();
  }

  loadMockDataForTesting() {
    // Create mock departments and report types
    this.departments = [
      { id: 1, name: 'Finance', description: 'Financial Management' },
      { id: 2, name: 'Human Resources', description: 'HR Management' },
      { id: 3, name: 'Operations', description: 'Operations Management' },
      { id: 4, name: 'Compliance', description: 'Compliance Management' },
      { id: 5, name: 'Information Technology', description: 'IT Management' }
    ];

    this.reportTypes = [
      'Monthly Financial',
      'Quarterly Budget', 
      'Annual Revenue',
      'Weekly System Status',
      'Monthly Security',
      'Performance Review',
      'Compliance Audit'
    ];

    // Create 50+ mock reports for pagination testing
    this.reports = [];
    for (let i = 1; i <= 57; i++) {
      this.reports.push({
        id: i,
        title: `Test Report ${i}`,
        description: `This is a test report number ${i} for pagination testing purposes.`,
        reportType: this.reportTypes[i % this.reportTypes.length],
        status: ['Draft', 'Pending', 'Approved', 'Overdue'][i % 4] as any,
        departmentId: ((i % 5) + 1),
        departmentName: this.departments[(i % 5)].name,
        createdByUserId: ((i % 10) + 1),
        createdBy: `User ${((i % 10) + 1)}`,
        reportPeriodStart: new Date(2025, 6, 1),
        reportPeriodEnd: new Date(2025, 6, 31),
        createdAt: new Date(2025, 7, i % 28 + 1),
        submittedAt: i % 3 === 0 ? new Date(2025, 7, (i % 28) + 2) : undefined,
        approvedAt: i % 4 === 0 ? new Date(2025, 7, (i % 28) + 3) : undefined,
        approvedByUserId: i % 4 === 0 ? 2 : undefined,
        approvedBy: i % 4 === 0 ? 'Admin User' : undefined,
        comments: i % 3 === 0 ? `Comments for report ${i}` : undefined,
        reportData: []
      });
    }

    console.log('Mock data loaded:', this.reports.length, 'reports');
    this.applyFilters();
    this.isLoading = false;
  }

  loadMockData() {
    // Fallback mock data for development
    this.departments = [
      { id: 1, name: 'Finance', description: 'Financial Management' },
      { id: 2, name: 'Human Resources', description: 'HR Management' },
      { id: 3, name: 'Operations', description: 'Operations Management' },
      { id: 4, name: 'Compliance', description: 'Compliance Management' },
      { id: 5, name: 'Information Technology', description: 'IT Management' }
    ];

    this.reportTypes = [
      'Monthly Financial',
      'Quarterly Budget',
      'Annual Revenue',
      'Weekly System Status',
      'Monthly Security',
      'Performance Review',
      'Compliance Audit'
    ];

    this.reports = [
      {
        id: 1,
        title: 'Monthly Financial Report - July 2025',
        description: 'Comprehensive financial analysis for July 2025',
        reportType: 'Monthly Financial',
        status: 'Approved',
        departmentId: 1,
        departmentName: 'Finance',
        createdByUserId: 1,
        createdBy: 'finance-lead',
        reportPeriodStart: new Date('2025-07-01'),
        reportPeriodEnd: new Date('2025-07-31'),
        createdAt: new Date('2025-08-01'),
        submittedAt: new Date('2025-08-02'),
        approvedAt: new Date('2025-08-03'),
        approvedByUserId: 2,
        approvedBy: 'ceo',
        comments: 'Excellent financial performance this month.',
        reportData: [
          {
            id: 1,
            reportId: 1,
            fieldName: 'Total Revenue',
            fieldType: 'Currency',
            fieldValue: '$1,250,000',
            numericValue: 1250000,
            createdAt: new Date()
          }
        ]
      }
    ];

    this.totalReports = this.reports.length;
    this.totalPages = Math.ceil(this.totalReports / this.pageSize);
    this.applyFilters();
    this.isLoading = false;
  }

  // Filter and Search Methods
  applyFilters() {
    let filtered = [...this.reports];

    console.log('=== APPLYING FILTERS DEBUG ===');
    console.log('Starting with reports:', filtered.length);
    console.log('Current filter values:', {
      searchTerm: this.searchTerm,
      statusFilter: this.statusFilter,
      typeFilter: this.typeFilter,
      departmentFilter: this.departmentFilter,
      dateRangeFilter: this.dateRangeFilter
    });

    // Search filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      const beforeCount = filtered.length;
      filtered = filtered.filter(report => 
        report.title.toLowerCase().includes(term) ||
        report.description.toLowerCase().includes(term) ||
        report.reportType.toLowerCase().includes(term) ||
        report.createdBy.toLowerCase().includes(term)
      );
      console.log(`Search filter: ${beforeCount} → ${filtered.length} (term: "${this.searchTerm}")`);
    }

    // Status filter
    if (this.statusFilter !== 'all') {
      const beforeCount = filtered.length;
      filtered = filtered.filter(report => report.status === this.statusFilter);
      console.log(`Status filter: ${beforeCount} → ${filtered.length} (status: "${this.statusFilter}")`);
    }

    // Type filter
    if (this.typeFilter !== 'all') {
      const beforeCount = filtered.length;
      filtered = filtered.filter(report => report.reportType === this.typeFilter);
      console.log(`Type filter: ${beforeCount} → ${filtered.length} (type: "${this.typeFilter}")`);
    }

    // Department filter (for admins and executives only - others are pre-filtered by server)
    if ((this.isAdmin || this.isExecutive) && this.departmentFilter !== 'all') {
      const beforeCount = filtered.length;
      filtered = filtered.filter(report => report.departmentId.toString() === this.departmentFilter);
      console.log(`Department filter: ${beforeCount} → ${filtered.length} (dept: "${this.departmentFilter}")`);
    }

    // Date range filter
    if (this.dateRangeFilter !== 'all') {
      const beforeCount = filtered.length;
      const days = this.getFilterDays(this.dateRangeFilter);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      filtered = filtered.filter(report => report.createdAt >= cutoffDate);
      console.log(`Date range filter: ${beforeCount} → ${filtered.length} (range: "${this.dateRangeFilter}", cutoff: ${cutoffDate.toISOString()})`);
    } else {
      console.log('Date range filter: SKIPPED (showing all dates)');
    }

    this.filteredReports = filtered;
    console.log('After filtering:', this.filteredReports.length);

    // Calculate pagination
    this.totalReports = this.filteredReports.length;
    this.totalPages = Math.ceil(this.totalReports / this.pageSize);
    
    console.log('Pagination Debug:', {
      totalReports: this.totalReports,
      pageSize: this.pageSize,
      totalPages: this.totalPages,
      currentPage: this.currentPage
    });
    
    // Ensure current page is valid
    if (this.currentPage > this.totalPages) {
      this.currentPage = Math.max(1, this.totalPages);
    }

    // Apply pagination
    this.applyPagination();
    
    console.log(`Page ${this.currentPage} of ${this.totalPages}, showing ${this.paginatedReports.length} reports`);
  }

  applyPagination() {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    
    this.paginatedReports = this.filteredReports.slice(startIndex, endIndex);
    
    console.log(`Pagination: showing items ${startIndex + 1} to ${Math.min(endIndex, this.totalReports)} of ${this.totalReports}`);
  }

  onFiltersChange() {
    this.currentPage = 1; // Reset to first page when filters change
    this.applyFilters();
  }

  onPageChange(page: number) {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.applyPagination(); // Only apply pagination, don't reload data
      console.log('Page changed to:', page);
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const start = Math.max(2, this.currentPage - 2);
    const end = Math.min(this.totalPages - 1, this.currentPage + 2);
    
    for (let i = start; i <= end; i++) {
      if (i !== 1 && i !== this.totalPages) {
        pages.push(i);
      }
    }
    
    return pages;
  }

  loadReportsData() {
    this.isLoading = true;
    this.loadReports().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (data) => {
        this.processReportsData(data);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load reports:', err);
        this.showNotification('error', 'Failed to load reports');
        this.isLoading = false;
      }
    });
  }

  // View Management
  switchView(view: string, report?: Report) {
    this.selectedView = view;
    this.clearErrors();
    
    if (view === 'details' || view === 'edit') {
      this.selectedReport = report || null;
      if (view === 'edit' && report) {
        this.populateEditForm(report);
      }
    } else if (view === 'create') {
      this.resetForm();
    }
  }

    // Report CRUD Operations
  populateEditForm(report: Report) {
    this.reportForm = {
      title: report.title,
      description: report.description,
      reportType: report.reportType,
      departmentId: report.departmentId,
      reportPeriodStart: report.reportPeriodStart,
      reportPeriodEnd: report.reportPeriodEnd,
      reportData: report.reportData?.map(field => ({
        fieldName: field.fieldName,
        fieldType: field.fieldType,
        fieldValue: field.fieldValue,
        numericValue: field.numericValue,
        dateValue: field.dateValue
      })) || []
    };
  }

  resetForm() {
    // Set default department based on user role
    const defaultDepartmentId = (this.isAdmin || this.isExecutive) ? 0 : this.userDepartmentId;
    
    this.reportForm = {
      title: '',
      description: '',
      reportType: '',
      departmentId: defaultDepartmentId,
      reportPeriodStart: new Date(),
      reportPeriodEnd: new Date(),
      reportData: []
    };
    this.clearErrors();
  }

  validateForm(): boolean {
    this.formErrors = {};
    let isValid = true;

    if (!this.reportForm.title.trim()) {
      this.formErrors['title'] = 'Report title is required';
      isValid = false;
    }

    if (!this.reportForm.reportType) {
      this.formErrors['reportType'] = 'Report type is required';
      isValid = false;
    }

    if (!this.reportForm.departmentId || this.reportForm.departmentId === 0) {
      this.formErrors['departmentId'] = 'Department is required';
      isValid = false;
    }

    // Validate department access based on role
    if (!this.isAdmin && !this.isExecutive && this.reportForm.departmentId !== this.userDepartmentId) {
      this.formErrors['departmentId'] = 'You can only create reports for your own department';
      isValid = false;
    }

    if (this.reportForm.reportPeriodStart >= this.reportForm.reportPeriodEnd) {
      this.formErrors['period'] = 'End date must be after start date';
      isValid = false;
    }

    return isValid;
  }

  createReport() {
    if (!this.validateForm()) {
      this.showNotification('error', 'Please fix the form errors');
      return;
    }

    this.isLoading = true;

    this.http.post<Report>(`${environment.apiUrl}/api/Reports`, this.reportForm)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (report) => {
          this.showNotification('success', 'Report created successfully');
          this.loadReportsData();
          this.switchView('details', report);
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error creating report:', err);
          this.showNotification('error', 'Failed to create report');
          this.isLoading = false;
        }
      });
  }

  updateReport() {
    if (!this.selectedReport || !this.validateForm()) {
      this.showNotification('error', 'Please fix the form errors');
      return;
    }

    this.isLoading = true;

    this.http.put<Report>(`${environment.apiUrl}/api/Reports/${this.selectedReport.id}`, this.reportForm)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (report) => {
          this.showNotification('success', 'Report updated successfully');
          this.loadReportsData();
          this.switchView('details', report);
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error updating report:', err);
          this.showNotification('error', 'Failed to update report');
          this.isLoading = false;
        }
      });
  }

  deleteReport(report: Report) {
    if (!confirm(`Are you sure you want to delete "${report.title}"?`)) {
      return;
    }

    this.isLoading = true;

    this.http.delete(`${environment.apiUrl}/api/Reports/${report.id}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showNotification('success', 'Report deleted successfully');
          this.loadReportsData();
          this.switchView('list');
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error deleting report:', err);
          this.showNotification('error', 'Failed to delete report');
          this.isLoading = false;
        }
      });
  }

  submitReport(report: Report) {
    this.http.post(`${environment.apiUrl}/api/Reports/${report.id}/submit`, {})
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showNotification('success', 'Report submitted for approval');
          this.loadReportsData();
        },
        error: (err) => {
          console.error('Error submitting report:', err);
          this.showNotification('error', 'Failed to submit report');
        }
      });
  }

  approveReport(report: Report) {
    const comments = prompt('Enter approval comments (optional):');
    
    this.http.post(`${environment.apiUrl}/api/Reports/${report.id}/approve`, { comments })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showNotification('success', 'Report approved successfully');
          this.loadReportsData();
        },
        error: (err) => {
          console.error('Error approving report:', err);
          this.showNotification('error', 'Failed to approve report');
        }
      });
  }

  // Report Data Management
  addDataField() {
    if (!this.newDataField.fieldName.trim() || !this.newDataField.fieldValue.trim()) {
      this.showNotification('error', 'Field name and value are required');
      return;
    }

    // Process numeric and date values
    if (this.newDataField.fieldType === 'Number' || this.newDataField.fieldType === 'Currency') {
      const numericValue = parseFloat(this.newDataField.fieldValue.replace(/[^0-9.-]/g, ''));
      if (!isNaN(numericValue)) {
        this.newDataField.numericValue = numericValue;
      }
    } else if (this.newDataField.fieldType === 'Date') {
      const dateValue = new Date(this.newDataField.fieldValue);
      if (!isNaN(dateValue.getTime())) {
        this.newDataField.dateValue = dateValue;
      }
    }

    this.reportForm.reportData.push({ ...this.newDataField });
    
    // Reset the form
    this.newDataField = {
      fieldName: '',
      fieldType: 'Text',
      fieldValue: '',
      numericValue: undefined,
      dateValue: undefined
    };
  }

  removeDataField(index: number) {
    this.reportForm.reportData.splice(index, 1);
  }

  // Export functionality
  exportReport(report: Report) {
    this.isExporting = true;
    
    const exportRequest = {
      ReportType: 'single-report',
      Format: this.exportFormat.toLowerCase(),
      ReportIds: [report.id],
      IncludeFields: ['all'],
      IncludeCharts: false,
      IncludeSummary: true,
      FileName: `${report.title.replace(/[^a-zA-Z0-9]/g, '-')}.${this.exportFormat.toLowerCase()}`
    };

    this.http.post(`${environment.apiUrl}/api/export/generate`, exportRequest, {
      responseType: 'blob'
    }).subscribe({
      next: (blob: Blob) => {
        if (blob && blob.size > 0) {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = exportRequest.FileName;
          a.click();
          window.URL.revokeObjectURL(url);
          this.showNotification('success', 'Report exported successfully');
        } else {
          this.showNotification('error', 'Export failed: Empty file received');
        }
        this.isExporting = false;
      },
      error: (err) => {
        console.error('Export failed:', err);
        this.showNotification('error', 'Export failed. Please try again.');
        this.isExporting = false;
      }
    });
  }

  exportSelectedReports() {
    const selectedIds = this.getSelectedReportIds();
    if (selectedIds.length === 0) {
      this.showNotification('warning', 'Please select reports to export');
      return;
    }

    this.isExporting = true;
    
    const exportRequest = {
      ReportType: 'multiple-reports',
      Format: this.exportFormat.toLowerCase(),
      ReportIds: selectedIds,
      IncludeFields: ['all'],
      IncludeCharts: true,
      IncludeSummary: true,
      FileName: `reports-export-${new Date().toISOString().split('T')[0]}.${this.exportFormat.toLowerCase()}`
    };

    this.http.post(`${environment.apiUrl}/api/export/generate`, exportRequest, {
      responseType: 'blob'
    }).subscribe({
      next: (blob: Blob) => {
        if (blob && blob.size > 0) {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = exportRequest.FileName;
          a.click();
          window.URL.revokeObjectURL(url);
          this.showNotification('success', `${selectedIds.length} reports exported successfully`);
        } else {
          this.showNotification('error', 'Export failed: Empty file received');
        }
        this.isExporting = false;
      },
      error: (err) => {
        console.error('Export failed:', err);
        this.showNotification('error', 'Export failed. Please try again.');
        this.isExporting = false;
      }
    });
  }

  // Utility Methods
  getDepartmentName(departmentId: number): string {
    // Ensure departments is an array before calling find
    if (!Array.isArray(this.departments)) {
      return 'Unknown';
    }
    
    const department = this.departments.find(d => d.id === departmentId);
    return department ? department.name : 'Unknown';
  }

  getFilterDays(filter: string): number {
    switch (filter) {
      case '7d': return 7;
      case '30d': return 30;
      case '90d': return 90;
      case '1y': return 365;
      default: return 30;
    }
  }

  getSelectedReportIds(): number[] {
    // This would be implemented with checkboxes in the template
    return [];
  }

  getStatusBadgeClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'approved': return 'badge bg-success';
      case 'pending': return 'badge bg-warning';
      case 'draft': return 'badge bg-secondary';
      case 'overdue': return 'badge bg-danger';
      default: return 'badge bg-light';
    }
  }

  canEditReport(report: Report): boolean {
    // Admins and Executives can edit any report
    if (this.isAdmin || this.isExecutive) {
      return true;
    }
    
    // Department leads can edit reports in their department that are not approved
    if (this.isDepartmentLead && 
        report.departmentId === this.userDepartmentId && 
        report.status !== 'Approved') {
      return true;
    }
    
    // Users can edit their own reports that are in Draft status
    if (report.createdByUserId === this.currentUser?.id && report.status === 'Draft') {
      return true;
    }
    
    return false;
  }

  canApproveReport(report: Report): boolean {
    // Only admins, executives, and department leads can approve reports
    if (!this.isAdmin && !this.isExecutive && !this.isDepartmentLead) {
      return false;
    }
    
    // Can't approve your own reports
    if (report.createdByUserId === this.currentUser?.id) {
      return false;
    }
    
    // Report must be in Pending status
    if (report.status !== 'Pending') {
      return false;
    }
    
    // Department leads can only approve reports from their department
    // Admins and Executives can approve any report
    if (this.isDepartmentLead && report.departmentId !== this.userDepartmentId) {
      return false;
    }
    
    return true;
  }

  canDeleteReport(report: Report): boolean {
    // Admins and Executives can delete any report that's not approved
    if ((this.isAdmin || this.isExecutive) && report.status !== 'Approved') {
      return true;
    }
    
    // Users can delete their own draft reports
    if (report.createdByUserId === this.currentUser?.id && report.status === 'Draft') {
      return true;
    }
    
    return false;
  }

  canViewReport(report: Report): boolean {
    // Admins and Executives can view all reports
    if (this.isAdmin || this.isExecutive) {
      return true;
    }
    
    // Department leads can view reports from their department
    if (this.isDepartmentLead && report.departmentId === this.userDepartmentId) {
      return true;
    }
    
    // Users can view their own reports
    if (report.createdByUserId === this.currentUser?.id) {
      return true;
    }
    
    return false;
  }

  clearErrors() {
    this.formErrors = {};
  }

  showNotification(type: 'success' | 'error' | 'info' | 'warning', message: string) {
    this.notification = { type, message };
    
    if (type === 'success' || type === 'info') {
      setTimeout(() => {
        this.clearNotification();
      }, 5000);
    }
  }

  clearNotification() {
    this.notification = null;
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  }

  formatDateTime(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  // Navigation method to go back to the appropriate dashboard
  navigateBack(): void {
    const userRole = this.currentUser?.role?.toLowerCase();
    
    switch (userRole) {
      case 'admin':
        this.router.navigate(['/dashboard']);
        break;
      case 'departmentlead':
      case 'department-lead':
        this.router.navigate(['/department-lead']);
        break;
      case 'executive':
        this.router.navigate(['/executive']);
        break;
      case 'staff':
        this.router.navigate(['/staff-user']);
        break;
      default:
        // Fallback to dashboard or main page
        this.router.navigate(['/dashboard']);
        break;
    }
  }
}

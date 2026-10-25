import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.js';
import { User, UserListResponse } from '../models/user.model.js';
import { Project, ProjectListResponse } from '../models/project.model.js';
import { ActivityListResponse } from '../models/activity.model.js';
import {
  OverviewAnalytics,
  TasksWeeklyStat,
  UserWorkload,
  TaskStatusStat,
} from '../models/analytics.model.js';

@Injectable({
  providedIn: 'root',
})
export class AdminApiService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ==========================
  // 1. User Management (CRUD)
  // ==========================

  getUsers(params?: {
    page?: number;
    limit?: number;
    role?: string;
    search?: string;
    department?: string;
  }): Observable<UserListResponse> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.limit) httpParams = httpParams.set('limit', params.limit.toString());
    if (params?.role && params.role !== 'ALL') httpParams = httpParams.set('role', params.role);
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.department) httpParams = httpParams.set('department', params.department);

    return this.http.get<UserListResponse>(`${this.apiUrl}/users`, { params: httpParams });
  }

  getUserById(id: string): Observable<{ success: boolean; data: User }> {
    return this.http.get<{ success: boolean; data: User }>(`${this.apiUrl}/users/${id}`);
  }

  createUser(userData: Partial<User> & { password?: string }): Observable<{ success: boolean; data: User }> {
    return this.http.post<{ success: boolean; data: User }>(`${this.apiUrl}/auth/register`, userData);
  }

  updateUser(id: string, userData: Partial<User>): Observable<{ success: boolean; data: User }> {
    return this.http.put<{ success: boolean; data: User }>(`${this.apiUrl}/users/${id}`, userData);
  }

  updateUserRole(id: string, role: string): Observable<{ success: boolean; data: User }> {
    return this.http.patch<{ success: boolean; data: User }>(`${this.apiUrl}/users/${id}/role`, { role });
  }

  deleteUser(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/users/${id}`);
  }

  // ==========================
  // 2. Project Management (CRUD)
  // ==========================

  getProjects(params?: { status?: string; search?: string }): Observable<ProjectListResponse> {
    let httpParams = new HttpParams();
    if (params?.status) httpParams = httpParams.set('status', params.status);
    if (params?.search) httpParams = httpParams.set('search', params.search);

    return this.http.get<ProjectListResponse>(`${this.apiUrl}/projects`, { params: httpParams });
  }

  getProjectById(id: string): Observable<{ success: boolean; data: { project: Project } }> {
    return this.http.get<{ success: boolean; data: { project: Project } }>(`${this.apiUrl}/projects/${id}`);
  }

  createProject(projectData: Partial<Project>): Observable<{ success: boolean; data: Project }> {
    return this.http.post<{ success: boolean; data: Project }>(`${this.apiUrl}/projects`, projectData);
  }

  updateProject(id: string, projectData: Partial<Project>): Observable<{ success: boolean; data: Project }> {
    return this.http.put<{ success: boolean; data: Project }>(`${this.apiUrl}/projects/${id}`, projectData);
  }

  deleteProject(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/projects/${id}`);
  }

  // ==========================
  // 3. Activity Logs
  // ==========================

  getActivities(params?: {
    actorId?: string;
    actionType?: string;
    startDate?: string;
    limit?: number;
  }): Observable<ActivityListResponse> {
    let httpParams = new HttpParams();
    if (params?.actorId) httpParams = httpParams.set('actorId', params.actorId);
    if (params?.actionType) httpParams = httpParams.set('actionType', params.actionType);
    if (params?.startDate) httpParams = httpParams.set('startDate', params.startDate);
    if (params?.limit) httpParams = httpParams.set('limit', params.limit.toString());

    return this.http.get<ActivityListResponse>(`${this.apiUrl}/analytics/overview`).pipe(
      // The overview returns recent activities or can hit an activity route directly
    );
  }

  // ==========================
  // 4. Analytics & Metrics
  // ==========================

  getOverviewAnalytics(): Observable<{ success: boolean; data: OverviewAnalytics }> {
    return this.http.get<{ success: boolean; data: OverviewAnalytics }>(`${this.apiUrl}/analytics/overview`);
  }

  getTasksCompletedWeekly(weeks: number = 8): Observable<{ success: boolean; data: TasksWeeklyStat[] }> {
    return this.http.get<{ success: boolean; data: TasksWeeklyStat[] }>(
      `${this.apiUrl}/analytics/tasks-completed-per-week?weeks=${weeks}`
    );
  }

  getUserWorkload(): Observable<{ success: boolean; data: UserWorkload[] }> {
    return this.http.get<{ success: boolean; data: UserWorkload[] }>(`${this.apiUrl}/analytics/workload-per-user`);
  }

  getTasksByStatus(): Observable<{ success: boolean; data: TaskStatusStat[] }> {
    return this.http.get<{ success: boolean; data: TaskStatusStat[] }>(`${this.apiUrl}/analytics/tasks-by-status`);
  }
}

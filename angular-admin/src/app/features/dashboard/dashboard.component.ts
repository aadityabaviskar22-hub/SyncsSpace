import { Component, OnInit, OnDestroy, ElementRef, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Subscription } from 'rxjs';
import { Chart, registerables } from 'chart.js';
import { AdminApiService } from '../../core/services/admin-api.service.js';
import { AdminSocketService } from '../../core/services/socket.service.js';
import {
  OverviewAnalytics,
  TasksWeeklyStat,
  UserWorkload,
  TaskStatusStat,
} from '../../core/models/analytics.model.js';
import { Activity } from '../../core/models/activity.model.js';

Chart.register(...registerables);

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
  ],
  template: `
    <div class="dashboard-container">
      <!-- Page Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Executive Operations & Analytics</h1>
          <p class="page-subtitle">Real-time system throughput, workload distribution, and audit streams</p>
        </div>
        <button mat-stroked-button color="primary" (click)="refreshAllData()" [disabled]="isLoading()">
          <mat-icon>refresh</mat-icon> Refresh Metrics
        </button>
      </div>

      <mat-progress-bar *ngIf="isLoading()" mode="indeterminate" class="loader"></mat-progress-bar>

      <!-- KPI Stat Cards -->
      <div class="kpi-grid">
        <mat-card class="kpi-card">
          <div class="kpi-icon-box users-bg">
            <mat-icon>group</mat-icon>
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Total Users</span>
            <span class="kpi-value">{{ overview()?.users?.total || 0 }}</span>
            <span class="kpi-subtext text-emerald">
              <mat-icon class="inline-icon">sensors</mat-icon> {{ overview()?.users?.online || 0 }} Online Now
            </span>
          </div>
        </mat-card>

        <mat-card class="kpi-card">
          <div class="kpi-icon-box projects-bg">
            <mat-icon>folder_open</mat-icon>
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Workspaces</span>
            <span class="kpi-value">{{ overview()?.projects?.total || 0 }}</span>
            <span class="kpi-subtext text-indigo">
              {{ overview()?.projects?.active || 0 }} Active Projects
            </span>
          </div>
        </mat-card>

        <mat-card class="kpi-card">
          <div class="kpi-icon-box tasks-bg">
            <mat-icon>task_alt</mat-icon>
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Tasks Tracked</span>
            <span class="kpi-value">{{ overview()?.tasks?.total || 0 }}</span>
            <span class="kpi-subtext text-cyan">
              {{ overview()?.tasks?.completed || 0 }} Tasks Done
            </span>
          </div>
        </mat-card>

        <mat-card class="kpi-card">
          <div class="kpi-icon-box rate-bg">
            <mat-icon>speed</mat-icon>
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Completion Velocity</span>
            <span class="kpi-value">{{ overview()?.tasks?.completionRate || 0 }}%</span>
            <span class="kpi-subtext text-amber">System Resolution Rate</span>
          </div>
        </mat-card>
      </div>

      <!-- Charts Section -->
      <div class="charts-grid">
        <!-- Chart 1: Tasks Completed Per Week -->
        <mat-card class="chart-card">
          <mat-card-header>
            <mat-icon mat-card-avatar color="primary">show_chart</mat-icon>
            <mat-card-title>Weekly Task Velocity</mat-card-title>
            <mat-card-subtitle>Tasks marked 'Done' grouped by ISO Week</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content class="canvas-wrapper">
            <canvas #weeklyTasksCanvas></canvas>
          </mat-card-content>
        </mat-card>

        <!-- Chart 2: Tasks by Status -->
        <mat-card class="chart-card">
          <mat-card-header>
            <mat-icon mat-card-avatar color="accent">donut_large</mat-icon>
            <mat-card-title>Status Distribution</mat-card-title>
            <mat-card-subtitle>Kanban board breakdown across stages</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content class="canvas-wrapper">
            <canvas #statusChartCanvas></canvas>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- User Workload & Real-Time Activity Feed -->
      <div class="secondary-grid">
        <!-- Chart 3: Workload per User -->
        <mat-card class="chart-card flex-2">
          <mat-card-header>
            <mat-icon mat-card-avatar>badge</mat-icon>
            <mat-card-title>Team Workload Distribution</mat-card-title>
            <mat-card-subtitle>Active task allocations per team member</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content class="canvas-wrapper">
            <canvas #workloadCanvas></canvas>
          </mat-card-content>
        </mat-card>

        <!-- Live Socket Activity Stream -->
        <mat-card class="activity-card flex-1">
          <mat-card-header>
            <div class="live-pulse-header">
              <span class="live-dot"></span>
              <mat-card-title>Live Audit Stream</mat-card-title>
            </div>
            <mat-card-subtitle>Pushed via WebSocket in real-time</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content class="activity-scroll">
            <div *ngIf="liveActivities().length === 0" class="no-activity">
              Waiting for live system activity...
            </div>
            <div *ngFor="let act of liveActivities()" class="activity-item">
              <mat-icon class="activity-type-icon">bolt</mat-icon>
              <div class="activity-info">
                <div class="activity-text">
                  <strong>{{ act.actorId?.name || 'User' }}</strong> triggered
                  <span class="action-tag">{{ act.actionType }}</span>
                </div>
                <small class="activity-time">{{ act.createdAt | date: 'mediumTime' }}</small>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [
    `
      .dashboard-container {
        display: flex;
        flex-direction: column;
        gap: 24px;
      }
      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .page-title {
        font-size: 24px;
        font-weight: 700;
        color: #ffffff;
        margin: 0;
      }
      .page-subtitle {
        color: #94a3b8;
        font-size: 13px;
        margin: 4px 0 0 0;
      }
      .loader {
        margin-top: -12px;
      }
      .kpi-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 16px;
      }
      .kpi-card {
        display: flex;
        flex-direction: row;
        align-items: center;
        padding: 20px;
        background: #0f172a !important;
        border: 1px solid #1e293b;
        border-radius: 12px;
        gap: 16px;
      }
      .kpi-icon-box {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 52px;
        height: 52px;
        border-radius: 12px;
      }
      .users-bg { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }
      .projects-bg { background: rgba(99, 102, 241, 0.15); color: #818cf8; }
      .tasks-bg { background: rgba(20, 184, 166, 0.15); color: #2dd4bf; }
      .rate-bg { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
      .kpi-content {
        display: flex;
        flex-direction: column;
      }
      .kpi-label {
        font-size: 12px;
        color: #94a3b8;
        font-weight: 500;
      }
      .kpi-value {
        font-size: 24px;
        font-weight: 800;
        color: #ffffff;
        margin: 2px 0;
      }
      .kpi-subtext {
        font-size: 11px;
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .text-emerald { color: #34d399; }
      .text-indigo { color: #818cf8; }
      .text-cyan { color: #22d3ee; }
      .text-amber { color: #fbbf24; }
      .inline-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
      }
      .charts-grid {
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: 20px;
      }
      @media (max-width: 960px) {
        .charts-grid { grid-template-columns: 1fr; }
      }
      .chart-card {
        background: #0f172a !important;
        border: 1px solid #1e293b;
        border-radius: 12px;
        padding: 16px;
      }
      mat-card-title {
        color: #f8fafc;
        font-size: 16px;
        font-weight: 600;
      }
      mat-card-subtitle {
        color: #64748b;
        font-size: 12px;
      }
      .canvas-wrapper {
        position: relative;
        height: 260px;
        width: 100%;
        margin-top: 16px;
      }
      .secondary-grid {
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: 20px;
      }
      @media (max-width: 960px) {
        .secondary-grid { grid-template-columns: 1fr; }
      }
      .activity-card {
        background: #0f172a !important;
        border: 1px solid #1e293b;
        border-radius: 12px;
        display: flex;
        flex-direction: column;
      }
      .live-pulse-header {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .live-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background-color: #10b981;
        box-shadow: 0 0 8px #10b981;
        animation: pulse 2s infinite;
      }
      @keyframes pulse {
        0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
        70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
        100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
      }
      .activity-scroll {
        max-height: 280px;
        overflow-y: auto;
        padding: 8px 0;
      }
      .activity-item {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 10px 12px;
        border-bottom: 1px solid #1e293b;
      }
      .activity-type-icon {
        color: #f59e0b;
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
      .activity-info {
        display: flex;
        flex-direction: column;
      }
      .activity-text {
        color: #cbd5e1;
        font-size: 12px;
      }
      .action-tag {
        font-family: monospace;
        color: #818cf8;
        background: rgba(99, 102, 241, 0.15);
        padding: 1px 4px;
        border-radius: 4px;
      }
      .activity-time {
        color: #64748b;
        font-size: 10px;
        margin-top: 2px;
      }
      .no-activity {
        padding: 24px;
        text-align: center;
        color: #64748b;
        font-size: 12px;
      }
    `,
  ],
})
export class DashboardComponent implements OnInit, OnDestroy {
  @ViewChild('weeklyTasksCanvas') weeklyTasksCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('statusChartCanvas') statusChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('workloadCanvas') workloadCanvas!: ElementRef<HTMLCanvasElement>;

  overview = signal<OverviewAnalytics | null>(null);
  liveActivities = signal<Activity[]>([]);
  isLoading = signal<boolean>(false);

  private weeklyChartInstance: Chart | null = null;
  private statusChartInstance: Chart | null = null;
  private workloadChartInstance: Chart | null = null;
  private socketSub: Subscription | null = null;

  constructor(
    private apiService: AdminApiService,
    private socketService: AdminSocketService
  ) {}

  ngOnInit(): void {
    this.refreshAllData();

    // Listen to real-time activities pushed through Socket.IO
    this.socketSub = this.socketService.onActivityLogged().subscribe((newActivity) => {
      this.liveActivities.update((current) => [newActivity, ...current.slice(0, 19)]);
    });
  }

  ngOnDestroy(): void {
    if (this.socketSub) this.socketSub.unsubscribe();
    if (this.weeklyChartInstance) this.weeklyChartInstance.destroy();
    if (this.statusChartInstance) this.statusChartInstance.destroy();
    if (this.workloadChartInstance) this.workloadChartInstance.destroy();
  }

  refreshAllData(): void {
    this.isLoading.set(true);

    this.apiService.getOverviewAnalytics().subscribe({
      next: (res) => {
        this.overview.set(res.data);
        if (res.data.recentActivities) {
          this.liveActivities.set(res.data.recentActivities);
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });

    this.loadWeeklyChart();
    this.loadStatusChart();
    this.loadWorkloadChart();
  }

  private loadWeeklyChart(): void {
    this.apiService.getTasksCompletedWeekly(8).subscribe((res) => {
      const labels = res.data.map((d) => d.label);
      const values = res.data.map((d) => d.completedCount);

      if (this.weeklyChartInstance) this.weeklyChartInstance.destroy();

      this.weeklyChartInstance = new Chart(this.weeklyTasksCanvas.nativeElement, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Completed Tasks',
              data: values,
              borderColor: '#6366f1',
              backgroundColor: 'rgba(99, 102, 241, 0.15)',
              borderWidth: 2,
              fill: true,
              tension: 0.3,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { color: '#1e293b' }, ticks: { color: '#94a3b8' } },
            y: { grid: { color: '#1e293b' }, ticks: { color: '#94a3b8', stepSize: 1 } },
          },
        },
      });
    });
  }

  private loadStatusChart(): void {
    this.apiService.getTasksByStatus().subscribe((res) => {
      const labels = res.data.map((d) => d.status);
      const values = res.data.map((d) => d.count);

      if (this.statusChartInstance) this.statusChartInstance.destroy();

      this.statusChartInstance = new Chart(this.statusChartCanvas.nativeElement, {
        type: 'doughnut',
        data: {
          labels,
          datasets: [
            {
              data: values,
              backgroundColor: ['#64748b', '#3b82f6', '#a855f7', '#10b981'],
              borderWidth: 0,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { color: '#94a3b8', boxWidth: 12 } },
          },
        },
      });
    });
  }

  private loadWorkloadChart(): void {
    this.apiService.getUserWorkload().subscribe((res) => {
      const labels = res.data.map((d) => d.name);
      const completed = res.data.map((d) => d.done);
      const pending = res.data.map((d) => d.inProgress + d.todo + d.inReview);

      if (this.workloadChartInstance) this.workloadChartInstance.destroy();

      this.workloadChartInstance = new Chart(this.workloadCanvas.nativeElement, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            { label: 'Completed', data: completed, backgroundColor: '#10b981' },
            { label: 'Pending', data: pending, backgroundColor: '#f59e0b' },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: 'y',
          plugins: {
            legend: { labels: { color: '#94a3b8' } },
          },
          scales: {
            x: { stacked: true, grid: { color: '#1e293b' }, ticks: { color: '#94a3b8' } },
            y: { stacked: true, grid: { color: '#1e293b' }, ticks: { color: '#94a3b8' } },
          },
        },
      });
    });
  }
}

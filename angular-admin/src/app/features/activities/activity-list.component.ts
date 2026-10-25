import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AdminApiService } from '../../core/services/admin-api.service.js';
import { AdminSocketService } from '../../core/services/socket.service.js';
import { Activity } from '../../core/models/activity.model.js';

@Component({
  selector: 'app-activity-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressBarModule,
  ],
  template: `
    <div class="activity-page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Activity Audit Trail</h1>
          <p class="page-subtitle">Time-series mutation ledger tracking project events, role changes, and deletions</p>
        </div>
        <button mat-stroked-button (click)="loadActivities()">
          <mat-icon>refresh</mat-icon> Refresh
        </button>
      </div>

      <!-- Filters -->
      <div class="toolbar-card">
        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>Action Type</mat-label>
          <mat-select [(ngModel)]="selectedAction" (selectionChange)="filterActivities()">
            <mat-option value="ALL">All Actions</mat-option>
            <mat-option value="TASK_CREATED">TASK_CREATED</mat-option>
            <mat-option value="TASK_UPDATED">TASK_UPDATED</mat-option>
            <mat-option value="TASK_DELETED">TASK_DELETED</mat-option>
            <mat-option value="NOTE_CREATED">NOTE_CREATED</mat-option>
            <mat-option value="PROJECT_CREATED">PROJECT_CREATED</mat-option>
            <mat-option value="USER_ROLE_CHANGED">USER_ROLE_CHANGED</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>Entity Type</mat-label>
          <mat-select [(ngModel)]="selectedEntity" (selectionChange)="filterActivities()">
            <mat-option value="ALL">All Entities</mat-option>
            <mat-option value="Task">Task</mat-option>
            <mat-option value="Note">Note</mat-option>
            <mat-option value="Project">Project</mat-option>
            <mat-option value="User">User</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <mat-progress-bar *ngIf="isLoading()" mode="indeterminate"></mat-progress-bar>

      <!-- Table -->
      <div class="table-container">
        <table mat-table [dataSource]="filteredActivities()" class="mat-elevation-z2 activity-table">
          <ng-container matColumnDef="timestamp">
            <th mat-header-cell *thHeaderCellDef>Timestamp</th>
            <td mat-cell *matCellDef="let act">
              <span class="timestamp-text">{{ act.createdAt | date: 'medium' }}</span>
            </td>
          </ng-container>

          <ng-container matColumnDef="actor">
            <th mat-header-cell *thHeaderCellDef>Actor</th>
            <td mat-cell *matCellDef="let act">
              <div class="actor-cell">
                <span class="actor-name">{{ act.actorId?.name || 'System' }}</span>
                <span class="actor-email">{{ act.actorId?.email || 'automated' }}</span>
              </div>
            </td>
          </ng-container>

          <ng-container matColumnDef="action">
            <th mat-header-cell *thHeaderCellDef>Action</th>
            <td mat-cell *matCellDef="let act">
              <span class="action-badge" [ngClass]="getActionClass(act.actionType)">
                {{ act.actionType }}
              </span>
            </td>
          </ng-container>

          <ng-container matColumnDef="entity">
            <th mat-header-cell *thHeaderCellDef>Target Entity</th>
            <td mat-cell *matCellDef="let act">
              <span class="entity-text">{{ act.entityType }}: {{ act.entityId }}</span>
            </td>
          </ng-container>

          <ng-container matColumnDef="metadata">
            <th mat-header-cell *thHeaderCellDef>Metadata Snapshot</th>
            <td mat-cell *matCellDef="let act">
              <code class="metadata-code">{{ formatMetadata(act.metadata) }}</code>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
        </table>
      </div>
    </div>
  `,
  styles: [
    `
      .activity-page {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }
      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .page-title {
        font-size: 22px;
        font-weight: 700;
        color: #ffffff;
        margin: 0;
      }
      .page-subtitle {
        color: #94a3b8;
        font-size: 13px;
        margin-top: 4px;
      }
      .toolbar-card {
        display: flex;
        gap: 16px;
        background: #0f172a;
        padding: 16px;
        border-radius: 12px;
        border: 1px solid #1e293b;
      }
      .filter-field { flex: 1; max-width: 250px; }
      .table-container {
        background: #0f172a;
        border: 1px solid #1e293b;
        border-radius: 12px;
        overflow: hidden;
      }
      .activity-table {
        width: 100%;
        background: #0f172a !important;
        color: #f1f5f9;
      }
      th.mat-header-cell {
        background-color: #1e293b;
        color: #94a3b8;
        font-size: 12px;
        text-transform: uppercase;
      }
      td.mat-cell {
        color: #cbd5e1;
        border-bottom-color: #1e293b;
      }
      .timestamp-text { font-size: 12px; font-family: monospace; color: #94a3b8; }
      .actor-cell { display: flex; flex-direction: column; }
      .actor-name { font-weight: 600; color: #ffffff; }
      .actor-email { font-size: 11px; color: #64748b; }
      .action-badge {
        padding: 3px 8px;
        border-radius: 6px;
        font-size: 11px;
        font-family: monospace;
        font-weight: 600;
      }
      .badge-create { background: rgba(16, 185, 129, 0.15); color: #34d399; }
      .badge-update { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }
      .badge-delete { background: rgba(239, 68, 68, 0.15); color: #f87171; }
      .badge-role { background: rgba(168, 85, 247, 0.15); color: #c084fc; }
      .entity-text { font-size: 12px; font-family: monospace; color: #94a3b8; }
      .metadata-code {
        font-size: 11px;
        background: #090d16;
        padding: 4px 8px;
        border-radius: 4px;
        color: #a5b4fc;
        display: block;
        max-width: 300px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    `,
  ],
})
export class ActivityListComponent implements OnInit {
  displayedColumns: string[] = ['timestamp', 'actor', 'action', 'entity', 'metadata'];
  allActivities = signal<Activity[]>([]);
  filteredActivities = signal<Activity[]>([]);
  isLoading = signal<boolean>(false);

  selectedAction: string = 'ALL';
  selectedEntity: string = 'ALL';

  constructor(
    private apiService: AdminApiService,
    private socketService: AdminSocketService
  ) {}

  ngOnInit(): void {
    this.loadActivities();

    // Listen for live activities pushed via WebSocket
    this.socketService.onActivityLogged().subscribe((newAct) => {
      this.allActivities.update((current) => [newAct, ...current]);
      this.filterActivities();
    });
  }

  loadActivities(): void {
    this.isLoading.set(true);
    this.apiService.getOverviewAnalytics().subscribe({
      next: (res) => {
        const acts = res.data.recentActivities || [];
        this.allActivities.set(acts);
        this.filteredActivities.set(acts);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  filterActivities(): void {
    let result = this.allActivities();
    if (this.selectedAction !== 'ALL') {
      result = result.filter((a) => a.actionType === this.selectedAction);
    }
    if (this.selectedEntity !== 'ALL') {
      result = result.filter((a) => a.entityType === this.selectedEntity);
    }
    this.filteredActivities.set(result);
  }

  getActionClass(action: string): string {
    if (action.includes('CREATE')) return 'badge-create';
    if (action.includes('UPDATE')) return 'badge-update';
    if (action.includes('DELETE')) return 'badge-delete';
    return 'badge-role';
  }

  formatMetadata(meta: any): string {
    if (!meta) return '{}';
    return JSON.stringify(meta);
  }
}

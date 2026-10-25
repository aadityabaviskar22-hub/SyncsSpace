import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AdminApiService } from '../../core/services/admin-api.service.js';
import { Project } from '../../core/models/project.model.js';
import { ProjectDialogComponent } from './project-dialog.component.js';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressBarModule,
  ],
  template: `
    <div class="projects-page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Project Workspaces</h1>
          <p class="page-subtitle">Oversee collaborative projects, assign team leads, and monitor delivery status</p>
        </div>
        <button mat-flat-button color="primary" (click)="openCreateProjectDialog()">
          <mat-icon>create_new_folder</mat-icon> New Project
        </button>
      </div>

      <!-- Search & Filters -->
      <div class="toolbar-card">
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Search Project Title</mat-label>
          <input matInput [(ngModel)]="searchQuery" (keyup.enter)="loadProjects()" placeholder="Search..." />
          <mat-icon matPrefix>search</mat-icon>
        </mat-form-field>

        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>Status Filter</mat-label>
          <mat-select [(ngModel)]="selectedStatus" (selectionChange)="loadProjects()">
            <mat-option value="">All Statuses</mat-option>
            <mat-option value="Active">Active</mat-option>
            <mat-option value="Planning">Planning</mat-option>
            <mat-option value="On-Hold">On-Hold</mat-option>
            <mat-option value="Completed">Completed</mat-option>
          </mat-select>
        </mat-form-field>

        <button mat-stroked-button (click)="loadProjects()">Filter</button>
      </div>

      <mat-progress-bar *ngIf="isLoading()" mode="indeterminate"></mat-progress-bar>

      <!-- Projects MatTable -->
      <div class="table-container">
        <table mat-table [dataSource]="projects()" class="mat-elevation-z2 projects-table">
          <ng-container matColumnDef="title">
            <th mat-header-cell *thHeaderCellDef>Workspace</th>
            <td mat-cell *matCellDef="let p">
              <div class="project-info">
                <span class="project-title">{{ p.title }}</span>
                <span class="project-desc">{{ p.description || 'No description provided.' }}</span>
              </div>
            </td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *thHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let p">
              <span class="status-badge" [ngClass]="p.status.toLowerCase()">{{ p.status }}</span>
            </td>
          </ng-container>

          <ng-container matColumnDef="priority">
            <th mat-header-cell *thHeaderCellDef>Priority</th>
            <td mat-cell *matCellDef="let p">
              <span class="priority-tag" [ngClass]="p.priority.toLowerCase()">{{ p.priority }}</span>
            </td>
          </ng-container>

          <ng-container matColumnDef="members">
            <th mat-header-cell *thHeaderCellDef>Team Assigned</th>
            <td mat-cell *matCellDef="let p">
              <div class="members-cell">
                <span class="members-count">{{ p.members?.length || 0 }} members</span>
              </div>
            </td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *thHeaderCellDef class="text-right">Actions</th>
            <td mat-cell *matCellDef="let p" class="text-right">
              <button mat-icon-button color="primary" (click)="openEditProjectDialog(p)" aria-label="Edit project">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button color="warn" (click)="deleteProject(p)" aria-label="Delete project">
                <mat-icon>delete</mat-icon>
              </button>
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
      .projects-page {
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
        align-items: center;
        gap: 16px;
        background: #0f172a;
        padding: 16px;
        border-radius: 12px;
        border: 1px solid #1e293b;
      }
      .search-field { flex: 2; }
      .filter-field { flex: 1; }
      .table-container {
        background: #0f172a;
        border: 1px solid #1e293b;
        border-radius: 12px;
        overflow: hidden;
      }
      .projects-table {
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
        color: #e2e8f0;
        border-bottom-color: #1e293b;
      }
      .project-info {
        display: flex;
        flex-direction: column;
        padding: 8px 0;
      }
      .project-title {
        font-weight: 600;
        color: #ffffff;
      }
      .project-desc {
        font-size: 12px;
        color: #94a3b8;
        max-width: 320px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .status-badge {
        padding: 3px 8px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 600;
      }
      .status-badge.active { background: rgba(16, 185, 129, 0.15); color: #34d399; }
      .status-badge.planning { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }
      .status-badge.on-hold { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
      .status-badge.completed { background: rgba(148, 163, 184, 0.15); color: #cbd5e1; }

      .priority-tag {
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
      }
      .priority-tag.critical { color: #f87171; }
      .priority-tag.high { color: #fb923c; }
      .priority-tag.medium { color: #facc15; }
      .priority-tag.low { color: #94a3b8; }
      .members-count {
        font-size: 12px;
        color: #cbd5e1;
      }
      .text-right { text-align: right; }
    `,
  ],
})
export class ProjectListComponent implements OnInit {
  displayedColumns: string[] = ['title', 'status', 'priority', 'members', 'actions'];
  projects = signal<Project[]>([]);
  isLoading = signal<boolean>(false);
  searchQuery: string = '';
  selectedStatus: string = '';

  constructor(
    private apiService: AdminApiService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadProjects();
  }

  loadProjects(): void {
    this.isLoading.set(true);
    this.apiService
      .getProjects({
        status: this.selectedStatus,
        search: this.searchQuery,
      })
      .subscribe({
        next: (res) => {
          this.projects.set(res.data);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
  }

  openCreateProjectDialog(): void {
    const dialogRef = this.dialog.open(ProjectDialogComponent, {
      width: '500px',
      data: {},
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.apiService.createProject(result).subscribe({
          next: () => {
            this.snackBar.open('Project workspace initialized!', 'Dismiss', { duration: 3000 });
            this.loadProjects();
          },
          error: (err) => {
            this.snackBar.open(err.error?.message || 'Failed to create project', 'Close', {
              duration: 4000,
            });
          },
        });
      }
    });
  }

  openEditProjectDialog(project: Project): void {
    const dialogRef = this.dialog.open(ProjectDialogComponent, {
      width: '500px',
      data: { project },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.apiService.updateProject(project._id, result).subscribe({
          next: () => {
            this.snackBar.open('Project updated successfully!', 'Dismiss', { duration: 3000 });
            this.loadProjects();
          },
          error: (err) => {
            this.snackBar.open(err.error?.message || 'Failed to update project', 'Close', {
              duration: 4000,
            });
          },
        });
      }
    });
  }

  deleteProject(project: Project): void {
    if (confirm(`Are you sure you want to delete project "${project.title}" and cascade delete its tasks and notes?`)) {
      this.apiService.deleteProject(project._id).subscribe({
        next: () => {
          this.snackBar.open('Project workspace deleted.', 'Dismiss', { duration: 3000 });
          this.loadProjects();
        },
        error: (err) => {
          this.snackBar.open(err.error?.message || 'Could not delete project', 'Close', {
            duration: 4000,
          });
        },
      });
    }
  }
}

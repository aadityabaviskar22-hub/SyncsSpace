import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AdminApiService } from '../../core/services/admin-api.service.js';
import { User, UserRole } from '../../core/models/user.model.js';
import { UserDialogComponent } from './user-dialog.component.js';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressBarModule,
  ],
  template: `
    <div class="user-management-page">
      <div class="page-header">
        <div>
          <h1 class="page-title">User Accounts & RBAC Roles</h1>
          <p class="page-subtitle">Inspect user accounts, reassign authorization levels, and manage credentials</p>
        </div>
        <button mat-flat-button color="primary" (click)="openCreateUserDialog()">
          <mat-icon>person_add</mat-icon> Register User
        </button>
      </div>

      <!-- Filters & Search Toolbar -->
      <div class="toolbar-card">
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Search Name or Email</mat-label>
          <input matInput [(ngModel)]="searchQuery" (keyup.enter)="loadUsers()" placeholder="e.g. aditya@..." />
          <mat-icon matPrefix>search</mat-icon>
          <button mat-icon-button matSuffix *ngIf="searchQuery" (click)="searchQuery = ''; loadUsers()">
            <mat-icon>close</mat-icon>
          </button>
        </mat-form-field>

        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>Filter by Role</mat-label>
          <mat-select [(ngModel)]="selectedRole" (selectionChange)="loadUsers()">
            <mat-option value="ALL">All Roles</mat-option>
            <mat-option value="Admin">Admin</mat-option>
            <mat-option value="Manager">Manager</mat-option>
            <mat-option value="Member">Member</mat-option>
          </mat-select>
        </mat-form-field>

        <button mat-stroked-button color="accent" (click)="loadUsers()">
          <mat-icon>filter_list</mat-icon> Apply Filters
        </button>
      </div>

      <mat-progress-bar *ngIf="isLoading()" mode="indeterminate"></mat-progress-bar>

      <!-- Users MatTable -->
      <div class="table-container">
        <table mat-table [dataSource]="users()" class="mat-elevation-z2 users-table">
          <!-- Name & Avatar Column -->
          <ng-container matColumnDef="name">
            <th mat-header-cell *thHeaderCellDef>User Details</th>
            <td mat-cell *matCellDef="let user">
              <div class="user-cell">
                <div class="avatar-circle">
                  {{ user.name.charAt(0).toUpperCase() }}
                  <span class="presence-indicator" [class.online]="user.isOnline"></span>
                </div>
                <div>
                  <div class="user-fullname">{{ user.name }}</div>
                  <div class="user-email">{{ user.email }}</div>
                </div>
              </div>
            </td>
          </ng-container>

          <!-- Department Column -->
          <ng-container matColumnDef="department">
            <th mat-header-cell *thHeaderCellDef>Department</th>
            <td mat-cell *matCellDef="let user">
              <span class="dept-badge">{{ user.department || 'General' }}</span>
            </td>
          </ng-container>

          <!-- Role & Quick Change Column -->
          <ng-container matColumnDef="role">
            <th mat-header-cell *thHeaderCellDef>Role Assignment</th>
            <td mat-cell *matCellDef="let user">
              <mat-form-field appearance="outline" class="role-select-compact">
                <mat-select [value]="user.role" (selectionChange)="changeRole(user, $event.value)">
                  <mat-option value="Member">Member</mat-option>
                  <mat-option value="Manager">Manager</mat-option>
                  <mat-option value="Admin">Admin</mat-option>
                </mat-select>
              </mat-form-field>
            </td>
          </ng-container>

          <!-- Created Date Column -->
          <ng-container matColumnDef="createdAt">
            <th mat-header-cell *thHeaderCellDef>Registered</th>
            <td mat-cell *matCellDef="let user">
              <span class="date-text">{{ user.createdAt | date: 'mediumDate' }}</span>
            </td>
          </ng-container>

          <!-- Actions Column -->
          <ng-container matColumnDef="actions">
            <th mat-header-cell *thHeaderCellDef class="text-right">Actions</th>
            <td mat-cell *matCellDef="let user" class="text-right">
              <button mat-icon-button color="primary" (click)="openEditUserDialog(user)" aria-label="Edit user">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button color="warn" (click)="deleteUser(user)" aria-label="Delete user">
                <mat-icon>delete</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>

          <tr class="mat-row" *matNoDataRow>
            <td class="mat-cell no-data-cell" colspan="5">
              No user accounts found matching your query.
            </td>
          </tr>
        </table>

        <mat-paginator
          [length]="totalUsers()"
          [pageSize]="pageSize"
          [pageSizeOptions]="[10, 20, 50]"
          (page)="onPageChange($event)"
          showFirstLastButtons
        ></mat-paginator>
      </div>
    </div>
  `,
  styles: [
    `
      .user-management-page {
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
        flex-wrap: wrap;
      }
      .search-field {
        flex: 2;
        min-width: 240px;
      }
      .filter-field {
        flex: 1;
        min-width: 160px;
      }
      .table-container {
        background: #0f172a;
        border: 1px solid #1e293b;
        border-radius: 12px;
        overflow: hidden;
      }
      .users-table {
        width: 100%;
        background: #0f172a !important;
        color: #f1f5f9;
      }
      th.mat-header-cell {
        background-color: #1e293b;
        color: #94a3b8;
        font-weight: 600;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      td.mat-cell {
        color: #e2e8f0;
        border-bottom-color: #1e293b;
      }
      .user-cell {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 6px 0;
      }
      .avatar-circle {
        position: relative;
        width: 38px;
        height: 38px;
        border-radius: 50%;
        background: #4f46e5;
        color: #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 14px;
      }
      .presence-indicator {
        position: absolute;
        bottom: 0;
        right: 0;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background-color: #64748b;
        border: 2px solid #0f172a;
      }
      .presence-indicator.online {
        background-color: #10b981;
      }
      .user-fullname {
        font-weight: 600;
        color: #ffffff;
      }
      .user-email {
        font-size: 12px;
        color: #94a3b8;
      }
      .dept-badge {
        padding: 4px 8px;
        border-radius: 6px;
        background: rgba(148, 163, 184, 0.1);
        color: #cbd5e1;
        font-size: 12px;
      }
      .role-select-compact {
        width: 130px;
        font-size: 13px;
        margin-top: 8px;
      }
      .date-text {
        font-size: 12px;
        color: #94a3b8;
      }
      .text-right {
        text-align: right;
      }
      .no-data-cell {
        text-align: center;
        padding: 40px !important;
        color: #64748b;
      }
      mat-paginator {
        background: #0f172a !important;
        color: #94a3b8 !important;
        border-top: 1px solid #1e293b;
      }
    `,
  ],
})
export class UserListComponent implements OnInit {
  displayedColumns: string[] = ['name', 'department', 'role', 'createdAt', 'actions'];
  users = signal<User[]>([]);
  totalUsers = signal<number>(0);
  isLoading = signal<boolean>(false);

  searchQuery: string = '';
  selectedRole: string = 'ALL';
  currentPage: number = 1;
  pageSize: number = 10;

  constructor(
    private apiService: AdminApiService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading.set(true);

    this.apiService
      .getUsers({
        page: this.currentPage,
        limit: this.pageSize,
        role: this.selectedRole,
        search: this.searchQuery,
      })
      .subscribe({
        next: (res) => {
          this.users.set(res.data.users);
          this.totalUsers.set(res.data.total);
          this.isLoading.set(false);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.snackBar.open(err.error?.message || 'Failed to load user roster', 'Close', {
            duration: 4000,
          });
        },
      });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadUsers();
  }

  changeRole(user: User, newRole: string): void {
    if (user.role === newRole) return;

    this.apiService.updateUserRole(user._id || user.id!, newRole).subscribe({
      next: () => {
        user.role = newRole as UserRole;
        this.snackBar.open(`Role updated to ${newRole} for ${user.name}`, 'Dismiss', {
          duration: 3000,
        });
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Failed to change role', 'Close', {
          duration: 4000,
        });
      },
    });
  }

  openCreateUserDialog(): void {
    const dialogRef = this.dialog.open(UserDialogComponent, {
      width: '450px',
      data: {},
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.apiService.createUser(result).subscribe({
          next: () => {
            this.snackBar.open('User registered successfully!', 'Dismiss', { duration: 3000 });
            this.loadUsers();
          },
          error: (err) => {
            this.snackBar.open(err.error?.message || 'Failed to create user', 'Close', {
              duration: 4000,
            });
          },
        });
      }
    });
  }

  openEditUserDialog(user: User): void {
    const dialogRef = this.dialog.open(UserDialogComponent, {
      width: '450px',
      data: { user },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.apiService.updateUser(user._id || user.id!, result).subscribe({
          next: () => {
            this.snackBar.open('User updated successfully!', 'Dismiss', { duration: 3000 });
            this.loadUsers();
          },
          error: (err) => {
            this.snackBar.open(err.error?.message || 'Failed to update user', 'Close', {
              duration: 4000,
            });
          },
        });
      }
    });
  }

  deleteUser(user: User): void {
    if (confirm(`Are you sure you want to delete user account "${user.name}" (${user.email})?`)) {
      this.apiService.deleteUser(user._id || user.id!).subscribe({
        next: () => {
          this.snackBar.open(`User ${user.email} removed.`, 'Dismiss', { duration: 3000 });
          this.loadUsers();
        },
        error: (err) => {
          this.snackBar.open(err.error?.message || 'Could not delete user', 'Close', {
            duration: 4000,
          });
        },
      });
    }
  }
}

import { Component, Inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { Project } from '../../core/models/project.model.js';
import { User } from '../../core/models/user.model.js';
import { AdminApiService } from '../../core/services/admin-api.service.js';

@Component({
  selector: 'app-project-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ isEditMode ? 'Modify Project Workspace' : 'Initialize Project Workspace' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="projectForm" class="project-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Project Title</mat-label>
          <input matInput formControlName="title" placeholder="Sprint 24: Core Cloud Engine" />
          <mat-error *ngIf="projectForm.get('title')?.hasError('required')">Project title is required</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Description</mat-label>
          <textarea matInput rows="3" formControlName="description" placeholder="Project goals and scope..."></textarea>
        </mat-form-field>

        <div class="form-row">
          <mat-form-field appearance="outline" class="half-width">
            <mat-label>Status</mat-label>
            <mat-select formControlName="status">
              <mat-option value="Planning">Planning</mat-option>
              <mat-option value="Active">Active</mat-option>
              <mat-option value="On-Hold">On-Hold</mat-option>
              <mat-option value="Completed">Completed</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="half-width">
            <mat-label>Priority</mat-label>
            <mat-select formControlName="priority">
              <mat-option value="Low">Low</mat-option>
              <mat-option value="Medium">Medium</mat-option>
              <mat-option value="High">High</mat-option>
              <mat-option value="Critical">Critical</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Assign Team Members</mat-label>
          <mat-select formControlName="members" multiple>
            <mat-option *ngFor="let user of availableUsers()" [value]="user._id || user.id">
              {{ user.name }} ({{ user.role }}) - {{ user.department }}
            </mat-option>
          </mat-select>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" [disabled]="projectForm.invalid" (click)="save()">
        {{ isEditMode ? 'Save Changes' : 'Create Workspace' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .project-form {
        display: flex;
        flex-direction: column;
        padding-top: 8px;
        min-width: 440px;
      }
      .full-width {
        width: 100%;
        margin-bottom: 8px;
      }
      .form-row {
        display: flex;
        gap: 12px;
      }
      .half-width {
        flex: 1;
      }
    `,
  ],
})
export class ProjectDialogComponent implements OnInit {
  projectForm: FormGroup;
  isEditMode: boolean = false;
  availableUsers = signal<User[]>([]);

  constructor(
    private fb: FormBuilder,
    private apiService: AdminApiService,
    private dialogRef: MatDialogRef<ProjectDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { project?: Project }
  ) {
    this.isEditMode = !!data?.project;

    const initialMemberIds = (data?.project?.members || []).map((m: any) =>
      typeof m === 'string' ? m : m._id || m.id
    );

    this.projectForm = this.fb.group({
      title: [data?.project?.title || '', [Validators.required, Validators.maxLength(120)]],
      description: [data?.project?.description || ''],
      status: [data?.project?.status || 'Active', [Validators.required]],
      priority: [data?.project?.priority || 'Medium', [Validators.required]],
      members: [initialMemberIds],
    });
  }

  ngOnInit(): void {
    // Load users for member multi-select assignment
    this.apiService.getUsers({ limit: 100 }).subscribe((res) => {
      this.availableUsers.set(res.data.users);
    });
  }

  save(): void {
    if (this.projectForm.invalid) return;
    this.dialogRef.close(this.projectForm.value);
  }
}

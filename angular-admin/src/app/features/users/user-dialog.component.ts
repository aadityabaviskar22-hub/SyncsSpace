import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { User, UserRole } from '../../core/models/user.model.js';

@Component({
  selector: 'app-user-dialog',
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
    <h2 mat-dialog-title>{{ isEditMode ? 'Edit User Details' : 'Register New User' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="userForm" class="user-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Full Name</mat-label>
          <input matInput formControlName="name" placeholder="Aditya Sharma" />
          <mat-error *ngIf="userForm.get('name')?.hasError('required')">Name is required</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Email Address</mat-label>
          <input matInput type="email" formControlName="email" placeholder="aditya@example.com" />
          <mat-error *ngIf="userForm.get('email')?.hasError('required')">Email is required</mat-error>
          <mat-error *ngIf="userForm.get('email')?.hasError('email')">Invalid email format</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width" *ngIf="!isEditMode">
          <mat-label>Password</mat-label>
          <input matInput type="password" formControlName="password" placeholder="At least 6 characters" />
          <mat-error *ngIf="userForm.get('password')?.hasError('required')">Password is required</mat-error>
          <mat-error *ngIf="userForm.get('password')?.hasError('minlength')">Minimum 6 characters</mat-error>
        </mat-form-field>

        <div class="form-row">
          <mat-form-field appearance="outline" class="half-width">
            <mat-label>Department</mat-label>
            <mat-select formControlName="department">
              <mat-option value="Engineering">Engineering</mat-option>
              <mat-option value="Product">Product</mat-option>
              <mat-option value="Design">Design</mat-option>
              <mat-option value="QA">QA</mat-option>
              <mat-option value="Operations">Operations</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="half-width">
            <mat-label>Role</mat-label>
            <mat-select formControlName="role">
              <mat-option value="Member">Member</mat-option>
              <mat-option value="Manager">Manager</mat-option>
              <mat-option value="Admin">Admin</mat-option>
            </mat-select>
          </mat-form-field>
        </div>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" [disabled]="userForm.invalid" (click)="save()">
        {{ isEditMode ? 'Update' : 'Create' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .user-form {
        display: flex;
        flex-direction: column;
        padding-top: 8px;
        min-width: 380px;
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
export class UserDialogComponent {
  userForm: FormGroup;
  isEditMode: boolean = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<UserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { user?: User }
  ) {
    this.isEditMode = !!data?.user;

    this.userForm = this.fb.group({
      name: [data?.user?.name || '', [Validators.required]],
      email: [data?.user?.email || '', [Validators.required, Validators.email]],
      password: ['', this.isEditMode ? [] : [Validators.required, Validators.minLength(6)]],
      department: [data?.user?.department || 'Engineering'],
      role: [data?.user?.role || 'Member', [Validators.required]],
    });

    if (this.isEditMode) {
      // Disable editing email in edit mode for data consistency
      this.userForm.get('email')?.disable();
    }
  }

  save(): void {
    if (this.userForm.invalid) return;
    this.dialogRef.close(this.userForm.getRawValue());
  }
}

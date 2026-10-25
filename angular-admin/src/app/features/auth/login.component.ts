import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AuthService } from '../../core/services/auth.service.js';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
  ],
  template: `
    <div class="login-container">
      <mat-card class="login-card">
        <mat-card-header>
          <div class="brand-header">
            <mat-icon class="brand-icon">admin_panel_settings</mat-icon>
            <mat-card-title>System Admin Portal</mat-card-title>
            <mat-card-subtitle>SyncSpace</mat-card-subtitle>
          </div>
        </mat-card-header>

        <mat-progress-bar *ngIf="isLoading()" mode="indeterminate"></mat-progress-bar>

        <mat-card-content>
          <div *ngIf="errorMessage()" class="error-banner">
            <mat-icon>error_outline</mat-icon>
            <span>{{ errorMessage() }}</span>
          </div>

          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Admin Email</mat-label>
              <input
                matInput
                type="email"
                formControlName="email"
                placeholder="admin@projecthub.com"
                autocomplete="email"
              />
              <mat-icon matPrefix>email</mat-icon>
              <mat-error *ngIf="loginForm.get('email')?.hasError('required')">
                Email address is required.
              </mat-error>
              <mat-error *ngIf="loginForm.get('email')?.hasError('email')">
                Please enter a valid email format.
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Password</mat-label>
              <input
                matInput
                [type]="hidePassword() ? 'password' : 'text'"
                formControlName="password"
                placeholder="••••••••"
                autocomplete="current-password"
              />
              <mat-icon matPrefix>lock</mat-icon>
              <button
                mat-icon-button
                matSuffix
                type="button"
                (click)="hidePassword.set(!hidePassword())"
                [attr.aria-label]="'Hide password'"
              >
                <mat-icon>{{ hidePassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              <mat-error *ngIf="loginForm.get('password')?.hasError('required')">
                Password is required.
              </mat-error>
              <mat-error *ngIf="loginForm.get('password')?.hasError('minlength')">
                Password must be at least 6 characters.
              </mat-error>
            </mat-form-field>

            <button
              mat-flat-button
              color="primary"
              class="full-width submit-btn"
              type="submit"
              [disabled]="loginForm.invalid || isLoading()"
            >
              Sign In to Admin Panel
            </button>
          </form>
        </mat-card-content>

        <mat-card-footer class="login-footer">
          <small>Role-based access enforced • System Administrators Only</small>
        </mat-card-footer>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .login-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
        padding: 24px;
      }
      .login-card {
        width: 100%;
        max-width: 440px;
        background: #1e293b !important;
        color: #f8fafc !important;
        border: 1px solid #334155;
        border-radius: 16px;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
        overflow: hidden;
      }
      .brand-header {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        width: 100%;
        padding: 24px 0 16px;
      }
      .brand-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        color: #6366f1;
        margin-bottom: 8px;
      }
      mat-card-title {
        font-size: 22px;
        font-weight: 700;
        color: #ffffff;
      }
      mat-card-subtitle {
        color: #94a3b8;
        font-size: 13px;
        margin-top: 4px;
      }
      .full-width {
        width: 100%;
        margin-bottom: 8px;
      }
      .submit-btn {
        margin-top: 16px;
        padding: 12px;
        font-size: 14px;
        font-weight: 600;
        background-color: #4f46e5 !important;
      }
      .error-banner {
        display: flex;
        align-items: center;
        gap: 8px;
        background: rgba(239, 68, 68, 0.15);
        border: 1px solid #ef4444;
        color: #fca5a5;
        padding: 10px 14px;
        border-radius: 8px;
        margin-bottom: 16px;
        font-size: 13px;
      }
      .login-footer {
        text-align: center;
        padding: 16px;
        border-top: 1px solid #334155;
        color: #64748b;
      }
    `,
  ],
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  hidePassword = signal<boolean>(true);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.login(this.loginForm.value).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.user.role !== 'Admin') {
          this.errorMessage.set('Access Denied: You must have an Admin role to view this panel.');
          this.authService.logout();
        } else {
          this.router.navigate(['/admin/dashboard']);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Authentication failed. Please verify credentials.');
      },
    });
  }
}

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { AuthService } from '../../core/services/auth.service.js';
import { AdminSocketService } from '../../core/services/socket.service.js';
import { ThemeService } from '../../core/services/theme.service.js';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatBadgeModule,
  ],
  template: `
    <div class="layout-container">
      <mat-toolbar class="admin-toolbar" color="primary">
        <button mat-icon-button (click)="sidenav.toggle()" aria-label="Toggle sidenav">
          <mat-icon>menu</mat-icon>
        </button>

        <div class="logo-area">
          <mat-icon class="hub-icon">hub</mat-icon>
          <span class="hub-title">
            <span class="sync-gradient">Sync</span><span class="space-regular">Space</span> Admin
          </span>
          <span class="hub-tag">Standalone Panel</span>
        </div>

        <span class="spacer"></span>

        <!-- Live Socket Indicator -->
        <div class="socket-status" [class.connected]="socketService.isConnected()">
          <span class="pulse-dot"></span>
          <span class="status-text">{{ socketService.isConnected() ? 'Live Stream Active' : 'Connecting...' }}</span>
        </div>

        <!-- Global Dark Mode Toggle -->
        <button
          mat-icon-button
          (click)="themeService.toggleTheme()"
          class="theme-toggle-btn"
          [attr.aria-label]="themeService.isDarkMode() ? 'Switch to light mode' : 'Switch to dark mode'"
          [title]="themeService.isDarkMode() ? 'Switch to light mode' : 'Switch to dark mode'"
        >
          <mat-icon>{{ themeService.isDarkMode() ? 'light_mode' : 'dark_mode' }}</mat-icon>
        </button>

        <!-- User Profile Dropdown -->
        <button mat-button [matMenuTriggerFor]="userMenu" class="user-btn">
          <mat-icon>account_circle</mat-icon>
          <span class="user-name">{{ authService.currentUser()?.name || 'Administrator' }}</span>
          <mat-icon>arrow_drop_down</mat-icon>
        </button>

        <mat-menu #userMenu="matMenu">
          <div class="user-menu-header">
            <strong>{{ authService.currentUser()?.name }}</strong>
            <small>{{ authService.currentUser()?.email }}</small>
            <span class="role-pill">Admin</span>
          </div>
          <mat-divider></mat-divider>
          <button mat-menu-item (click)="logout()">
            <mat-icon>logout</mat-icon>
            <span>Sign Out</span>
          </button>
        </mat-menu>
      </mat-toolbar>

      <mat-sidenav-container class="sidenav-container">
        <mat-sidenav #sidenav mode="side" opened class="admin-sidenav">
          <mat-nav-list>
            <div class="nav-section-title">SYSTEM MONITORING</div>

            <a mat-list-item routerLink="/admin/dashboard" routerLinkActive="active-nav">
              <mat-icon matListItemIcon>insights</mat-icon>
              <span matListItemTitle>Analytics Dashboard</span>
            </a>

            <div class="nav-section-title">ADMINISTRATIVE CRUD</div>

            <a mat-list-item routerLink="/admin/users" routerLinkActive="active-nav">
              <mat-icon matListItemIcon>manage_accounts</mat-icon>
              <span matListItemTitle>User Management</span>
            </a>

            <a mat-list-item routerLink="/admin/projects" routerLinkActive="active-nav">
              <mat-icon matListItemIcon>folder_shared</mat-icon>
              <span matListItemTitle>Projects Roster</span>
            </a>

            <div class="nav-section-title">SECURITY & AUDIT</div>

            <a mat-list-item routerLink="/admin/activities" routerLinkActive="active-nav">
              <mat-icon matListItemIcon>history_edu</mat-icon>
              <span matListItemTitle>Activity Audit Trail</span>
            </a>
          </mat-nav-list>
        </mat-sidenav>

        <mat-sidenav-content class="main-content">
          <router-outlet></router-outlet>
        </mat-sidenav-content>
      </mat-sidenav-container>
    </div>
  `,
  styles: [
    `
      .layout-container {
        display: flex;
        flex-direction: column;
        height: 100vh;
        background-color: #0b0f19;
      }
      .admin-toolbar {
        background: #0f172a !important;
        border-bottom: 1px solid #1e293b;
        color: #ffffff;
        z-index: 10;
        height: 64px;
      }
      .logo-area {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-left: 8px;
      }
      .hub-icon {
        color: #6366f1;
      }
      .hub-title {
        font-size: 18px;
        letter-spacing: -0.5px;
      }
      .sync-gradient {
        background: linear-gradient(135deg, #818cf8, #38bdf8);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        font-weight: 800;
      }
      .space-regular {
        font-weight: 400;
        color: #ffffff;
      }
      .hub-tag {
        font-size: 10px;
        padding: 2px 6px;
        background: rgba(99, 102, 241, 0.2);
        color: #818cf8;
        border: 1px solid rgba(99, 102, 241, 0.4);
        border-radius: 4px;
        font-family: monospace;
      }
      .spacer {
        flex: 1 1 auto;
      }
      .socket-status {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        border-radius: 12px;
        background: rgba(148, 163, 184, 0.1);
        color: #94a3b8;
        font-size: 12px;
        margin-right: 16px;
      }
      .socket-status.connected {
        background: rgba(16, 185, 129, 0.15);
        color: #34d399;
        border: 1px solid rgba(16, 185, 129, 0.3);
      }
      .pulse-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background-color: #ef4444;
      }
      .socket-status.connected .pulse-dot {
        background-color: #10b981;
        box-shadow: 0 0 6px #10b981;
      }
      .theme-toggle-btn {
        margin-right: 8px;
        color: #94a3b8;
        transition: color 0.2s ease, transform 0.2s ease;
      }
      .theme-toggle-btn:hover {
        color: #f8fafc;
        transform: rotate(15deg);
      }
      .user-btn {
        color: #f1f5f9;
      }
      .user-name {
        margin: 0 4px;
        font-weight: 500;
      }
      .sidenav-container {
        flex: 1;
        background-color: #0b0f19;
      }
      .admin-sidenav {
        width: 250px;
        background: #0f172a;
        border-right: 1px solid #1e293b;
        color: #cbd5e1;
      }
      .nav-section-title {
        font-size: 11px;
        font-weight: 700;
        color: #64748b;
        letter-spacing: 0.5px;
        padding: 16px 16px 6px;
      }
      mat-nav-list a {
        color: #94a3b8 !important;
        margin: 2px 8px;
        border-radius: 8px;
      }
      mat-nav-list a:hover {
        background: #1e293b !important;
        color: #f8fafc !important;
      }
      .active-nav {
        background: rgba(99, 102, 241, 0.15) !important;
        color: #818cf8 !important;
        font-weight: 600;
      }
      .active-nav mat-icon {
        color: #818cf8 !important;
      }
      .main-content {
        padding: 24px;
        background-color: #0b0f19;
        overflow-y: auto;
      }
      .user-menu-header {
        display: flex;
        flex-direction: column;
        padding: 12px 16px;
      }
      .role-pill {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 12px;
        background: #4f46e5;
        color: white;
        font-size: 10px;
        width: fit-content;
        margin-top: 6px;
      }
    `,
  ],
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  constructor(
    public authService: AuthService,
    public socketService: AdminSocketService,
    public themeService: ThemeService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Connect to Socket.IO when entering admin layout
    this.socketService.connect();
  }

  ngOnDestroy(): void {
    this.socketService.disconnect();
  }

  logout(): void {
    this.authService.logout();
  }
}

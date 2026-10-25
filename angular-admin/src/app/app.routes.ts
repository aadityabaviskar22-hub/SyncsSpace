import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin.guard.js';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login.component.js').then((m) => m.LoginComponent),
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./features/layout/admin-layout.component.js').then((m) => m.AdminLayoutComponent),
    canActivate: [adminGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component.js').then((m) => m.DashboardComponent),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./features/users/user-list.component.js').then((m) => m.UserListComponent),
      },
      {
        path: 'projects',
        loadComponent: () =>
          import('./features/projects/project-list.component.js').then((m) => m.ProjectListComponent),
      },
      {
        path: 'activities',
        loadComponent: () =>
          import('./features/activities/activity-list.component.js').then(
            (m) => m.ActivityListComponent
          ),
      },
    ],
  },
  {
    path: '',
    redirectTo: '/admin/dashboard',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: '/admin/dashboard',
  },
];

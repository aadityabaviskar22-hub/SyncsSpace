import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service.js';

export const adminGuard: CanActivateFn = (_route, _state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated() && authService.isAdmin()) {
    return true;
  }

  // If user is logged in but not an Admin, alert and redirect to login
  router.navigate(['/login'], {
    queryParams: { error: 'AdminAccessRequired' },
  });
  return false;
};

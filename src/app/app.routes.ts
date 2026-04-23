import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'auth/login'
  },
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES)
  },
  {
    path: 'app',
    loadChildren: () =>
      import('./layout/pages/app-layout/app-layout.routes').then((m) => m.APP_LAYOUT_ROUTES)
  },
  {
    path: '**',
    redirectTo: 'auth/login'
  }
];

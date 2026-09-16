import { Routes } from '@angular/router';
import { authGuard, guestGuard } from '@core/guards/auth.guard';
import { AppLayoutComponent } from '@layout/components/app-layout/app-layout.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login',
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadChildren: () => import('@features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: '',
    component: AppLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'home',
        loadChildren: () => import('@features/home/home.routes').then((m) => m.HOME_ROUTES),
      },
      {
        path: 'inbox',
        loadChildren: () => import('@features/inbox/inbox.routes').then((m) => m.INBOX_ROUTES),
      },
      {
        path: 'diagrama',
        loadChildren: () => import('@features/diagrama/diagrama.routes').then((m) => m.DIAGRAMA_ROUTES),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];

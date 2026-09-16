import { Routes } from '@angular/router';

export const DIAGRAMA_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./diagrama.component').then((m) => m.DiagramaComponent),
    title: 'Diagrama · UBX',
  },
];

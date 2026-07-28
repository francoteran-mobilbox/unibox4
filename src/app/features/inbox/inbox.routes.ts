import { Routes } from '@angular/router';
import { SeccionTipo } from './bandeja/bandeja.component';

export const INBOX_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'recibidas',
  },
  {
    path: 'recibidas',
    loadComponent: () =>
      import('./bandeja/bandeja.component').then((m) => m.BandejaComponent),
    data: { tipo: 'recibidas' satisfies SeccionTipo },
    title: 'Recibidas · UBX',
  },
  {
    path: 'enviadas',
    loadComponent: () =>
      import('./bandeja/bandeja.component').then((m) => m.BandejaComponent),
    data: { tipo: 'enviadas' satisfies SeccionTipo },
    title: 'Enviadas · UBX',
  },
  {
    path: 'procesos-ejecucion',
    loadComponent: () =>
      import('./procesos-ejecucion/procesos-ejecucion.component').then(
        (m) => m.ProcesosEjecucionComponent,
      ),
    title: 'Procesos en ejecución · UBX',
  },
];

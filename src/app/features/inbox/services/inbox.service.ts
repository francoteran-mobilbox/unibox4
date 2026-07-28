import { HttpClient } from '@angular/common/http';
import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { ActividadEjecucion, ActividadResponse } from '../models/actividad.model';

const API_BASE_RECIBIDAS =
  'http://capacitacion4.mobilbox.mobi/gestorDocumental/rest-gestor/tareas/obtenerActividadesPorIdUsuario';
const API_BASE_ENVIADAS =
  'http://capacitacion4.mobilbox.mobi/gestorDocumental/rest-gestor/tareas/obtenerActividadesEnviadasPorIdUsuario';
const ID_USUARIO = 'SoporteMovilgo';
const PAGINA = 0;
const ITEMS_POR_PAGINA = 10;

export interface SeccionStore {
  readonly isLoading: Signal<boolean>;
  readonly actividades: Signal<readonly ActividadEjecucion[]>;
  readonly count: Signal<number>;
  readonly fallido: Signal<boolean>;
  readonly mensajeError: Signal<string>;
  readonly cargar: () => void;
}

function crearStore(
  http: HttpClient,
  buildUrl: () => string,
  countField: (r: ActividadResponse) => number,
): SeccionStore {
  const data = signal<ActividadResponse | null>(null);
  const loading = signal<boolean>(false);
  const fallido = signal<boolean>(false);
  const mensajeError = signal<string>('');

  const cargar = (): void => {
    loading.set(true);
    fallido.set(false);
    mensajeError.set('');

    http
      .get<ActividadResponse>(buildUrl())
      .pipe(
        catchError((err) => {
          fallido.set(true);
          mensajeError.set(err.statusText ?? 'Error de conexión');
          return of(null);
        }),
        finalize(() => loading.set(false)),
      )
      .subscribe({
        next: (res) => {
          if (res !== null) {
            data.set(res);
          }
        },
      });
  };

  return {
    isLoading: loading.asReadonly(),
    actividades: computed(() => data()?.actividades ?? []),
    count: computed(() => (data() !== null ? countField(data()!) : 0)),
    fallido: fallido.asReadonly(),
    mensajeError: mensajeError.asReadonly(),
    cargar,
  };
}

@Injectable({ providedIn: 'root' })
export class InboxService {
  private readonly http = inject(HttpClient);

  readonly recibidas: SeccionStore = crearStore(
    this.http,
    () =>
      `${API_BASE_RECIBIDAS}/${ID_USUARIO}/recibidas/${PAGINA}/${ITEMS_POR_PAGINA}`,
    (r) => r.count_recibidas,
  );

  readonly enviadas: SeccionStore = crearStore(
    this.http,
    () => `${API_BASE_ENVIADAS}/${ID_USUARIO}/${PAGINA}/${ITEMS_POR_PAGINA}`,
    (r) => r.count_enviadas ?? r.count_recibidas,
  );
}

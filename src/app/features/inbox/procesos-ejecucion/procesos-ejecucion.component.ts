import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { ProcesoEjecucionDict, ProcesoEjecucionItem } from '../models/proceso-ejecucion.model';
import { ActividadIbx, ActividadesResponse } from '../models/actividad-ibx.model';

const API_PROCESOS =
  'http://capacitacion4.mobilbox.mobi/gestorDocumental/rest-gestor/procesos-ejecucion/obtenerProcesosEnEjecucionPorActividadesUsuarioPorEstado';
const API_ACTIVIDADES =
  'http://capacitacion4.mobilbox.mobi/gestorDocumental/rest-gestor/tareas/obtenerActividadesIbxPorIdProcesoEE';
const ESTADO = 'eje';
const ID_USUARIO = 'SoporteMovilgo';
const PAGINA = 0;
const ITEMS_POR_PAGINA = 10;

@Component({
  selector: 'app-procesos-ejecucion',
  imports: [
    NzButtonModule,
    NzCardModule,
    NzEmptyModule,
    NzIconModule,
    NzInputModule,
    NzSpinModule,
    NzTableModule,
    NzToolTipModule,
    PageHeaderComponent,
  ],
  templateUrl: './procesos-ejecucion.component.html',
  styleUrl: './procesos-ejecucion.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProcesosEjecucionComponent {
  private readonly http = inject(HttpClient);
  private readonly message = inject(NzMessageService);

  protected readonly emptyArr: ActividadIbx[] = [];

  protected readonly responseData = signal<ProcesoEjecucionDict | null>(null);
  protected readonly isLoading = signal<boolean>(false);
  protected readonly pasoFallido = signal<boolean>(false);
  protected readonly searchText = signal<string>('');
  protected readonly expandedIds = signal<Set<number>>(new Set());

  /** caché de actividades por processrunning_id */
  protected readonly actividadesCache = signal<Record<number, ActividadIbx[] | undefined>>({});
  /** ids para los que se está cargando */
  protected readonly cargandoActividades = signal<Set<number>>(new Set());

  protected readonly procesos = computed<readonly ProcesoEjecucionItem[]>(() => {
    const data = this.responseData();
    if (data === null) {
      return [];
    }
    return Object.values(data);
  });

  protected readonly filteredProcesos = computed<readonly ProcesoEjecucionItem[]>(() => {
    const texto = this.searchText().toLowerCase().trim();
    const lista = this.procesos();

    if (texto === '') {
      return lista;
    }

    return lista.filter((p) => p.processrunning_name.toLowerCase().includes(texto));
  });

  constructor() {
    this.cargarProcesos();
  }

  protected cargarProcesos(): void {
    this.isLoading.set(true);
    this.pasoFallido.set(false);

    const url = `${API_PROCESOS}/${ESTADO}/${ID_USUARIO}/${PAGINA}/${ITEMS_POR_PAGINA}`;

    this.http
      .get<ProcesoEjecucionDict>(url)
      .pipe(
        catchError(() => {
          this.pasoFallido.set(true);
          return of(null);
        }),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: (data) => {
          if (data !== null) {
            this.responseData.set(data);
          }
        },
      });
  }

  protected onReload(): void {
    this.actividadesCache.set({});
    this.cargandoActividades.set(new Set());
    this.cargarProcesos();
  }

  protected onSearch(event: Event): void {
    this.searchText.set((event.target as HTMLInputElement).value);
  }

  protected toggleExpand(id: number): void {
    const isExpanding = !this.expandedIds().has(id);

    this.expandedIds.update((set) => {
      const nuevo = new Set(set);
      if (nuevo.has(id)) {
        nuevo.delete(id);
      } else {
        nuevo.add(id);
      }
      return nuevo;
    });

    if (isExpanding) {
      setTimeout(() => this.cargarActividades(id));
    }
  }

  private cargarActividades(processrunningId: number): void {
    if (this.actividadesCache()[processrunningId] !== undefined) {
      return;
    }

    this.cargandoActividades.update((set) => {
      const nuevo = new Set(set);
      nuevo.add(processrunningId);
      return nuevo;
    });

    this.http
      .post<ActividadesResponse>(API_ACTIVIDADES, { processrunning_id: processrunningId })
      .pipe(
        catchError(() => {
          this.message.error('Error al cargar actividades del proceso');
          this.actividadesCache.update((cache) => ({
            ...cache,
            [processrunningId]: [],
          }));
          return of({ actividades: [] });
        }),
        finalize(() => {
          this.cargandoActividades.update((set) => {
            const nuevo = new Set(set);
            nuevo.delete(processrunningId);
            return nuevo;
          });
        }),
      )
      .subscribe({
        next: (resp) => {
          this.actividadesCache.update((cache) => ({
            ...cache,
            [processrunningId]: resp.actividades ?? [],
          }));
        },
      });
  }

  protected estaCargandoActividades(id: number): boolean {
    return this.cargandoActividades().has(id);
  }

  protected formatDate(fecha: string): string {
    try {
      const date = new Date(fecha.replace(' ', 'T') + 'Z');
      if (isNaN(date.getTime())) {
        return fecha.slice(0, 10);
      }
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return fecha.slice(0, 10);
    }
  }

  protected estadoIcono(estado: string): string {
    const map: Record<string, string> = {
      eje: 'play-circle',
    };
    return map[estado] ?? 'exclamation-circle';
  }

  protected estadoColor(estado: string): string {
    const map: Record<string, string> = {
      eje: '#1677ff',
    };
    return map[estado] ?? '#94a3b8';
  }

  protected encargadoTexto(act: ActividadIbx): string {
    if (act.usuarios_encargados.length > 0) {
      return act.usuarios_encargados[0].encargado;
    }
    return '-';
  }
}

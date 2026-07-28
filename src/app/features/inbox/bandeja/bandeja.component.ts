import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { ActividadEjecucion } from '../models/actividad.model';
import { InboxService, SeccionStore } from '../services/inbox.service';

interface EstadoMeta {
  readonly icon: string;
  readonly color: string;
}

const ESTADO_META_MAP: Record<string, EstadoMeta> = {
  aceptada: { icon: 'check-circle', color: '#52c41a' },
  pendiente: { icon: 'clock-circle', color: '#faad14' },
  rechazada: { icon: 'close-circle', color: '#ff4d4f' },
  finalizada: { icon: 'check-circle', color: '#1677ff' },
};

function obtenerEstadoMeta(actividad: ActividadEjecucion): EstadoMeta {
  const id = actividad.state_activity.statetype_id.toLowerCase();
  return ESTADO_META_MAP[id] ?? { icon: 'exclamation-circle', color: '#94a3b8' };
}

export type SeccionTipo = 'recibidas' | 'enviadas';

interface ConfigSeccion {
  readonly title: string;
  readonly subtitle: string;
  readonly emptyText: string;
}

const CONFIG_MAP: Record<SeccionTipo, ConfigSeccion> = {
  recibidas: {
    title: 'Recibidas',
    subtitle: 'Bandeja de tareas recibidas pendientes de gestión',
    emptyText: 'No hay tareas recibidas',
  },
  enviadas: {
    title: 'Enviadas',
    subtitle: 'Bandeja de tareas enviadas',
    emptyText: 'No hay tareas enviadas',
  },
};

@Component({
  selector: 'app-bandeja',
  imports: [
    NzButtonModule,
    NzCardModule,
    NzEmptyModule,
    NzIconModule,
    NzInputModule,
    NzTableModule,
    NzToolTipModule,
    PageHeaderComponent,
  ],
  templateUrl: './bandeja.component.html',
  styleUrl: './bandeja.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BandejaComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly inboxService = inject(InboxService);
  private readonly message = inject(NzMessageService);

  private readonly tipo = signal<SeccionTipo>(
    (this.route.snapshot.data['tipo'] as SeccionTipo) ?? 'recibidas',
  );

  private readonly seccion = computed<SeccionStore>(() =>
    this.tipo() === 'recibidas' ? this.inboxService.recibidas : this.inboxService.enviadas,
  );

  protected readonly config = computed<ConfigSeccion>(() => CONFIG_MAP[this.tipo()]);
  protected readonly isLoading = computed(() => this.seccion().isLoading());
  protected readonly pasoFallido = computed(() => this.seccion().fallido());
  protected readonly searchText = signal<string>('');

  protected readonly actividades = computed<readonly ActividadEjecucion[]>(() => {
    const texto = this.searchText().toLowerCase().trim();
    const lista = this.seccion().actividades();

    if (texto === '') {
      return lista;
    }

    return lista.filter(
      (a) =>
        a.actividad.activity_name.toLowerCase().includes(texto) ||
        a.proceso_en_ejecucion.processrunnig_name.toLowerCase().includes(texto),
    );
  });

  constructor() {
    this.seccion().cargar();
  }

  protected onSearch(event: Event): void {
    this.searchText.set((event.target as HTMLInputElement).value);
  }

  protected onReload(): void {
    this.seccion().cargar();
  }

  protected estadoMeta(actividad: ActividadEjecucion): EstadoMeta {
    return obtenerEstadoMeta(actividad);
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

  protected onAccion(tipo: string): void {
    this.message.info(`Acción «${tipo}» — funcionalidad en desarrollo`);
  }
}

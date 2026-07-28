import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { RecentUserStatus } from '@core/models/recent-user.model';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { StatCardComponent } from '@shared/components/stat-card/stat-card.component';
import { InitialsPipe } from '@shared/pipes/initials.pipe';
import { DASHBOARD_STATS, RECENT_ACTIVITY, RECENT_USERS } from './data/dashboard.mock';

interface StatusMeta {
  readonly label: string;
  readonly badge: 'success' | 'warning' | 'default';
  readonly tagColor: string;
}

const STATUS_META: Record<RecentUserStatus, StatusMeta> = {
  active: { label: 'Activo', badge: 'success', tagColor: 'success' },
  pending: { label: 'Pendiente', badge: 'warning', tagColor: 'warning' },
  inactive: { label: 'Inactivo', badge: 'default', tagColor: 'default' },
};

@Component({
  selector: 'app-home',
  imports: [
    CurrencyPipe,
    NzBadgeModule,
    NzButtonModule,
    NzCardModule,
    NzIconModule,
    NzTableModule,
    NzTagModule,
    PageHeaderComponent,
    StatCardComponent,
    InitialsPipe,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  private readonly message = inject(NzMessageService);

  protected readonly stats = DASHBOARD_STATS;
  protected readonly recentUsers = RECENT_USERS;
  protected readonly activities = RECENT_ACTIVITY;

  protected statusMeta(status: RecentUserStatus): StatusMeta {
    return STATUS_META[status];
  }

  protected onDownloadReport(): void {
    this.message.success('El reporte se está generando y estará listo en breve');
  }
}

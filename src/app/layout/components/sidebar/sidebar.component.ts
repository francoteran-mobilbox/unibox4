import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { MenuItem } from '@core/models/menu-item.model';
import { AuthService } from '@core/services/auth.service';
import { LogoComponent } from '@shared/ui/logo/logo.component';
import { InboxService } from '@features/inbox/services/inbox.service';

@Component({
  selector: 'app-sidebar',
  imports: [
    RouterLink,
    RouterLinkActive,
    NzBadgeModule,
    NzIconModule,
    NzMenuModule,
    NzToolTipModule,
    LogoComponent,
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  private readonly authService = inject(AuthService);
  private readonly message = inject(NzMessageService);
  private readonly router = inject(Router);

  readonly collapsed = input<boolean>(false);
  readonly mobileOpen = input<boolean>(false);
  readonly navigated = output<void>();

  protected readonly inboxService = inject(InboxService);

  protected readonly menuItems: readonly MenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', route: '/home' },
    { id: 'inbox', label: 'Inbox', icon: 'inbox', children: [
      { id: 'recibidas', label: 'Recibidas', icon: 'mail', route: '/inbox/recibidas' },
      { id: 'enviadas', label: 'Enviadas', icon: 'send', route: '/inbox/enviadas' },
      { id: 'procesos-ejecucion', label: 'Procesos‑Ejecución', icon: 'profile', route: '/inbox/procesos-ejecucion' },
    ]},
    { id: 'users', label: 'Usuarios', icon: 'team' },
    { id: 'reports', label: 'Reportes', icon: 'bar-chart' },
    { id: 'settings', label: 'Configuración', icon: 'setting' },
  ];

  protected onMenuItemClick(item: MenuItem): void {
    if (item.route) {
      this.navigated.emit();
      return;
    }
    this.message.info(`La sección «${item.label}» estará disponible próximamente`);
  }

  protected async onLogout(): Promise<void> {
    this.authService.logout();
    this.navigated.emit();
    await this.router.navigate(['/login']);
  }
}

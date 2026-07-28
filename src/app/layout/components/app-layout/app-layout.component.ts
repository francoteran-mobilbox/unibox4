import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LayoutService } from '@core/services/layout.service';
import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, HeaderComponent, SidebarComponent],
  templateUrl: './app-layout.component.html',
  styleUrl: './app-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppLayoutComponent {
  protected readonly layout = inject(LayoutService);

  protected onMenuToggle(): void {
    this.layout.toggleSidebar();
  }

  protected onBackdropClick(): void {
    this.layout.closeMobileSidebar();
  }

  protected onNavigated(): void {
    this.layout.closeMobileSidebar();
  }
}

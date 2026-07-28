import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { Router } from '@angular/router';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { AuthService } from '@core/services/auth.service';
import { InitialsPipe } from '@shared/pipes/initials.pipe';

@Component({
  selector: 'app-header',
  imports: [NzAvatarModule, NzBadgeModule, NzDropDownModule, NzIconModule, NzToolTipModule, InitialsPipe],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly menuToggle = output<void>();

  protected readonly user = this.authService.user;

  protected async onLogout(): Promise<void> {
    this.authService.logout();
    await this.router.navigate(['/login']);
  }
}

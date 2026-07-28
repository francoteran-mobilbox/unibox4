import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type LogoVariant = 'dark' | 'light';

@Component({
  selector: 'app-logo',
  templateUrl: './logo.component.html',
  styleUrl: './logo.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogoComponent {
  readonly collapsed = input<boolean>(false);
  readonly variant = input<LogoVariant>('dark');
}

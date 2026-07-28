import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { StatCardData } from '@core/models/stat-card.model';

@Component({
  selector: 'app-stat-card',
  imports: [NzIconModule],
  templateUrl: './stat-card.component.html',
  styleUrl: './stat-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatCardComponent {
  readonly stat = input.required<StatCardData>();

  protected readonly trendPositive = computed<boolean>(() => this.stat().trend >= 0);
  protected readonly trendIcon = computed<string>(() =>
    this.trendPositive() ? 'arrow-up' : 'arrow-down',
  );
  protected readonly trendValue = computed<string>(() => `${Math.abs(this.stat().trend)}%`);
}

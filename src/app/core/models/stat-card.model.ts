export type StatAccent = 'blue' | 'green' | 'violet' | 'orange';

export interface StatCardData {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly icon: string;
  readonly trend: number;
  readonly trendLabel: string;
  readonly accent: StatAccent;
}

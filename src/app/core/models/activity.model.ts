export type ActivityTone = 'blue' | 'green' | 'violet' | 'orange' | 'red';

export interface ActivityItem {
  readonly id: string;
  readonly icon: string;
  readonly tone: ActivityTone;
  readonly title: string;
  readonly description: string;
  readonly time: string;
}

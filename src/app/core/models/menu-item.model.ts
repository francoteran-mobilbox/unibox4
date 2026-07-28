export interface MenuItem {
  readonly id: string;
  readonly label: string;
  readonly icon: string;
  readonly route?: string;
  readonly children?: readonly MenuItem[];
  readonly badge?: number;
}

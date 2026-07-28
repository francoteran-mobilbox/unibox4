export type RecentUserStatus = 'active' | 'pending' | 'inactive';

export interface RecentUser {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly role: string;
  readonly status: RecentUserStatus;
  readonly joinedAt: string;
  readonly totalSpent: number;
}

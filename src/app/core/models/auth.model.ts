import { User } from './user.model';

export interface LoginCredentials {
  readonly email: string;
  readonly password: string;
  readonly rememberMe: boolean;
}

export interface AuthSession {
  readonly user: User;
  readonly persistent: boolean;
  readonly accessToken: string;
}

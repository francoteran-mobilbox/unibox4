import { Injectable, computed, effect, signal } from '@angular/core';
import { AUTH_SESSION_STORAGE_KEY, AUTH_TOKEN_STORAGE_KEY } from '@shared/utils/storage-keys';
import { AuthSession, LoginCredentials } from '@core/models/auth.model';
import { User } from '@core/models/user.model';

const MOCK_USER: User = {
  id: 'usr-001',
  name: 'Valeria Mendoza',
  email: 'valeria.mendoza@ubx.io',
  role: 'Administradora',
};

const LOGIN_SIMULATION_DELAY_MS = 900;

interface PersistedAuthSession {
  readonly user: User;
  readonly accessToken: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly sessionState = signal<AuthSession | null>(this.restoreSession());

  readonly user = computed<User | null>(() => this.sessionState()?.user ?? null);
  readonly isAuthenticated = computed<boolean>(() => this.sessionState() !== null);
  readonly accessToken = computed<string | null>(() => this.sessionState()?.accessToken ?? null);

  constructor() {
    effect(() => this.syncStorage(this.sessionState()));
  }

  login(credentials: LoginCredentials): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const session: AuthSession = {
          user: { ...MOCK_USER, email: credentials.email },
          persistent: credentials.rememberMe,
          accessToken: this.generateMockToken(credentials.email),
        };
        this.sessionState.set(session);
        resolve();
      }, LOGIN_SIMULATION_DELAY_MS);
    });
  }

  logout(): void {
    this.sessionState.set(null);
  }

  private restoreSession(): AuthSession | null {
    const stored =
      localStorage.getItem(AUTH_SESSION_STORAGE_KEY) ??
      sessionStorage.getItem(AUTH_SESSION_STORAGE_KEY);
    const storedToken =
      localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) ??
      sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY);

    if (stored === null || storedToken === null) {
      return null;
    }

    try {
      const parsed = JSON.parse(stored) as PersistedAuthSession | User;
      const user = this.resolveUser(parsed);
      if (user === null) {
        return null;
      }

      const persistent = localStorage.getItem(AUTH_SESSION_STORAGE_KEY) !== null;
      return {
        user,
        persistent,
        accessToken: storedToken,
      };
    } catch {
      return null;
    }
  }

  private syncStorage(session: AuthSession | null): void {
    localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
    sessionStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);

    if (session !== null) {
      const storage = session.persistent ? localStorage : sessionStorage;
      storage.setItem(
        AUTH_SESSION_STORAGE_KEY,
        JSON.stringify({ user: session.user, accessToken: session.accessToken }),
      );
      storage.setItem(AUTH_TOKEN_STORAGE_KEY, session.accessToken);
    }
  }

  private resolveUser(data: PersistedAuthSession | User): User | null {
    if ('user' in data) {
      return data.user;
    }
    if ('email' in data && 'name' in data && 'id' in data && 'role' in data) {
      return data;
    }
    return null;
  }

  private generateMockToken(email: string): string {
    return `mock.${btoa(`${email}:${Date.now()}`)}`;
  }
}

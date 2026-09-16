import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { AUTH_SESSION_STORAGE_KEY, AUTH_TOKEN_STORAGE_KEY } from '@shared/utils/storage-keys';
import { User } from '@core/models/user.model';

describe('AuthService', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();

    TestBed.configureTestingModule({
      providers: [AuthService],
    });
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('starts unauthenticated when there is no stored session', () => {
    const service = TestBed.inject(AuthService);

    expect(service.isAuthenticated()).toBeFalse();
    expect(service.user()).toBeNull();
    expect(service.accessToken()).toBeNull();
  });

  it('stores session and token in sessionStorage when rememberMe is false', fakeAsync(() => {
    const service = TestBed.inject(AuthService);

    void service.login({
      email: 'dev@ubx.io',
      password: 'secret',
      rememberMe: false,
    });

    tick(900);

    expect(service.isAuthenticated()).toBeTrue();
    expect(service.accessToken()).not.toBeNull();

    const storedSession = sessionStorage.getItem(AUTH_SESSION_STORAGE_KEY);
    const storedToken = sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY);

    expect(storedSession).not.toBeNull();
    expect(storedToken).toBe(service.accessToken());
    expect(localStorage.getItem(AUTH_SESSION_STORAGE_KEY)).toBeNull();
  }));

  it('stores session and token in localStorage when rememberMe is true', fakeAsync(() => {
    const service = TestBed.inject(AuthService);

    void service.login({
      email: 'dev@ubx.io',
      password: 'secret',
      rememberMe: true,
    });

    tick(900);

    expect(localStorage.getItem(AUTH_SESSION_STORAGE_KEY)).not.toBeNull();
    expect(localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBe(service.accessToken());
    expect(sessionStorage.getItem(AUTH_SESSION_STORAGE_KEY)).toBeNull();
  }));

  it('restores session from legacy user payload when token is present', () => {
    const legacyUser: User = {
      id: 'usr-legacy',
      name: 'Legacy User',
      email: 'legacy@ubx.io',
      role: 'Operador',
    };

    sessionStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(legacyUser));
    sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEY, 'mock.legacy-token');

    const restored = new AuthService();

    expect(restored.isAuthenticated()).toBeTrue();
    expect(restored.user()?.email).toBe('legacy@ubx.io');
    expect(restored.accessToken()).toBe('mock.legacy-token');
  });

  it('clears all auth storage keys on logout', fakeAsync(() => {
    const service = TestBed.inject(AuthService);

    void service.login({
      email: 'dev@ubx.io',
      password: 'secret',
      rememberMe: true,
    });

    tick(900);

    service.logout();

    expect(service.isAuthenticated()).toBeFalse();
    expect(localStorage.getItem(AUTH_SESSION_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBeNull();
    expect(sessionStorage.getItem(AUTH_SESSION_STORAGE_KEY)).toBeNull();
    expect(sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBeNull();
  }));
});

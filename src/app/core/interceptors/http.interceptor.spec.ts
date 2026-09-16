import { HttpClient } from '@angular/common/http';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthService } from '@core/services/auth.service';
import { httpInterceptor } from './http.interceptor';

class AuthServiceStub {
  token: string | null = null;

  accessToken(): string | null {
    return this.token;
  }
}

describe('httpInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authStub: AuthServiceStub;

  beforeEach(() => {
    authStub = new AuthServiceStub();

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authStub },
        provideHttpClient(withInterceptors([httpInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('adds Authorization header when token exists', () => {
    authStub.token = 'mock.token.value';

    http.get('/api/data').subscribe();

    const req = httpMock.expectOne('/api/data');
    expect(req.request.headers.get('Authorization')).toBe('Bearer mock.token.value');
    req.flush({ ok: true });
  });

  it('does not add Authorization header when token is missing', () => {
    authStub.token = null;

    http.get('/api/data').subscribe();

    const req = httpMock.expectOne('/api/data');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({ ok: true });
  });
});

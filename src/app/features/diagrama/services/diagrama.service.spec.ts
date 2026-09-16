import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { DiagramaService } from './diagrama.service';

describe('DiagramaService', () => {
  let service: DiagramaService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DiagramaService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(DiagramaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('calls procesos en ejecucion endpoint with POST and server paging payload', () => {
    service
      .obtenerProcesosEjecucion({
        id_roles: [1],
        pag: 0,
        itemPag: 10,
      })
      .subscribe();

    const req = httpMock.expectOne(
      'http://capacitacion4.mobilbox.mobi/gestorDocumental/rest-gestor/procesos-ejecucion-gestion/obtenerTodosGestionProcesosEE/',
    );

    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ id_roles: [1], pag: 0, itemPag: 10 });

    req.flush({ procesosEE: [], count_procesosEE: 0 });
  });

  it('calls procesos endpoint with GET', () => {
    service.obtenerProcesos().subscribe();

    const req = httpMock.expectOne(
      'http://capacitacion4.mobilbox.mobi/gestorDocumental/rest-gestor/procesos/obtenerTodosLivianoConfiguracion/',
    );

    expect(req.request.method).toBe('GET');
    req.flush({ count_procesos: 0, procesos: [] });
  });
});

import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { DiagramaService } from './diagrama.service';

// El host cambia entre entornos (remoto / local para pruebas): los specs
// identifican el endpoint por la ruta y verifican solo el método y el payload.
function esperarPeticion(httpMock: HttpTestingController, ruta: string) {
  return httpMock.expectOne((request) => request.url.endsWith(ruta));
}

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

    const req = esperarPeticion(
      httpMock,
      '/rest-gestor/procesos-ejecucion-gestion/obtenerTodosGestionProcesosEE/',
    );

    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ id_roles: [1], pag: 0, itemPag: 10 });

    req.flush({ procesosEE: [], count_procesosEE: 0 });
  });

  it('calls procesos endpoint with GET', () => {
    service.obtenerProcesos().subscribe();

    const req = esperarPeticion(
      httpMock,
      '/rest-gestor/procesos/obtenerTodosLivianoConfiguracion/',
    );

    expect(req.request.method).toBe('GET');
    req.flush({ count_procesos: 0, procesos: [] });
  });

  it('calls grupos endpoint with GET', () => {
    service.obtenerGrupos().subscribe();

    const req = esperarPeticion(httpMock, '/rest-gestor/grupo/obtenerGrupos');

    expect(req.request.method).toBe('GET');
    req.flush([
      { id_grupo: 1, nombre_grupo: 'Administradores', sigla_grupo: 'adm', lista_permisos_grupo: [] },
    ]);
  });
});

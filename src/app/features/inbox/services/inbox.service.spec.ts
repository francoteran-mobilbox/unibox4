import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { InboxService } from './inbox.service';

describe('InboxService', () => {
  let service: InboxService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [InboxService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(InboxService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('loads recibidas and updates count and activities', () => {
    service.recibidas.cargar();

    expect(service.recibidas.isLoading()).toBeTrue();

    const req = httpMock.expectOne(
      'http://capacitacion4.mobilbox.mobi/gestorDocumental/rest-gestor/tareas/obtenerActividadesPorIdUsuario/SoporteMovilgo/recibidas/0/10',
    );
    expect(req.request.method).toBe('GET');

    req.flush({
      count_finalizadas: 0,
      count_recibidas: 2,
      actividades_paralelas: [],
      actividades: [
        {
          end_date: '',
          limit_date: '',
          state_activity: {
            statetype_name: 'Pendiente',
            activitystate_id: 1,
            usuarios_activitystate: '',
            statetype_id: 'P',
          },
          creation_date: '',
          actividad_paralela: false,
          transitions: [],
          id_usuario_anterior: '',
          actividad: {
            activity_name: 'Revision',
            activity_type: 'manual',
            activity_id: 10,
            funcionality: 'inbox',
          },
          derivada_actividad_paralela: false,
          proceso_en_ejecucion: {
            processrunnig_id: 1,
            processrunnig_name: 'Proceso A',
          },
          modification_date: '',
          tiempo_restante: '1d',
          activityrunning_id: 100,
          id_estado_ejecucion: 'ACT',
        },
      ],
    });

    expect(service.recibidas.isLoading()).toBeFalse();
    expect(service.recibidas.fallido()).toBeFalse();
    expect(service.recibidas.count()).toBe(2);
    expect(service.recibidas.actividades().length).toBe(1);
  });

  it('marks enviadas as failed when request errors', () => {
    service.enviadas.cargar();

    const req = httpMock.expectOne(
      'http://capacitacion4.mobilbox.mobi/gestorDocumental/rest-gestor/tareas/obtenerActividadesEnviadasPorIdUsuario/SoporteMovilgo/0/10',
    );

    req.flush('failure', { status: 500, statusText: 'Server Error' });

    expect(service.enviadas.isLoading()).toBeFalse();
    expect(service.enviadas.fallido()).toBeTrue();
    expect(service.enviadas.mensajeError()).toBe('Server Error');
    expect(service.enviadas.actividades()).toEqual([]);
    expect(service.enviadas.count()).toBe(0);
  });
});

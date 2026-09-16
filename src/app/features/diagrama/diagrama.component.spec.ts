import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { NzTableQueryParams } from 'ng-zorro-antd/table';
import { DiagramaComponent } from './diagrama.component';
import { BpmnAdapterService } from './services/bpmn-adapter.service';
import { DiagramaService } from './services/diagrama.service';

const DIAGRAMA_SERVICE_SPY = jasmine.createSpyObj<DiagramaService>('DiagramaService', [
  'obtenerProcesosEjecucion',
  'obtenerProcesos',
]);

const BPMN_ADAPTER_SPY = jasmine.createSpyObj<BpmnAdapterService>('BpmnAdapterService', [
  'preloadLibrary',
]);

describe('DiagramaComponent', () => {
  beforeEach(async () => {
    DIAGRAMA_SERVICE_SPY.obtenerProcesosEjecucion.and.returnValue(
      of({
        procesosEE: [],
        count_procesosEE: 0,
      }),
    );
    DIAGRAMA_SERVICE_SPY.obtenerProcesos.and.returnValue(
      of({
        count_procesos: 0,
        procesos: [],
      }),
    );
    BPMN_ADAPTER_SPY.preloadLibrary.and.returnValue(Promise.resolve());

    await TestBed.configureTestingModule({
      imports: [DiagramaComponent],
      providers: [
        { provide: DiagramaService, useValue: DIAGRAMA_SERVICE_SPY },
        { provide: BpmnAdapterService, useValue: BPMN_ADAPTER_SPY },
      ],
    }).compileComponents();
  });

  it('renders both required tabs', () => {
    const fixture = TestBed.createComponent(DiagramaComponent);
    fixture.detectChanges();

    const html = fixture.nativeElement as HTMLElement;

    expect(html.textContent).toContain('Procesos en Ejecución');
    expect(html.textContent).toContain('Procesos');
  });

  it('requests server-side data with translated page index', () => {
    const fixture = TestBed.createComponent(DiagramaComponent);
    fixture.detectChanges();

    DIAGRAMA_SERVICE_SPY.obtenerProcesosEjecucion.calls.reset();

    const params: NzTableQueryParams = {
      pageIndex: 3,
      pageSize: 20,
      sort: [],
      filter: [],
    };

    (fixture.componentInstance as any).onProcesosEjecucionQueryParamsChange(params);

    expect(DIAGRAMA_SERVICE_SPY.obtenerProcesosEjecucion).toHaveBeenCalledWith({
      id_roles: [1],
      pag: 2,
      itemPag: 20,
    });
  });

  it('keeps client-side pagination state independent for Procesos tab', () => {
    const fixture = TestBed.createComponent(DiagramaComponent);
    fixture.detectChanges();

    (fixture.componentInstance as any).onProcesosPageSizeChange(50);
    (fixture.componentInstance as any).onProcesosPageIndexChange(2);

    expect((fixture.componentInstance as any).procesosPageSize()).toBe(50);
    expect((fixture.componentInstance as any).procesosPageIndex()).toBe(2);
  });
});

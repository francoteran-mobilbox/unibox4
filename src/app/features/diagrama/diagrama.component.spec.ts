import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { NzTableQueryParams } from 'ng-zorro-antd/table';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideNzIcons } from 'ng-zorro-antd/icon';
import {
  DeleteOutline,
  DoubleRightOutline,
  EditOutline,
  FormOutline,
} from '@ant-design/icons-angular/icons';
import { APP_ICONS } from '../../app.icons';
import { DiagramaComponent } from './diagrama.component';
import { BpmnAdapterService } from './services/bpmn-adapter.service';
import { DiagramaService } from './services/diagrama.service';

const DIAGRAMA_SERVICE_SPY = jasmine.createSpyObj<DiagramaService>('DiagramaService', [
  'obtenerProcesosEjecucion',
  'obtenerProcesos',
  'obtenerRoles',
  'getFamiliasProceso',
  'getMecanismosProceso',
  'getJornadaCalendario',
  'obtenerMetadatosReqRol',
  'obtenerUsuariosLiviano',
  'obtenerCatalogosSegunUsuario',
  'obtenerMetadatosRequeridosDocumento',
  'obtenerDocumentosLivianoConfiguracion',
  'obtenerDocumentosComunProcesoSegunProcessId',
  'obtenerTareasProceso',
  'obtenerXmlPathPorIdProceso',
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
    DIAGRAMA_SERVICE_SPY.obtenerRoles.and.returnValue(of([]));
    DIAGRAMA_SERVICE_SPY.getFamiliasProceso.and.returnValue(of([]));
    DIAGRAMA_SERVICE_SPY.getMecanismosProceso.and.returnValue(of([]));
    DIAGRAMA_SERVICE_SPY.getJornadaCalendario.and.returnValue(of({}));
    DIAGRAMA_SERVICE_SPY.obtenerMetadatosReqRol.and.returnValue(of([]));
    DIAGRAMA_SERVICE_SPY.obtenerUsuariosLiviano.and.returnValue(
      of({ user_count: 0, usuarios: [] }),
    );
    DIAGRAMA_SERVICE_SPY.obtenerCatalogosSegunUsuario.and.returnValue(of([]));
    DIAGRAMA_SERVICE_SPY.obtenerMetadatosRequeridosDocumento.and.returnValue(of([]));
    DIAGRAMA_SERVICE_SPY.obtenerDocumentosLivianoConfiguracion.and.returnValue(
      of({ documentos: [], count_documentos: 0 }),
    );
    DIAGRAMA_SERVICE_SPY.obtenerDocumentosComunProcesoSegunProcessId.and.returnValue(of([]));
    DIAGRAMA_SERVICE_SPY.obtenerTareasProceso.and.returnValue(
      of({ activities: [], transitions: [] }),
    );
    DIAGRAMA_SERVICE_SPY.obtenerXmlPathPorIdProceso.and.returnValue(of(''));
    BPMN_ADAPTER_SPY.preloadLibrary.and.returnValue(Promise.resolve());

    await TestBed.configureTestingModule({
      imports: [DiagramaComponent],
      providers: [
        provideNoopAnimations(),
        provideNzIcons([...APP_ICONS, DeleteOutline, DoubleRightOutline, EditOutline, FormOutline]),
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
      texto_busqueda: '',
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

  describe('documentosReglasProceso', () => {
    it('expone los formularios de proceso configurados en modo creación', () => {
      const fixture = TestBed.createComponent(DiagramaComponent);
      fixture.detectChanges();
      const component = fixture.componentInstance as any;

      component.documentosOptions.set([]);
      component.formulariosProceso.set([
        {
          id: 'fp-1',
          nombre: 'Solicitud de Viático',
          idFormulario: 795,
          visibilidad: 'privado',
        },
        {
          id: 'fp-2',
          nombre: 'Sin resolver',
          idFormulario: 0,
          visibilidad: 'privado',
        },
        {
          id: 'fp-3',
          nombre: 'Flag',
          nombreDocumento: 'Flag Documento',
          idFormulario: 660,
          visibilidad: 'publico',
        },
      ]);

      expect(component.documentosReglasProceso()).toEqual([
        { label: 'Solicitud de Viático', value: '795' },
        { label: 'Flag', value: '660' },
      ]);
    });

    it('en edición los formularios cargados del API y los agregados en sesión se combinan', () => {
      const fixture = TestBed.createComponent(DiagramaComponent);
      fixture.detectChanges();
      const component = fixture.componentInstance as any;

      component.documentosOptions.set([
        { label: 'Solicitud de Viático', value: '795' },
      ]);
      component.formulariosProceso.set([
        {
          id: 'fp-1',
          nombre: 'Solicitud de Viático',
          idFormulario: 795,
          visibilidad: 'privado',
        },
        {
          id: 'fp-2',
          nombre: 'Rendición nuevo',
          idFormulario: 802,
          visibilidad: 'privado',
        },
      ]);

      expect(component.documentosReglasProceso()).toEqual([
        { label: 'Solicitud de Viático', value: '795' },
        { label: 'Rendición nuevo', value: '802' },
      ]);
    });
  });

  describe('diagrama asociado persistente', () => {
    const TEMPLATE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<process-definition swimlane="1" version="1" name="Proceso Test" privado="true" compartido="false">
  <documentosComunesProceso></documentosComunesProceso>
  <responsables></responsables>
  <mecanismoDenominacion idMecanismoDenominacion="-1" />
  <catalogos></catalogos>
  <Roles></Roles>
  <SubProcesosAsociados></SubProcesosAsociados>
</process-definition>`;

    const LIVE_XML = '<?xml version="1.0"?><process-definition name="Proceso Test"></process-definition>';

    it('abrir crear resetea la sesión del diagrama (sin visor y seed vacío)', () => {
      const fixture = TestBed.createComponent(DiagramaComponent);
      fixture.detectChanges();
      const component = fixture.componentInstance as any;

      component.onAbrirCrearProcesoModal();

      expect(component.procesoDiagramaMontadoVisible()).toBeFalse();
      expect(component.procesoDiagramModalVisible()).toBeFalse();
      expect(component.procesoDiagramaXmlBase()).toBe('');
    });

    it('la primera apertura monta el visor y las siguientes solo lo ocultan/muestran', () => {
      const fixture = TestBed.createComponent(DiagramaComponent);
      fixture.detectChanges();
      const component = fixture.componentInstance as any;

      component.onAbrirCrearProcesoModal();
      component.onAbrirDiagramaAsociadoModal();

      expect(component.procesoDiagramaMontadoVisible()).toBeTrue();
      expect(component.procesoDiagramModalVisible()).toBeTrue();
      expect(component.diagramaModalClase()).toBe('diagrama-modal');

      component.onCerrarDiagramaAsociadoModal();

      expect(component.procesoDiagramModalVisible()).toBeFalse();
      expect(component.procesoDiagramaMontadoVisible()).toBeTrue();
      expect(component.diagramaModalClase()).toBe('diagrama-modal diagrama-modal--oculto');

      component.onAbrirDiagramaAsociadoModal();

      expect(component.procesoDiagramaMontadoVisible()).toBeTrue();
      expect(component.procesoDiagramModalVisible()).toBeTrue();
      expect(component.procesoDiagramaXmlBase()).toBe('');
    });

    it('abrir editar destruye el visor anterior y siembra el xml del proceso', () => {
      const fixture = TestBed.createComponent(DiagramaComponent);
      fixture.detectChanges();
      const component = fixture.componentInstance as any;

      component.onAbrirCrearProcesoModal();
      component.onAbrirDiagramaAsociadoModal();
      expect(component.procesoDiagramaMontadoVisible()).toBeTrue();

      component.onAbrirEditarProcesoModal({ id_proceso: 7, xml: '<process-definition/>' } as any);

      expect(component.procesoDiagramaMontadoVisible()).toBeFalse();
      expect(component.procesoDiagramModalVisible()).toBeFalse();
      expect(component.procesoDiagramaXmlBase()).toBe('<process-definition/>');
    });

    it('resolverLiveXmlProceso usa el preview montado y si no, el template', async () => {
      const fixture = TestBed.createComponent(DiagramaComponent);
      fixture.detectChanges();
      const component = fixture.componentInstance as any;

      expect(await component.resolverLiveXmlProceso(TEMPLATE_XML)).toBe(TEMPLATE_XML);

      component.procesoDiagramaPreview = {
        obtenerSnapshot: () => null,
        limpiarMarcadoresValidacion: () => undefined,
        exportLegacyXml: () => Promise.resolve(LIVE_XML),
      };

      expect(await component.resolverLiveXmlProceso(TEMPLATE_XML)).toBe(LIVE_XML);
    });

    it('cerrar el proceso termina la sesión del diagrama', () => {
      const fixture = TestBed.createComponent(DiagramaComponent);
      fixture.detectChanges();
      const component = fixture.componentInstance as any;

      component.onAbrirCrearProcesoModal();
      component.onAbrirDiagramaAsociadoModal();
      component.onCerrarProcesoModal();

      expect(component.procesoDiagramaMontadoVisible()).toBeFalse();
      expect(component.procesoDiagramModalVisible()).toBeFalse();
    });
  });
});

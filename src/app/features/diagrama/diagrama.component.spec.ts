import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
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
import {
  LegacyBpmnNodeSnapshot,
  LegacyBpmnSnapshot,
  LegacyBpmnTransitionSnapshot,
} from './models/diagrama.model';
import { BpmnAdapterService } from './services/bpmn-adapter.service';
import { DiagramaService } from './services/diagrama.service';
import { buildDefaultTareaConfig } from './models/tarea-config.model';
import { buildDefaultDecisionConfig } from './models/decision-config.model';
import { buildDefaultMensajeConfig } from './models/mensaje-config.model';
import { buildDefaultTransicionConfig } from './models/transicion-config.model';

const DIAGRAMA_SERVICE_SPY = jasmine.createSpyObj<DiagramaService>('DiagramaService', [
  'obtenerProcesosEjecucion',
  'obtenerProcesos',
  'obtenerRoles',
  'obtenerGrupos',
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
  'crearProceso',
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
    DIAGRAMA_SERVICE_SPY.obtenerGrupos.and.returnValue(of([]));
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
    // Contador limpio por test: los asserts de creación no arrastran llamadas previas.
    DIAGRAMA_SERVICE_SPY.crearProceso.calls.reset();
    DIAGRAMA_SERVICE_SPY.crearProceso.and.returnValue(of({ processId: 1309 }));
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

  describe('toolbar tab procesos en mobile', () => {
    const PROCESO = {
      id_proceso: 1,
      nombre_proceso: 'Proceso Test',
      procesosEE: 0,
      version: 1,
      modificado_por: 'usuario.local',
      ultima_modificacion: '2026-01-01T00:00:00.000Z',
      privado: false,
      compartido: false,
      xml: '',
    };

    function crearFixture(): ComponentFixture<DiagramaComponent> {
      const fixture = TestBed.createComponent(DiagramaComponent);
      const component = fixture.componentInstance as any;

      component.procesos.set([PROCESO]);
      component.activeTabIndex.set(1);
      fixture.detectChanges();

      return fixture;
    }

    function buscarBoton(html: HTMLElement, ariaLabel: string): HTMLButtonElement | null {
      return html.querySelector<HTMLButtonElement>(`button[aria-label="${ariaLabel}"]`);
    }

    it('en desktop muestra Crear Proceso y Editar proceso sin aviso', () => {
      const fixture = crearFixture();
      (fixture.componentInstance as any).isDesktop.set(true);
      fixture.detectChanges();

      const html = fixture.nativeElement as HTMLElement;

      expect(buscarBoton(html, 'Crear proceso')).not.toBeNull();
      expect(buscarBoton(html, 'Editar proceso')).not.toBeNull();
      expect(html.querySelector('.diagrama__mobile-info')).toBeNull();
    });

    it('en mobile oculta Crear Proceso y Editar proceso y muestra el aviso de escritorio', () => {
      const fixture = crearFixture();
      (fixture.componentInstance as any).isDesktop.set(false);
      fixture.detectChanges();

      const html = fixture.nativeElement as HTMLElement;

      expect(buscarBoton(html, 'Crear proceso')).toBeNull();
      expect(buscarBoton(html, 'Editar proceso')).toBeNull();
      expect(buscarBoton(html, 'Desactivar proceso')).not.toBeNull();
      expect(html.querySelector('.diagrama__mobile-info')?.textContent).toContain(
        'Crear y editar procesos está disponible solo en versión escritorio',
      );
    });
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

  describe('formulariosProcesoOptions', () => {
    it('lista solo los formularios de proceso: sin id 0, sin duplicados y con el nombre del formulario', () => {
      const fixture = TestBed.createComponent(DiagramaComponent);
      fixture.detectChanges();
      const component = fixture.componentInstance as any;

      component.documentosOptions.set([
        { label: 'Documento ajeno', value: '900' },
        { label: 'Otro nombre', value: '660' },
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
        {
          id: 'fp-4',
          nombre: 'Flag (duplicado)',
          idFormulario: 660,
          visibilidad: 'publico',
        },
        {
          id: 'fp-5',
          nombre: '',
          nombreDocumento: 'Rendición',
          idFormulario: 802,
          visibilidad: 'publico',
        },
      ]);

      expect(component.formulariosProcesoOptions()).toEqual([
        { label: 'Solicitud de Viático', value: '795' },
        { label: 'Flag', value: '660' },
        { label: 'Rendición', value: '802' },
      ]);
    });
  });

  describe('formulariosFirmablesOptions', () => {
    it('precarga los documentos livianos al iniciar el módulo', () => {
      DIAGRAMA_SERVICE_SPY.obtenerDocumentosLivianoConfiguracion.calls.reset();
      DIAGRAMA_SERVICE_SPY.obtenerDocumentosLivianoConfiguracion.and.returnValue(
        of({
          documentos: [
            { id: 795, nombre_documento: 'Solicitud', es_firmable: true },
            { id: 660, nombre_documento: 'Flag', es_firmable: false },
          ],
          count_documentos: 2,
        }) as any,
      );

      const fixture = TestBed.createComponent(DiagramaComponent);
      fixture.detectChanges();
      const component = fixture.componentInstance as any;

      expect(
        DIAGRAMA_SERVICE_SPY.obtenerDocumentosLivianoConfiguracion,
      ).toHaveBeenCalledTimes(1);
      expect(component.documentosLivianoOptions()).toEqual([
        { label: 'Solicitud', value: '795' },
        { label: 'Flag', value: '660' },
      ]);
      expect([...component.documentosLivianoFirmables()]).toEqual(['795']);
    });

    it('solo incluye formularios cuyo documento tiene es_firmable true', () => {
      const fixture = TestBed.createComponent(DiagramaComponent);
      fixture.detectChanges();
      const component = fixture.componentInstance as any;

      component.documentosLivianoFirmables.set(new Set(['795']));
      component.formulariosProceso.set([
        {
          id: 'fp-1',
          nombre: 'Solicitud firmable',
          idFormulario: 795,
          visibilidad: 'privado',
        },
        {
          id: 'fp-2',
          nombre: 'Flag no firmable',
          idFormulario: 660,
          visibilidad: 'publico',
        },
        {
          id: 'fp-3',
          nombre: 'Sin resolver',
          idFormulario: 0,
          visibilidad: 'publico',
        },
      ]);

      expect(component.formulariosFirmablesOptions()).toEqual([
        { label: 'Solicitud firmable', value: '795' },
      ]);
    });

    it('guarda los ids firmables del servicio liviano y los limpia si el servicio falla', () => {
      const fixture = TestBed.createComponent(DiagramaComponent);
      fixture.detectChanges();
      const component = fixture.componentInstance as any;

      DIAGRAMA_SERVICE_SPY.obtenerDocumentosLivianoConfiguracion.and.returnValue(
        of({
          documentos: [
            { id: 795, es_firmable: true },
            { id: 660, es_firmable: false },
          ],
          count_documentos: 2,
        }) as any,
      );
      component.documentosLivianoOptions.set([]);
      component.abrirCrudFormularios();

      expect([...component.documentosLivianoFirmables()]).toEqual(['795']);

      DIAGRAMA_SERVICE_SPY.obtenerDocumentosLivianoConfiguracion.and.returnValue(
        throwError(() => new Error('sin respuesta')),
      );
      component.documentosLivianoOptions.set([]);
      component.documentosLivianoCargando.set(false);
      component.abrirCrudFormularios();

      expect([...component.documentosLivianoFirmables()]).toEqual([]);
    });

    it('activar una decisión carga los documentos livianos; con caché no repite la llamada', () => {
      const fixture = TestBed.createComponent(DiagramaComponent);
      fixture.detectChanges();
      const component = fixture.componentInstance as any;

      DIAGRAMA_SERVICE_SPY.obtenerDocumentosLivianoConfiguracion.calls.reset();
      DIAGRAMA_SERVICE_SPY.obtenerDocumentosLivianoConfiguracion.and.returnValue(
        of({
          documentos: [{ id: 795, es_firmable: true }],
          count_documentos: 1,
        }) as any,
      );

      component.onDiagramaElementoActivado({
        kind: 'decision',
        label: 'Decisión',
        nombre: 'D1',
        id: 'D1',
      });
      expect(component.diagramaElementoSeleccionado()).not.toBeNull();
      expect(DIAGRAMA_SERVICE_SPY.obtenerDocumentosLivianoConfiguracion).toHaveBeenCalledTimes(1);

      component.onDiagramaElementoActivado({
        kind: 'decision',
        label: 'Decisión',
        nombre: 'D2',
        id: 'D2',
      });
      expect(component.diagramaElementoSeleccionado()).not.toBeNull();
      expect(DIAGRAMA_SERVICE_SPY.obtenerDocumentosLivianoConfiguracion).toHaveBeenCalledTimes(1);
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
      expect(component.diagramaModalClase()).toBe('diagrama-modal diagrama-modal--fullscreen');

      component.onCerrarDiagramaAsociadoModal();

      expect(component.procesoDiagramModalVisible()).toBeFalse();
      expect(component.procesoDiagramaMontadoVisible()).toBeTrue();
      expect(component.diagramaModalClase()).toBe(
        'diagrama-modal diagrama-modal--fullscreen diagrama-modal--oculto',
      );

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

    it('pantalla completa agrega la clase al modal y se resetea al cerrar la sesión', async () => {
      const fixture = TestBed.createComponent(DiagramaComponent);
      fixture.detectChanges();
      const component = fixture.componentInstance as any;

      component.onAbrirCrearProcesoModal();
      component.onAbrirDiagramaAsociadoModal();
      component.diagramaModalPantallaCompleta.set(true);

      expect(component.diagramaModalClase()).toBe(
        'diagrama-modal diagrama-modal--fullscreen diagrama-modal--pantalla-completa',
      );

      component.procesoDiagramModalVisible.set(false);

      expect(component.diagramaModalClase()).toBe(
        'diagrama-modal diagrama-modal--fullscreen diagrama-modal--pantalla-completa diagrama-modal--oculto',
      );

      await component.onCerrarDiagramaAsociadoModal();

      expect(component.diagramaModalPantallaCompleta()).toBeFalse();
    });

    it('alternarPantallaCompleta sin fullscreen disponible deja la señal en false', async () => {
      const fixture = TestBed.createComponent(DiagramaComponent);
      fixture.detectChanges();
      const component = fixture.componentInstance as any;

      // Se neutraliza la Fullscreen API para forzar el early-return del guard.
      Object.defineProperty(document, 'fullscreenEnabled', {
        configurable: true,
        value: false,
      });

      try {
        await component.alternarPantallaCompleta();
      } finally {
        delete (document as any).fullscreenEnabled;
      }

      expect(component.diagramaModalPantallaCompleta()).toBeFalse();
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

  describe('guardado con validación del diagrama', () => {
    const LIVE_XML =
      '<?xml version="1.0"?><process-definition name="Proceso Test"></process-definition>';

    function nodo(id: string, type: string, name = ''): LegacyBpmnNodeSnapshot {
      return {
        id,
        type,
        name,
        x: 0,
        y: 0,
        width: 100,
        height: 60,
        hasMessageEventDefinition: false,
        hasTimerEventDefinition: false,
        hasTerminateEventDefinition: false,
      };
    }

    function flujo(id: string, sourceId: string, targetId: string): LegacyBpmnTransitionSnapshot {
      return { id, sourceId, targetId, name: '' };
    }

    const SNAPSHOT_VALIDO: LegacyBpmnSnapshot = {
      nodes: [nodo('S', 'bpmn:StartEvent', 'Inicio'), nodo('F', 'bpmn:EndEvent', 'Fin')],
      transitions: [flujo('S-F', 'S', 'F')],
    };

    const SNAPSHOT_INVALIDO: LegacyBpmnSnapshot = {
      nodes: [nodo('T', 'bpmn:Task', 'Tarea'), nodo('F', 'bpmn:EndEvent', 'Fin')],
      transitions: [flujo('T-F', 'T', 'F')],
    };

    function instalarPreview(component: any, snapshot: LegacyBpmnSnapshot): void {
      component.procesoDiagramaPreview = {
        obtenerSnapshot: () => snapshot,
        limpiarMarcadoresValidacion: () => undefined,
        marcarErroresValidacion: () => undefined,
        exportLegacyXml: () => Promise.resolve(LIVE_XML),
      };
    }

    function prepararFormularioValido(component: any): void {
      component.procesoForm.patchValue({
        nombre: 'Proceso Test',
        responsables: ['1'],
        duracionValor: 5,
        duracionUnidad: 'dias',
        familiaProceso: '1',
        visibilidad: 'privado',
        mecanismoDenominacion: 'm1',
      });
    }

    it('guardar con diagrama inválido lista "Diagrama asociado" y bloquea el guardado', async () => {
      const fixture = TestBed.createComponent(DiagramaComponent);
      fixture.detectChanges();
      const component = fixture.componentInstance as any;

      component.onAbrirCrearProcesoModal();
      instalarPreview(component, SNAPSHOT_INVALIDO);
      prepararFormularioValido(component);
      component.procesoDiagramTouched.set(true);

      await component.onGuardarProcesoModal();

      expect(component.procesoValidacionError()).toContain('Diagrama asociado');
      expect(
        component
          .procesoValidacionError()
          .some((mensaje: string) => mensaje.includes('evento de inicio')),
      ).toBeTrue();
      expect(component.procesoDiagramaInvalido()).toBeTrue();
      expect(component.procesos().length).toBe(0);
      expect(component.procesoModalVisible()).toBeTrue();
    });

    it('guardar con diagrama válido persiste el xml del visor y limpia el estado inválido', async () => {
      const fixture = TestBed.createComponent(DiagramaComponent);
      fixture.detectChanges();
      const component = fixture.componentInstance as any;

      component.onAbrirCrearProcesoModal();
      instalarPreview(component, SNAPSHOT_VALIDO);
      prepararFormularioValido(component);
      component.procesoDiagramTouched.set(true);
      component.procesoDiagramaInvalido.set(true);

      await component.onGuardarProcesoModal();

      expect(component.procesoDiagramaInvalido()).toBeFalse();
      // El xml del visor viaja dentro del request (ya no se persiste en una fila local).
      expect(DIAGRAMA_SERVICE_SPY.crearProceso).toHaveBeenCalledTimes(1);
      expect(component.procesoModalVisible()).toBeFalse();
    });

    it('editar el diagrama y abrir una nueva sesión limpian el estado inválido', async () => {
      const fixture = TestBed.createComponent(DiagramaComponent);
      fixture.detectChanges();
      const component = fixture.componentInstance as any;

      component.onAbrirCrearProcesoModal();
      instalarPreview(component, SNAPSHOT_INVALIDO);
      prepararFormularioValido(component);
      component.procesoDiagramTouched.set(true);
      await component.onGuardarProcesoModal();
      expect(component.procesoDiagramaInvalido()).toBeTrue();

      component.onProcesoModalDiagramEdited();
      expect(component.procesoDiagramaInvalido()).toBeFalse();

      component.procesoDiagramaInvalido.set(true);
      component.onAbrirEditarProcesoModal({ id_proceso: 7, xml: '<process-definition/>' } as any);
      expect(component.procesoDiagramaInvalido()).toBeFalse();

      component.procesoDiagramaInvalido.set(true);
      component.onAbrirCrearProcesoModal();
      expect(component.procesoDiagramaInvalido()).toBeFalse();
    });
  });

  describe('validación mecanismo de denominación', () => {
    const LIVE_XML =
      '<?xml version="1.0"?><process-definition name="Proceso Test"></process-definition>';

    const SNAPSHOT_VALIDO: LegacyBpmnSnapshot = {
      nodes: [
        { id: 'S', type: 'bpmn:StartEvent', name: 'Inicio', x: 0, y: 0, width: 100, height: 60, hasMessageEventDefinition: false, hasTimerEventDefinition: false, hasTerminateEventDefinition: false },
        { id: 'F', type: 'bpmn:EndEvent', name: 'Fin', x: 200, y: 0, width: 100, height: 60, hasMessageEventDefinition: false, hasTimerEventDefinition: false, hasTerminateEventDefinition: false },
      ],
      transitions: [{ id: 'S-F', sourceId: 'S', targetId: 'F', name: '' }],
    };

    const MECANISMO_BASE = {
      id_tipo_mecanismo: 'td',
      id_mecanismo_denominacion: 1,
      id_usuario_creador: 'admin',
      nombre_mecanismo_denominacion: 'Mecanismo Test',
      fecha_creacion: '',
    };

    const MECANISMO_POR_DEFECTO = {
      ...MECANISMO_BASE,
      por_defecto: true,
      datos_requeridos: [],
    };

    const MECANISMO_CONFIGURABLE = {
      ...MECANISMO_BASE,
      id_mecanismo_denominacion: 2,
      por_defecto: false,
      datos_requeridos: [
        {
          valor_por_defecto: '',
          id_mecanismo_denominacion: 2,
          orden: 1,
          id_dato_mecanismo: 'var',
          id_dato_req_mecanismo: 11,
        },
      ],
    };

    function instalarPreview(component: any): void {
      component.procesoDiagramaPreview = {
        obtenerSnapshot: () => SNAPSHOT_VALIDO,
        limpiarMarcadoresValidacion: () => undefined,
        marcarErroresValidacion: () => undefined,
        exportLegacyXml: () => Promise.resolve(LIVE_XML),
      };
    }

    function prepararFormulario(component: any, mecanismoId: string | null): void {
      component.procesoForm.patchValue({
        nombre: 'Proceso Test',
        responsables: ['1'],
        duracionValor: 5,
        duracionUnidad: 'dias',
        familiaProceso: '1',
        visibilidad: 'privado',
        ...(mecanismoId !== null ? { mecanismoDenominacion: mecanismoId } : {}),
      });
      component.procesoDiagramTouched.set(true);
    }

    it('mecanismo por defecto crea el proceso via POST y recarga el listado', async () => {
      const fixture = TestBed.createComponent(DiagramaComponent);
      fixture.detectChanges();
      const component = fixture.componentInstance as any;
      let recargasAntes =
        DIAGRAMA_SERVICE_SPY.obtenerProcesos.calls.count();

      component.onAbrirCrearProcesoModal();
      instalarPreview(component);
      component.mecanismosMap.set({ m1: MECANISMO_POR_DEFECTO });
      prepararFormulario(component, 'm1');

      await component.onGuardarProcesoModal();

      expect(component.procesoValidacionError()).toEqual([]);
      expect(component.procesoMecanismoError()).toBe('');
      // Se envió el request completo al POST /api/processes.
      expect(DIAGRAMA_SERVICE_SPY.crearProceso).toHaveBeenCalledTimes(1);
      expect(
        DIAGRAMA_SERVICE_SPY.crearProceso.calls.mostRecent().args[0],
      ).toEqual(
        jasmine.objectContaining({
          proceso: jasmine.objectContaining({
            processId: null,
            processName: 'Proceso Test',
          }),
        }),
      );
      // El listado se recarga con el backend ya no con una fila local.
      expect(DIAGRAMA_SERVICE_SPY.obtenerProcesos.calls.count()).toBe(recargasAntes + 1);
      expect(component.procesoModalVisible()).toBeFalse();
      expect(component.procesoGuardando()).toBeFalse();
    });

    it('mecanismo no por defecto sin configuración lista el campo obligatorio y muestra el error', async () => {
      const fixture = TestBed.createComponent(DiagramaComponent);
      fixture.detectChanges();
      const component = fixture.componentInstance as any;

      component.onAbrirCrearProcesoModal();
      instalarPreview(component);
      component.mecanismosMap.set({ m2: MECANISMO_CONFIGURABLE });
      prepararFormulario(component, 'm2');

      await component.onGuardarProcesoModal();

      expect(component.procesoValidacionError()).toContain(
        'Mecanismo de denominación (configuración)',
      );
      expect(component.procesoMecanismoError()).toContain('está incompleta');
      expect(component.procesos().length).toBe(0);
      expect(component.procesoModalVisible()).toBeTrue();
    });

    it('mecanismo no por defecto con configuración completa guarda sin error', async () => {
      const fixture = TestBed.createComponent(DiagramaComponent);
      fixture.detectChanges();
      const component = fixture.componentInstance as any;

      component.onAbrirCrearProcesoModal();
      instalarPreview(component);
      component.mecanismosMap.set({ m2: MECANISMO_CONFIGURABLE });
      prepararFormulario(component, 'm2');
      // patchValue del mecanismo resetea las selecciones (CP-M07): se
      // configuran después de preparar el formulario.
      component.configDatoSelections.set({
        11: { tipo: 'texto_fijo', valor: 'FOP' },
      });

      await component.onGuardarProcesoModal();

      expect(component.procesoValidacionError()).toEqual([]);
      expect(component.procesoMecanismoError()).toBe('');
      expect(DIAGRAMA_SERVICE_SPY.crearProceso).toHaveBeenCalledTimes(1);
      expect(DIAGRAMA_SERVICE_SPY.obtenerProcesos).toHaveBeenCalled();
      expect(component.procesoModalVisible()).toBeFalse();
    });

    it('el fallo del POST deja el modal abierto con la alerta de error', async () => {
      const fixture = TestBed.createComponent(DiagramaComponent);
      fixture.detectChanges();
      const component = fixture.componentInstance as any;

      DIAGRAMA_SERVICE_SPY.crearProceso.and.returnValue(
        throwError(() => new Error('backend down')),
      );

      component.onAbrirCrearProcesoModal();
      instalarPreview(component);
      component.mecanismosMap.set({ m1: MECANISMO_POR_DEFECTO });
      prepararFormulario(component, 'm1');

      await component.onGuardarProcesoModal();

      expect(component.procesoValidacionError()).toEqual([
        'No se pudo crear el proceso. Intenta nuevamente.',
      ]);
      expect(component.procesoModalVisible()).toBeTrue();
      expect(component.procesoGuardando()).toBeFalse();
    });

    it('una validación bloqueante no dispara el POST', async () => {
      const fixture = TestBed.createComponent(DiagramaComponent);
      fixture.detectChanges();
      const component = fixture.componentInstance as any;

      component.onAbrirCrearProcesoModal();
      instalarPreview(component);
      prepararFormulario(component, null);

      await component.onGuardarProcesoModal();

      expect(component.procesoValidacionError()).toContain('Mecanismo de denominación');
      expect(component.procesos().length).toBe(0);
      expect(DIAGRAMA_SERVICE_SPY.crearProceso).not.toHaveBeenCalled();
    });
  });

  describe('acción desactivar proceso', () => {
    it('registra la simulación del endpoint de desactivación', () => {
      const fixture = TestBed.createComponent(DiagramaComponent);
      fixture.detectChanges();
      const component = fixture.componentInstance as any;
      const consoleSpy = spyOn(console, 'log');

      component.onDesactivarProceso({
        id_proceso: 7,
        nombre_proceso: 'Proceso X',
      } as any);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Simulación DesactivarProceso',
        jasmine.objectContaining({
          processId: 7,
          active: false,
          nombreProceso: 'Proceso X',
        }),
      );
    });
  });

  describe('guard de formularios en uso', () => {
    const FORMULARIO_EN_USO = {
      id: 'fp-1',
      nombre: 'Solicitud',
      idFormulario: 795,
      visibilidad: 'privado',
    };
    const FORMULARIO_LIBRE = {
      id: 'fp-2',
      nombre: 'Flag',
      idFormulario: 660,
      visibilidad: 'privado',
    };

    function configurarFormularioEnUso(component: any): void {
      component.formulariosProceso.set([FORMULARIO_EN_USO, FORMULARIO_LIBRE]);
      component.tareaConfigs.set({
        T_1: {
          ...buildDefaultTareaConfig('Tarea A'),
          formularioRequeridoSeleccionado: {
            idFormulario: 795,
            nombre: 'Solicitud',
            visibilidad: 'privado',
            metadatosSeleccionados: [],
          },
        },
      });
    }

    it('bloquea eliminar un formulario en uso y muestra el aviso', () => {
      const fixture = TestBed.createComponent(DiagramaComponent);
      fixture.detectChanges();
      const component = fixture.componentInstance as any;
      configurarFormularioEnUso(component);

      component.eliminarFilaFormularioProceso('fp-1');

      expect(component.formulariosProceso().length).toBe(2);
      expect(component.formulariosCrudAviso()).toContain('Formulario requerido de una tarea');
    });

    it('permite eliminar un formulario sin usos', () => {
      const fixture = TestBed.createComponent(DiagramaComponent);
      fixture.detectChanges();
      const component = fixture.componentInstance as any;
      configurarFormularioEnUso(component);

      component.eliminarFilaFormularioProceso('fp-2');

      expect(component.formulariosProceso().map((f: any) => f.id)).toEqual(['fp-1']);
      expect(component.formulariosCrudAviso()).toEqual([]);
    });

    it('editar formulario en uso cambiando documento conserva el documento y avisa', () => {
      const fixture = TestBed.createComponent(DiagramaComponent);
      fixture.detectChanges();
      const component = fixture.componentInstance as any;
      configurarFormularioEnUso(component);

      component.abrirFormularioEditModalExistente('fp-1');
      component.formularioEditNombre.set('Solicitud Renombrada');
      component.formularioEditDocumentoValor.set('660');
      component.guardarFormularioEdit();

      const fila = component.formulariosProceso().find((f: any) => f.id === 'fp-1');
      expect(fila.idFormulario).toBe(795);
      expect(fila.nombre).toBe('Solicitud Renombrada');
      expect(component.formularioEditAviso()).toContain('No se puede cambiar el documento');
    });

    it('editar formulario en uso sin cambiar documento guarda sin aviso', () => {
      const fixture = TestBed.createComponent(DiagramaComponent);
      fixture.detectChanges();
      const component = fixture.componentInstance as any;
      configurarFormularioEnUso(component);

      component.abrirFormularioEditModalExistente('fp-1');
      component.formularioEditNombre.set('Solicitud Renombrada');
      component.formularioEditDocumentoValor.set('795');
      component.guardarFormularioEdit();

      const fila = component.formulariosProceso().find((f: any) => f.id === 'fp-1');
      expect(fila.idFormulario).toBe(795);
      expect(fila.nombre).toBe('Solicitud Renombrada');
      expect(component.formularioEditAviso()).toBe('');
    });

    it('no permite crear un formulario con nombre repetido (trim + case-insensitive)', () => {
      const fixture = TestBed.createComponent(DiagramaComponent);
      fixture.detectChanges();
      const component = fixture.componentInstance as any;
      configurarFormularioEnUso(component);

      component.abrirFormularioEditModal();
      component.formularioEditNombre.set('  solicitud  ');
      component.formularioEditDocumentoValor.set('660');
      component.guardarFormularioEdit();

      expect(component.formularioEditAviso()).toContain('Ya existe un formulario');
      expect(component.formulariosProceso().length).toBe(2);
      expect(component.formularioEditModalAbierto()).toBeTrue();
    });

    it('editar una fila manteniendo su propio nombre guarda sin aviso de duplicado', () => {
      const fixture = TestBed.createComponent(DiagramaComponent);
      fixture.detectChanges();
      const component = fixture.componentInstance as any;
      configurarFormularioEnUso(component);

      component.abrirFormularioEditModalExistente('fp-2');
      component.formularioEditNombre.set('FLAG');
      component.formularioEditDocumentoValor.set('660');
      component.guardarFormularioEdit();

      const fila = component.formulariosProceso().find((f: any) => f.id === 'fp-2');
      expect(fila.nombre).toBe('FLAG');
      expect(component.formularioEditAviso()).toBe('');
    });

    it('la fila en uso reporta sus usos para tooltip y deshabilitado', () => {
      const fixture = TestBed.createComponent(DiagramaComponent);
      fixture.detectChanges();
      const component = fixture.componentInstance as any;
      configurarFormularioEnUso(component);

      expect(component.usosFormularioFila(FORMULARIO_EN_USO)).toEqual([
        'Formulario requerido de una tarea',
      ]);
      expect(component.usosFormularioFila(FORMULARIO_LIBRE)).toEqual([]);
      expect(component.tooltipEliminarFormulario(FORMULARIO_EN_USO)).toContain('En uso en:');
      expect(component.tooltipEliminarFormulario(FORMULARIO_LIBRE)).toBe('Eliminar');
    });

    it('traspasoFormulariosOrigen excluye solo la fila seleccionada aunque compartan documento', () => {
      const fixture = TestBed.createComponent(DiagramaComponent);
      fixture.detectChanges();
      const component = fixture.componentInstance as any;

      component.formulariosProceso.set([
        { id: 'fp-1', nombre: 'Solicitud', idFormulario: 795, visibilidad: 'privado' },
        { id: 'fp-2', nombre: 'Solicitud nueva', idFormulario: 795, visibilidad: 'privado' },
        { id: 'fp-3', nombre: 'Flag', idFormulario: 660, visibilidad: 'privado' },
        { id: 'fp-4', nombre: 'Sin documento', idFormulario: 0, visibilidad: 'publico' },
      ]);
      component.formularioSeleccionadoId.set('fp-1');

      const opciones = component.traspasoFormulariosOrigen();

      expect(opciones.map((f: any) => f.id)).toEqual(['fp-2', 'fp-3']);
    });
  });

  describe('opciones de compartir', () => {
    it('el select de área se llena con los grupos de obtenerGrupos', () => {
      DIAGRAMA_SERVICE_SPY.obtenerGrupos.and.returnValue(
        of([
          { id_grupo: 1, nombre_grupo: 'Administradores', sigla_grupo: 'adm', lista_permisos_grupo: [] },
          { id_grupo: 2, nombre_grupo: 'INFOR', sigla_grupo: 'INF', lista_permisos_grupo: [] },
        ]),
      );
      const fixture = TestBed.createComponent(DiagramaComponent);
      fixture.detectChanges();
      const component = fixture.componentInstance as any;

      expect(component.areasOptions()).toEqual([
        { label: 'Administradores', value: '1' },
        { label: 'INFOR', value: '2' },
      ]);
    });

    it('usuariosOptions expone todos los usuarios sin filtrar por cargo', () => {
      const fixture = TestBed.createComponent(DiagramaComponent);
      fixture.detectChanges();
      const component = fixture.componentInstance as any;

      component.usuariosLiviano.set([
        {
          id_rol: 1,
          nombre_completo_usuario: 'Ana Torres',
          id_usuario: 'atorres',
          roles_secundarios: [],
        },
        {
          id_rol: 2,
          nombre_completo_usuario: 'Bruno Diaz',
          id_usuario: 'bdiaz',
          roles_secundarios: [{ id_rol: 1, nombre_rol: 'Analista' }],
        },
      ]);

      expect(component.usuariosOptions()).toEqual([
        { label: 'Ana Torres', value: 'atorres' },
        { label: 'Bruno Diaz', value: 'bdiaz' },
      ]);
    });
  });

  describe('usuarios por cargo', () => {
    const USUARIO_CARGO_46 = {
      id_rol: 46,
      nombre_completo_usuario: 'Carla Ruiz',
      id_usuario: 'cruiz',
      roles_secundarios: [],
    };

    it('al restaurar una tarea el espejo del cargo se sincroniza y conviven guardados y opciones', () => {
      const fixture = TestBed.createComponent(DiagramaComponent);
      fixture.detectChanges();
      const component = fixture.componentInstance as any;

      component.usuariosLiviano.set([USUARIO_CARGO_46]);
      component.diagramaElementoSeleccionado.set({ id: 't1', kind: 'tarea' });
      component.tareaConfigs.set({
        t1: {
          ...buildDefaultTareaConfig('Tarea Uno'),
          cargo: '46',
          usuarios: ['uX'],
        },
      });

      component.resetDiagramaElementoForm(
        component.diagramaElementoSeleccionado(),
        component.tareaConfigs()['t1'],
      );

      expect(component.tareaUsuariosDisponibles()).toEqual([
        { label: 'Carla Ruiz', value: 'cruiz' },
        { label: 'uX', value: 'uX' },
      ]);
    });

    it('al restaurar una decisión el espejo del cargo se sincroniza y conviven guardados y opciones', () => {
      const fixture = TestBed.createComponent(DiagramaComponent);
      fixture.detectChanges();
      const component = fixture.componentInstance as any;

      component.usuariosLiviano.set([USUARIO_CARGO_46]);
      component.diagramaElementoSeleccionado.set({ id: 'd1', kind: 'decision' });
      component.decisionConfigs.set({
        d1: {
          ...buildDefaultDecisionConfig('Decision Uno'),
          cargo: '46',
          usuarios: ['uD'],
        },
      });

      component.resetDecisionForm(component.decisionConfigs()['d1']);

      expect(component.decisionUsuariosDisponibles()).toEqual([
        { label: 'Carla Ruiz', value: 'cruiz' },
        { label: 'uD', value: 'uD' },
      ]);
    });
  });

  describe('reglas de usuario (cargo del nodo destino)', () => {
    const REQUISITO_ROL_46 = {
      id_rol: 46,
      nombre_rol: 'Analista',
      metadatosRequeridos: [
        { id_metadato: 873, nombre_metadato: 'Id usuario', nombre_bloque: '(Bloque sistema)' },
        { id_metadato: 900, nombre_metadato: 'Otro', nombre_bloque: 'Otro bloque' },
      ],
    };
    const REQUISITO_ROL_52 = {
      id_rol: 52,
      nombre_rol: 'Supervisor',
      metadatosRequeridos: [
        { id_metadato: 990, nombre_metadato: 'Id usuario', nombre_bloque: '(Bloque sistema)' },
      ],
    };

    it('el estado del destino es válido cuando el rol destino expone Id usuario', () => {
      const fixture = TestBed.createComponent(DiagramaComponent);
      fixture.detectChanges();
      const component = fixture.componentInstance as any;

      component.metadatosRequeridosRol.set([REQUISITO_ROL_46, REQUISITO_ROL_52]);
      component.transicionDestinoId.set('T_1');
      component.tareaConfigs.set({
        T_1: { ...buildDefaultTareaConfig('Tarea destino'), cargo: '46' },
      });

      expect(component.transicionDestinoReglasEstado()).toEqual(
        jasmine.objectContaining({
          cargo: '46',
          metadatoUsuario: '873',
          valido: true,
        }),
      );
      expect(component.transicionCargosDestinoOptions()).toEqual([
        { label: 'Analista', value: '46' },
      ]);
    });

    it('trata como sin cargo cuando el rol destino no expone Id usuario', () => {
      const fixture = TestBed.createComponent(DiagramaComponent);
      fixture.detectChanges();
      const component = fixture.componentInstance as any;

      component.metadatosRequeridosRol.set([
        { id_rol: 46, nombre_rol: 'Analista', metadatosRequeridos: [] },
      ]);
      component.transicionDestinoId.set('T_1');
      component.tareaConfigs.set({
        T_1: { ...buildDefaultTareaConfig('Tarea destino'), cargo: '46' },
      });

      expect(component.transicionDestinoReglasEstado().valido).toBeFalse();
      expect(component.transicionCargosDestinoOptions()).toEqual([]);
    });

    it('resuelve el cargo del destino por fall-through entre tarea, mensaje y timer', () => {
      const fixture = TestBed.createComponent(DiagramaComponent);
      fixture.detectChanges();
      const component = fixture.componentInstance as any;

      component.mensajeConfigs.set({
        M_1: { ...buildDefaultMensajeConfig(), cargo: '52' },
      });

      expect(component['cargoDeNodo']('M_1')).toBe('52');
      expect(component['cargoDeNodo']('inexistente')).toBeNull();
    });

    it('reconfigurarReglasDeDestino reescribe cargo y metadato según el nodo destino', () => {
      const fixture = TestBed.createComponent(DiagramaComponent);
      fixture.detectChanges();
      const component = fixture.componentInstance as any;

      component.metadatosRequeridosRol.set([REQUISITO_ROL_46, REQUISITO_ROL_52]);
      component.mensajeConfigs.set({
        M_1: { ...buildDefaultMensajeConfig(), cargo: '52' },
      });
      component.transicionConfigs.set({
        f1: {
          ...buildDefaultTransicionConfig(),
          reglasUsuario: [
            {
              idDocumento: 795,
              idMetadato: 'BM2163-1299',
              interpretacion: 'texto' as const,
              idCargo: 46,
              idMetadatoValor: '873',
              idReglaUsuario: null,
            },
          ],
        },
      });

      const resultado = component['reconfigurarReglasDeDestino'](
        component.transicionConfigs(),
        [{ id: 'f1', sourceId: 'T_1', targetId: 'M_1', name: '' }],
      );

      expect(resultado['f1'].reglasUsuario[0]).toEqual(
        jasmine.objectContaining({
          idCargo: 52,
          idMetadatoValor: '990',
        }),
      );
    });
  });

  describe('metadatos de destinatarios del mensaje', () => {
    it('el select de metadato solo muestra tipos DGD, COR y SIS', () => {
      const fixture = TestBed.createComponent(DiagramaComponent);
      fixture.detectChanges();
      const component = fixture.componentInstance as any;

      component['mensajeMetadatosCache'].set(795, [
        { label: '(Bloque 1) | DGD uno', value: 'BM2177-100', idMetadato: 100, tipo: 'DGD' },
        { label: '(Bloque 1) | COR uno', value: 'BM2177-101', idMetadato: 101, tipo: 'COR' },
        { label: '(Bloque 1) | SIS uno', value: 'BM2177-102', idMetadato: 102, tipo: 'SIS' },
        { label: '(Bloque 1) | ALF uno', value: 'BM2177-103', idMetadato: 103, tipo: 'ALF' },
        { label: '(Bloque 1) | NUM uno', value: 'BM2177-104', idMetadato: 104, tipo: 'NUM' },
      ]);
      component.diagramaElementoSeleccionado.set({ id: 'M_1', kind: 'mensaje' });
      component.agregarMensajeReferenciaPar('para');
      const par = component.mensajeReferenciasDe('para').at(0);
      par.controls.idDocumento.setValue('795', { emitEvent: false });

      expect(component.mensajeMetadatosDePar('para', 0).map((o: any) => o.tipo)).toEqual([
        'DGD',
        'COR',
        'SIS',
      ]);

      par.controls.idDocumento.setValue('', { emitEvent: false });
      expect(component.mensajeMetadatosDePar('para', 0)).toEqual([]);
    });

    it('el token de referencia usa nombreMetadato + idBloque (formato legacy)', () => {
      const fixture = TestBed.createComponent(DiagramaComponent);
      fixture.detectChanges();
      const component = fixture.componentInstance as any;

      component['mensajeMetadatosCache'].set(795, [
        {
          label: 'Solicitud N°',
          value: 'BM2177-1219',
          nombreMetadato: 'Solicitud N°',
          idMetadato: 1219,
          tipo: 'ALF',
          codigoBloque: 'BM2177',
          idBloque: 5641,
        },
      ]);
      component.formulariosProceso.set([
        {
          id: 'fp-1',
          nombre: 'Solicitud de Viático',
          idFormulario: 795,
          visibilidad: 'publico',
        },
      ]);
      component.mensajeTokenDocumentoSeleccionado.set('795');
      component.mensajeTokenMetadatoSeleccionado.set('BM2177-1219');

      expect(component.construirTokenReferenciaPar()).toBe(
        '/insertar//var/Solicitud N°%Solicitud de Viático%5641%1219/insertar/',
      );
    });

    it('el token de referencia no se construye para metadatos DGD', () => {
      const fixture = TestBed.createComponent(DiagramaComponent);
      fixture.detectChanges();
      const component = fixture.componentInstance as any;

      component['mensajeMetadatosCache'].set(795, [
        {
          label: 'DGD uno',
          value: 'BM2177-100',
          nombreMetadato: 'DGD uno',
          idMetadato: 100,
          tipo: 'DGD',
          codigoBloque: 'BM2177',
          idBloque: 5641,
        },
      ]);
      component.formulariosProceso.set([
        {
          id: 'fp-1',
          nombre: 'Solicitud de Viático',
          idFormulario: 795,
          visibilidad: 'publico',
        },
      ]);
      component.mensajeTokenDocumentoSeleccionado.set('795');
      component.mensajeTokenMetadatoSeleccionado.set('BM2177-100');

      expect(component.construirTokenReferenciaPar()).toBe('');
    });
  });
});

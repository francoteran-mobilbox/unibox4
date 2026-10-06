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

    it('alternarPantallaCompleta sin modal en el DOM deja la señal en false', async () => {
      const fixture = TestBed.createComponent(DiagramaComponent);
      fixture.detectChanges();
      const component = fixture.componentInstance as any;

      await component.alternarPantallaCompleta();

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
      expect(component.procesos()[0]?.xml).toBe(LIVE_XML);
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

    it('mecanismo por defecto guarda sin configuración', async () => {
      const fixture = TestBed.createComponent(DiagramaComponent);
      fixture.detectChanges();
      const component = fixture.componentInstance as any;

      component.onAbrirCrearProcesoModal();
      instalarPreview(component);
      component.mecanismosMap.set({ m1: MECANISMO_POR_DEFECTO });
      prepararFormulario(component, 'm1');

      await component.onGuardarProcesoModal();

      expect(component.procesoValidacionError()).toEqual([]);
      expect(component.procesoMecanismoError()).toBe('');
      expect(component.procesos()[0]?.xml).toBe(LIVE_XML);
      expect(component.procesoModalVisible()).toBeFalse();
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
      expect(component.procesos()[0]?.xml).toBe(LIVE_XML);
      expect(component.procesoModalVisible()).toBeFalse();
    });

    it('sin mecanismo seleccionado lista "Mecanismo de denominación"', async () => {
      const fixture = TestBed.createComponent(DiagramaComponent);
      fixture.detectChanges();
      const component = fixture.componentInstance as any;

      component.onAbrirCrearProcesoModal();
      instalarPreview(component);
      prepararFormulario(component, null);

      await component.onGuardarProcesoModal();

      expect(component.procesoValidacionError()).toContain('Mecanismo de denominación');
      expect(component.procesoValidacionError()).not.toContain(
        'Mecanismo de denominación (configuración)',
      );
      expect(component.procesos().length).toBe(0);
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
});

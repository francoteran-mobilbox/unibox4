import { DatePipe, DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  FormArray,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTableModule, NzTableQueryParams } from 'ng-zorro-antd/table';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { Subject, Subscription, Observable, forkJoin, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, map } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzTimePickerModule } from 'ng-zorro-antd/time-picker';
import { QuillEditorComponent } from 'ngx-quill';
import {
  ObtenerProcesosEjecucionRequest,
  ProcesoConfiguracion,
  ProcesoEjecucion,
  LegacyFlowProgress,
  MecanismoProceso,
  ConfigDatoSelection,
  DatoRequerido,
  DatoProcesoMecanismo,
  DocumentoComunProceso,
  ActividadTareaProceso,
  TransicionTareaProceso,
  MetadatoRequeridoRol,
  UsuarioLiviano,
  GrillaMetadatoColumna,
  GrillaMetadatoInfo,
  ProcesoCompartido,
} from './models/diagrama.model';
import { ResultadoValidacionDiagrama } from './models/validacion-diagrama.model';
import { validarDiagrama } from './services/validador-diagrama';
import { BpmnBasePreviewComponent } from './components/bpmn-base-preview.component';
import { BpmnAdapterService } from './services/bpmn-adapter.service';
import { CrearProcesoRequestBuilder } from './services/crear-proceso-request.builder';
import {
  construirDecisionConfigDesdeActividad,
  construirMensajeConfigDesdeActividad,
  construirTareaConfigDesdeActividad,
  construirTimerConfigDesdeActividad,
  construirTransicionConfigDesdeActividad,
  claveDeActividad,
  timerMetadatoPendiente,
  timerTransicionMetadatoPendiente,
  TimerMetadatoPendiente,
} from './services/tareas-proceso.mapper';
import { DiagramaService } from './services/diagrama.service';
import {
  BPMN_NODO_KIND_LABELS,
  BpmnElementoInfo,
  BpmnNodoKind,
  BpmnTransicionInfo,
} from './models/bpmn-elemento.model';
import {
  TareaConfig,
  TareaDuracionUnidad,
  TareaFuncionalidad,
  TareaTipoEjecucion,
  TAREA_DURACION_UNIDAD_OPTIONS,
  TAREA_FUNCIONALIDAD_OPTIONS,
  TAREA_FORMULARIO_VISIBILIDAD_OPTIONS,
  TAREA_TIPO_EJECUCION_OPTIONS,
  FormularioProcesoConfig,
  FormularioRequeridoSeleccion,
  MetadatoTransferidoConfig,
  MetadatoTransferidoDetalle,
  ParColumnaTransferido,
  buildDefaultTareaConfig,
  esCombinacionTraspasoValida,
} from './models/tarea-config.model';
import {
  MensajeCompletarFormulario,
  MensajeConfig,
  MensajeDestinatarios,
  MensajeReferenciaPar,
  MENSAJE_CONTENIDO_TOOLBAR,
  buildDefaultMensajeConfig,
} from './models/mensaje-config.model';
import {
  DECISION_ALERTAS_OPTIONS,
  DECISION_DURACION_UNIDAD_OPTIONS,
  DECISION_FUNCIONALIDAD_OPTIONS,
  DECISION_TIPO_EJECUCION_OPTIONS,
  DecisionConfig,
  DecisionDuracionUnidad,
  DecisionFuncionalidad,
  DecisionTipoEjecucion,
  buildDefaultDecisionConfig,
} from './models/decision-config.model';
import {
  TimerConfig,
  TimerDatoFijoTipo,
  TimerModo,
  TIMER_DURACION_UNIDAD_OPTIONS,
  buildDefaultTimerConfig,
} from './models/timer-config.model';
import {
  TransicionAccion,
  TransicionConfig,
  TransicionFlags,
  TransicionFuenteValor,
  TransicionInterpretacion,
  TransicionOperador,
  TransicionReglaNegocio,
  TransicionReglaUsuario,
  TRANSICION_ACCION_OPTIONS,
  TRANSICION_OPERADOR_OPTIONS,
  LabelValueOption,
  buildDefaultTransicionConfig,
  flagsDeComboTransicion,
  operadoresPorTipoDato,
} from './models/transicion-config.model';

interface MensajeFormularioItem {
  readonly idDocumento: number | null;
  readonly idsMetadatos: readonly string[];
}

interface MetadatoOpcion {
  readonly label: string;
  readonly value: string;
  readonly idMetadato: number;
  readonly tipo?: string;
  readonly codigoBloque?: string;
  readonly nombreBloque?: string | null;
  readonly idBloque?: number | null;
  readonly ordenBloque?: number;
  readonly grilla?: GrillaMetadatoInfo | null;
}

function claveCompuestaMetadato(codigoBloque: string | undefined, idMetadato: number): string {
  return codigoBloque !== undefined && codigoBloque !== ''
    ? `${codigoBloque}-${idMetadato}`
    : String(idMetadato);
}

function labelMetadatoConBloque(
  nombreMetadato: string,
  nombreBloque: string | undefined,
  codigoBloque: string | undefined,
): string {
  const bloque = nombreBloque?.trim() || codigoBloque?.trim() || '';

  return bloque !== '' ? `${bloque} | ${nombreMetadato}` : nombreMetadato;
}

function parsearFechaTimer(valor: string): Date | null {
  const [anio, mes, dia] = valor.split('-').map(Number);

  if (!anio || !mes || !dia) {
    return null;
  }

  return new Date(anio, mes - 1, dia);
}

function parsearHoraTimer(valor: string): Date | null {
  const [horas, minutos] = valor.split(':').map(Number);

  if (Number.isNaN(horas) || Number.isNaN(minutos)) {
    return null;
  }

  return new Date(0, 0, 0, horas, minutos);
}

function formatearFechaTimer(fecha: Date | null): string | null {
  if (!fecha) {
    return null;
  }

  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');

  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

function formatearHoraTimer(hora: Date | null): string | null {
  if (!hora) {
    return null;
  }

  const horas = String(hora.getHours()).padStart(2, '0');
  const minutos = String(hora.getMinutes()).padStart(2, '0');

  return `${horas}:${minutos}`;
}

type MensajeReferenciasArray = FormArray<
  FormGroup<{ idDocumento: FormControl<string>; idMetadato: FormControl<string> }>
>;

type MensajeDestinatariosGroup = ReturnType<DiagramaComponent['buildMensajeDestinatariosGroup']>;

interface QuillEditorLike {
  getSelection(focus?: boolean): { index: number; length: number } | null;
  getLength(): number;
  insertText(index: number, text: string): void;
}

interface MensajeFormularioRow {
  readonly uid: number;
  readonly group: FormGroup<{
    idDocumento: FormControl<string>;
    idsMetadatos: FormControl<string[]>;
  }>;
  readonly subscription: Subscription;
}

type TransicionReglaUsuarioGroup = FormGroup<{
  idDocumento: FormControl<string>;
  idMetadato: FormControl<string>;
  interpretacion: FormControl<TransicionInterpretacion>;
  idCargo: FormControl<string>;
  idMetadatoValor: FormControl<string>;
  idReglaUsuario: FormControl<string>;
}>;

type TransicionReglaNegocioGroup = FormGroup<{
  idDocumento: FormControl<string>;
  idMetadato: FormControl<string>;
  operador: FormControl<TransicionOperador | null>;
  idOperadorRegla: FormControl<string>;
  fuenteValor: FormControl<TransicionFuenteValor>;
  valorTexto: FormControl<string>;
  idDocumentoValor: FormControl<string>;
  idMetadatoValor: FormControl<string>;
}>;

interface TransicionReglaRow<T> {
  readonly uid: number;
  readonly group: T;
  readonly subscriptions: Subscription[];
}

const FLAGS_TRANSICION_VACIOS: TransicionFlags = {
  requiereTimer: false,
  interrupcion: false,
  accion: false,
  reglasUsuario: false,
  reglasNegocio: false,
};

const DEFAULT_ROLE_IDS: readonly number[] = [1];
const DEFAULT_PAGE_INDEX = 1;
const DEFAULT_PAGE_SIZE = 10;
const DATO_DISPONIBLE_PROCESO_TO_TIPO: Record<string, string> = {
  txf: 'texto_fijo',
  met: 'metadato_formulario',
  cor: 'correlativo',
  npr: 'nombre_proceso',
};
// Bypass: la validación de mensaje queda definida pero omitida (revertir a false para activarla).
const BYPASS_VALIDACION_MENSAJE = true;

const MODAL_FORM_DEFAULTS: ProcesoModalFormValue = {
  nombre: '',
  responsables: [],
  duracionValor: null,
  duracionUnidad: 'dias',
  familiaProceso: null,
  visibilidad: 'privado',
  mecanismoDenominacion: null,
  observaciones: '',
  creaExpedienteElectronico: false,
  publicaEnCatalogo: false,
  catalogosPublicacion: [],
  aplicaJornadaLaboral: false,
  jornada: null,
  calendario: null,
};

@Component({
  selector: 'app-diagrama',
  imports: [
    DatePipe,
    DecimalPipe,
    ReactiveFormsModule,
    FormsModule,
    NzAlertModule,
    NzButtonModule,
    NzCardModule,
    NzCheckboxModule,
    NzCollapseModule,
    NzEmptyModule,
    NzFormModule,
    NzIconModule,
    NzInputModule,
    NzModalModule,
    NzRadioModule,
    NzDatePickerModule,
    NzTimePickerModule,
    NzSelectModule,
    NzSpinModule,
    NzTableModule,
    NzTabsModule,
    NzTagModule,
    NzToolTipModule,
    BpmnBasePreviewComponent,
    QuillEditorComponent,
  ],
  templateUrl: './diagrama.component.html',
  styleUrl: './diagrama.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiagramaComponent {
  private readonly diagramaService = inject(DiagramaService);
  private readonly bpmnAdapter = inject(BpmnAdapterService);
  private readonly crearProcesoRequestBuilder = inject(CrearProcesoRequestBuilder);
  private readonly formBuilder = inject(FormBuilder);
  private readonly searchProcesosEjecucionSubject = new Subject<string>();

  @ViewChild('procesoDiagramaPreview')
  private readonly procesoDiagramaPreview?: BpmnBasePreviewComponent;

  @ViewChild('mensajeAsuntoTextarea')
  private readonly mensajeAsuntoTextarea?: ElementRef<HTMLTextAreaElement>;

  protected readonly activeTabIndex = signal(0);
  protected readonly isDesktop = signal(this.readDesktopState());

  protected readonly procesosEjecucion = signal<readonly ProcesoEjecucion[]>([]);
  protected readonly procesosEjecucionTotal = signal(0);
  protected readonly procesosEjecucionTotalFiltrado = signal(0);
  protected readonly procesosEjecucionLoading = signal(false);
  protected readonly procesosEjecucionError = signal('');
  protected readonly procesosEjecucionPageIndex = signal(DEFAULT_PAGE_INDEX);
  protected readonly procesosEjecucionPageSize = signal(DEFAULT_PAGE_SIZE);
  protected readonly procesosEjecucionSearchText = signal('');
  protected readonly procesosEjecucionExpanded = signal<Set<number>>(new Set<number>());
  protected readonly procesosEjecucionDiagramas = signal<
    Record<number, LegacyProcesoEjecucionDiagramaState>
  >({});

  protected readonly procesos = signal<readonly ProcesoConfiguracion[]>([]);
  protected readonly procesosTotalApi = signal(0);
  protected readonly procesosLoading = signal(false);
  protected readonly procesosError = signal('');
  protected readonly procesosPageIndex = signal(DEFAULT_PAGE_INDEX);
  protected readonly procesosPageSize = signal(DEFAULT_PAGE_SIZE);
  protected readonly procesosSearchText = signal('');

  protected readonly procesoModalVisible = signal(false);
  protected readonly procesoModalMode = signal<ProcesoModalMode>('create');
  protected readonly procesoEditId = signal<number | null>(null);
  protected readonly procesoEditSourceXml = signal('');
  protected readonly procesoDiagramModalVisible = signal(false);
  protected readonly procesoDiagramTouched = signal(false);
  protected readonly diagramaElementoModalVisible = signal(false);
  protected readonly diagramaElementoSeleccionado = signal<BpmnElementoInfo | null>(null);
  protected readonly diagramaElementoNombreInput = signal('');
  protected readonly diagramaElementoModalTitulo = computed(() => {
    const elemento = this.diagramaElementoSeleccionado();
    if (!elemento) {
      return 'Elemento del diagrama';
    }

    const nombre = elemento.nombre.trim();

    return `${elemento.label} · ${nombre !== '' ? `${nombre} · ` : ''}${elemento.id}`;
  });

  protected readonly tareaDuracionUnidadOptions = TAREA_DURACION_UNIDAD_OPTIONS;
  protected readonly tareaFuncionalidadOptions = TAREA_FUNCIONALIDAD_OPTIONS;
  protected readonly tareaTipoEjecucionOptions = TAREA_TIPO_EJECUCION_OPTIONS;
  protected readonly tareaFormularioVisibilidadOptions = TAREA_FORMULARIO_VISIBILIDAD_OPTIONS;
  protected readonly tareaConfigs = signal<Record<string, TareaConfig>>({});

  protected readonly seleccionMetadatosModalAbierto = signal(false);
  protected readonly crudFormulariosModalAbierto = signal(false);
  protected readonly filaFormularioEditandoId = signal<string | null>(null);
  protected readonly documentosLivianoOptions = signal<readonly SelectOption[]>([]);
  protected readonly formulariosProceso = signal<readonly FormularioProcesoConfig[]>([]);
  protected readonly formularioSeleccionadoId = signal<string | null>(null);
  protected readonly metadatosTrabajo = signal<readonly string[]>([]);
  protected readonly traspasosModalAbierto = signal(false);
  protected readonly traspasoOrigenFormularioId = signal<number | null>(null);
  protected readonly traspasoOrigenSeleccion = signal<string | null>(null);
  protected readonly traspasoDestinoSeleccion = signal<string | null>(null);
  protected readonly traspasosTrabajo = signal<readonly MetadatoTransferidoConfig[]>([]);
  protected readonly traspasoFiltroOrigen = signal('');
  protected readonly traspasoFiltroDestino = signal('');
  protected readonly actividadesProceso = signal<readonly ActividadTareaProceso[]>([]);
  protected readonly transicionesProceso = signal<readonly TransicionTareaProceso[]>([]);
  protected readonly traspasoInvalidoModalAbierto = signal(false);
  protected readonly traspasoInvalidoMensaje = signal('');
  protected readonly paresColumnasModalAbierto = signal(false);
  protected readonly traspasoPendienteOrigen = signal<MetadatoOpcion | null>(null);
  protected readonly traspasoPendienteDestino = signal<MetadatoOpcion | null>(null);
  protected readonly paresColumnasTrabajo = signal<readonly ParColumnaTransferido[]>([]);
  protected readonly parOrigenSeleccion = signal<GrillaMetadatoColumna | null>(null);
  protected readonly parDestinoSeleccion = signal<GrillaMetadatoColumna | null>(null);
  protected readonly parFiltroOrigen = signal('');
  protected readonly parFiltroDestino = signal('');
  private readonly formularioProcesoUid = { current: 0 };

  protected readonly diagramaElementoForm = this.formBuilder.group({
    nombre: this.formBuilder.nonNullable.control('', [
      Validators.required,
      Validators.maxLength(180),
    ]),
    duracionValor: this.formBuilder.control<number | null>(null, [
      Validators.required,
    ]),
    duracionUnidad: this.formBuilder.control<TareaDuracionUnidad | null>(null, [
      Validators.required,
    ]),
    cargo: this.formBuilder.control<string | null>(null, [Validators.required]),
    usuarios: this.formBuilder.nonNullable.control<string[]>([]),
    observaciones: this.formBuilder.nonNullable.control(''),
    ejecutaFuncionalidad: this.formBuilder.nonNullable.control(false),
    funcionalidad: this.formBuilder.control<TareaFuncionalidad | null>(null),
    dispositivoMovil: this.formBuilder.nonNullable.control(false),
    agenda: this.formBuilder.nonNullable.control(false),
    tipoEjecucion: this.formBuilder.nonNullable.control<TareaTipoEjecucion>('normal'),
    ignorarValidacionCargo: this.formBuilder.nonNullable.control(false),
    aplicarJornadaLaboral: this.formBuilder.nonNullable.control(false),
    jornada: this.formBuilder.control<string | null>(null),
    calendario: this.formBuilder.control<string | null>(null),
    agregarRegistrosExternos: this.formBuilder.nonNullable.control(false),
    filtrarUsuariosPorMetadatos: this.formBuilder.nonNullable.control(false),
    conservarVistosBuenos: this.formBuilder.nonNullable.control(false),
    imprimirFormulario: this.formBuilder.nonNullable.control(false),
    tareaWeb: this.formBuilder.nonNullable.control(false),
    notificarViaEmail: this.formBuilder.nonNullable.control(false),
    alertas: this.formBuilder.nonNullable.control(false),
    checkpoint: this.formBuilder.nonNullable.control(false),
  });

  private readonly tareaCargoSeleccionado = toSignal(
    this.diagramaElementoForm.controls.cargo.valueChanges,
    { initialValue: this.diagramaElementoForm.controls.cargo.value },
  );

  private usuariosPorRol(cargo: string | null): SelectOption[] {
    if (cargo === null || cargo.trim() === '') {
      return [];
    }

    return this.usuariosLiviano()
      .filter(
        (usuario) =>
          String(usuario.id_rol) === cargo ||
          usuario.roles_secundarios.some((rol) => String(rol.id_rol) === cargo),
      )
      .map((usuario) => ({
        label: usuario.nombre_completo_usuario.trim(),
        value: usuario.id_usuario,
      }));
  }

  protected readonly tareaUsuariosDisponibles = computed(() => {
    const cargo = this.tareaCargoSeleccionado();
    const opciones = new Map<string, SelectOption>();

    for (const usuario of this.usuariosPorRol(cargo)) {
      opciones.set(usuario.value, usuario);
    }

    const elementoId = this.diagramaElementoSeleccionado()?.id;

    if (elementoId !== undefined) {
      for (const usuario of this.tareaConfigs()[elementoId]?.usuarios ?? []) {
        if (usuario.trim() !== '' && !opciones.has(usuario)) {
          opciones.set(usuario, { label: usuario, value: usuario });
        }
      }
    }

    return [...opciones.values()];
  });

  protected readonly mensajeConfigs = signal<Record<string, MensajeConfig>>({});
  protected readonly mensajeSubModal = signal<
    'destinatarios' | 'asunto' | 'contenido' | 'formulario' | null
  >(null);
  protected readonly mensajeSubModalTarget = signal<'para' | 'cc'>('para');
  protected readonly mensajeValidacionError = signal('');
  protected readonly tareaValidacionError = signal('');
  protected readonly timerValidacionError = signal('');
  protected readonly decisionValidacionError = signal('');
  protected readonly mensajeTokenDocumentoSeleccionado = signal('');
  protected readonly mensajeTokenMetadatoSeleccionado = signal('');
  protected readonly mensajeTokenLinkDocumentoSeleccionado = signal('');
  protected readonly quillModules = { toolbar: MENSAJE_CONTENIDO_TOOLBAR };
  private quillContenido: QuillEditorLike | null = null;
  private readonly mensajeMetadatosCache = new Map<number, MetadatoOpcion[]>();
  private readonly mensajeMetadatosVersion = signal(0);
  private readonly mensajeRowUid = { current: 0 };
  private readonly mensajesParSubscripciones = new WeakMap<
    FormGroup<{ idDocumento: FormControl<string>; idMetadato: FormControl<string> }>,
    Subscription
  >();

  protected readonly mensajeElementoForm = this.formBuilder.group({
    enviarACargo: this.formBuilder.nonNullable.control(false),
    encabezadoInfoProceso: this.formBuilder.nonNullable.control(false),
    asunto: this.formBuilder.nonNullable.control(''),
    contenido: this.formBuilder.nonNullable.control(''),
    adjuntarPdfIds: this.formBuilder.nonNullable.control<string[]>([]),
    completarFormulario: this.formBuilder.nonNullable.control<MensajeCompletarFormulario>('sin'),
    destinatarios: this.buildMensajeDestinatariosGroup(),
    destinatariosCc: this.buildMensajeDestinatariosGroup(),
  });

  protected readonly timerConfigs = signal<Record<string, TimerConfig>>({});
  protected readonly timerDuracionUnidadOptions = TIMER_DURACION_UNIDAD_OPTIONS;

  protected readonly timerElementoForm = this.formBuilder.group({
    modo: this.formBuilder.nonNullable.control<TimerModo>('datoFijo'),
    datoFijoTipo: this.formBuilder.nonNullable.control<TimerDatoFijoTipo>('tiempo'),
    duracionValor: this.formBuilder.control<number | null>(null),
    duracionUnidad: this.formBuilder.control<string | null>(null),
    fecha: this.formBuilder.control<Date | null>(null),
    hora: this.formBuilder.control<Date | null>(null),
    idDocumento: this.formBuilder.control<string | null>(null),
    idMetadato: this.formBuilder.control<string | null>(null),
  });

  protected timerMetadatosOptions(): readonly MetadatoOpcion[] {
    this.mensajeMetadatosVersion();
    const docId = this.timerElementoForm.controls.idDocumento.value;

    if (docId === null || docId === '') {
      return [];
    }

    return (this.mensajeMetadatosCache.get(Number(docId)) ?? []).filter(
      (opcion) => opcion.tipo === 'FEC',
    );
  }

  private updateTimerValidators(): void {
    const { modo, datoFijoTipo } = this.timerElementoForm.getRawValue();
    const esTiempo = modo === 'datoFijo' && datoFijoTipo === 'tiempo';
    const esFecha = modo === 'datoFijo' && datoFijoTipo === 'fecha';
    const esMetadato = modo === 'metadatoFormulario';

    const duracionValor = this.timerElementoForm.controls.duracionValor;
    const duracionUnidad = this.timerElementoForm.controls.duracionUnidad;
    const fecha = this.timerElementoForm.controls.fecha;
    const idDocumento = this.timerElementoForm.controls.idDocumento;
    const idMetadato = this.timerElementoForm.controls.idMetadato;

    duracionValor.setValidators(esTiempo ? [Validators.required, Validators.min(1)] : []);
    duracionUnidad.setValidators(esTiempo ? [Validators.required] : []);
    fecha.setValidators(esFecha ? [Validators.required] : []);
    idDocumento.setValidators(esMetadato ? [Validators.required] : []);
    idMetadato.setValidators(esMetadato ? [Validators.required] : []);

    duracionValor.updateValueAndValidity({ emitEvent: false });
    duracionUnidad.updateValueAndValidity({ emitEvent: false });
    fecha.updateValueAndValidity({ emitEvent: false });
    idDocumento.updateValueAndValidity({ emitEvent: false });
    idMetadato.updateValueAndValidity({ emitEvent: false });
  }

  private resetTimerForm(config?: TimerConfig): void {
    const base = config ?? buildDefaultTimerConfig();

    this.timerElementoForm.patchValue(
      {
        modo: base.modo,
        datoFijoTipo: base.datoFijoTipo,
        duracionValor: base.duracionValor,
        duracionUnidad: base.duracionUnidad,
        fecha: base.fecha !== null ? parsearFechaTimer(base.fecha) : null,
        hora: base.hora !== null ? parsearHoraTimer(base.hora) : null,
        idDocumento: base.idDocumento !== null ? String(base.idDocumento) : null,
        idMetadato: base.idMetadato,
      },
      { emitEvent: false },
    );
    this.updateTimerValidators();
    this.timerElementoForm.markAsPristine();
    this.timerElementoForm.markAsUntouched();

    if (base.idDocumento !== null) {
      this.asegurarMetadatosDocumento(String(base.idDocumento));
    }
  }

  protected readonly decisionConfigs = signal<Record<string, DecisionConfig>>({});
  protected readonly decisionDuracionUnidadOptions = DECISION_DURACION_UNIDAD_OPTIONS;
  protected readonly decisionFuncionalidadOptions = DECISION_FUNCIONALIDAD_OPTIONS;
  protected readonly decisionTipoEjecucionOptions = DECISION_TIPO_EJECUCION_OPTIONS;
  protected readonly decisionAlertasOptions = DECISION_ALERTAS_OPTIONS;

  protected readonly decisionElementoForm = this.formBuilder.group({
    nombre: this.formBuilder.nonNullable.control('', [
      Validators.required,
      Validators.maxLength(180),
    ]),
    duracionValor: this.formBuilder.control<number | null>(null, [
      Validators.required,
      Validators.min(1),
    ]),
    duracionUnidad: this.formBuilder.control<DecisionDuracionUnidad | null>(null, [
      Validators.required,
    ]),
    cargo: this.formBuilder.control<string | null>(null, [Validators.required]),
    usuarios: this.formBuilder.nonNullable.control<string[]>([]),
    tipoEjecucion: this.formBuilder.nonNullable.control<DecisionTipoEjecucion>('normal'),
    ejecutaFuncionalidad: this.formBuilder.nonNullable.control(false),
    funcionalidad: this.formBuilder.control<DecisionFuncionalidad | null>(null),
    documento: this.formBuilder.control<string | null>(null),
    activarMetadatosSistema: this.formBuilder.nonNullable.control(false),
    aplicarJornadaLaboral: this.formBuilder.nonNullable.control(false),
    jornada: this.formBuilder.control<string | null>(null),
    calendario: this.formBuilder.control<string | null>(null),
    dispositivoMovil: this.formBuilder.nonNullable.control(false),
    alertas: this.formBuilder.nonNullable.control(false),
    alertaSeleccionada: this.formBuilder.control<string | null>(null),
    notificarViaEmail: this.formBuilder.nonNullable.control(false),
  });

  private readonly decisionCargoSeleccionado = toSignal(
    this.decisionElementoForm.controls.cargo.valueChanges,
    { initialValue: this.decisionElementoForm.controls.cargo.value },
  );

  protected readonly decisionUsuariosDisponibles = computed(() => {
    const cargo = this.decisionCargoSeleccionado();

    return this.usuariosPorRol(cargo);
  });

  private updateDecisionValidators(): void {
    const {
      ejecutaFuncionalidad,
      funcionalidad,
      aplicarJornadaLaboral,
      alertas,
    } = this.decisionElementoForm.getRawValue();
    const firmaRegistroActiva = ejecutaFuncionalidad && funcionalidad === 'freg';
    const funcionalidadControl = this.decisionElementoForm.controls.funcionalidad;
    const documentoControl = this.decisionElementoForm.controls.documento;
    const jornadaControl = this.decisionElementoForm.controls.jornada;
    const calendarioControl = this.decisionElementoForm.controls.calendario;
    const alertaSeleccionadaControl = this.decisionElementoForm.controls.alertaSeleccionada;

    funcionalidadControl.setValidators(
      ejecutaFuncionalidad ? [Validators.required] : [],
    );
    documentoControl.setValidators(firmaRegistroActiva ? [Validators.required] : []);
    jornadaControl.setValidators(aplicarJornadaLaboral ? [Validators.required] : []);
    calendarioControl.setValidators(aplicarJornadaLaboral ? [Validators.required] : []);
    alertaSeleccionadaControl.setValidators(alertas ? [Validators.required] : []);

    funcionalidadControl.updateValueAndValidity({ emitEvent: false });
    documentoControl.updateValueAndValidity({ emitEvent: false });
    jornadaControl.updateValueAndValidity({ emitEvent: false });
    calendarioControl.updateValueAndValidity({ emitEvent: false });
    alertaSeleccionadaControl.updateValueAndValidity({ emitEvent: false });
  }

  private resetDecisionForm(config?: DecisionConfig): void {
    const base = config ?? buildDefaultDecisionConfig('');

    this.decisionElementoForm.patchValue(
      {
        ...base,
        usuarios: [...base.usuarios],
        documento: base.documento !== null ? String(base.documento) : null,
      },
      { emitEvent: false },
    );
    this.updateDecisionValidators();
    this.decisionElementoForm.markAsPristine();
    this.decisionElementoForm.markAsUntouched();
  }

  private buildDecisionConfigDesdeForm(): DecisionConfig {
    const formValue = this.decisionElementoForm.getRawValue();
    const firmaRegistroActiva =
      formValue.ejecutaFuncionalidad && formValue.funcionalidad === 'freg';

    return {
      ...formValue,
      nombre: formValue.nombre.trim(),
      documento:
        firmaRegistroActiva && formValue.documento !== null && formValue.documento !== ''
          ? Number(formValue.documento)
          : null,
      activarMetadatosSistema: firmaRegistroActiva
        ? formValue.activarMetadatosSistema
        : false,
    };
  }

  protected readonly transicionConfigs = signal<Record<string, TransicionConfig>>({});
  protected readonly transicionValidacionError = signal('');
  protected readonly transicionAccionOptions = TRANSICION_ACCION_OPTIONS;
  protected readonly transicionOperadorOptions = TRANSICION_OPERADOR_OPTIONS;
  protected readonly transicionDuracionUnidadOptions = TIMER_DURACION_UNIDAD_OPTIONS;
  protected readonly metadatosRequeridosRol = signal<readonly MetadatoRequeridoRol[]>([]);
  protected readonly usuariosLiviano = signal<readonly UsuarioLiviano[]>([]);
  protected readonly transicionOrigenId = signal<string | null>(null);
  protected readonly validacionDiagrama = signal<readonly ResultadoValidacionDiagrama[]>([]);
  protected readonly tieneErroresValidacionDiagrama = computed(() =>
    this.validacionDiagrama().some((resultado) => resultado.nivel === 'error'),
  );
  private readonly transicionCombo = signal<{ origen: BpmnNodoKind; destino: BpmnNodoKind } | null>(
    null,
  );
  private readonly transicionRowUid = { current: 0 };
  private readonly transicionReglaSubscripciones = new WeakMap<FormGroup, Subscription[]>();

  protected readonly transicionFlags = computed<TransicionFlags>(() => {
    const combo = this.transicionCombo();

    return combo ? flagsDeComboTransicion(combo.origen, combo.destino) : FLAGS_TRANSICION_VACIOS;
  });

  protected readonly transicionConexionTexto = computed(() => {
    const combo = this.transicionCombo();

    return combo
      ? `${BPMN_NODO_KIND_LABELS[combo.origen]} → ${BPMN_NODO_KIND_LABELS[combo.destino]}`
      : '';
  });

  private buildTransicionTimerGroup() {
    return this.formBuilder.group({
      modo: this.formBuilder.nonNullable.control<TimerModo>('datoFijo'),
      datoFijoTipo: this.formBuilder.nonNullable.control<TimerDatoFijoTipo>('tiempo'),
      duracionValor: this.formBuilder.control<number | null>(null),
      duracionUnidad: this.formBuilder.control<string | null>(null),
      fecha: this.formBuilder.control<Date | null>(null),
      hora: this.formBuilder.control<Date | null>(null),
      idDocumento: this.formBuilder.control<string | null>(null),
      idMetadato: this.formBuilder.control<string | null>(null),
    });
  }

  protected readonly transicionElementoForm = this.formBuilder.group({
    requiereTimer: this.formBuilder.nonNullable.control(false),
    interrupcion: this.formBuilder.nonNullable.control(false),
    accionRequerida: this.formBuilder.nonNullable.control(false),
    accion: this.formBuilder.control<TransicionAccion | null>(null),
    timer: this.buildTransicionTimerGroup(),
    reglasUsuario: this.formBuilder.array<TransicionReglaUsuarioGroup>([]),
    reglasNegocio: this.formBuilder.array<TransicionReglaNegocioGroup>([]),
  });

  protected transicionTimerMetadatosOptions(): readonly MetadatoOpcion[] {
    this.mensajeMetadatosVersion();
    const docId = this.transicionElementoForm.controls.timer.controls.idDocumento.value;

    if (docId === null || docId === '') {
      return [];
    }

    return (this.mensajeMetadatosCache.get(Number(docId)) ?? []).filter(
      (opcion) => opcion.tipo === 'FEC',
    );
  }

  protected metadatosDeDocumento(idDocumento: string): readonly MetadatoOpcion[] {
    this.mensajeMetadatosVersion();

    if (idDocumento === '') {
      return [];
    }

    return this.mensajeMetadatosCache.get(Number(idDocumento)) ?? [];
  }

  protected agregarTransicionReglaUsuario(): void {
    this.transicionRowUid.current += 1;
    const origenId = this.transicionOrigenId();
    const cargoPorDefecto = origenId === null ? null : this.tareaConfigs()[origenId]?.cargo ?? '';
    const group = this.formBuilder.group({
      idDocumento: this.formBuilder.nonNullable.control<string>(''),
      idMetadato: this.formBuilder.nonNullable.control<string>(''),
      interpretacion: this.formBuilder.nonNullable.control<TransicionInterpretacion>('id'),
      idCargo: this.formBuilder.nonNullable.control<string>(cargoPorDefecto ?? ''),
      idMetadatoValor: this.formBuilder.nonNullable.control<string>(''),
      idReglaUsuario: this.formBuilder.nonNullable.control<string>(''),
    });

    const subscriptions = [
      group.controls.idDocumento.valueChanges.subscribe((idDocumento) => {
        group.controls.idMetadato.setValue('');
        this.asegurarMetadatosDocumento(idDocumento);
      }),
      group.controls.idCargo.valueChanges.subscribe(() => {
        group.controls.idMetadatoValor.setValue('');
      }),
    ];

    this.transicionReglaSubscripciones.set(group, subscriptions);
    this.transicionElementoForm.controls.reglasUsuario.push(group);
  }

  protected agregarTransicionReglaNegocio(): void {
    this.transicionRowUid.current += 1;
    const group = this.formBuilder.group({
      idDocumento: this.formBuilder.nonNullable.control<string>(''),
      idMetadato: this.formBuilder.nonNullable.control<string>(''),
      operador: this.formBuilder.control<TransicionOperador | null>(null),
      idOperadorRegla: this.formBuilder.nonNullable.control<string>(''),
      fuenteValor: this.formBuilder.nonNullable.control<TransicionFuenteValor>('valor'),
      valorTexto: this.formBuilder.nonNullable.control<string>(''),
      idDocumentoValor: this.formBuilder.nonNullable.control<string>(''),
      idMetadatoValor: this.formBuilder.nonNullable.control<string>(''),
    });

    const subscriptions = [
      group.controls.idDocumento.valueChanges.subscribe((idDocumento) => {
        group.controls.idMetadato.setValue('');
        group.controls.operador.setValue(null);
        this.asegurarMetadatosDocumento(idDocumento);
      }),
      group.controls.idDocumentoValor.valueChanges.subscribe((idDocumentoValor) => {
        group.controls.idMetadatoValor.setValue('');
        this.asegurarMetadatosDocumento(idDocumentoValor);
      }),
      group.controls.idMetadato.valueChanges.subscribe((idMetadato) => {
        if (idMetadato === '') {
          group.controls.operador.setValue(null);
          return;
        }

        const idDocumento = group.controls.idDocumento.value;
        const opciones = this.mensajeMetadatosCache.get(Number(idDocumento)) ?? [];
        const opcion = opciones.find((o) => o.value === idMetadato);
        const operadoresValidos = operadoresPorTipoDato(opcion?.tipo ?? null);

        if (!operadoresValidos.some((o) => o.value === group.controls.operador.value)) {
          group.controls.operador.setValue(null);
        }
      }),
    ];

    this.transicionReglaSubscripciones.set(group, subscriptions);
    this.transicionElementoForm.controls.reglasNegocio.push(group);
  }

  protected quitarTransicionReglaUsuario(index: number): void {
    const group = this.transicionElementoForm.controls.reglasUsuario.at(index);

    if (group) {
      this.transicionReglaSubscripciones.get(group)?.forEach((s) => s.unsubscribe());
      this.transicionReglaSubscripciones.delete(group);
    }

    this.transicionElementoForm.controls.reglasUsuario.removeAt(index);
  }

  protected quitarTransicionReglaNegocio(index: number): void {
    const group = this.transicionElementoForm.controls.reglasNegocio.at(index);

    if (group) {
      this.transicionReglaSubscripciones.get(group)?.forEach((s) => s.unsubscribe());
      this.transicionReglaSubscripciones.delete(group);
    }

    this.transicionElementoForm.controls.reglasNegocio.removeAt(index);
  }

  private limpiarTransicionReglas(): void {
    const { reglasUsuario, reglasNegocio } = this.transicionElementoForm.controls;

    for (const group of [...reglasUsuario.controls, ...reglasNegocio.controls]) {
      this.transicionReglaSubscripciones.get(group)?.forEach((s) => s.unsubscribe());
      this.transicionReglaSubscripciones.delete(group);
    }

    reglasUsuario.clear();
    reglasNegocio.clear();
  }

  private agregarTransicionReglaUsuarioRow(item: TransicionReglaUsuario): void {
    this.agregarTransicionReglaUsuario();
    const group = this.transicionElementoForm.controls.reglasUsuario.at(
      this.transicionElementoForm.controls.reglasUsuario.length - 1,
    );

    group?.patchValue(
      {
        idDocumento: item.idDocumento !== null ? String(item.idDocumento) : '',
        idMetadato: item.idMetadato ?? '',
        interpretacion: item.interpretacion,
        idCargo: item.idCargo !== null && item.idCargo !== undefined ? String(item.idCargo) : '',
        idMetadatoValor: item.idMetadatoValor ?? '',
        idReglaUsuario: item.idReglaUsuario !== null && item.idReglaUsuario !== undefined ? String(item.idReglaUsuario) : '',
      },
      { emitEvent: false },
    );

    if (item.idDocumento !== null) {
      this.asegurarMetadatosDocumento(String(item.idDocumento));
    }
  }

  private agregarTransicionReglaNegocioRow(item: TransicionReglaNegocio): void {
    this.agregarTransicionReglaNegocio();
    const group = this.transicionElementoForm.controls.reglasNegocio.at(
      this.transicionElementoForm.controls.reglasNegocio.length - 1,
    );

    group?.patchValue(
      {
        idDocumento: item.idDocumento !== null ? String(item.idDocumento) : '',
        idMetadato: item.idMetadato ?? '',
        operador: item.operador,
        idOperadorRegla: item.idOperadorRegla ?? '',
        fuenteValor: item.fuenteValor,
        valorTexto: item.valorTexto,
        idDocumentoValor: item.idDocumentoValor !== null ? String(item.idDocumentoValor) : '',
        idMetadatoValor: item.idMetadatoValor ?? '',
      },
      { emitEvent: false },
    );

    if (item.idDocumento !== null) {
      this.asegurarMetadatosDocumento(String(item.idDocumento));
    }
    if (item.idDocumentoValor !== null) {
      this.asegurarMetadatosDocumento(String(item.idDocumentoValor));
    }
  }

  private resetTransicionForm(config?: TransicionConfig): void {
    const base = config ?? buildDefaultTransicionConfig();

    this.limpiarTransicionReglas();
    for (const regla of base.reglasUsuario) {
      this.agregarTransicionReglaUsuarioRow(regla);
    }
    for (const regla of base.reglasNegocio) {
      this.agregarTransicionReglaNegocioRow(regla);
    }

    this.transicionElementoForm.patchValue(
      {
        requiereTimer: base.requiereTimer,
        interrupcion: base.interrupcion,
        accionRequerida: base.accionRequerida,
        accion: base.accion,
        timer: {
          modo: base.timer.modo,
          datoFijoTipo: base.timer.datoFijoTipo,
          duracionValor: base.timer.duracionValor,
          duracionUnidad: base.timer.duracionUnidad,
          fecha: base.timer.fecha !== null ? parsearFechaTimer(base.timer.fecha) : null,
          hora: base.timer.hora !== null ? parsearHoraTimer(base.timer.hora) : null,
          idDocumento:
            base.timer.idDocumento !== null ? String(base.timer.idDocumento) : null,
          idMetadato: base.timer.idMetadato,
        },
      },
      { emitEvent: false },
    );
    this.transicionElementoForm.markAsPristine();
    this.transicionElementoForm.markAsUntouched();

    if (base.timer.idDocumento !== null) {
      this.asegurarMetadatosDocumento(String(base.timer.idDocumento));
    }
  }

  private validarTransicion(): string | null {
    const flags = this.transicionFlags();
    const { requiereTimer, accionRequerida, accion, timer } =
      this.transicionElementoForm.getRawValue();

    if (flags.requiereTimer && requiereTimer) {
      if (timer.modo === 'datoFijo' && timer.datoFijoTipo === 'tiempo') {
        if (
          timer.duracionValor === null ||
          timer.duracionValor < 1 ||
          timer.duracionUnidad === null
        ) {
          return 'Completa la duración del timer (valor y unidad).';
        }
      } else if (timer.modo === 'datoFijo' && timer.datoFijoTipo === 'fecha') {
        if (timer.fecha === null) {
          return 'Selecciona la fecha del timer.';
        }
      } else if (timer.modo === 'metadatoFormulario') {
        if (timer.idDocumento === null || timer.idMetadato === null) {
          return 'Selecciona documento y metadato del timer.';
        }
      }
    }

    if (flags.accion && accionRequerida && !accion) {
      return 'Selecciona la acción requerida.';
    }

    for (const group of this.transicionElementoForm.controls.reglasUsuario.controls) {
      const { idDocumento, idMetadato } = group.getRawValue();
      const parcial = (idDocumento !== '' || idMetadato !== '') && !(idDocumento !== '' && idMetadato !== '');

      if (parcial) {
        return 'Completa o elimina las reglas de usuario incompletas.';
      }
    }

    for (const group of this.transicionElementoForm.controls.reglasNegocio.controls) {
      const v = group.getRawValue();
      const ladoIzquierdo = v.idDocumento !== '' || v.idMetadato !== '';
      const ladoValor =
        v.fuenteValor === 'valor'
          ? v.valorTexto !== ''
          : v.idDocumentoValor !== '' && v.idMetadatoValor !== '';
      const parcialValor =
        v.fuenteValor === 'valor'
          ? v.valorTexto !== ''
          : v.idDocumentoValor !== '' || v.idMetadatoValor !== '';

      if ((ladoIzquierdo || parcialValor) && !(ladoIzquierdo && ladoValor)) {
        return 'Completa o elimina las reglas de negocio incompletas.';
      }
    }

    return null;
  }

  private buildTransicionConfigDesdeForm(): TransicionConfig {
    const flags = this.transicionFlags();
    const formValue = this.transicionElementoForm.getRawValue();
    const requiereTimer = flags.requiereTimer && formValue.requiereTimer;
    const accionRequerida = flags.accion && formValue.accionRequerida;

    const timer: TimerConfig = requiereTimer
      ? {
          modo: formValue.timer.modo,
          datoFijoTipo: formValue.timer.datoFijoTipo,
          duracionValor:
            formValue.timer.modo === 'datoFijo' && formValue.timer.datoFijoTipo === 'tiempo'
              ? formValue.timer.duracionValor
              : null,
          duracionUnidad:
            formValue.timer.modo === 'datoFijo' && formValue.timer.datoFijoTipo === 'tiempo'
              ? formValue.timer.duracionUnidad
              : null,
          fecha:
            formValue.timer.modo === 'datoFijo' && formValue.timer.datoFijoTipo === 'fecha'
              ? formatearFechaTimer(formValue.timer.fecha)
              : null,
          hora:
            formValue.timer.modo === 'datoFijo' && formValue.timer.datoFijoTipo === 'fecha'
              ? formatearHoraTimer(formValue.timer.hora)
              : null,
          idDocumento:
            formValue.timer.modo === 'metadatoFormulario' && formValue.timer.idDocumento !== null
              ? Number(formValue.timer.idDocumento)
              : null,
          idMetadato:
            formValue.timer.modo === 'metadatoFormulario' ? formValue.timer.idMetadato : null,
        }
      : buildDefaultTimerConfig();

    const reglasUsuario: TransicionReglaUsuario[] = this.transicionElementoForm.controls.reglasUsuario.controls
      .map((group) => group.getRawValue())
      .filter((v) => v.idDocumento !== '' && v.idMetadato !== '')
      .map((v) => ({
        idDocumento: Number(v.idDocumento),
        idMetadato: v.idMetadato,
        interpretacion: v.interpretacion,
        idCargo: v.idCargo !== '' ? Number(v.idCargo) : null,
        idMetadatoValor: v.idMetadatoValor !== '' ? v.idMetadatoValor : null,
        idReglaUsuario: v.idReglaUsuario !== '' ? Number(v.idReglaUsuario) : null,
      }));

    const reglasNegocio: TransicionReglaNegocio[] = this.transicionElementoForm.controls.reglasNegocio.controls
      .map((group) => group.getRawValue())
      .filter(
        (v): v is typeof v & { operador: TransicionOperador } =>
          v.idDocumento !== '' &&
          v.idMetadato !== '' &&
          v.operador !== null &&
          (v.fuenteValor === 'valor'
            ? v.valorTexto.trim() !== ''
            : v.idDocumentoValor !== '' && v.idMetadatoValor !== ''),
      )
      .map((v) => ({
        idDocumento: Number(v.idDocumento),
        idMetadato: v.idMetadato,
        operador: v.operador,
        idOperadorRegla: v.idOperadorRegla !== '' ? v.idOperadorRegla : null,
        fuenteValor: v.fuenteValor,
        valorTexto: v.fuenteValor === 'valor' ? v.valorTexto : '',
        idDocumentoValor:
          v.fuenteValor === 'otroMetadato' && v.idDocumentoValor !== ''
            ? Number(v.idDocumentoValor)
            : null,
        idMetadatoValor: v.fuenteValor === 'otroMetadato' ? v.idMetadatoValor : null,
      }));

    return {
      requiereTimer,
      timer,
      interrupcion:
        flags.requiereTimer && flags.interrupcion && requiereTimer
          ? formValue.interrupcion
          : false,
      accionRequerida,
      accion: accionRequerida ? formValue.accion : null,
      reglasUsuario,
      reglasNegocio,
    };
  }

  protected readonly mensajeCompletarFormularioOptions: readonly {
    value: MensajeCompletarFormulario;
    label: string;
  }[] = [
    { value: 'sin', label: 'Sin formulario' },
    { value: 'proceso', label: 'Formulario de proceso' },
    { value: 'externo', label: 'formulario externo' },
  ];

  private buildMensajeDestinatariosGroup() {
    return this.formBuilder.group({
      usuariosSistema: this.formBuilder.nonNullable.control<string[]>([]),
      usuariosExternos: this.formBuilder.nonNullable.control<string[]>([]),
      referencias: this.formBuilder.array<
        FormGroup<{ idDocumento: FormControl<string>; idMetadato: FormControl<string> }>
      >([]),
    });
  }

  protected readonly mensajeFormularioRows = signal<MensajeFormularioRow[]>([]);

  protected mensajeMetadatosDeFila(uid: number): readonly MetadatoOpcion[] {
    this.mensajeMetadatosVersion();
    const fila = this.mensajeFormularioRows().find((row) => row.uid === uid);
    const docId = fila?.group.controls.idDocumento.value ?? '';

    return docId === '' ? [] : (this.mensajeMetadatosCache.get(Number(docId)) ?? []);
  }

  protected agregarMensajeFormularioItem(): void {
    this.agregarMensajeFormularioRow(undefined);
  }

  protected quitarMensajeFormularioItem(index: number): void {
    this.quitarMensajeFormularioRow(index);
  }

  private agregarMensajeFormularioRow(item?: MensajeFormularioItem): void {
    this.mensajeRowUid.current += 1;
    const uid = this.mensajeRowUid.current;
    const group = this.formBuilder.group({
      idDocumento: this.formBuilder.nonNullable.control<string>(
        item?.idDocumento != null ? String(item.idDocumento) : '',
      ),
      idsMetadatos: this.formBuilder.nonNullable.control<string[]>(
        item?.idsMetadatos.map(String) ?? [],
      ),
    });

    const subscription = group.controls.idDocumento.valueChanges.subscribe((idDocumento) => {
      this.asegurarMetadatosDocumento(idDocumento);
      group.controls.idsMetadatos.setValue([]);
    });

    this.mensajeFormularioRows.update((rows) => [...rows, { uid, group, subscription }]);
    this.asegurarMetadatosDocumento(group.controls.idDocumento.value);
  }

  private quitarMensajeFormularioRow(index: number): void {
    const fila = this.mensajeFormularioRows()[index];

    if (!fila) {
      return;
    }

    fila.subscription.unsubscribe();
    this.mensajeFormularioRows.update((rows) => rows.filter((_, i) => i !== index));
  }

  private limpiarMensajeFormularioRows(): void {
    for (const fila of this.mensajeFormularioRows()) {
      fila.subscription.unsubscribe();
    }
    this.mensajeFormularioRows.set([]);
  }

  private asegurarMetadatosDocumento(idDocumento: string): void {
    this.asegurarMetadatosDocumento$(idDocumento).subscribe({ error: () => undefined });
  }

  private asegurarMetadatosDocumento$(
    idDocumento: string,
  ): Observable<MetadatoOpcion[] | null> {
    if (idDocumento === '') {
      return of(null);
    }

    const idNumero = Number(idDocumento);

    if (!Number.isFinite(idNumero) || this.mensajeMetadatosCache.has(idNumero)) {
      return of(null);
    }

    return this.diagramaService.obtenerMetadatosRequeridosDocumento(idNumero).pipe(
      map((metadatos) => {
        const opciones: MetadatoOpcion[] = metadatos.map((meta) => ({
          label: labelMetadatoConBloque(
            meta.nombre_metadato,
            meta.nombre_bloque,
            meta.codigo_bloque,
          ),
          value: claveCompuestaMetadato(meta.codigo_bloque, meta.id_metadato),
          idMetadato: meta.id_metadato,
          tipo: meta.tipo_metadato,
          codigoBloque: meta.codigo_bloque,
          nombreBloque: meta.nombre_bloque ?? null,
          idBloque: meta.id_bloque ?? null,
          ordenBloque: meta.orden_bloque,
          grilla: meta.grilla ?? null,
        }));
        this.mensajeMetadatosCache.set(idNumero, opciones);
        this.mensajeMetadatosVersion.update((version) => version + 1);
        return opciones;
      }),
      catchError(() => {
        this.mensajeMetadatosVersion.update((version) => version + 1);
        return of(null);
      }),
    );
  }

  protected abrirSubModalDestinatarios(target: 'para' | 'cc'): void {
    this.mensajeSubModalTarget.set(target);
    this.mensajeSubModal.set('destinatarios');
  }

  protected abrirSubModalAsunto(): void {
    this.mensajeSubModal.set('asunto');
  }

  protected abrirSubModalContenido(): void {
    this.mensajeSubModal.set('contenido');
  }

  protected abrirSubModalFormulario(): void {
    this.mensajeSubModal.set('formulario');
  }

  protected cerrarMensajeSubModal(): void {
    this.mensajeSubModal.set(null);
  }

  protected mostrarMensajeFormularioProceso(): boolean {
    return this.mensajeElementoForm.controls.completarFormulario.value === 'proceso';
  }

  protected mensajeReferenciasDe(target: 'para' | 'cc'): MensajeReferenciasArray {
    const grupo =
      target === 'para'
        ? this.mensajeElementoForm.controls.destinatarios
        : this.mensajeElementoForm.controls.destinatariosCc;

    return grupo.controls.referencias;
  }

  protected agregarMensajeReferenciaPar(target: 'para' | 'cc'): void {
    this.agregarMensajeParAGrupo(this.grupoDestinatarios(target), undefined);
  }

  protected quitarMensajeReferenciaPar(target: 'para' | 'cc', index: number): void {
    const arreglo = this.mensajeReferenciasDe(target);
    const par = arreglo.at(index);

    if (par) {
      this.mensajesParSubscripciones.get(par)?.unsubscribe();
      this.mensajesParSubscripciones.delete(par);
    }

    arreglo.removeAt(index);
  }

  private limpiarMensajeReferencias(grupo: MensajeDestinatariosGroup): void {
    const arreglo = grupo.controls.referencias;

    while (arreglo.length > 0) {
      const par = arreglo.at(0);

      if (par) {
        this.mensajesParSubscripciones.get(par)?.unsubscribe();
        this.mensajesParSubscripciones.delete(par);
      }

      arreglo.removeAt(0);
    }
  }

  private agregarMensajeParAGrupo(
    grupo: MensajeDestinatariosGroup,
    item?: MensajeReferenciaPar,
  ): void {
    const par = this.formBuilder.group({
      idDocumento: this.formBuilder.nonNullable.control<string>(
        item?.idDocumento != null ? String(item.idDocumento) : '',
      ),
      idMetadato: this.formBuilder.nonNullable.control<string>(
        item?.idMetadato != null ? String(item.idMetadato) : '',
      ),
    });

    const subscription = par.controls.idDocumento.valueChanges.subscribe((idDocumento) => {
      par.controls.idMetadato.setValue('');
      this.asegurarMetadatosDocumento(idDocumento);
    });

    this.mensajesParSubscripciones.set(par, subscription);
    grupo.controls.referencias.push(par);

    if (par.controls.idDocumento.value !== '') {
      this.asegurarMetadatosDocumento(par.controls.idDocumento.value);
    }
  }

  protected mensajeMetadatosDePar(target: 'para' | 'cc', index: number): readonly MetadatoOpcion[] {
    this.mensajeMetadatosVersion();
    const par = this.mensajeReferenciasDe(target).at(index);
    const docId = par?.controls.idDocumento.value ?? '';

    return docId === '' ? [] : (this.mensajeMetadatosCache.get(Number(docId)) ?? []);
  }

  protected mensajeParEsDgd(
    par:
      | FormGroup<{ idDocumento: FormControl<string>; idMetadato: FormControl<string> }>
      | undefined,
  ): boolean {
    this.mensajeMetadatosVersion();

    if (!par) {
      return false;
    }

    const docId = par.controls.idDocumento.value;
    const metaId = par.controls.idMetadato.value;

    if (docId === '' || metaId === '') {
      return false;
    }

    return (
      this.mensajeMetadatosCache.get(Number(docId))?.find((o) => o.value === metaId)?.tipo ===
      'DGD'
    );
  }

  protected mensajeParAvisoDgd(target: 'para' | 'cc', index: number): boolean {
    const par = this.mensajeReferenciasDe(target).at(index);

    return this.mensajeParEsDgd(par);
  }

  protected hayMetadatoDgdSeleccionado(): boolean {
    for (const target of ['para', 'cc'] as const) {
      const arreglo = this.mensajeReferenciasDe(target);

      for (let index = 0; index < arreglo.length; index += 1) {
        if (this.mensajeParAvisoDgd(target, index)) {
          return true;
        }
      }
    }

    return false;
  }

  private mensajeDestinatariosGrupoActivo(): MensajeDestinatariosGroup {
    return this.grupoDestinatarios(this.mensajeSubModalTarget());
  }

  private grupoDestinatarios(target: 'para' | 'cc'): MensajeDestinatariosGroup {
    return target === 'para'
      ? this.mensajeElementoForm.controls.destinatarios
      : this.mensajeElementoForm.controls.destinatariosCc;
  }

  protected mensajeExternosInvalidos(): readonly string[] {
    const patronEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    return this.mensajeDestinatariosGrupoActivo().controls.usuariosExternos.value.filter(
      (correo) => !patronEmail.test(correo.trim()),
    );
  }

  protected onMensajeTokenDocumentoChange(idDocumento: string): void {
    this.mensajeTokenDocumentoSeleccionado.set(idDocumento);
    this.mensajeTokenMetadatoSeleccionado.set('');
    this.asegurarMetadatosDocumento(idDocumento);
  }

  protected construirTokenReferenciaPar(): string {
    const docId = this.mensajeTokenDocumentoSeleccionado();
    const metaId = this.mensajeTokenMetadatoSeleccionado();

    if (docId === '' || metaId === '') {
      return '';
    }

    const metadato = this.mensajeMetadatosCache.get(Number(docId))?.find((o) => o.value === metaId);

    if (!metadato || metadato.tipo === 'DGD') {
      return '';
    }

    const nombreDocumento = this.labelDeOpcion(this.documentosOptions(), docId);

    return `/insertar//var/${metadato.label}%${nombreDocumento}%${metadato.codigoBloque ?? ''}%${metadato.idMetadato}/insertar/`;
  }

  protected construirTokenLink(): string {
    const docId = this.mensajeTokenLinkDocumentoSeleccionado();

    if (docId === '') {
      return '';
    }

    const nombreDocumento = this.labelDeOpcion(this.documentosOptions(), docId);

    return `/insertar//link/%${nombreDocumento}%${nombreDocumento}/insertar/`;
  }

  protected mensajeTokenMetaEsDgd(): boolean {
    this.mensajeMetadatosVersion();
    const docId = this.mensajeTokenDocumentoSeleccionado();
    const metaId = this.mensajeTokenMetadatoSeleccionado();

    if (docId === '' || metaId === '') {
      return false;
    }

    return (
      this.mensajeMetadatosCache.get(Number(docId))?.find((o) => o.value === metaId)?.tipo ===
      'DGD'
    );
  }

  protected mensajeMetadatosDelToken(): readonly MetadatoOpcion[] {
    this.mensajeMetadatosVersion();
    const docId = this.mensajeTokenDocumentoSeleccionado();

    return docId === '' ? [] : (this.mensajeMetadatosCache.get(Number(docId)) ?? []);
  }

  protected insertarTokenReferenciaEnAsunto(): void {
    const token = this.construirTokenReferenciaPar();

    if (token !== '') {
      this.insertarTokenAsunto(token);
    }
  }

  protected insertarTokenReferenciaEnContenido(): void {
    const token = this.construirTokenReferenciaPar();

    if (token !== '') {
      this.insertarTokenContenido(token);
    }
  }

  protected insertarTokenLinkEnContenido(): void {
    const token = this.construirTokenLink();

    if (token !== '') {
      this.insertarTokenContenido(token);
    }
  }

  protected onQuillEditorCreated(editor: unknown): void {
    this.quillContenido = editor as QuillEditorLike;
  }

  protected insertarTokenAsunto(token: string): void {
    const control = this.mensajeElementoForm.controls.asunto;
    const elemento = this.mensajeAsuntoTextarea?.nativeElement;
    const valorActual = control.value ?? '';
    const posicion =
      elemento && elemento.selectionStart !== null ? elemento.selectionStart : valorActual.length;
    const nuevoValor = `${valorActual.slice(0, posicion)}${token}${valorActual.slice(posicion)}`;

    control.setValue(nuevoValor);
    queueMicrotask(() => {
      if (elemento) {
        const nuevaPosicion = posicion + token.length;
        elemento.focus();
        elemento.setSelectionRange(nuevaPosicion, nuevaPosicion);
      }
    });
  }

  protected insertarTokenContenido(token: string): void {
    const quill = this.quillContenido;

    if (!quill) {
      const control = this.mensajeElementoForm.controls.contenido;
      control.setValue(`${control.value}${token}`);
      return;
    }

    const seleccion = quill.getSelection(true);
    const index = seleccion ? seleccion.index : quill.getLength();
    quill.insertText(index, token);
  }

  protected mensajeResumenDestinatarios(target: 'para' | 'cc'): string {
    this.mensajeMetadatosVersion();
    const grupo =
      target === 'para'
        ? this.mensajeElementoForm.controls.destinatarios
        : this.mensajeElementoForm.controls.destinatariosCc;
    const valores = grupo.getRawValue();
    const partes: string[] = [];

    if (valores.usuariosSistema.length > 0) {
      partes.push(`Sistema: ${valores.usuariosSistema.join(', ')}`);
    }
    if (valores.usuariosExternos.length > 0) {
      partes.push(`Externos: ${valores.usuariosExternos.join(', ')}`);
    }

    for (const par of valores.referencias) {
      if (par.idDocumento === '' || par.idMetadato === '') {
        continue;
      }

      const metadato = this.mensajeMetadatosCache
        .get(Number(par.idDocumento))
        ?.find((o) => o.value === par.idMetadato);
      const nombreDocumento = this.labelDeOpcion(this.documentosOptions(), par.idDocumento);
      const nombreMetadato = metadato?.label ?? par.idMetadato;

      partes.push(`Doc: ${nombreDocumento} / Meta: ${nombreMetadato}`);
    }

    return partes.length > 0 ? partes.join(' · ') : 'Sin destinatarios';
  }

  protected mensajeResumenTexto(valor: string, largo = 60): string {
    const plano = valor
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (plano === '') {
      return '—';
    }

    return plano.length > largo ? `${plano.slice(0, largo)}…` : plano;
  }

  private validarMensaje(): string | null {
    const valores = this.mensajeElementoForm.getRawValue();
    const faltantes: string[] = [];

    if (valores.asunto.trim() === '') {
      faltantes.push('asunto');
    }
    if (valores.contenido.trim() === '') {
      faltantes.push('contenido');
    }

    const destinoOk =
      valores.enviarACargo ||
      this.mensajeDestinoConfigurado(valores.destinatarios) ||
      this.mensajeDestinoConfigurado(valores.destinatariosCc);

    if (!destinoOk) {
      faltantes.push('destinatarios');
    }

    if (faltantes.length > 0) {
      return `Completa: ${faltantes.join(', ')}. El destino también puede cubrirse activando "Enviar a usuarios del cargo".`;
    }

    if (this.hayMetadatoDgdSeleccionado()) {
      return 'Hay metadatos tipo DGD seleccionados como destinatarios; serán abordados en una futura iteración.';
    }

    return null;
  }

  private mensajeDestinoConfigurado(destino: {
    usuariosSistema: string[];
    usuariosExternos: string[];
    referencias: { idDocumento: string; idMetadato: string }[];
  }): boolean {
    return (
      destino.usuariosSistema.length > 0 ||
      destino.usuariosExternos.length > 0 ||
      destino.referencias.some(
        (par) => par.idDocumento !== '' && par.idMetadato !== '',
      )
    );
  }

  private buildMensajeConfigDesdeForm(): MensajeConfig {
    const valores = this.mensajeElementoForm.getRawValue();

    return {
      destinatarios: this.buildMensajeDestinatarios(valores.destinatarios),
      destinatariosCc: this.buildMensajeDestinatarios(valores.destinatariosCc),
      enviarACargo: valores.enviarACargo,
      encabezadoInfoProceso: valores.encabezadoInfoProceso,
      asunto: valores.asunto,
      contenido: valores.contenido,
      adjuntarPdfIds: valores.adjuntarPdfIds.map(Number).filter(Number.isFinite),
      completarFormulario: valores.completarFormulario,
      formularioItems: this.mensajeFormularioRows().map((fila) => ({
        idDocumento:
          fila.group.controls.idDocumento.value === ''
            ? null
            : Number(fila.group.controls.idDocumento.value),
        idsMetadatos: [...fila.group.controls.idsMetadatos.value],
      })),
    };
  }

  private buildMensajeDestinatarios(grupo: {
    usuariosSistema: string[];
    usuariosExternos: string[];
    referencias: { idDocumento: string; idMetadato: string }[];
  }): MensajeDestinatarios {
    return {
      usuariosSistema: [...grupo.usuariosSistema],
      usuariosExternos: [...grupo.usuariosExternos],
      referencias: grupo.referencias
        .filter((par) => par.idDocumento !== '' && par.idMetadato !== '')
        .map((par) => ({
          idDocumento: Number(par.idDocumento),
          idMetadato: par.idMetadato,
        })),
    };
  }

  private resetMensajeForm(config?: MensajeConfig): void {
    const base = config ?? buildDefaultMensajeConfig();

    this.limpiarMensajeFormularioRows();
    for (const item of base.formularioItems) {
      this.agregarMensajeFormularioRow(item);
    }

    this.resetMensajeDestinatariosGrupo(
      this.mensajeElementoForm.controls.destinatarios,
      base.destinatarios,
    );
    this.resetMensajeDestinatariosGrupo(
      this.mensajeElementoForm.controls.destinatariosCc,
      base.destinatariosCc,
    );

    this.mensajeElementoForm.patchValue(
      {
        enviarACargo: base.enviarACargo,
        encabezadoInfoProceso: base.encabezadoInfoProceso,
        asunto: base.asunto,
        contenido: base.contenido,
        adjuntarPdfIds: base.adjuntarPdfIds.map(String),
        completarFormulario: base.completarFormulario,
      },
      { emitEvent: false },
    );

    this.mensajeValidacionError.set('');
    this.mensajeSubModal.set(null);
    this.mensajeTokenDocumentoSeleccionado.set('');
    this.mensajeTokenMetadatoSeleccionado.set('');
    this.mensajeTokenLinkDocumentoSeleccionado.set('');
    this.mensajeElementoForm.markAsPristine();
    this.mensajeElementoForm.markAsUntouched();
  }

  private resetMensajeDestinatariosGrupo(
    grupo: MensajeDestinatariosGroup,
    data: MensajeDestinatarios,
  ): void {
    grupo.patchValue(
      {
        usuariosSistema: [...data.usuariosSistema],
        usuariosExternos: [...data.usuariosExternos],
      },
      { emitEvent: false },
    );

    this.limpiarMensajeReferencias(grupo);
    for (const par of data.referencias) {
      this.agregarMensajeParAGrupo(grupo, par);
    }
  }

  protected readonly procesoMecanismoError = signal('');
  protected readonly procesoAdvertenciaEjecucion = signal('');
  protected readonly procesoValidacionError = signal<readonly string[]>([]);

  protected readonly jornadaOptions = signal<readonly SelectOption[]>([]);
  protected readonly calendarioOptions = signal<readonly SelectOption[]>([]);

  protected readonly responsablesOptions = signal<readonly SelectOption[]>([]);
  protected readonly familiasProcesoOptions = signal<readonly SelectOption[]>([]);
  protected readonly mecanismosDenominacionOptions = signal<readonly SelectOption[]>([]);
  protected readonly mecanismosMap = signal<Record<string, MecanismoProceso>>({});
  protected readonly mecanismoConfigModalVisible = signal(false);
  protected readonly selectedMecanismoForConfig = signal<MecanismoProceso | null>(null);
  protected readonly configDatoSelections = signal<Record<number, ConfigDatoSelection>>({});
  protected readonly mecanismoSeleccionadoId = signal<string | null>(null);

  protected readonly documentosOptions = signal<readonly SelectOption[]>([]);
  protected readonly metadatosOptions = signal<readonly MetadatoOpcion[]>([]);

  protected readonly areasOptions = signal<readonly SelectOption[]>([
    { label: 'Administración y Finanzas', value: '1' },
    { label: 'Tecnologías de la Información', value: '2' },
    { label: 'Recursos Humanos', value: '3' },
  ]);
  protected readonly cargosOptions = signal<readonly SelectOption[]>([
    { label: 'Investigador', value: '4' },
    { label: 'Analista', value: '5' },
    { label: 'Jefe de Proyecto', value: '6' },
  ]);
  protected readonly usuariosOptions = signal<readonly SelectOption[]>([
    { label: 'soporte', value: 'soporte' },
    { label: 'admin', value: 'admin' },
    { label: 'lmarillanca', value: 'lmarillanca' },
  ]);

  protected readonly compartirModalVisible = signal(false);
  protected readonly compartirGrupo = signal<readonly string[]>([]);
  protected readonly compartirCargo = signal<readonly string[]>([]);
  protected readonly compartirUsuario = signal<readonly string[]>([]);
  protected readonly visibilidadActual = signal<ProcesoVisibilidad>('privado');

  protected readonly mostrarCompartirIcono = computed<boolean>(
    () => this.visibilidadActual() === 'privado',
  );

  protected readonly selectedMecanismo = computed<MecanismoProceso | null>(() => {
    const value = this.mecanismoSeleccionadoId();
    if (!value) return null;
    return this.mecanismosMap()[value] ?? null;
  });

  protected readonly showMecanismoConfigIcon = computed<boolean>(() => {
    return this.selectedMecanismo() !== null;
  });

  protected readonly isMecanismoConfigDisabled = computed<boolean>(() => {
    const m = this.selectedMecanismo();
    return m === null || m.por_defecto !== false;
  });

  protected readonly catalogosPublicacionOptions = signal<readonly SelectOption[]>([]);
  protected readonly duracionUnidadOptions: readonly ProcesoDuracionUnidad[] = [
    'minutos',
    'horas',
    'dias',
  ];

  protected readonly procesoForm = this.formBuilder.group({
    nombre: this.formBuilder.nonNullable.control(MODAL_FORM_DEFAULTS.nombre, [
      Validators.required,
      Validators.maxLength(180),
    ]),
    responsables: this.formBuilder.nonNullable.control<string[]>(MODAL_FORM_DEFAULTS.responsables, [
      Validators.required,
    ]),
    duracionValor: this.formBuilder.control<number | null>(MODAL_FORM_DEFAULTS.duracionValor, [
      Validators.required,
      Validators.min(1),
    ]),
    duracionUnidad: this.formBuilder.control<ProcesoDuracionUnidad | null>(
      MODAL_FORM_DEFAULTS.duracionUnidad,
      [Validators.required],
    ),
    familiaProceso: this.formBuilder.control<string | null>(MODAL_FORM_DEFAULTS.familiaProceso, [
      Validators.required,
    ]),
    visibilidad: this.formBuilder.nonNullable.control<ProcesoVisibilidad>(
      MODAL_FORM_DEFAULTS.visibilidad,
      [Validators.required],
    ),
    mecanismoDenominacion: this.formBuilder.control<string | null>(
      MODAL_FORM_DEFAULTS.mecanismoDenominacion,
      [Validators.required],
    ),
    observaciones: this.formBuilder.nonNullable.control(MODAL_FORM_DEFAULTS.observaciones),
    creaExpedienteElectronico: this.formBuilder.nonNullable.control(
      MODAL_FORM_DEFAULTS.creaExpedienteElectronico,
    ),
    publicaEnCatalogo: this.formBuilder.nonNullable.control(MODAL_FORM_DEFAULTS.publicaEnCatalogo),
    catalogosPublicacion: this.formBuilder.nonNullable.control<string[]>(
      MODAL_FORM_DEFAULTS.catalogosPublicacion,
    ),
    aplicaJornadaLaboral: this.formBuilder.nonNullable.control(
      MODAL_FORM_DEFAULTS.aplicaJornadaLaboral,
    ),
    jornada: this.formBuilder.control<string | null>(MODAL_FORM_DEFAULTS.jornada),
    calendario: this.formBuilder.control<string | null>(MODAL_FORM_DEFAULTS.calendario),
  });

  protected readonly procesosTotalCliente = computed(() => this.procesos().length);
  protected readonly procesosEjecucionFiltrados = computed(() => this.procesosEjecucion());
  protected readonly procesosFiltrados = computed(() => {
    const term = this.procesosSearchText().toLowerCase().trim();
    const data = this.procesos();

    if (term === '') {
      return data;
    }

    return data.filter((row) =>
      [
        String(row.id_proceso),
        row.nombre_proceso,
        row.modificado_por,
        String(row.version),
      ]
        .join(' ')
        .toLowerCase()
        .includes(term),
    );
  });

  constructor() {
    void this.bpmnAdapter.preloadLibrary();
    this.procesoForm.controls.publicaEnCatalogo.valueChanges.subscribe((enabled) => {
      this.updateCatalogosValidators(enabled);
    });
    this.procesoForm.controls.mecanismoDenominacion.valueChanges.subscribe((value) => {
      this.mecanismoSeleccionadoId.set(value);
      this.configDatoSelections.set({});
    });
    this.updateCatalogosValidators(this.procesoForm.controls.publicaEnCatalogo.value);
    this.procesoForm.controls.aplicaJornadaLaboral.valueChanges.subscribe((enabled) => {
      this.updateJornadaCalendarioValidators(enabled);
    });
    this.updateJornadaCalendarioValidators(this.procesoForm.controls.aplicaJornadaLaboral.value);
    this.procesoForm.controls.visibilidad.valueChanges.subscribe((value) => {
      this.visibilidadActual.set(value);
    });
    this.visibilidadActual.set(this.procesoForm.controls.visibilidad.value);
    this.diagramaElementoForm.controls.cargo.valueChanges.subscribe((cargo) => {
      if (this.usuariosLiviano().length === 0) {
        return;
      }

      const disponibles = new Set(
        this.usuariosPorRol(cargo ?? null).map((opcion) => opcion.value),
      );
      const usuariosFiltrados = this.diagramaElementoForm.controls.usuarios.value.filter(
        (usuario) => disponibles.has(usuario),
      );
      this.diagramaElementoForm.controls.usuarios.setValue(usuariosFiltrados);
    });
    this.diagramaElementoForm.controls.ejecutaFuncionalidad.valueChanges.subscribe((enabled) => {
      this.updateFuncionalidadTareaValidator(enabled);
    });
    this.updateFuncionalidadTareaValidator(
      this.diagramaElementoForm.controls.ejecutaFuncionalidad.value,
    );
    this.diagramaElementoForm.controls.aplicarJornadaLaboral.valueChanges.subscribe((enabled) => {
      this.updateJornadaCalendarioTareaValidators(enabled);
    });
    this.updateJornadaCalendarioTareaValidators(
      this.diagramaElementoForm.controls.aplicarJornadaLaboral.value,
    );
    this.timerElementoForm.controls.modo.valueChanges.subscribe(() => {
      this.updateTimerValidators();
    });
    this.timerElementoForm.controls.datoFijoTipo.valueChanges.subscribe(() => {
      this.updateTimerValidators();
    });
    this.timerElementoForm.controls.idDocumento.valueChanges.subscribe((idDocumento) => {
      this.timerElementoForm.controls.idMetadato.setValue(null, { emitEvent: false });
      if (idDocumento !== null && idDocumento !== '') {
        this.asegurarMetadatosDocumento(idDocumento);
      }
    });
    this.updateTimerValidators();
    this.transicionElementoForm.controls.timer.controls.idDocumento.valueChanges.subscribe(
      (idDocumento) => {
        this.transicionElementoForm.controls.timer.controls.idMetadato.setValue(null, {
          emitEvent: false,
        });
        if (idDocumento !== null && idDocumento !== '') {
          this.asegurarMetadatosDocumento(idDocumento);
        }
      },
    );
    this.transicionElementoForm.controls.accionRequerida.valueChanges.subscribe((requerida) => {
      if (!requerida) {
        this.transicionElementoForm.controls.accion.setValue(null, { emitEvent: false });
      }
    });
    this.decisionElementoForm.controls.ejecutaFuncionalidad.valueChanges.subscribe((activado) => {
      this.updateDecisionValidators();

      if (!activado) {
        this.decisionElementoForm.controls.funcionalidad.setValue(null, { emitEvent: false });
        this.decisionElementoForm.controls.documento.setValue(null, { emitEvent: false });
        this.decisionElementoForm.controls.activarMetadatosSistema.setValue(false, {
          emitEvent: false,
        });
      }
    });
    this.decisionElementoForm.controls.aplicarJornadaLaboral.valueChanges.subscribe(() => {
      this.updateDecisionValidators();
    });
    this.decisionElementoForm.controls.alertas.valueChanges.subscribe(() => {
      this.updateDecisionValidators();
    });
    this.decisionElementoForm.controls.cargo.valueChanges.subscribe((cargo) => {
      if (this.usuariosLiviano().length === 0) {
        return;
      }

      const disponibles = new Set(
        this.usuariosPorRol(cargo ?? null).map((opcion) => opcion.value),
      );
      const usuariosFiltrados = this.decisionElementoForm.controls.usuarios.value.filter(
        (usuario) => disponibles.has(usuario),
      );
      this.decisionElementoForm.controls.usuarios.setValue(usuariosFiltrados);
    });
    this.updateDecisionValidators();
    this.searchProcesosEjecucionSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((term) => {
        this.procesosEjecucionSearchText.set(term);
        this.procesosEjecucionExpanded.set(new Set<number>());
        this.procesosEjecucionDiagramas.set({});
        this.procesosEjecucionPageIndex.set(DEFAULT_PAGE_INDEX);
        this.cargarProcesosEjecucion();
      });
    this.cargarProcesosEjecucion();
    this.cargarProcesos();
    this.cargarRoles();
    this.cargarFamilias();
    this.cargarMecanismos();
    this.cargarJornadaCalendario();
    this.cargarCatalogosSegunUsuario();
    this.cargarMetadatosReqRol();
    this.cargarUsuariosLiviano();
  }

  protected onTabChange(index: number): void {
    this.activeTabIndex.set(index);
  }

  protected onRecargarProcesosEjecucion(): void {
    this.procesosEjecucionExpanded.set(new Set<number>());
    this.procesosEjecucionDiagramas.set({});
    this.cargarProcesosEjecucion();
  }

  protected onRecargarProcesos(): void {
    this.cargarProcesos();
  }

  protected onSearchProcesosEjecucion(event: Event): void {
    const term = (event.target as HTMLInputElement).value;
    this.procesosEjecucionSearchText.set(term);
    this.searchProcesosEjecucionSubject.next(term);
  }

  protected onSearchProcesos(event: Event): void {
    this.procesosSearchText.set((event.target as HTMLInputElement).value);
  }

  protected onAbrirCrearProcesoModal(): void {
    this.procesoModalMode.set('create');
    this.procesoEditId.set(null);
    this.procesoEditSourceXml.set('');
    this.procesoDiagramTouched.set(false);
    this.procesoMecanismoError.set('');
    this.procesoAdvertenciaEjecucion.set('');
    this.procesoValidacionError.set([]);
    this.documentosOptions.set([]);
    this.metadatosOptions.set([]);
    this.formulariosProceso.set([]);
    this.actividadesProceso.set([]);
    this.transicionesProceso.set([]);
    this.tareaConfigs.set({});
    this.timerConfigs.set({});
    this.mensajeConfigs.set({});
    this.decisionConfigs.set({});
    this.configDatoSelections.set({});
    this.resetearCompartir();
    this.procesoForm.reset(MODAL_FORM_DEFAULTS);
    this.procesoForm.controls.nombre.enable();
    this.updateCatalogosValidators(false);
    this.updateJornadaCalendarioValidators(false);
    this.procesoModalVisible.set(true);
  }

  protected onAbrirEditarProcesoModal(row: ProcesoConfiguracion): void {
    const draft = this.buildDraftFromProceso(row);

    this.procesoModalMode.set('edit');
    this.procesoEditId.set(row.id_proceso);
    this.procesoEditSourceXml.set(row.xml ?? '');
    this.procesoDiagramTouched.set(false);
    this.procesoMecanismoError.set('');
    this.procesoValidacionError.set([]);

    const procesosEE = row.procesosEE ?? 0;
    this.procesoAdvertenciaEjecucion.set(
      procesosEE > 0
        ? `Actualmente este proceso tiene ${procesosEE} procesos en ejecución. Las modificaciones que se realicen no afectarán estos procesos en ejecución, y aplicarán para las próximas instancias.`
        : '',
    );

    this.procesoForm.reset({
      nombre: draft.nombre,
      responsables: draft.responsables,
      duracionValor: draft.duracionValor,
      duracionUnidad: draft.duracionUnidad,
      familiaProceso: draft.familiaProceso,
      visibilidad: draft.visibilidad,
      mecanismoDenominacion: draft.mecanismoDenominacion,
      observaciones: draft.observaciones,
      creaExpedienteElectronico: draft.creaExpedienteElectronico,
      publicaEnCatalogo: draft.publicaEnCatalogo,
      catalogosPublicacion: draft.catalogosPublicacion,
      aplicaJornadaLaboral: draft.aplicaJornadaLaboral,
      jornada: draft.jornada,
      calendario: draft.calendario,
    });
    this.procesoForm.controls.nombre.disable();
    this.updateCatalogosValidators(draft.publicaEnCatalogo);
    this.updateJornadaCalendarioValidators(draft.aplicaJornadaLaboral);
    this.formulariosProceso.set([]);
    this.actividadesProceso.set([]);
    this.transicionesProceso.set([]);
    this.tareaConfigs.set({});
    this.timerConfigs.set({});
    this.mensajeConfigs.set({});
    this.decisionConfigs.set({});
    this.configDatoSelections.set({});
    this.cargarConfiguracionMecanismo(row);
    this.cargarCompartirDesdeProceso(row);
    this.procesoModalVisible.set(true);
  }

  protected onCerrarProcesoModal(): void {
    this.procesoModalVisible.set(false);
    this.procesoDiagramModalVisible.set(false);
    this.procesoValidacionError.set([]);
  }

  protected onAbrirDiagramaAsociadoModal(): void {
    this.procesoDiagramModalVisible.set(true);
  }

  protected validarDiagramaAsociado(): readonly ResultadoValidacionDiagrama[] {
    if (this.procesoDiagramaPreview === undefined) {
      // El visor no está montado (modal de diagrama nunca abierto en esta sesión):
      // no hay snapshot que validar; se evitan falsos "sin evento de inicio/fin".
      return [];
    }

    const snapshot = this.procesoDiagramaPreview.obtenerSnapshot();
    console.debug(
      '[validación] nodos en snapshot:',
      snapshot.nodes.length,
      'flujos:',
      snapshot.transitions.length,
    );

    // Transiciones sin config de usuario usan la precarga del REST (usuario gana).
    const transicionConfigsEfectivos: Record<string, TransicionConfig> = {
      ...this.transicionConfigs(),
    };

    for (const flujo of snapshot.transitions) {
      if (transicionConfigsEfectivos[flujo.id] !== undefined) {
        continue;
      }

      const precargada = this.construirTransicionPrecargada(
        flujo.sourceId,
        flujo.targetId,
      );

      if (precargada !== null) {
        transicionConfigsEfectivos[flujo.id] = precargada;
      }
    }

    const resultados = validarDiagrama(snapshot, {
      tareaConfigs: this.tareaConfigs(),
      timerConfigs: this.timerConfigs(),
      mensajeConfigs: this.mensajeConfigs(),
      decisionConfigs: this.decisionConfigs(),
      transicionConfigs: transicionConfigsEfectivos,
      omitirValidacionMensaje: BYPASS_VALIDACION_MENSAJE,
    });

    this.validacionDiagrama.set(resultados);
    this.procesoDiagramaPreview?.marcarErroresValidacion(
      resultados
        .filter((resultado) => resultado.nivel === 'error' && resultado.elementoId !== undefined)
        .map((resultado) => resultado.elementoId as string),
    );

    return resultados;
  }

  protected onCerrarDiagramaAsociadoModal(): void {
    this.procesoDiagramaPreview?.limpiarMarcadoresValidacion();
    this.procesoDiagramModalVisible.set(false);
  }

  protected onAbrirMecanismoConfigModal(): void {
    const mecanismo = this.selectedMecanismo();
    if (!mecanismo || mecanismo.por_defecto !== false) {
      return;
    }
    this.selectedMecanismoForConfig.set(mecanismo);
    this.mecanismoConfigModalVisible.set(true);
  }

  protected onCerrarMecanismoConfigModal(): void {
    this.mecanismoConfigModalVisible.set(false);
  }

  protected onAbrirCompartirModal(): void {
    this.compartirModalVisible.set(true);
  }

  protected onCerrarCompartirModal(): void {
    this.compartirModalVisible.set(false);
  }

  private cargarCompartirDesdeProceso(row: ProcesoConfiguracion): void {
    const compartido = row.proceso_compartido;
    this.compartirGrupo.set((compartido?.grupo ?? []).map((g) => String(g.id_grupo)));
    this.compartirCargo.set((compartido?.cargo ?? []).map((c) => String(c.id_rol)));
    this.compartirUsuario.set((compartido?.usuario ?? []).map((u) => u.id_usuario));
  }

  private resetearCompartir(): void {
    this.compartirGrupo.set([]);
    this.compartirCargo.set([]);
    this.compartirUsuario.set([]);
  }

  private buildProcesoCompartidoPayload(): ProcesoCompartido {
    return {
      grupo: this.compartirGrupo().map((id) => ({
        id_grupo: Number(id),
        nombre_grupo: this.labelDeOpcion(this.areasOptions(), id),
      })),
      usuario: this.compartirUsuario().map((id) => ({ id_usuario: id })),
      cargo: this.compartirCargo().map((id) => ({
        id_rol: Number(id),
        nombre_rol: this.labelDeOpcion(this.cargosOptions(), id),
      })),
    };
  }

  private labelDeOpcion(options: readonly SelectOption[], value: string): string {
    return options.find((o) => o.value === value)?.label ?? value;
  }

  protected updateConfigDato(datoId: number, patch: Partial<ConfigDatoSelection>): void {
    this.configDatoSelections.update((current) => ({
      ...current,
      [datoId]: { ...(current[datoId] ?? { tipo: '' }), ...patch },
    }));
  }

  protected onConfigDatoDocumentoChange(datoId: number, documento: string | null): void {
    this.updateConfigDato(datoId, {
      documento: documento ?? undefined,
      metadato: undefined,
      codigoBloque: undefined,
    });
    this.metadatosOptions.set([]);
    if (documento) {
      const idDocumento = Number(documento);
      if (Number.isFinite(idDocumento)) {
        this.cargarMetadatosDocumento(idDocumento);
      }
    }
  }

  protected compuestoConfigDatoMetadato(datoId: number): string {
    const seleccion = this.configDatoSelections()[datoId];

    if (!seleccion?.metadato) {
      return '';
    }

    return claveCompuestaMetadato(seleccion.codigoBloque, Number(seleccion.metadato));
  }

  protected onConfigDatoMetadatoChange(datoId: number, compuesto: string): void {
    if (!compuesto) {
      this.updateConfigDato(datoId, { metadato: undefined, codigoBloque: undefined });
      return;
    }

    const opcion = this.metadatosOptions().find((o) => o.value === compuesto);

    if (!opcion) {
      return;
    }

    this.updateConfigDato(datoId, {
      metadato: String(opcion.idMetadato),
      codigoBloque: opcion.codigoBloque,
    });
  }

  private cargarConfiguracionMecanismo(row: ProcesoConfiguracion): void {
    this.documentosOptions.set([]);
    this.metadatosOptions.set([]);

    const mecanismo = this.selectedMecanismo();
    const entradas = (row.datoProcesoMecanismo ?? []).filter(
      (dato) => dato.process_id === row.id_proceso,
    );

    if (mecanismo !== null) {
      const selections: Record<number, ConfigDatoSelection> = {};
      for (const dato of mecanismo.datos_requeridos) {
        if (dato.id_dato_mecanismo !== 'var') {
          continue;
        }
        const entrada = entradas.find(
          (item) => item.id_dato_req_mecanismo === dato.id_dato_req_mecanismo,
        );
        if (entrada) {
          selections[dato.id_dato_req_mecanismo] = this.buildConfigDatoSelection(entrada);
        }
      }
      this.configDatoSelections.set(selections);
    }

    this.cargarDocumentosProceso(row.id_proceso);

    const documentoConfigurado = Object.values(this.configDatoSelections()).find(
      (sel) => sel.tipo === 'metadato_formulario' && sel.documento,
    )?.documento;
    if (documentoConfigurado) {
      const idDocumento = Number(documentoConfigurado);
      if (Number.isFinite(idDocumento)) {
        this.cargarMetadatosDocumento(idDocumento);
      }
    }
  }

  private buildConfigDatoSelection(entrada: DatoProcesoMecanismo): ConfigDatoSelection {
    const tipo = DATO_DISPONIBLE_PROCESO_TO_TIPO[entrada.id_dato_disponible_proceso] ?? '';

    if (tipo === 'texto_fijo') {
      return { tipo, valor: entrada.valor_texto_fijo ?? '' };
    }
    if (tipo === 'metadato_formulario') {
      return {
        tipo,
        documento: entrada.id_documento !== undefined ? String(entrada.id_documento) : undefined,
        metadato: entrada.id_metadato !== undefined ? String(entrada.id_metadato) : undefined,
        codigoBloque: entrada.codigo_bloque,
      };
    }
    if (tipo === 'correlativo') {
      return { tipo, secuencia: entrada.nombre_secuencia ?? '' };
    }
    return { tipo };
  }

  private cargarDocumentosProceso(processId: number): void {
    this.diagramaService.obtenerDocumentosComunProcesoSegunProcessId(processId).subscribe({
      next: (documentos) => {
        this.documentosOptions.set(
          documentos.map((doc) => ({
            label: doc.nombre_doc_comun,
            value: String(doc.id_documento),
          })),
        );
        this.cargarFormulariosProcesoDesdeBackend(documentos);
        this.cargarTareasProceso(processId);
      },
      error: () => this.documentosOptions.set([]),
    });
  }

  private cargarTareasProceso(processId: number): void {
    this.diagramaService.obtenerTareasProceso(processId).subscribe({
      next: (respuesta) => {
        this.actividadesProceso.set(respuesta.activities);
        this.transicionesProceso.set(respuesta.transitions);
        this.aplicarActividadesAlDiagrama(respuesta.activities);
      },
      error: () => undefined,
    });
  }

  private aplicarActividadesAlDiagrama(actividades: readonly ActividadTareaProceso[]): void {
    const formularios = this.formulariosProceso();

    let tareaConfigs = { ...this.tareaConfigs() };
    let timerConfigs = { ...this.timerConfigs() };
    let mensajeConfigs = { ...this.mensajeConfigs() };
    let decisionConfigs = { ...this.decisionConfigs() };
    const documentosReferenciados = new Set<string>();
    const timersPendientes: TimerMetadatoPendiente[] = [];

    for (const actividad of actividades) {
      const clave = claveDeActividad(actividad);

      if (clave === '') {
        continue;
      }

      if (actividad.activitytype_id === 'tarea') {
        tareaConfigs = {
          ...tareaConfigs,
          [clave]: construirTareaConfigDesdeActividad(actividad, formularios),
        };
        this.recolectarDocumentosDeActividad(actividad, documentosReferenciados);
      } else if (actividad.activitytype_id === 'timer') {
        timerConfigs = {
          ...timerConfigs,
          [clave]: construirTimerConfigDesdeActividad(actividad),
        };
        const pendiente = timerMetadatoPendiente(actividad, clave);

        if (pendiente !== null) {
          timersPendientes.push(pendiente);
        }
      } else if (actividad.activitytype_id === 'mensaje') {
        mensajeConfigs = {
          ...mensajeConfigs,
          [clave]: construirMensajeConfigDesdeActividad(actividad, formularios),
        };
        this.recolectarDocumentosDeMensaje(actividad, formularios, documentosReferenciados);
      } else if (actividad.activitytype_id === 'decision') {
        decisionConfigs = {
          ...decisionConfigs,
          [clave]: construirDecisionConfigDesdeActividad(actividad, formularios),
        };
      }
    }

    this.tareaConfigs.set(tareaConfigs);
    this.timerConfigs.set(timerConfigs);
    this.mensajeConfigs.set(mensajeConfigs);
    this.decisionConfigs.set(decisionConfigs);

    this.resolverMetadatosPendientes(actividades, timersPendientes, documentosReferenciados);
  }

  private recolectarDocumentosDeActividad(
    actividad: ActividadTareaProceso,
    documentos: Set<string>,
  ): void {
    for (const meta of actividad.metadatosDisponibles) {
      documentos.add(String(meta.id_documento));
    }
    for (const traspaso of actividad.metadatosTransferidos) {
      documentos.add(String(traspaso.id_documento_origen));
      documentos.add(String(traspaso.id_documento_destino));
    }
  }

  private recolectarDocumentosDeMensaje(
    actividad: ActividadTareaProceso,
    formularios: readonly FormularioProcesoConfig[],
    documentos: Set<string>,
  ): void {
    const mensaje = actividad.mensajes[0];

    if (mensaje === undefined) {
      return;
    }

    const docComunIds = [
      ...(mensaje.metadatosDestino ?? []),
      ...(mensaje.metadatosDestinoCC ?? []),
    ]
      .map((item) => item.doc_comun_id)
      .filter((id): id is number => id !== undefined && id !== null);

    for (const docComunId of docComunIds) {
      const fila = formularios.find((f) => f.docComunId === docComunId);

      if (fila !== undefined && fila.idFormulario !== 0) {
        documentos.add(String(fila.idFormulario));
      }
    }
  }

  private resolverMetadatosPendientes(
    actividades: readonly ActividadTareaProceso[],
    timersPendientes: readonly TimerMetadatoPendiente[],
    documentosReferenciados: Set<string>,
  ): void {
    for (const actividad of actividades) {
      const pendiente = timerMetadatoPendiente(actividad, claveDeActividad(actividad));

      if (pendiente !== null) {
        const fila = this.formulariosProceso().find(
          (f) => f.docComunId === pendiente.docComunId,
        );
        if (fila !== undefined) {
          documentosReferenciados.add(String(fila.idFormulario));
        }
      }
    }

    // Timers de transición (met_formulario): precargar el cache del documento
    // resuelto por doc_comun_id antes de cualquier clic.
    for (const transicion of this.transicionesProceso()) {
      const pendiente = timerTransicionMetadatoPendiente(transicion);

      if (pendiente === null) {
        continue;
      }

      const fila = this.formulariosProceso().find(
        (f) => f.docComunId === pendiente.docComunId,
      );

      if (fila !== undefined && fila.idFormulario !== 0) {
        documentosReferenciados.add(String(fila.idFormulario));
      }
    }

    if (documentosReferenciados.size === 0) {
      return;
    }

    forkJoin(
      Array.from(documentosReferenciados).map((id) => this.asegurarMetadatosDocumento$(id)),
    ).subscribe(() => {
      this.resolverTimerMetadato(timersPendientes);
      this.enriquecerTraspasosTarea();
      this.resolverReferenciasMensaje();
    });
  }

  private resolverTimerMetadato(timersPendientes: readonly TimerMetadatoPendiente[]): void {
    if (timersPendientes.length === 0) {
      return;
    }

    let timerConfigs = { ...this.timerConfigs() };

    for (const pendiente of timersPendientes) {
      const config = timerConfigs[pendiente.claveElemento];

      if (config === undefined || config.idDocumento === null) {
        continue;
      }

      const opciones = this.mensajeMetadatosCache.get(config.idDocumento) ?? [];
      const opcion = opciones.find((o) => o.idMetadato === pendiente.idMetadato);

      if (opcion !== undefined) {
        timerConfigs = {
          ...timerConfigs,
          [pendiente.claveElemento]: { ...config, idMetadato: opcion.value },
        };
      }
    }

    this.timerConfigs.set(timerConfigs);
  }

  private enriquecerTraspasosTarea(): void {
    let tareaConfigs = { ...this.tareaConfigs() };
    let cambiado = false;

    for (const [clave, config] of Object.entries(tareaConfigs)) {
      const seleccion = config.formularioRequeridoSeleccionado;
      const traspasos = seleccion?.metadatosTransferidos;

      if (!traspasos || traspasos.length === 0) {
        continue;
      }

      const enriquecidos = traspasos.map((traspaso) => ({
        origen: this.enriquecerDetalleTransferido(traspaso.origen),
        destino: this.enriquecerDetalleTransferido(traspaso.destino),
      }));

      tareaConfigs = {
        ...tareaConfigs,
        [clave]: {
          ...config,
          formularioRequeridoSeleccionado: { ...seleccion, metadatosTransferidos: enriquecidos },
        },
      };
      cambiado = true;
    }

    if (cambiado) {
      this.tareaConfigs.set(tareaConfigs);
    }
  }

  private enriquecerDetalleTransferido(
    detalle: MetadatoTransferidoDetalle,
  ): MetadatoTransferidoDetalle {
    const opciones = this.mensajeMetadatosCache.get(detalle.idFormulario) ?? [];
    const opcion = opciones.find((o) => o.value === detalle.clave);

    if (opcion === undefined) {
      return detalle;
    }

    return {
      ...detalle,
      nombreMetadato: this.nombreMetadato(opcion),
      tipoMetadato: opcion.tipo ?? null,
      esGrilla: (opcion.grilla?.columnas?.length ?? 0) > 0,
      nombreBloque: opcion.nombreBloque ?? null,
    };
  }

  private construirTransicionPrecargada(
    origenId: string | null,
    destinoId: string | null,
  ): TransicionConfig | null {
    if (origenId === null || destinoId === null) {
      return null;
    }

    const mapa = new Map<number, string>();

    for (const actividad of this.actividadesProceso()) {
      mapa.set(actividad.activity_id, claveDeActividad(actividad));
    }

    const transicion = this.transicionesProceso().find(
      (t) =>
        mapa.get(t.activity_id_source) === origenId &&
        mapa.get(t.activity_id_destination) === destinoId,
    );

    if (transicion === undefined) {
      return null;
    }

    const config = construirTransicionConfigDesdeActividad(
      transicion,
      this.formulariosProceso(),
    );
    const pendiente = timerTransicionMetadatoPendiente(transicion);

    if (
      pendiente !== null &&
      config.timer.modo === 'metadatoFormulario' &&
      config.timer.idDocumento !== null
    ) {
      const opciones = this.mensajeMetadatosCache.get(config.timer.idDocumento) ?? [];
      const opcion = opciones.find((o) => o.idMetadato === pendiente.idMetadato);

      if (opcion !== undefined) {
        return { ...config, timer: { ...config.timer, idMetadato: opcion.value } };
      }
    }

    return config;
  }

  protected transicionCargosReqRolOptions(): readonly SelectOption[] {
    return this.metadatosRequeridosRol().map((rol) => ({
      label: rol.nombre_rol,
      value: String(rol.id_rol),
    }));
  }

  protected transicionMetadatosReqRolDeFila(
    regla: TransicionReglaUsuarioGroup,
  ): readonly MetadatoOpcion[] {
    const idCargo = regla.controls.idCargo.value;

    if (idCargo === '') {
      return [];
    }

    const requisito = this.metadatosRequeridosRol().find(
      (rol) => String(rol.id_rol) === idCargo,
    );

    return (requisito?.metadatosRequeridos ?? []).map((metadato) => ({
      label: labelMetadatoConBloque(metadato.nombre_metadato, metadato.nombre_bloque, undefined),
      value: String(metadato.id_metadato),
      idMetadato: metadato.id_metadato,
    }));
  }

  protected transicionInterpretacionHabilitada(regla: TransicionReglaUsuarioGroup): boolean {
    this.mensajeMetadatosVersion();

    const idDoc = regla.controls.idDocumento.value;
    const clave = regla.controls.idMetadato.value;

    if (idDoc === '' || clave === '') {
      return false;
    }

    const opcion = this.mensajeMetadatosCache.get(Number(idDoc))?.find((o) => o.value === clave);

    return opcion?.tipo === 'CBX';
  }

  protected transicionOperadoresDeFila(
    regla: TransicionReglaNegocioGroup,
  ): readonly LabelValueOption<TransicionOperador>[] {
    this.mensajeMetadatosVersion();

    const idDoc = regla.controls.idDocumento.value;
    const clave = regla.controls.idMetadato.value;

    if (idDoc === '' || clave === '') {
      return this.transicionOperadorOptions;
    }

    const opcion = this.mensajeMetadatosCache.get(Number(idDoc))?.find((o) => o.value === clave);

    return operadoresPorTipoDato(opcion?.tipo ?? null);
  }

  private resolverReferenciasMensaje(): void {
    let mensajeConfigs = { ...this.mensajeConfigs() };
    let cambiado = false;

    for (const [clave, config] of Object.entries(mensajeConfigs)) {
      const referencias = this.resolverReferenciasGrupo(config.destinatarios.referencias);
      const referenciasCc = this.resolverReferenciasGrupo(config.destinatariosCc.referencias);

      if (referencias === null && referenciasCc === null) {
        continue;
      }

      mensajeConfigs = {
        ...mensajeConfigs,
        [clave]: {
          ...config,
          destinatarios: {
            ...config.destinatarios,
            referencias: referencias ?? config.destinatarios.referencias,
          },
          destinatariosCc: {
            ...config.destinatariosCc,
            referencias: referenciasCc ?? config.destinatariosCc.referencias,
          },
        },
      };
      cambiado = true;
    }

    if (cambiado) {
      this.mensajeConfigs.set(mensajeConfigs);
    }
  }

  private resolverReferenciasGrupo(
    referencias: readonly MensajeReferenciaPar[],
  ): readonly MensajeReferenciaPar[] | null {
    let cambiado = false;
    const resueltas = referencias.map((ref) => {
      if (ref.idDocumento === null || ref.idMetadato === null) {
        return ref;
      }

      const opciones = this.mensajeMetadatosCache.get(Number(ref.idDocumento)) ?? [];

      if (opciones.length === 0 || opciones.some((o) => o.value === ref.idMetadato)) {
        return ref;
      }

      const idMetadato = Number(ref.idMetadato);
      const opcion = opciones.find((o) => o.idMetadato === idMetadato) ?? null;

      if (opcion === null) {
        return ref;
      }

      cambiado = true;

      return { ...ref, idMetadato: opcion.value };
    });

    return cambiado ? resueltas : null;
  }

  private cargarMetadatosDocumento(idDocumento: number): void {
    this.diagramaService.obtenerMetadatosRequeridosDocumento(idDocumento).subscribe({
      next: (metadatos) =>
        this.metadatosOptions.set(
          metadatos.map((meta) => ({
            label: labelMetadatoConBloque(
              meta.nombre_metadato,
              meta.nombre_bloque,
              meta.codigo_bloque,
            ),
            value: claveCompuestaMetadato(meta.codigo_bloque, meta.id_metadato),
            idMetadato: meta.id_metadato,
            tipo: meta.tipo_metadato,
            codigoBloque: meta.codigo_bloque,
          })),
        ),
      error: () => this.metadatosOptions.set([]),
    });
  }

  protected onProcesoModalDiagramEdited(): void {
    this.procesoDiagramTouched.set(true);
  }

  protected onDiagramaElementoActivado(info: BpmnElementoInfo): void {
    this.diagramaElementoSeleccionado.set(info);
    this.tareaValidacionError.set('');
    this.timerValidacionError.set('');
    this.decisionValidacionError.set('');

    if (info.kind === 'tarea') {
      this.resetDiagramaElementoForm(info, this.tareaConfigs()[info.id]);
    } else if (info.kind === 'mensaje') {
      this.diagramaElementoNombreInput.set(info.nombre);
      this.resetMensajeForm(this.mensajeConfigs()[info.id]);
    } else if (info.kind === 'timer') {
      this.diagramaElementoNombreInput.set(info.nombre);
      this.resetTimerForm(this.timerConfigs()[info.id]);
    } else if (info.kind === 'decision') {
      this.resetDecisionForm(this.decisionConfigs()[info.id]);
    } else if (info.kind === 'transicion') {
      const transaccion = info as BpmnTransicionInfo;
      this.transicionCombo.set({ origen: transaccion.origen, destino: transaccion.destino });
      this.transicionOrigenId.set(transaccion.origenId ?? null);
      this.diagramaElementoNombreInput.set(info.nombre);
      const precargada = this.construirTransicionPrecargada(
        transaccion.origenId ?? null,
        transaccion.destinoId ?? null,
      );
      this.resetTransicionForm(this.transicionConfigs()[info.id] ?? precargada ?? undefined);
    } else {
      this.diagramaElementoNombreInput.set(info.nombre);
    }

    this.diagramaElementoModalVisible.set(true);
  }

  protected onCerrarDiagramaElementoModal(): void {
    this.diagramaElementoModalVisible.set(false);
    this.diagramaElementoSeleccionado.set(null);
    this.diagramaElementoNombreInput.set('');
    this.mensajeSubModal.set(null);
    this.mensajeValidacionError.set('');
    this.transicionCombo.set(null);
    this.transicionValidacionError.set('');
    this.tareaValidacionError.set('');
    this.timerValidacionError.set('');
    this.decisionValidacionError.set('');
  }

  protected onConfirmarDiagramaElementoModal(): void {
    const elemento = this.diagramaElementoSeleccionado();

    if (!elemento) {
      this.onCerrarDiagramaElementoModal();
      return;
    }

    if (elemento.kind === 'tarea') {
      if (this.diagramaElementoForm.invalid) {
        this.diagramaElementoForm.markAllAsTouched();
        this.tareaValidacionError.set(
          'Faltan campos obligatorios. Completa los marcados con *.',
        );
        return;
      }

      const formValue = this.diagramaElementoForm.getRawValue();
      const nombre = formValue.nombre.trim();

      this.procesoDiagramaPreview?.renameElement(elemento.id, nombre);
      this.tareaConfigs.update((configs) => ({
        ...configs,
        [elemento.id]: {
          ...formValue,
          nombre,
          formularioRequeridoSeleccionado:
            this.tareaConfigs()[elemento.id]?.formularioRequeridoSeleccionado ?? null,
          activityId: this.tareaConfigs()[elemento.id]?.activityId,
        },
      }));
    } else if (elemento.kind === 'mensaje') {
      const error = this.validarMensaje();

      if (error) {
        this.mensajeValidacionError.set(error);
        return;
      }

      const nombre = this.diagramaElementoNombreInput().trim();

      this.procesoDiagramaPreview?.renameElement(elemento.id, nombre);
      this.mensajeConfigs.update((configs) => ({
        ...configs,
        [elemento.id]: {
          ...this.buildMensajeConfigDesdeForm(),
          activityId: this.mensajeConfigs()[elemento.id]?.activityId,
        },
      }));
    } else if (elemento.kind === 'timer') {
      if (this.timerElementoForm.invalid) {
        this.timerElementoForm.markAllAsTouched();
        this.timerValidacionError.set(
          'Faltan campos obligatorios. Completa los marcados con *.',
        );
        return;
      }

      const nombre = this.diagramaElementoNombreInput().trim();
      const formValue = this.timerElementoForm.getRawValue();
      const esTiempo = formValue.modo === 'datoFijo' && formValue.datoFijoTipo === 'tiempo';
      const esFecha = formValue.modo === 'datoFijo' && formValue.datoFijoTipo === 'fecha';

      this.procesoDiagramaPreview?.renameElement(elemento.id, nombre);
      this.timerConfigs.update((configs) => ({
        ...configs,
        [elemento.id]: {
          modo: formValue.modo,
          datoFijoTipo: formValue.datoFijoTipo,
          duracionValor: esTiempo ? formValue.duracionValor : null,
          duracionUnidad: esTiempo ? formValue.duracionUnidad : null,
          fecha: esFecha ? formatearFechaTimer(formValue.fecha) : null,
          hora: esFecha ? formatearHoraTimer(formValue.hora) : null,
          idDocumento:
            formValue.modo === 'metadatoFormulario' && formValue.idDocumento !== null
              ? Number(formValue.idDocumento)
              : null,
          idMetadato: formValue.modo === 'metadatoFormulario' ? formValue.idMetadato : null,
          activityId: this.timerConfigs()[elemento.id]?.activityId,
        },
      }));
    } else if (elemento.kind === 'decision') {
      if (this.decisionElementoForm.invalid) {
        this.decisionElementoForm.markAllAsTouched();
        this.decisionValidacionError.set(
          'Faltan campos obligatorios. Completa los marcados con *.',
        );
        return;
      }

      const formValue = this.decisionElementoForm.getRawValue();
      const nombre = formValue.nombre.trim();

      this.procesoDiagramaPreview?.renameElement(elemento.id, nombre);
      this.decisionConfigs.update((configs) => ({
        ...configs,
        [elemento.id]: this.buildDecisionConfigDesdeForm(),
      }));
    } else if (elemento.kind === 'transicion') {
      const error = this.validarTransicion();

      if (error) {
        this.transicionValidacionError.set(error);
        return;
      }

      const nombre = this.diagramaElementoNombreInput().trim();

      this.procesoDiagramaPreview?.renameElement(elemento.id, nombre);
      this.transicionConfigs.update((configs) => ({
        ...configs,
        [elemento.id]: {
          ...this.buildTransicionConfigDesdeForm(),
          transitionId: this.transicionConfigs()[elemento.id]?.transitionId,
        },
      }));
    } else {
      this.procesoDiagramaPreview?.renameElement(
        elemento.id,
        this.diagramaElementoNombreInput().trim(),
      );
    }

    this.onCerrarDiagramaElementoModal();
  }

  protected mostrarFuncionalidadTarea(): boolean {
    return this.diagramaElementoForm.controls.ejecutaFuncionalidad.value;
  }

  protected mostrarJornadaCalendarioTarea(): boolean {
    return this.diagramaElementoForm.controls.aplicarJornadaLaboral.value;
  }

  private resetDiagramaElementoForm(elemento: BpmnElementoInfo, config?: TareaConfig): void {
    const base = config ?? buildDefaultTareaConfig(elemento.nombre);

    this.diagramaElementoForm.patchValue(
      { ...base, usuarios: [...base.usuarios] },
      { emitEvent: false },
    );
    this.updateFuncionalidadTareaValidator(base.ejecutaFuncionalidad);
    this.updateJornadaCalendarioTareaValidators(base.aplicarJornadaLaboral);
    this.diagramaElementoForm.markAsPristine();
    this.diagramaElementoForm.markAsUntouched();
  }

  private updateFuncionalidadTareaValidator(ejecutaFuncionalidad: boolean): void {
    const control = this.diagramaElementoForm.controls.funcionalidad;

    control.setValidators(ejecutaFuncionalidad ? [Validators.required] : []);
    control.updateValueAndValidity({ emitEvent: false });
  }

  private updateJornadaCalendarioTareaValidators(aplicarJornadaLaboral: boolean): void {
    const jornadaControl = this.diagramaElementoForm.controls.jornada;
    const calendarioControl = this.diagramaElementoForm.controls.calendario;

    jornadaControl.setValidators(aplicarJornadaLaboral ? [Validators.required] : []);
    calendarioControl.setValidators(aplicarJornadaLaboral ? [Validators.required] : []);
    jornadaControl.updateValueAndValidity({ emitEvent: false });
    calendarioControl.updateValueAndValidity({ emitEvent: false });
  }

  protected async onGuardarProcesoModal(): Promise<void> {
    this.procesoMecanismoError.set('');
    this.procesoAdvertenciaEjecucion.set('');
    this.procesoValidacionError.set([]);

    this.validarCatalogosPublicacion();
    const camposFaltantes = this.camposObligatoriosFaltantes();

    if (camposFaltantes.length > 0 || this.procesoForm.invalid) {
      this.procesoForm.markAllAsTouched();
      if (camposFaltantes.length > 0) {
        this.procesoValidacionError.set(camposFaltantes);
      }
      return;
    }

    const mecanismoError = this.validarConfiguracionMecanismo();
    if (mecanismoError !== null) {
      this.procesoMecanismoError.set(mecanismoError);
      this.procesoForm.markAllAsTouched();
      return;
    }

    this.validarDiagramaAsociado();
    const erroresDiagrama = this.validacionDiagrama().filter(
      (resultado) => resultado.nivel === 'error',
    );

    if (erroresDiagrama.length > 0) {
      this.procesoValidacionError.set(erroresDiagrama.map((resultado) => resultado.mensaje));
      this.procesoForm.markAllAsTouched();
      return;
    }

    const formValue = this.procesoForm.getRawValue();
    const nowIso = new Date().toISOString();
    const payload = {
      mode: this.procesoModalMode(),
      id_proceso: this.procesoEditId(),
      nombre: formValue.nombre.trim(),
      responsables: formValue.responsables,
      duracion: {
        valor: formValue.duracionValor,
        unidad: formValue.duracionUnidad,
      },
      familiaProceso: formValue.familiaProceso,
      visibilidad: formValue.visibilidad,
      mecanismoDenominacion: formValue.mecanismoDenominacion,
      observaciones: formValue.observaciones?.trim() ?? '',
      creaExpedienteElectronico: formValue.creaExpedienteElectronico,
      publicaEnCatalogo: formValue.publicaEnCatalogo,
      catalogosPublicacion: formValue.catalogosPublicacion,
      aplicaJornadaLaboralEjecucion: formValue.aplicaJornadaLaboral,
      jornada: formValue.aplicaJornadaLaboral ? formValue.jornada : null,
      calendario: formValue.aplicaJornadaLaboral ? formValue.calendario : null,
      diagrama: {
        xmlBase: this.procesoEditSourceXml(),
        modificadoEnSesion: this.procesoDiagramTouched(),
      },
      configuracionMecanismo: this.buildMecanismoConfigPayload(),
      proceso_compartido:
        formValue.visibilidad === 'privado'
          ? this.buildProcesoCompartidoPayload()
          : { grupo: [], usuario: [], cargo: [] },
      submittedAt: nowIso,
    };

    if (this.procesoModalMode() === 'create') {
      const nextId =
        this.procesos().reduce((max, current) => Math.max(max, current.id_proceso), 0) + 1;
      const nuevoProceso: ProcesoConfiguracion = {
        id_proceso: nextId,
        modificado_por: 'usuario.local',
        distribucion_requerida: false,
        xml: this.procesoEditSourceXml(),
        nombre_proceso: formValue.nombre.trim(),
        id_organigrama: 0,
        ultima_modificacion: nowIso,
        id_padre: 0,
        privado: formValue.visibilidad === 'privado',
        version: 1,
        es_oficina_partes: false,
        compartido: formValue.visibilidad === 'publico',
        proceso_compartido: payload.proceso_compartido,
        id_catalogo: formValue.catalogosPublicacion.map((id) => Number(id)),
      };

      this.procesos.set([nuevoProceso, ...this.procesos()]);
    } else {
      const editId = this.procesoEditId();
      if (editId !== null) {
        this.procesos.set(
          this.procesos().map((item) => {
            if (item.id_proceso !== editId) {
              return item;
            }

            return {
              ...item,
              nombre_proceso: formValue.nombre.trim(),
              ultima_modificacion: nowIso,
              privado: formValue.visibilidad === 'privado',
              compartido: formValue.visibilidad === 'publico',
              modificado_por: 'usuario.local',
              proceso_compartido: payload.proceso_compartido,
              id_catalogo: formValue.catalogosPublicacion.map((id) => Number(id)),
            };
          }),
        );
      }
    }

    console.log('Submit simulado Crear/Editar proceso', payload);

    const usuarioCreador = 'soportemovilgo';
    const templateXml =
      this.procesoEditSourceXml() !== ''
        ? this.procesoEditSourceXml()
        : this.crearProcesoRequestBuilder.buildLegacyTemplateXml(formValue, usuarioCreador);

    try {
      const liveXml =
        (await this.procesoDiagramaPreview?.exportLegacyXml(templateXml)) ?? templateXml;
      const request = this.crearProcesoRequestBuilder.buildRequest(
        formValue,
        liveXml,
        usuarioCreador,
        this.tareaConfigs(),
        this.formulariosProceso(),
      );
      console.log('CrearProcesoRequest', request);
    } catch {
      // El visor BPMN no está inicializado; se omite la construcción del request.
    }

    this.procesoModalVisible.set(false);
    this.procesoDiagramModalVisible.set(false);
  }

  protected procesoModalTitulo(): string {
    return this.procesoModalMode() === 'create' ? 'Crear Proceso' : 'Editar Proceso';
  }

  protected procesoModalBotonGuardarLabel(): string {
    return this.procesoModalMode() === 'create' ? 'Crear' : 'Guardar';
  }

  // ====== Selección de metadatos / Formularios de proceso ======
  protected abrirSeleccionMetadatos(): void {
    const elemento = this.diagramaElementoSeleccionado();
    if (elemento === null) {
      return;
    }

    this.cargarOpcionesDocumentosLivianos();

    const seleccionActual =
      this.tareaConfigs()[elemento.id]?.formularioRequeridoSeleccionado ?? null;
    if (seleccionActual !== null) {
      const entrada = this.formulariosProceso().find(
        (f) => f.idFormulario === seleccionActual.idFormulario,
      );
      this.formularioSeleccionadoId.set(entrada?.id ?? null);
      this.metadatosTrabajo.set(seleccionActual.metadatosSeleccionados);
      this.traspasosTrabajo.set(seleccionActual.metadatosTransferidos ?? []);
      if (entrada !== undefined && entrada.idFormulario !== 0) {
        this.asegurarMetadatosDocumento(String(entrada.idFormulario));
      }
    } else {
      this.formularioSeleccionadoId.set(null);
      this.metadatosTrabajo.set([]);
      this.traspasosTrabajo.set([]);
    }
    this.seleccionMetadatosModalAbierto.set(true);
  }

  protected cerrarSeleccionMetadatos(): void {
    this.seleccionMetadatosModalAbierto.set(false);
  }

  protected guardarSeleccionMetadatos(): void {
    const elemento = this.diagramaElementoSeleccionado();
    if (elemento === null) {
      this.seleccionMetadatosModalAbierto.set(false);
      return;
    }

    const idSeleccionado = this.formularioSeleccionadoId();
    const entrada =
      idSeleccionado !== null
        ? this.formulariosProceso().find((f) => f.id === idSeleccionado)
        : undefined;

    const seleccion: FormularioRequeridoSeleccion | null =
      entrada !== undefined
        ? {
            idFormulario: entrada.idFormulario,
            nombre: entrada.nombre,
            nombreDocumento: entrada.nombreDocumento ?? '',
            visibilidad: entrada.visibilidad,
            metadatosSeleccionados: this.metadatosTrabajo(),
            metadatosTransferidos: this.traspasosTrabajo(),
          }
        : null;

    const idNodo = elemento.id;
    const base = this.tareaConfigs()[idNodo] ?? buildDefaultTareaConfig(elemento.nombre);
    this.tareaConfigs.update((configs) => ({
      ...configs,
      [idNodo]: { ...base, formularioRequeridoSeleccionado: seleccion },
    }));
    this.seleccionMetadatosModalAbierto.set(false);
  }

  protected abrirCrudFormularios(): void {
    this.cargarOpcionesDocumentosLivianos();
    this.crudFormulariosModalAbierto.set(true);
  }

  protected cerrarCrudFormularios(): void {
    this.crudFormulariosModalAbierto.set(false);
  }

  private cargarOpcionesDocumentosLivianos(): void {
    if (this.documentosLivianoOptions().length > 0) {
      return;
    }
    this.diagramaService.obtenerDocumentosLivianoConfiguracion().subscribe({
      next: (respuesta) =>
        this.documentosLivianoOptions.set(
          respuesta.documentos.map((doc) => ({
            label: doc.nombre_documento,
            value: String(doc.id),
          })),
        ),
      error: () => this.documentosLivianoOptions.set([]),
    });
  }

  protected crearFilaFormularioProceso(): void {
    const id = `fp-${++this.formularioProcesoUid.current}`;
    const nueva: FormularioProcesoConfig = {
      id,
      nombre: '',
      idFormulario: 0,
      visibilidad: 'privado',
    };
    this.formulariosProceso.update((lista) => [...lista, nueva]);
    this.filaFormularioEditandoId.set(id);
  }

  protected editarFilaFormularioProceso(id: string): void {
    this.filaFormularioEditandoId.set(id);
  }

  protected cancelarEdicionFilaFormularioProceso(id: string): void {
    const fila = this.formulariosProceso().find((f) => f.id === id);
    if (fila !== undefined && fila.nombre === '' && fila.idFormulario === 0) {
      this.formulariosProceso.update((lista) => lista.filter((f) => f.id !== id));
    }
    this.filaFormularioEditandoId.set(null);
  }

  protected guardarFilaFormularioProceso(id: string): void {
    const fila = this.formulariosProceso().find((f) => f.id === id);
    if (fila === undefined || fila.nombre === '' || fila.idFormulario === 0) {
      return;
    }
    this.filaFormularioEditandoId.set(null);
  }

  protected actualizarFilaFormularioProceso(
    id: string,
    patch: Partial<FormularioProcesoConfig>,
  ): void {
    this.formulariosProceso.update((lista) =>
      lista.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    );
  }

  protected actualizarFormularioProcesoFila(id: string, valor: string | number): void {
    const idFormulario = Number(valor);
    const documento = this.documentosLivianoOptions().find(
      (o) => o.value === String(idFormulario),
    );
    this.formulariosProceso.update((lista) =>
      lista.map((f) =>
        f.id === id ? { ...f, idFormulario, nombreDocumento: documento?.label } : f,
      ),
    );
  }

  protected eliminarFilaFormularioProceso(id: string): void {
    this.formulariosProceso.update((lista) => lista.filter((f) => f.id !== id));
    if (this.formularioSeleccionadoId() === id) {
      this.formularioSeleccionadoId.set(null);
      this.metadatosTrabajo.set([]);
      this.traspasosTrabajo.set([]);
    }
  }

  protected seleccionarFormularioProceso(id: string): void {
    this.formularioSeleccionadoId.set(id);
    const fila = this.formulariosProceso().find((f) => f.id === id);
    if (fila !== undefined && fila.idFormulario !== 0) {
      this.asegurarMetadatosDocumento(String(fila.idFormulario));
    }
    this.metadatosTrabajo.set([]);
    this.traspasosTrabajo.set([]);
    this.traspasoOrigenFormularioId.set(null);
    this.traspasoOrigenSeleccion.set(null);
    this.traspasoDestinoSeleccion.set(null);
  }

  protected formularioSeleccionadoFila(): FormularioProcesoConfig | undefined {
    const id = this.formularioSeleccionadoId();

    return id === null
      ? undefined
      : this.formulariosProceso().find((f) => f.id === id);
  }

  protected formularioSeleccionadoValor(fila: FormularioProcesoConfig): string | null {
    return fila.idFormulario === 0 ? null : String(fila.idFormulario);
  }

  protected nombreDocumentoDeFormulario(fila: FormularioProcesoConfig): string {
    if (fila.nombreDocumento !== undefined && fila.nombreDocumento.trim() !== '') {
      return fila.nombreDocumento;
    }

    const opcion = this.documentosLivianoOptions().find(
      (o) => o.value === String(fila.idFormulario),
    );
    return opcion?.label ?? `id ${fila.idFormulario}`;
  }

  protected bloqueDisplay(
    nombreBloque: string | null | undefined,
    codigoBloque: string | null | undefined,
  ): string {
    return nombreBloque?.trim() || codigoBloque?.trim() || 'Sin bloque';
  }

  protected nombreMetadato(opcion: MetadatoOpcion): string {
    return opcion.label.includes(' | ') ? opcion.label.split(' | ')[1] : opcion.label;
  }

  protected metadatosFormularioPorBloque(): readonly {
    bloque: string;
    opciones: readonly MetadatoOpcion[];
    total: number;
    seleccionados: number;
    orden: number;
  }[] {
    this.mensajeMetadatosVersion();
    const idSeleccionado = this.formularioSeleccionadoId();
    const seleccionadosActual = this.metadatosTrabajo();
    if (idSeleccionado === null) {
      return [];
    }
    const fila = this.formulariosProceso().find((f) => f.id === idSeleccionado);
    if (fila === undefined || fila.idFormulario === 0) {
      return [];
    }
    const opciones = this.mensajeMetadatosCache.get(fila.idFormulario) ?? [];
    const grupos = new Map<string, { ops: MetadatoOpcion[]; orden: number }>();
    for (const opcion of opciones) {
      const bloque = opcion.label.includes(' | ')
        ? opcion.label.split(' | ')[0]
        : 'Sin bloque';
      if (!grupos.has(bloque)) {
        grupos.set(bloque, {
          ops: [],
          orden: opcion.ordenBloque ?? Number.MAX_SAFE_INTEGER,
        });
      }
      grupos.get(bloque)?.ops.push(opcion);
    }
    return Array.from(grupos.entries())
      .map(([bloque, g]) => ({
        bloque,
        opciones: g.ops,
        total: g.ops.length,
        seleccionados: g.ops.filter((o) => seleccionadosActual.includes(o.value)).length,
        orden: g.orden,
      }))
      .sort((a, b) => a.orden - b.orden);
  }

  protected metadatosTotal(): number {
    return this.metadatosFormularioPorBloque().reduce((acc, g) => acc + g.total, 0);
  }

  protected metadatosSeleccionadosTotal(): number {
    return this.metadatosTrabajo().length;
  }

  protected seleccionarTodosMetadatos(marcar: boolean): void {
    const idSeleccionado = this.formularioSeleccionadoId();
    if (idSeleccionado === null) {
      return;
    }
    const fila = this.formulariosProceso().find((f) => f.id === idSeleccionado);
    if (fila === undefined || fila.idFormulario === 0) {
      return;
    }
    const opciones = this.mensajeMetadatosCache.get(fila.idFormulario) ?? [];
    this.metadatosTrabajo.set(marcar ? opciones.map((o) => o.value) : []);
  }

  protected seleccionarTodosMetadatosBloque(
    opciones: readonly MetadatoOpcion[],
    marcar: boolean,
  ): void {
    const claves = opciones.map((o) => o.value);
    const conjunto = new Set(claves);
    this.metadatosTrabajo.update((lista) =>
      marcar
        ? Array.from(new Set([...lista, ...conjunto]))
        : lista.filter((m) => !conjunto.has(m)),
    );
  }

  protected metadatoTrabajoSeleccionado(opcion: MetadatoOpcion): boolean {
    return this.metadatosTrabajo().includes(opcion.value);
  }

  protected toggleMetadatoTrabajo(opcion: MetadatoOpcion): void {
    const clave = opcion.value;
    this.metadatosTrabajo.update((lista) =>
      lista.includes(clave)
        ? lista.filter((m) => m !== clave)
        : [...lista, clave],
    );
  }

  private cargarFormulariosProcesoDesdeBackend(
    documentos: readonly DocumentoComunProceso[],
  ): void {
    let indice = 0;
    this.formulariosProceso.set(
      documentos.map((doc) => ({
        id: `fp-${++indice}`,
        nombre: doc.nombre_doc_comun,
        nombreDocumento: doc.nombre_documento,
        docComunId: doc.doc_comun_id,
        idFormulario: doc.id_documento,
        visibilidad: doc.privado ? 'privado' : 'publico',
      })),
    );
    this.formularioProcesoUid.current = Math.max(this.formularioProcesoUid.current, indice);
  }

  // ====== Configuración de traspasos ======
  protected abrirConfigurarTraspasos(): void {
    if (this.formularioSeleccionadoId() === null) {
      return;
    }

    this.traspasoOrigenFormularioId.set(null);
    this.traspasoOrigenSeleccion.set(null);
    this.traspasoDestinoSeleccion.set(null);
    this.traspasoFiltroOrigen.set('');
    this.traspasoFiltroDestino.set('');
    this.traspasosModalAbierto.set(true);
  }

  protected cerrarConfigurarTraspasos(): void {
    this.traspasosModalAbierto.set(false);
  }

  protected traspasoFormulariosOrigen(): readonly FormularioProcesoConfig[] {
    const seleccionada = this.formularioSeleccionadoFila();

    return this.formulariosProceso().filter(
      (f) => f.idFormulario !== 0 && f.idFormulario !== seleccionada?.idFormulario,
    );
  }

  protected traspasoOrigenMetadatos(): readonly MetadatoOpcion[] {
    const id = this.traspasoOrigenFormularioId();

    return id === null ? [] : this.metadatosDeDocumento(String(id));
  }

  protected traspasoOrigenMetadatosFiltrados(): readonly MetadatoOpcion[] {
    return this.filtrarMetadatos(this.traspasoOrigenMetadatos(), this.traspasoFiltroOrigen());
  }

  protected traspasoDestinoMetadatos(): readonly MetadatoOpcion[] {
    const fila = this.formularioSeleccionadoFila();

    return fila === undefined || fila.idFormulario === 0
      ? []
      : this.metadatosDeDocumento(String(fila.idFormulario));
  }

  protected traspasoDestinoMetadatosFiltrados(): readonly MetadatoOpcion[] {
    return this.filtrarMetadatos(this.traspasoDestinoMetadatos(), this.traspasoFiltroDestino());
  }

  private filtrarMetadatos(
    opciones: readonly MetadatoOpcion[],
    filtro: string,
  ): readonly MetadatoOpcion[] {
    const texto = filtro.trim().toLowerCase();

    if (texto === '') {
      return opciones;
    }

    return opciones.filter((opcion) =>
      [
        this.nombreMetadato(opcion),
        this.bloqueDisplay(opcion.nombreBloque, opcion.codigoBloque),
        opcion.tipo ?? '',
      ]
        .join(' ')
        .toLowerCase()
        .includes(texto),
    );
  }

  protected traspasoSeleccionarOrigenFormulario(idFormulario: number): void {
    this.traspasoOrigenFormularioId.set(idFormulario);
    this.traspasoOrigenSeleccion.set(null);
    this.traspasoFiltroOrigen.set('');

    if (idFormulario !== 0) {
      this.asegurarMetadatosDocumento(String(idFormulario));
    }
  }

  protected traspasoSeleccionarOrigenMetadato(opcion: MetadatoOpcion): void {
    this.traspasoOrigenSeleccion.set(opcion.value);
  }

  protected traspasoSeleccionarDestinoMetadato(opcion: MetadatoOpcion): void {
    if (this.traspasoDestinoYaConfigurado(opcion)) {
      return;
    }

    this.traspasoDestinoSeleccion.set(opcion.value);
  }

  protected traspasoDestinoYaConfigurado(opcion: MetadatoOpcion): boolean {
    return this.traspasosTrabajo().some((traspaso) => traspaso.destino.clave === opcion.value);
  }

  protected traspasoAgregarHabilitado(): boolean {
    return (
      this.traspasoOrigenFormularioId() !== null &&
      this.traspasoOrigenSeleccion() !== null &&
      this.traspasoDestinoSeleccion() !== null
    );
  }

  protected esMetadatoGrilla(opcion: MetadatoOpcion): boolean {
    return (opcion.grilla?.columnas?.length ?? 0) > 0;
  }

  protected traspasoAgregar(): void {
    const idFormularioOrigen = this.traspasoOrigenFormularioId();
    const claveOrigen = this.traspasoOrigenSeleccion();
    const claveDestino = this.traspasoDestinoSeleccion();

    if (idFormularioOrigen === null || claveOrigen === null || claveDestino === null) {
      return;
    }

    const filaOrigen = this.formulariosProceso().find((f) => f.idFormulario === idFormularioOrigen);
    const filaDestino = this.formularioSeleccionadoFila();
    const opcionOrigen = this.traspasoOrigenMetadatos().find((o) => o.value === claveOrigen);
    const opcionDestino = this.traspasoDestinoMetadatos().find((o) => o.value === claveDestino);

    if (
      filaOrigen === undefined ||
      filaDestino === undefined ||
      opcionOrigen === undefined ||
      opcionDestino === undefined ||
      this.traspasoDestinoYaConfigurado(opcionDestino)
    ) {
      return;
    }

    if (!esCombinacionTraspasoValida(opcionOrigen.tipo ?? '', opcionDestino.tipo ?? '')) {
      this.traspasoInvalidoMensaje.set(
        `La combinación de tipos ${opcionOrigen.tipo ?? '—'} (origen) → ${opcionDestino.tipo ?? '—'} (destino) no está permitida.`,
      );
      this.traspasoInvalidoModalAbierto.set(true);
      return;
    }

    if (this.esMetadatoGrilla(opcionOrigen) && this.esMetadatoGrilla(opcionDestino)) {
      this.traspasoPendienteOrigen.set(opcionOrigen);
      this.traspasoPendienteDestino.set(opcionDestino);
      this.paresColumnasTrabajo.set([]);
      this.parOrigenSeleccion.set(null);
      this.parDestinoSeleccion.set(null);
      this.parFiltroOrigen.set('');
      this.parFiltroDestino.set('');
      this.paresColumnasModalAbierto.set(true);
      return;
    }

    const origen = this.construirDetalleTransferido(filaOrigen, opcionOrigen);
    const destino = this.construirDetalleTransferido(filaDestino, opcionDestino);

    this.traspasosTrabajo.update((lista) => [...lista, { origen, destino }]);
    this.traspasoOrigenSeleccion.set(null);
    this.traspasoDestinoSeleccion.set(null);
  }

  protected traspasoEliminar(indice: number): void {
    this.traspasosTrabajo.update((lista) => lista.filter((_, i) => i !== indice));
  }

  protected traspasoCantidadPares(traspaso: MetadatoTransferidoConfig): number {
    return traspaso.paresColumnas?.length ?? 0;
  }

  private construirDetalleTransferido(
    fila: FormularioProcesoConfig,
    opcion: MetadatoOpcion,
  ): MetadatoTransferidoDetalle {
    return {
      idFormulario: fila.idFormulario,
      nombreFormulario: fila.nombre || this.nombreDocumentoDeFormulario(fila),
      clave: opcion.value,
      idMetadato: opcion.idMetadato,
      nombreMetadato: this.nombreMetadato(opcion),
      tipoMetadato: opcion.tipo ?? null,
      esGrilla: this.esMetadatoGrilla(opcion),
      nombreBloque: opcion.nombreBloque ?? null,
      codigoBloque: opcion.codigoBloque ?? null,
    };
  }

  // ====== Emparejamiento de columnas de grilla ======
  protected cerrarTraspasoInvalido(): void {
    this.traspasoInvalidoModalAbierto.set(false);
  }

  protected cerrarParesColumnas(): void {
    this.paresColumnasModalAbierto.set(false);
  }

  protected nombrePendienteOrigen(): string {
    const opcion = this.traspasoPendienteOrigen();

    return opcion === null ? '' : this.nombreMetadato(opcion);
  }

  protected nombrePendienteDestino(): string {
    const opcion = this.traspasoPendienteDestino();

    return opcion === null ? '' : this.nombreMetadato(opcion);
  }

  protected paresColumnasOrigen(): readonly GrillaMetadatoColumna[] {
    return this.filtrarColumnas(
      this.traspasoPendienteOrigen()?.grilla?.columnas ?? [],
      this.parFiltroOrigen(),
    );
  }

  protected paresColumnasDestino(): readonly GrillaMetadatoColumna[] {
    return this.filtrarColumnas(
      this.traspasoPendienteDestino()?.grilla?.columnas ?? [],
      this.parFiltroDestino(),
    );
  }

  private filtrarColumnas(
    columnas: readonly GrillaMetadatoColumna[],
    filtro: string,
  ): readonly GrillaMetadatoColumna[] {
    const texto = filtro.trim().toLowerCase();

    if (texto === '') {
      return columnas;
    }

    return columnas.filter((columna) =>
      `${columna.titulo} ${columna.datafield} ${columna.tipo_dato}`
        .toLowerCase()
        .includes(texto),
    );
  }

  protected parSeleccionarOrigen(columna: GrillaMetadatoColumna): void {
    if (this.parOrigenYaConfigurado(columna)) {
      return;
    }

    this.parOrigenSeleccion.set(columna);
  }

  protected parSeleccionarDestino(columna: GrillaMetadatoColumna): void {
    if (this.parDestinoYaConfigurado(columna)) {
      return;
    }

    this.parDestinoSeleccion.set(columna);
  }

  protected parDestinoYaConfigurado(columna: GrillaMetadatoColumna): boolean {
    return this.paresColumnasTrabajo().some(
      (par) => par.destino.idColumnaGrilla === columna.id_columna_grilla,
    );
  }

  protected parOrigenYaConfigurado(columna: GrillaMetadatoColumna): boolean {
    return this.paresColumnasTrabajo().some(
      (par) => par.origen.idColumnaGrilla === columna.id_columna_grilla,
    );
  }

  protected parAgregarHabilitado(): boolean {
    return this.parOrigenSeleccion() !== null && this.parDestinoSeleccion() !== null;
  }

  protected parAgregar(): void {
    const origen = this.parOrigenSeleccion();
    const destino = this.parDestinoSeleccion();

    if (origen === null || destino === null || this.parDestinoYaConfigurado(destino)) {
      return;
    }

    if (!esCombinacionTraspasoValida(origen.tipo_dato, destino.tipo_dato)) {
      this.traspasoInvalidoMensaje.set(
        `La combinación de tipos de columna ${origen.tipo_dato} (origen) → ${destino.tipo_dato} (destino) no está permitida.`,
      );
      this.traspasoInvalidoModalAbierto.set(true);
      return;
    }

    const par: ParColumnaTransferido = {
      origen: {
        idColumnaGrilla: origen.id_columna_grilla,
        datafield: origen.datafield,
        titulo: origen.titulo,
        tipoDato: origen.tipo_dato,
      },
      destino: {
        idColumnaGrilla: destino.id_columna_grilla,
        datafield: destino.datafield,
        titulo: destino.titulo,
        tipoDato: destino.tipo_dato,
      },
    };

    this.paresColumnasTrabajo.update((lista) => [...lista, par]);
    this.parOrigenSeleccion.set(null);
    this.parDestinoSeleccion.set(null);
  }

  protected parEliminar(indice: number): void {
    this.paresColumnasTrabajo.update((lista) => lista.filter((_, i) => i !== indice));
  }

  protected paresGuardarHabilitado(): boolean {
    return this.paresColumnasTrabajo().length > 0;
  }

  protected guardarParesColumnas(): void {
    const idFormularioOrigen = this.traspasoOrigenFormularioId();
    const filaOrigen =
      idFormularioOrigen === null
        ? undefined
        : this.formulariosProceso().find((f) => f.idFormulario === idFormularioOrigen);
    const filaDestino = this.formularioSeleccionadoFila();
    const opcionOrigen = this.traspasoPendienteOrigen();
    const opcionDestino = this.traspasoPendienteDestino();
    const pares = this.paresColumnasTrabajo();

    if (
      filaOrigen === undefined ||
      filaDestino === undefined ||
      opcionOrigen === null ||
      opcionDestino === null ||
      pares.length === 0
    ) {
      return;
    }

    const origen = this.construirDetalleTransferido(filaOrigen, opcionOrigen);
    const destino = this.construirDetalleTransferido(filaDestino, opcionDestino);

    this.traspasosTrabajo.update((lista) => [...lista, { origen, destino, paresColumnas: pares }]);
    this.traspasoPendienteOrigen.set(null);
    this.traspasoPendienteDestino.set(null);
    this.paresColumnasTrabajo.set([]);
    this.paresColumnasModalAbierto.set(false);
    this.traspasoOrigenSeleccion.set(null);
    this.traspasoDestinoSeleccion.set(null);
  }

  protected mostrarCatalogosPublicacion(): boolean {
    return this.procesoForm.controls.publicaEnCatalogo.value;
  }

  protected mostrarJornadaCalendario(): boolean {
    return this.procesoForm.controls.aplicaJornadaLaboral.value;
  }

  private buildMecanismoConfigPayload(): unknown {
    const mecanismo = this.selectedMecanismo();
    if (!mecanismo) return null;

    const selections = this.configDatoSelections();
    return {
      id_mecanismo_denominacion: mecanismo.id_mecanismo_denominacion,
      datos: mecanismo.datos_requeridos.map((dato) => {
        const sel = selections[dato.id_dato_req_mecanismo] ?? { tipo: '' };
        return {
          id_dato_req_mecanismo: dato.id_dato_req_mecanismo,
          ...sel,
        };
      }),
    };
  }

  protected onProcesosEjecucionQueryParamsChange(params: NzTableQueryParams): void {
    const { pageIndex, pageSize } = params;
    const pageChanged = pageIndex !== this.procesosEjecucionPageIndex();
    const pageSizeChanged = pageSize !== this.procesosEjecucionPageSize();

    if (!pageChanged && !pageSizeChanged) {
      return;
    }

    this.procesosEjecucionPageIndex.set(pageIndex);
    this.procesosEjecucionPageSize.set(pageSize);
    this.cargarProcesosEjecucion();
  }

  protected onProcesosPageIndexChange(pageIndex: number): void {
    this.procesosPageIndex.set(pageIndex);
  }

  protected onProcesosPageSizeChange(pageSize: number): void {
    this.procesosPageSize.set(pageSize);
    this.procesosPageIndex.set(DEFAULT_PAGE_INDEX);
  }

  protected onExpandProcesosEjecucion(processrunningId: number, expand: boolean): void {
    const previousExpandedId = this.getSingleExpandedId(this.procesosEjecucionExpanded());

    if (expand) {
      if (previousExpandedId !== null && previousExpandedId !== processrunningId) {
        this.clearDiagramaProcesoEjecucion(previousExpandedId);
      }

      this.procesosEjecucionExpanded.set(new Set<number>([processrunningId]));
      this.cargarDiagramaProcesoEjecucion(processrunningId);
    } else {
      this.procesosEjecucionExpanded.set(new Set<number>());
      this.clearDiagramaProcesoEjecucion(processrunningId);
    }
  }

  @HostListener('window:resize')
  protected onWindowResize(): void {
    this.isDesktop.set(this.readDesktopState());
  }

  private cargarProcesosEjecucion(): void {
    this.procesosEjecucionLoading.set(true);
    this.procesosEjecucionError.set('');

    const payload: ObtenerProcesosEjecucionRequest = {
      id_roles: DEFAULT_ROLE_IDS,
      pag: this.procesosEjecucionPageIndex() - 1,
      itemPag: this.procesosEjecucionPageSize(),
      texto_busqueda: this.procesosEjecucionSearchText().trim(),
    };

    this.diagramaService.obtenerProcesosEjecucion(payload).subscribe({
      next: (response) => {
        this.procesosEjecucion.set(response.procesosEE ?? []);
        this.procesosEjecucionTotal.set(response.count_procesosEE ?? 0);
        this.procesosEjecucionTotalFiltrado.set(
          response.count_procesosEE_Filtro ?? response.count_procesosEE ?? 0,
        );
        this.procesosEjecucionExpanded.set(new Set<number>());
        this.procesosEjecucionDiagramas.set({});
        this.procesosEjecucionLoading.set(false);
      },
      error: (err: { statusText?: string }) => {
        this.procesosEjecucionError.set(
          err.statusText ?? 'No fue posible cargar Procesos en Ejecucion.',
        );
        this.procesosEjecucionLoading.set(false);
      },
    });
  }

  private cargarProcesos(): void {
    this.procesosLoading.set(true);
    this.procesosError.set('');

    this.diagramaService.obtenerProcesos().subscribe({
      next: (response) => {
        this.procesos.set(response.procesos ?? []);
        this.procesosTotalApi.set(response.count_procesos ?? 0);
        this.procesosLoading.set(false);
      },
      error: (err: { statusText?: string }) => {
        this.procesosError.set(err.statusText ?? 'No fue posible cargar Procesos.');
        this.procesosLoading.set(false);
      },
    });
  }

  private cargarRoles(): void {
    this.diagramaService.obtenerRoles().subscribe({
      next: (roles) => {
        const opciones = roles.map((r) => ({ label: r.nombre_rol, value: String(r.id_rol) }));
        this.responsablesOptions.set(opciones);
        this.cargosOptions.set(opciones);
      },
      error: () => {
        this.responsablesOptions.set([]);
        this.cargosOptions.set([
          { label: 'Investigador', value: '4' },
          { label: 'Analista', value: '5' },
          { label: 'Jefe de Proyecto', value: '6' },
        ]);
      },
    });
  }

  private cargarFamilias(): void {
    this.diagramaService.getFamiliasProceso().subscribe({
      next: (familias) => {
        this.familiasProcesoOptions.set(
          familias.map((f) => ({ label: f.nombre_familia, value: String(f.id_familia) })),
        );
      },
      error: () => {
        this.familiasProcesoOptions.set([]);
      },
    });
  }

  private cargarMetadatosReqRol(): void {
    this.diagramaService.obtenerMetadatosReqRol().subscribe({
      next: (requisitos) => this.metadatosRequeridosRol.set(requisitos),
      error: () => this.metadatosRequeridosRol.set([]),
    });
  }

  private cargarUsuariosLiviano(): void {
    this.diagramaService.obtenerUsuariosLiviano().subscribe({
      next: (respuesta) => this.usuariosLiviano.set(respuesta.usuarios),
      error: () => this.usuariosLiviano.set([]),
    });
  }

  private cargarMecanismos(): void {
    this.diagramaService.getMecanismosProceso().subscribe({
      next: (mecanismos) => {
        const options = mecanismos.map((m) => ({
          label: m.nombre_mecanismo_denominacion,
          value: String(m.id_mecanismo_denominacion),
        }));
        const map = Object.fromEntries(
          mecanismos.map((m) => [String(m.id_mecanismo_denominacion), m]),
        );
        this.mecanismosDenominacionOptions.set(options);
        this.mecanismosMap.set(map);
      },
      error: () => {
        this.mecanismosDenominacionOptions.set([]);
        this.mecanismosMap.set({});
      },
    });
  }

  private cargarJornadaCalendario(): void {
    this.diagramaService.getJornadaCalendario().subscribe({
      next: (response) => {
        this.jornadaOptions.set(
          (response.jornada ?? []).map((j) => ({
            label: j.jornada_nombre,
            value: String(j.id_jornada),
          })),
        );
        this.calendarioOptions.set(
          (response.calendario ?? []).map((c) => ({
            label: c.calendario_nombre,
            value: String(c.id_calendario),
          })),
        );
      },
      error: () => {
        this.jornadaOptions.set([]);
        this.calendarioOptions.set([]);
      },
    });
  }

  private cargarCatalogosSegunUsuario(): void {
    this.diagramaService.obtenerCatalogosSegunUsuario().subscribe({
      next: (catalogos) =>
        this.catalogosPublicacionOptions.set(
          catalogos.map((c) => ({
            label: c.nombre_catalogo,
            value: String(c.id_catalogo),
          })),
        ),
      error: () => this.catalogosPublicacionOptions.set([]),
    });
  }

  protected procesosEjecucionDiagrama(processrunningId: number): LegacyProcesoEjecucionDiagramaState | null {
    return this.procesosEjecucionDiagramas()[processrunningId] ?? null;
  }

  private cargarDiagramaProcesoEjecucion(processrunningId: number): void {
    this.setDiagramaProcesoEjecucion(processrunningId, {
      loading: true,
      xml: '',
      executedElementIds: [],
      flowProgressItems: [],
      error: '',
    });

    this.diagramaService.obtenerXmlPathPorIdProceso(processrunningId).subscribe({
      next: (response) => {
        if (!this.procesosEjecucionExpanded().has(processrunningId)) {
          return;
        }

        const parsed = this.parseProcesoEjecucionPayload(response);

        this.setDiagramaProcesoEjecucion(processrunningId, {
          loading: false,
          xml: parsed.xml,
          executedElementIds: parsed.executedElementIds,
          flowProgressItems: parsed.flowProgressItems,
          error: parsed.xml.trim() === '' ? 'El proceso no devolvió XML.' : '',
        });
      },
      error: (err: { statusText?: string }) => {
        if (!this.procesosEjecucionExpanded().has(processrunningId)) {
          return;
        }

        this.setDiagramaProcesoEjecucion(processrunningId, {
          loading: false,
          xml: '',
          executedElementIds: [],
          flowProgressItems: [],
          error: err.statusText ?? 'No fue posible cargar el XML del proceso.',
        });
      },
    });
  }

  private clearDiagramaProcesoEjecucion(processrunningId: number): void {
    const current = { ...this.procesosEjecucionDiagramas() };
    delete current[processrunningId];
    this.procesosEjecucionDiagramas.set(current);
  }

  private setDiagramaProcesoEjecucion(
    processrunningId: number,
    state: LegacyProcesoEjecucionDiagramaState,
  ): void {
    this.procesosEjecucionDiagramas.set({
      ...this.procesosEjecucionDiagramas(),
      [processrunningId]: state,
    });
  }

  private parseProcesoEjecucionPayload(response: string): LegacyProcesoEjecucionParsedPayload {
    const trimmed = response.trim();

    if (trimmed === '') {
      return {
        xml: '',
        executedElementIds: [],
        flowProgressItems: [],
      };
    }

    const parsedJson = this.tryParseJson(trimmed);
    if (typeof parsedJson === 'string') {
      return {
        xml: parsedJson,
        executedElementIds: [],
        flowProgressItems: [],
      };
    }

    if (parsedJson !== null && typeof parsedJson === 'object') {
      const parsedRecord = parsedJson as Record<string, unknown>;
      const xml = this.readLegacyStringField(parsedRecord, ['xml', 'xmlPath', 'path']);
      return {
        xml,
        executedElementIds: this.normalizeExecutedElementIds(parsedRecord),
        flowProgressItems: this.normalizeFlowProgressItems(parsedRecord),
      };
    }

    return {
      xml: trimmed,
      executedElementIds: [],
      flowProgressItems: [],
    };
  }

  private normalizeExecutedElementIds(payload: Record<string, unknown>): readonly string[] {
    const candidates = [
      payload['tareasEjecutadas'],
      payload['actividadesEjecutadas'],
      payload['actividadesEjecutadasEnProcesoEESegunProcesoId'],
    ];

    const ids: string[] = [];

    for (const candidate of candidates) {
      if (!Array.isArray(candidate)) {
        continue;
      }

      for (const item of candidate) {
        const id = this.readLegacyStringField(item, [
          'id_elemento',
          'elemento',
          'idElemento',
          'activity_id',
          'idActivity',
        ]);

        if (id !== '') {
          ids.push(id);
        }
      }
    }

    return Array.from(new Set(ids.map((id) => this.normalizeLegacyId(id))));
  }

  private normalizeFlowProgressItems(payload: Record<string, unknown>): readonly LegacyFlowProgress[] {
    const candidates = [
      payload['actividadesEjecutadas'],
      payload['actividadesEjecutadasEnProcesoEESegunProcesoId'],
    ];

    const items: LegacyFlowProgress[] = [];

    for (const candidate of candidates) {
      if (!Array.isArray(candidate)) {
        continue;
      }

      for (const item of candidate) {
        const elemento = this.readLegacyStringField(item, ['elemento', 'id_elemento', 'idElemento']);
        const cuenta = Number(this.readLegacyNumberField(item, ['cuenta', 'count', 'ejecutadas']));
        const total = Number(this.readLegacyNumberField(item, ['total', 'cantidad', 'countTotal']));

        if (elemento !== '' && Number.isFinite(cuenta) && Number.isFinite(total)) {
          items.push({
            elemento: this.normalizeLegacyId(elemento),
            cuenta,
            total,
          });
        }
      }
    }

    return items;
  }

  private readLegacyStringField(value: unknown, keys: readonly string[]): string {
    if (value === null || typeof value !== 'object') {
      return '';
    }

    for (const key of keys) {
      const candidate = (value as Record<string, unknown>)[key];
      if (typeof candidate === 'string' && candidate.trim() !== '') {
        return candidate.trim();
      }
      if (typeof candidate === 'number' && Number.isFinite(candidate)) {
        return String(candidate);
      }
    }

    return '';
  }

  private readLegacyNumberField(value: unknown, keys: readonly string[]): number | null {
    if (value === null || typeof value !== 'object') {
      return null;
    }

    for (const key of keys) {
      const candidate = (value as Record<string, unknown>)[key];
      if (typeof candidate === 'number' && Number.isFinite(candidate)) {
        return candidate;
      }
      if (typeof candidate === 'string' && candidate.trim() !== '') {
        const parsed = Number(candidate);
        if (Number.isFinite(parsed)) {
          return parsed;
        }
      }
    }

    return null;
  }

  private tryParseJson(value: string): unknown {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }

  private normalizeLegacyId(value: string): string {
    return value.replace(/ /g, '_');
  }

  private updateCatalogosValidators(publicaEnCatalogo: boolean): void {
    const control = this.procesoForm.controls.catalogosPublicacion;

    if (publicaEnCatalogo) {
      control.setValidators([Validators.required]);
    } else {
      control.setValue([]);
      control.clearValidators();
    }

    control.updateValueAndValidity({ emitEvent: false });
  }

  private updateJornadaCalendarioValidators(aplicaJornadaLaboral: boolean): void {
    const jornadaControl = this.procesoForm.controls.jornada;
    const calendarioControl = this.procesoForm.controls.calendario;

    if (aplicaJornadaLaboral) {
      jornadaControl.setValidators([Validators.required]);
      calendarioControl.setValidators([Validators.required]);
    } else {
      jornadaControl.setValue(null);
      jornadaControl.clearValidators();
      calendarioControl.setValue(null);
      calendarioControl.clearValidators();
    }

    jornadaControl.updateValueAndValidity({ emitEvent: false });
    calendarioControl.updateValueAndValidity({ emitEvent: false });
  }

  private validarCatalogosPublicacion(): boolean {
    if (!this.procesoForm.controls.publicaEnCatalogo.value) {
      return true;
    }

    const catalogos = this.procesoForm.controls.catalogosPublicacion.value;
    if (catalogos.length > 0) {
      return true;
    }

    this.procesoForm.controls.catalogosPublicacion.setErrors({ required: true });
    return false;
  }

  private camposObligatoriosFaltantes(): string[] {
    const faltantes: string[] = [];
    const controls = this.procesoForm.controls;

    if (controls.nombre.invalid) {
      faltantes.push('Nombre');
    }
    if (controls.responsables.invalid) {
      faltantes.push('Responsable');
    }
    if (controls.duracionValor.invalid || controls.duracionUnidad.invalid) {
      faltantes.push('Duración');
    }
    if (controls.familiaProceso.invalid) {
      faltantes.push('Familia procesos');
    }
    if (controls.mecanismoDenominacion.invalid) {
      faltantes.push('Mecanismo de denominación');
    }
    if (
      controls.publicaEnCatalogo.value &&
      (controls.catalogosPublicacion.invalid || controls.catalogosPublicacion.value.length === 0)
    ) {
      faltantes.push('Catálogos de publicación');
    }
    if (controls.aplicaJornadaLaboral.value) {
      if (controls.jornada.invalid) {
        faltantes.push('Jornada');
      }
      if (controls.calendario.invalid) {
        faltantes.push('Calendario');
      }
    }
    if (!this.procesoDiagramTouched() && this.procesoEditSourceXml().trim() === '') {
      faltantes.push('Diagrama asociado');
    }

    return faltantes;
  }

  private validarConfiguracionMecanismo(): string | null {
    const mecanismo = this.selectedMecanismo();
    if (mecanismo === null || mecanismo.por_defecto !== false) {
      return null;
    }

    const selections = this.configDatoSelections();
    const datosVar = mecanismo.datos_requeridos.filter(
      (dato) => dato.id_dato_mecanismo === 'var',
    );

    for (const dato of datosVar) {
      const sel = selections[dato.id_dato_req_mecanismo];
      const tipo = sel?.tipo ?? '';

      if (tipo === '') {
        return 'La configuración del mecanismo de denominación está incompleta. Configura todos los datos requeridos (icono de configuración).';
      }

      if (tipo === 'metadato_formulario') {
        if (!sel?.documento || !sel?.metadato) {
          return 'La configuración del mecanismo de denominación está incompleta. Configura todos los datos requeridos (icono de configuración).';
        }
      }

      if (tipo === 'texto_fijo') {
        if (!sel?.valor || sel.valor.trim() === '') {
          return 'La configuración del mecanismo de denominación está incompleta. Configura todos los datos requeridos (icono de configuración).';
        }
      }
    }

    return null;
  }

  private buildDraftFromProceso(row: ProcesoConfiguracion): ProcesoModalFormValue {
    let baseDraft: ProcesoModalFormValue = {
      ...MODAL_FORM_DEFAULTS,
      nombre: row.nombre_proceso ?? '',
      visibilidad: row.privado ? 'privado' : 'publico',
    };

    // Preferencia por id_familia del API sobre XML legacy
    if (row.id_familia !== undefined && row.id_familia !== null) {
      const familiaIdStr = String(row.id_familia);
      const match = this.familiasProcesoOptions().find((o) => o.value === familiaIdStr);
      if (match) {
        baseDraft = { ...baseDraft, familiaProceso: familiaIdStr };
      }
    }

    // Preferencia por responsables del API
    if (row.responsables && row.responsables.length > 0) {
      const mapped = row.responsables
        .map((id) => String(id))
        .filter((idStr) => this.responsablesOptions().some((o) => o.value === idStr));
      baseDraft = { ...baseDraft, responsables: mapped };
    }

    // Preferencia por duración del API
    if (row.process_time !== undefined && row.process_time !== null && Number.isFinite(row.process_time)) {
      baseDraft = { ...baseDraft, duracionValor: row.process_time };
    }
    if (row.timeunit_id) {
      const validUnit = this.duracionUnidadOptions.find((u) => u === row.timeunit_id);
      if (validUnit) {
        baseDraft = { ...baseDraft, duracionUnidad: validUnit };
      }
    }

    // Preferencia por mecanismo del API
    const mecanismoIdApi = row.id_mecanismo_denominacion ?? row.id_mecanismo;
    if (mecanismoIdApi !== undefined && mecanismoIdApi !== null) {
      const mecanismoIdStr = String(mecanismoIdApi);
      const match = this.mecanismosDenominacionOptions().find((o) => o.value === mecanismoIdStr);
      if (match) {
        baseDraft = { ...baseDraft, mecanismoDenominacion: mecanismoIdStr };
      }
    }

    // Preferencia por flags booleanas del API
    if (row.expediente_electronico !== undefined && row.expediente_electronico !== null) {
      baseDraft = { ...baseDraft, creaExpedienteElectronico: row.expediente_electronico };
    }
    if (row.agregado_catalogo_formularios !== undefined && row.agregado_catalogo_formularios !== null) {
      baseDraft = { ...baseDraft, publicaEnCatalogo: row.agregado_catalogo_formularios };
    }

    // Preferencia por catálogos del API (id_catalogo)
    if (row.id_catalogo && row.id_catalogo.length > 0) {
      const mapeados = row.id_catalogo
        .map(String)
        .filter((idStr) => this.catalogosPublicacionOptions().some((o) => o.value === idStr));
      if (mapeados.length > 0) {
        baseDraft = {
          ...baseDraft,
          catalogosPublicacion: mapeados,
          publicaEnCatalogo: true,
        };
      }
    }

    // Preferencia por jornada/calendario del API
    const apiJornadaId =
      row.id_jornada !== undefined && row.id_jornada !== null ? String(row.id_jornada) : null;
    const apiCalendarioId =
      row.id_calendario !== undefined && row.id_calendario !== null
        ? String(row.id_calendario)
        : null;

    // El check de jornada laboral depende del signo de id_jornada:
    //   id_jornada > 0 => true
    //   id_jornada < 0 => false
    if (row.id_jornada !== undefined && row.id_jornada !== null) {
      baseDraft = { ...baseDraft, aplicaJornadaLaboral: row.id_jornada > 0 };
    }
    if (apiJornadaId !== null && this.jornadaOptions().some((o) => o.value === apiJornadaId)) {
      baseDraft = { ...baseDraft, jornada: apiJornadaId };
    }
    if (apiCalendarioId !== null && this.calendarioOptions().some((o) => o.value === apiCalendarioId)) {
      baseDraft = { ...baseDraft, calendario: apiCalendarioId };
    }

    if (!row.xml || row.xml.trim() === '') {
      return baseDraft;
    }

    try {
      const documentXml = new DOMParser().parseFromString(row.xml, 'text/xml');
      if (documentXml.querySelector('parsererror')) {
        return baseDraft;
      }

      const processDefinition = documentXml.documentElement;

      let duracionValor = baseDraft.duracionValor;
      let duracionUnidad = baseDraft.duracionUnidad;
      let familiaProceso = baseDraft.familiaProceso;
      let observaciones = baseDraft.observaciones;
      let creaExpedienteElectronico = baseDraft.creaExpedienteElectronico;
      let publicaEnCatalogo = baseDraft.publicaEnCatalogo;
      let aplicaJornadaLaboral = baseDraft.aplicaJornadaLaboral;
      let jornada = baseDraft.jornada;
      let calendario = baseDraft.calendario;
      let responsables = baseDraft.responsables;
      let mecanismoDenominacion = baseDraft.mecanismoDenominacion;
      let catalogosPublicacion = baseDraft.catalogosPublicacion;

      // Solo parsear duración del XML si el API no la proporcionó
      if (row.process_time === undefined || row.process_time === null || !Number.isFinite(row.process_time)) {
        const durationRaw = processDefinition.getAttribute('duration')?.trim() ?? '';
        const durationMatch = durationRaw.match(/^(\d+)\s*(minutos?|horas?|dias?)$/i);
        if (durationMatch) {
          duracionValor = Number(durationMatch[1]);
          const unit = durationMatch[2].toLowerCase();
          duracionUnidad = unit.startsWith('min')
            ? 'minutos'
            : unit.startsWith('hora')
              ? 'horas'
              : 'dias';
        }
      }

      // Si id_familia del API no produjo match, intentar leer del XML legacy
      if (familiaProceso === null) {
        const familia = processDefinition.getAttribute('family')?.trim() ?? '';
        familiaProceso =
          familia !== '' && this.familiasProcesoOptions().some((option) => option.value === familia)
            ? familia
            : null;
      }

      observaciones = processDefinition.getAttribute('comments')?.trim() ?? '';

      // Solo parsear flags del XML si el API no las proporcionó
      if (row.expediente_electronico === undefined || row.expediente_electronico === null) {
        creaExpedienteElectronico =
          (processDefinition.getAttribute('expedienteElectronico') ?? '').toLowerCase() === 'true';
      }
      if (row.agregado_catalogo_formularios === undefined || row.agregado_catalogo_formularios === null) {
        publicaEnCatalogo =
          (processDefinition.getAttribute('publicaEnCatalogo') ?? '').toLowerCase() === 'true';
      }
      // Solo parsear jornada/calendario del XML si el API no proporcionó id_jornada
      const xmlJornadaId = processDefinition.getAttribute('workingtime')?.trim() ?? '';
      const xmlCalendarioId = processDefinition.getAttribute('workingschedule')?.trim() ?? '';
      const apiTieneJornadaId = apiJornadaId !== null;

      if (!apiTieneJornadaId) {
        const xmlJornadaNum = Number(xmlJornadaId);
        aplicaJornadaLaboral =
          xmlJornadaId !== '' && !Number.isNaN(xmlJornadaNum) && xmlJornadaNum > 0;
      }
      if (jornada === null && xmlJornadaId !== '') {
        jornada = this.jornadaOptions().some((o) => o.value === xmlJornadaId)
          ? xmlJornadaId
          : null;
      }
      if (calendario === null && xmlCalendarioId !== '') {
        calendario = this.calendarioOptions().some((o) => o.value === xmlCalendarioId)
          ? xmlCalendarioId
          : null;
      }

      // Solo parsear responsables del XML si el API no los proporcionó
      if (!row.responsables || row.responsables.length === 0) {
        const parsedResponsables = Array.from(documentXml.getElementsByTagName('responsable'))
          .map((item) => item.getAttribute('idUsuario') ?? item.getAttribute('id_usuario') ?? '')
          .filter((value) => value !== '')
          .filter((value, index, all) => all.indexOf(value) === index);
        responsables = parsedResponsables.filter((value) =>
          this.responsablesOptions().some((option) => option.value === value),
        );
      }

      // Solo parsear mecanismo del XML si el API no lo proporcionó
      const mecanismoIdApi = row.id_mecanismo_denominacion ?? row.id_mecanismo;
      if (mecanismoIdApi === undefined || mecanismoIdApi === null) {
        const mecanismo =
          documentXml
            .getElementsByTagName('mecanismoDenominacion')
            .item(0)
            ?.getAttribute('idMecanismoDenominacion')
            ?.trim() ?? '';
        mecanismoDenominacion =
          mecanismo !== '' &&
          this.mecanismosDenominacionOptions().some((option) => option.value === mecanismo)
            ? mecanismo
            : null;
      }

      // Solo parsear catálogos del XML si el API no proporcionó id_catalogo
      if (baseDraft.catalogosPublicacion.length === 0) {
        const parsedCatalogos = Array.from(documentXml.getElementsByTagName('catalogo'))
          .map((catalogo) => catalogo.getAttribute('idCatalogo') ?? '')
          .filter((catalogo) => catalogo !== '')
          .filter((value, index, all) => all.indexOf(value) === index);
        catalogosPublicacion = parsedCatalogos.filter((catalogo) =>
          this.catalogosPublicacionOptions().some((option) => option.value === catalogo),
        );
      }

      return {
        ...baseDraft,
        duracionValor,
        duracionUnidad,
        familiaProceso,
        observaciones,
        creaExpedienteElectronico,
        publicaEnCatalogo,
        aplicaJornadaLaboral,
        jornada,
        calendario,
        responsables,
        mecanismoDenominacion,
        catalogosPublicacion,
      };
    } catch {
      return baseDraft;
    }
  }

  private getSingleExpandedId(expandedSet: Set<number>): number | null {
    const first = expandedSet.values().next();
    return first.done ? null : first.value;
  }

  protected resolveDatoLabel(dato: DatoRequerido): string {
    if (dato.id_dato_mecanismo === 'feh') {
      return 'Fecha hora creación';
    }
    return dato.valor_por_defecto;
  }

  private readDesktopState(): boolean {
    return typeof window === 'undefined' ? true : window.innerWidth >= 992;
  }

}

interface LegacyProcesoEjecucionDiagramaState {
  readonly loading: boolean;
  readonly xml: string;
  readonly executedElementIds: readonly string[];
  readonly flowProgressItems: readonly LegacyFlowProgress[];
  readonly error: string;
}

interface LegacyProcesoEjecucionParsedPayload {
  readonly xml: string;
  readonly executedElementIds: readonly string[];
  readonly flowProgressItems: readonly LegacyFlowProgress[];
}

type ProcesoModalMode = 'create' | 'edit';
type ProcesoVisibilidad = 'privado' | 'publico';
type ProcesoDuracionUnidad = 'minutos' | 'horas' | 'dias';

interface SelectOption {
  readonly label: string;
  readonly value: string;
}

interface ProcesoModalFormValue {
  nombre: string;
  responsables: string[];
  duracionValor: number | null;
  duracionUnidad: ProcesoDuracionUnidad | null;
  familiaProceso: string | null;
  visibilidad: ProcesoVisibilidad;
  mecanismoDenominacion: string | null;
  observaciones: string;
  creaExpedienteElectronico: boolean;
  publicaEnCatalogo: boolean;
  catalogosPublicacion: string[];
  aplicaJornadaLaboral: boolean;
  jornada: string | null;
  calendario: string | null;
}

import {
  ActividadTareaProceso,
  ReferenciaMetadatoMensaje,
  ReglaUsuarioActividad,
  TimerProcesoActividad,
  TransicionTareaProceso,
  ReglaNegocioActividad,
} from '../models/diagrama.model';
import {
  FormularioProcesoConfig,
  FormularioRequeridoSeleccion,
  MetadatoTransferidoConfig,
  MetadatoTransferidoDetalle,
  TareaConfig,
  TareaDuracionUnidad,
  TareaFuncionalidad,
  TareaTipoEjecucion,
} from '../models/tarea-config.model';
import {
  TransicionAccion,
  TRANSICION_ACCION_OPTIONS,
  TransicionConfig,
  TransicionReglaNegocio,
  TransicionReglaUsuario,
  buildDefaultTransicionConfig,
  operadorDesdeIdOperadorRegla,
} from '../models/transicion-config.model';
import {
  buildDefaultTimerConfig,
  TimerConfig,
  TimerDatoFijoTipo,
  TimerModo,
} from '../models/timer-config.model';
import {
  DecisionConfig,
  DecisionDuracionUnidad,
  buildDefaultDecisionConfig,
} from '../models/decision-config.model';
import {
  MensajeConfig,
  MensajeDestinatarios,
  MensajeReferenciaPar,
  buildDefaultMensajeConfig,
} from '../models/mensaje-config.model';

const DURACION_UNIDADES_VALIDAS: readonly TareaDuracionUnidad[] = ['minutos', 'horas', 'dias'];
const FUNCIONALIDADES_VALIDAS: readonly TareaFuncionalidad[] = ['cmf', 'freg', 'rdd', 'aur', 'aurg', 'cmmf'];

export function claveDeActividad(actividad: ActividadTareaProceso): string {
  return (actividad.id_elemento ?? '').replace(/ /g, '_');
}

export function claveMetadatoDesdeActividad(
  codigoBloque: string | undefined | null,
  idMetadato: number,
): string {
  return codigoBloque !== undefined && codigoBloque !== null && codigoBloque !== ''
    ? `${codigoBloque}-${idMetadato}`
    : String(idMetadato);
}

export function nombreFormularioDe(
  formularios: readonly FormularioProcesoConfig[],
  idFormulario: number,
): string {
  const fila = formularios.find((f) => f.idFormulario === idFormulario);

  if (fila === undefined) {
    return `Formulario ${idFormulario}`;
  }

  return fila.nombre || fila.nombreDocumento || `Formulario ${idFormulario}`;
}

function nombreDocumentoDe(
  formularios: readonly FormularioProcesoConfig[],
  idFormulario: number,
): string | undefined {
  return formularios.find((f) => f.idFormulario === idFormulario)?.nombreDocumento;
}

function visibilidadDe(
  formularios: readonly FormularioProcesoConfig[],
  idFormulario: number,
): FormularioProcesoConfig['visibilidad'] {
  return formularios.find((f) => f.idFormulario === idFormulario)?.visibilidad ?? 'privado';
}

export function construirTareaConfigDesdeActividad(
  actividad: ActividadTareaProceso,
  formularios: readonly FormularioProcesoConfig[],
): TareaConfig {
  const tipoEjecucion: TareaTipoEjecucion = actividad.automatica
    ? 'automatica'
    : actividad.consecutiva
      ? 'consecutiva'
      : 'normal';

  const funcionalidad = FUNCIONALIDADES_VALIDAS.includes(
    actividad.funcionality as TareaFuncionalidad,
  )
    ? (actividad.funcionality as TareaFuncionalidad)
    : null;

  const duracionUnidad = DURACION_UNIDADES_VALIDAS.includes(
    actividad.timeunit_id as TareaDuracionUnidad,
  )
    ? (actividad.timeunit_id as TareaDuracionUnidad)
    : null;

  const idJornada = actividad.id_jornada ?? 0;
  const idCalendario = actividad.id_calendario ?? 0;
  const usuarios = [
    ...new Set(
      (actividad.usuariosPreAsignados ?? [])
        .map((usuario) => usuario.id_usuario)
        .filter((usuario) => usuario.trim() !== ''),
    ),
  ];

  return {
    nombre: actividad.activity_name ?? '',
    activityId: actividad.activity_id,
    duracionValor: numberOrNull(actividad.activity_time),
    duracionUnidad,
    cargo:
      actividad.id_rol !== undefined && actividad.id_rol !== null
        ? String(actividad.id_rol)
        : null,
    usuarios,
    observaciones: '',
    ejecutaFuncionalidad: funcionalidad !== null,
    funcionalidad,
    dispositivoMovil: actividad.dispositivo_movil === true,
    agenda: actividad.utiliza_agenda === true,
    tipoEjecucion,
    ignorarValidacionCargo: false,
    aplicarJornadaLaboral: idJornada !== 0,
    jornada: idJornada !== 0 ? String(idJornada) : null,
    calendario: idCalendario !== 0 ? String(idCalendario) : null,
    agregarRegistrosExternos: actividad.registros_externos === true,
    filtrarUsuariosPorMetadatos: actividad.filtrar_por_metadato === true,
    conservarVistosBuenos: actividad.conservar_vistos_buenos === true,
    imprimirFormulario: actividad.imprime_formulario === true,
    tareaWeb: actividad.tarea_web === true,
    notificarViaEmail: actividad.tiene_notificacion === true,
    alertas: actividad.tiene_alertas === true,
    checkpoint: actividad.tiene_checkpoint === true,
    formularioRequeridoSeleccionado: construirSeleccionDesdeActividad(actividad, formularios),
  };
}

function construirSeleccionDesdeActividad(
  actividad: ActividadTareaProceso,
  formularios: readonly FormularioProcesoConfig[],
): FormularioRequeridoSeleccion | null {
  const docComunSeleccionado = actividad.documentoComunActividad[0]?.doc_comun_id ?? null;
  const idFormularioDesdeDocComun = idFormularioPorDocComun(formularios, docComunSeleccionado);
  const idFormulario =
    idFormularioDesdeDocComun ?? actividad.metadatosDisponibles[0]?.id_documento ?? null;

  if (idFormulario === null) {
    return null;
  }

  const flagTraspasos = actividad.documentoComunActividad[0]?.tiene_metadatos_transferidos;

  return {
    idFormulario,
    nombre: nombreFormularioDe(formularios, idFormulario),
    nombreDocumento: nombreDocumentoDe(formularios, idFormulario),
    visibilidad: visibilidadDe(formularios, idFormulario),
    metadatosSeleccionados: actividad.metadatosDisponibles
      .filter((meta) => meta.id_documento === idFormulario)
      .map((meta) => claveMetadatoDesdeActividad(meta.codigo_bloque, meta.id_metadato)),
    metadatosTransferidos: construirTraspasosDesdeActividad(actividad, formularios),
    tieneMetadatosTransferidos: flagTraspasos !== undefined && flagTraspasos !== null
      ? flagTraspasos.trim().toLowerCase()
      : undefined,
  };
}

export function construirTraspasosDesdeActividad(
  actividad: ActividadTareaProceso,
  formularios: readonly FormularioProcesoConfig[],
): MetadatoTransferidoConfig[] {
  return actividad.metadatosTransferidos.map((traspaso) => ({
    origen: construirDetalleTransferidoDesdeActividad(
      traspaso.id_documento_origen,
      traspaso.id_metadato_origen,
      traspaso.codigo_bloque_origen,
      formularios,
    ),
    destino: construirDetalleTransferidoDesdeActividad(
      traspaso.id_documento_destino,
      traspaso.id_metadato_destino,
      traspaso.codigo_bloque_destino,
      formularios,
    ),
  }));
}

function construirDetalleTransferidoDesdeActividad(
  idFormulario: number,
  idMetadato: number,
  codigoBloque: string | undefined | null,
  formularios: readonly FormularioProcesoConfig[],
): MetadatoTransferidoDetalle {
  return {
    idFormulario,
    nombreFormulario: nombreFormularioDe(formularios, idFormulario),
    clave: claveMetadatoDesdeActividad(codigoBloque, idMetadato),
    idMetadato,
    nombreMetadato: '',
    tipoMetadato: null,
    esGrilla: false,
    nombreBloque: null,
    codigoBloque: codigoBloque ?? null,
  };
}

export interface TimerMetadatoPendiente {
  readonly claveElemento: string;
  readonly docComunId: number;
  readonly idMetadato: number;
}

export function construirTimerConfigDesdeActividad(
  actividad: ActividadTareaProceso,
  formularios: readonly FormularioProcesoConfig[],
): TimerConfig {
  const timer = actividad.timers[0];

  if (timer === undefined) {
    return {
      ...buildDefaultTimerConfig(),
      activityId: actividad.activity_id,
    };
  }

  const modo: TimerModo = timer.es_met_formulario ? 'metadatoFormulario' : 'datoFijo';
  const datoFijoTipo: TimerDatoFijoTipo = timer.es_fecha ? 'fecha' : 'tiempo';
  const esTiempo = modo === 'datoFijo' && datoFijoTipo === 'tiempo';
  const duracionValor = esTiempo ? numberOrNull(timer.dato_fijo) : null;

  return {
    modo,
    datoFijoTipo,
    duracionValor,
    duracionUnidad: esTiempo ? timer.id_unidad_tiempo ?? null : null,
    fecha: datoFijoTipo === 'fecha' ? timer.fecha ?? null : null,
    hora: datoFijoTipo === 'fecha' ? timer.hora ?? null : null,
    idDocumento: timer.es_met_formulario
      ? idFormularioPorDocComun(formularios, timer.doc_comun_id)
      : null,
    idMetadato: null,
    activityId: actividad.activity_id,
  };
}

export function timerMetadatoPendiente(
  actividad: ActividadTareaProceso,
  claveElemento: string,
): TimerMetadatoPendiente | null {
  const timer: TimerProcesoActividad | undefined = actividad.timers[0];

  if (
    timer === undefined ||
    !timer.es_met_formulario ||
    timer.doc_comun_id === null ||
    timer.doc_comun_id === undefined ||
    timer.doc_comun_id <= 0
  ) {
    return null;
  }

  return {
    claveElemento,
    docComunId: timer.doc_comun_id,
    idMetadato: timer.id_metadato ?? 0,
  };
}

function numberOrNull(valor: string | number | null | undefined): number | null {
  if (valor === null || valor === undefined) {
    return null;
  }

  const numero = Number(valor);

  return Number.isFinite(numero) ? numero : null;
}

export function construirMensajeConfigDesdeActividad(
  actividad: ActividadTareaProceso,
  formularios: readonly FormularioProcesoConfig[],
): MensajeConfig {
  const mensaje = actividad.mensajes[0];
  const base = buildDefaultMensajeConfig();

  if (mensaje === undefined) {
    return base;
  }

  const referencias = (items: readonly ReferenciaMetadatoMensaje[] | undefined) =>
    (items ?? []).map((item): MensajeReferenciaPar => ({
      idDocumento: idFormularioPorDocComun(formularios, item.doc_comun_id),
      // Valor provisional (id crudo): el componente lo resuelve contra el cache
      // de metadatos del documento (option.value real = codigo-id).
      idMetadato: item.id_metadato !== undefined && item.id_metadato !== null
        ? String(item.id_metadato)
        : null,
    }));

  const destinatarios: MensajeDestinatarios = {
    usuariosSistema: [...(mensaje.usuarios ?? [])],
    usuariosExternos: [],
    referencias: referencias(mensaje.metadatosDestino),
  };

  return {
    ...base,
    destinatarios,
    destinatariosCc: {
      usuariosSistema: [],
      usuariosExternos: [],
      referencias: referencias(mensaje.metadatosDestinoCC),
    },
    enviarACargo: mensaje.envia_a_cargo === true,
    encabezadoInfoProceso: mensaje.encabezado === true,
    asunto: mensaje.asunto ?? '',
    contenido: mensaje.contenido ?? '',
    adjuntarPdfIds: (mensaje.documentosComunesAdjuntos ?? [])
      .map((item) => idFormularioPorNombreComun(formularios, item.nombre_documento_comun))
      .filter((id): id is number => id !== null),
    completarFormulario: mensaje.envia_formulario_externo ? 'externo' : 'sin',
    activityId: actividad.activity_id,
  };
}

export function idFormularioPorDocComun(
  formularios: readonly FormularioProcesoConfig[],
  docComunId: number | null | undefined,
): number | null {
  if (docComunId === null || docComunId === undefined) {
    return null;
  }

  const fila = formularios.find((f) => f.docComunId === docComunId);

  return fila === undefined ? null : fila.idFormulario;
}

function idFormularioPorNombreComun(
  formularios: readonly FormularioProcesoConfig[],
  nombre: string | undefined | null,
): number | null {
  if (nombre === undefined || nombre === null || nombre.trim() === '') {
    return null;
  }

  const fila = formularios.find(
    (f) => f.nombre === nombre || f.nombreDocumento === nombre,
  );

  return fila?.idFormulario ?? null;
}

export function construirTransicionConfigDesdeActividad(
  transicion: TransicionTareaProceso,
  formularios: readonly FormularioProcesoConfig[],
): TransicionConfig {
  const accion = accionDesdeId(transicion.id_accion_transicion);

  return {
    ...buildDefaultTransicionConfig(),
    transitionId: transicion.transition_id,
    requiereTimer: transicion.tiene_timer === true,
    interrupcion: transicion.con_interrupcion === true,
    timer: construirTimerTransicionDesdeActividad(transicion, formularios),
    accionRequerida: accion !== null,
    accion,
    reglasUsuario: transicion.reglasUsuario.map((regla) =>
      construirReglaUsuarioDesdeActividad(regla, formularios),
    ),
    reglasNegocio: transicion.reglasNegocio.map((regla) =>
      construirReglaNegocioDesdeActividad(regla, formularios),
    ),
  };
}

export function construirReglaUsuarioDesdeActividad(
  regla: ReglaUsuarioActividad,
  formularios: readonly FormularioProcesoConfig[],
): TransicionReglaUsuario {
  return {
    idDocumento: idFormularioPorDocComun(formularios, regla.id_doc_izq),
    idMetadato:
      regla.id_met_izq !== undefined && regla.id_met_izq !== null
        ? claveMetadatoDesdeActividad(regla.codigo_bloq_izq, regla.id_met_izq)
        : null,
    interpretacion: regla.campo_valor2 === true ? 'id' : 'texto',
    idCargo: regla.id_rol_der ?? null,
    // Los metadatos de rol no traen codigo_bloque: el value del option es el id crudo.
    idMetadatoValor:
      regla.id_met_der !== undefined && regla.id_met_der !== null
        ? String(regla.id_met_der)
        : null,
    idReglaUsuario: regla.id_regla_usuario ?? null,
  };
}

function construirReglaNegocioDesdeActividad(
  regla: ReglaNegocioActividad,
  formularios: readonly FormularioProcesoConfig[],
): TransicionReglaNegocio {
  const derEsDoc = regla.der_es_doc === true;

  return {
    idDocumento: idFormularioPorDocComun(formularios, regla.izq_doc_comun_id),
    idMetadato:
      regla.izq_id_metadato !== undefined && regla.izq_id_metadato !== null
        ? claveMetadatoDesdeActividad(regla.izq_codigo_bloque, regla.izq_id_metadato)
        : null,
    operador: operadorDesdeIdOperadorRegla(regla.id_operador_regla) ?? 'contiene',
    idOperadorRegla: regla.id_operador_regla ?? null,
    fuenteValor: derEsDoc ? 'otroMetadato' : 'valor',
    valorTexto: derEsDoc ? '' : regla.der_valor_operando ?? '',
    idDocumentoValor: derEsDoc
      ? idFormularioPorDocComun(formularios, regla.der_doc_comun_id)
      : null,
    idMetadatoValor:
      derEsDoc && regla.der_id_metadato !== undefined && regla.der_id_metadato !== null
        ? claveMetadatoDesdeActividad(regla.der_codigo_bloque, regla.der_id_metadato)
        : null,
  };
}

export function construirDecisionConfigDesdeActividad(
  actividad: ActividadTareaProceso,
  formularios: readonly FormularioProcesoConfig[],
): DecisionConfig {
  const docComunSeleccionado = actividad.documentoComunActividad[0]?.doc_comun_id ?? null;
  const tipoEjecucion: 'normal' | 'automatica' | 'consecutiva' = actividad.automatica
    ? 'automatica'
    : actividad.consecutiva
      ? 'consecutiva'
      : 'normal';

  const funcionalidad = actividad.funcionality === 'freg' ? 'freg' : null;

  const duracionUnidad = DURACION_UNIDADES_VALIDAS.includes(
    actividad.timeunit_id as TareaDuracionUnidad,
  )
    ? (actividad.timeunit_id as DecisionDuracionUnidad)
    : null;

  const idJornada = actividad.id_jornada ?? 0;
  const idCalendario = actividad.id_calendario ?? 0;
  const usuarios = [
    ...new Set(
      (actividad.usuariosPreAsignados ?? [])
        .map((usuario) => usuario.id_usuario)
        .filter((usuario) => usuario.trim() !== ''),
    ),
  ];

  const documento =
    funcionalidad === 'freg'
      ? (idFormularioPorDocComun(formularios, docComunSeleccionado)
        ?? actividad.metadatosDisponibles[0]?.id_documento
        ?? null)
      : null;

  const base = buildDefaultDecisionConfig(actividad.activity_name ?? '');

  return {
    ...base,
    nombre: actividad.activity_name ?? '',
    activityId: actividad.activity_id,
    duracionValor: numberOrNull(actividad.activity_time),
    duracionUnidad,
    cargo:
      actividad.id_rol !== undefined && actividad.id_rol !== null
        ? String(actividad.id_rol)
        : null,
    usuarios,
    tipoEjecucion,
    ejecutaFuncionalidad: actividad.funcionality !== null && actividad.funcionality !== undefined,
    funcionalidad,
    documento,
    activarMetadatosSistema: false,
    aplicarJornadaLaboral: idJornada !== 0,
    jornada: idJornada !== 0 ? String(idJornada) : null,
    calendario: idCalendario !== 0 ? String(idCalendario) : null,
    dispositivoMovil: actividad.dispositivo_movil === true,
    alertas: actividad.tiene_alertas === true,
    alertaSeleccionada: null,
    notificarViaEmail: actividad.tiene_notificacion === true,
  };
}

function accionDesdeId(idAccion: string | null | undefined): TransicionAccion | null {
  if (idAccion === null || idAccion === undefined || idAccion.trim() === '') {
    return null;
  }

  const valor = idAccion.trim().toUpperCase() as TransicionAccion;

  return TRANSICION_ACCION_OPTIONS.some((option) => option.value === valor) ? valor : null;
}

export interface TimerTransicionPendiente {
  readonly transitionId: number;
  readonly docComunId: number;
  readonly idMetadato: number;
}

export function construirTimerTransicionDesdeActividad(
  transicion: TransicionTareaProceso,
  formularios: readonly FormularioProcesoConfig[],
): TimerConfig {
  const timer = transicion.timers[0];

  if (timer === undefined) {
    return buildDefaultTimerConfig();
  }

  const modo: TimerModo = timer.es_met_formulario ? 'metadatoFormulario' : 'datoFijo';
  const datoFijoTipo: TimerDatoFijoTipo = timer.es_fecha ? 'fecha' : 'tiempo';
  const esTiempo = modo === 'datoFijo' && datoFijoTipo === 'tiempo';

  return {
    modo,
    datoFijoTipo,
    duracionValor: esTiempo ? numberOrNull(timer.dato_fijo) : null,
    duracionUnidad: esTiempo ? timer.id_unidad_tiempo ?? null : null,
    fecha: datoFijoTipo === 'fecha' ? timer.fecha ?? null : null,
    hora: datoFijoTipo === 'fecha' ? timer.hora ?? null : null,
    idDocumento: idFormularioPorDocComun(formularios, timer.doc_comun_id),
    idMetadato: null,
  };
}

export function timerTransicionMetadatoPendiente(
  transicion: TransicionTareaProceso,
): TimerTransicionPendiente | null {
  const timer = transicion.timers[0];

  if (
    timer === undefined ||
    !timer.es_met_formulario ||
    timer.doc_comun_id === null ||
    timer.doc_comun_id === undefined ||
    timer.doc_comun_id <= 0 ||
    timer.id_metadato === null ||
    timer.id_metadato === undefined
  ) {
    return null;
  }

  return {
    transitionId: transicion.transition_id,
    docComunId: timer.doc_comun_id,
    idMetadato: timer.id_metadato,
  };
}

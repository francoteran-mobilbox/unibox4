import {
  ActividadTareaProceso,
  TransicionTareaProceso,
} from '../models/diagrama.model';
import { FormularioProcesoConfig } from '../models/tarea-config.model';
import {
  claveDeActividad,
  construirDecisionConfigDesdeActividad,
  construirMensajeConfigDesdeActividad,
  construirTareaConfigDesdeActividad,
  construirTimerConfigDesdeActividad,
  construirTransicionConfigDesdeActividad,
  construirTraspasosDesdeActividad,
  timerMetadatoPendiente,
} from './tareas-proceso.mapper';

const FORMULARIOS: readonly FormularioProcesoConfig[] = [
  {
    id: 'fp-1',
    nombre: 'Flag',
    nombreDocumento: 'Flag Solicitud',
    docComunId: 4162,
    idFormulario: 795,
    visibilidad: 'privado',
  },
  {
    id: 'fp-2',
    nombre: 'Rendición',
    nombreDocumento: 'Rendición de Viático',
    docComunId: 4164,
    idFormulario: 802,
    visibilidad: 'publico',
  },
];

function actividadBase(
  overrides: Partial<ActividadTareaProceso> = {},
): ActividadTareaProceso {
  return {
    activity_id: 58736,
    process_id: 1248,
    activity_name: 'Ingresar Solicitud',
    activitytype_id: 'tarea',
    id_elemento: 'Tarea 280202116428506',
    activity_time: 2,
    timeunit_id: 'dias',
    funcionality: 'cmf',
    id_rol: 46,
    id_jornada: 2,
    id_calendario: 4,
    automatica: false,
    consecutiva: false,
    registros_externos: true,
    tiene_notificacion: true,
    dispositivo_movil: true,
    utiliza_agenda: true,
    tarea_web: true,
    conservar_vistos_buenos: true,
    imprime_formulario: true,
    filtrar_por_metadato: true,
    tiene_alertas: true,
    tiene_checkpoint: true,
    usuariosPreAsignados: [
      { id_usuario: 'abravo', activity_id: 58736, id_procedencia: 'diagrama' },
      { id_usuario: 'mrojas', activity_id: 58736, id_procedencia: 'diagrama' },
    ],
    documentoComunActividad: [
      { doc_comun_id: 4162, activity_id: 58736, tiene_metadatos_transferidos: 'false     ' },
    ],
    metadatosDisponibles: [
      {
        id_documento: 795,
        doc_comun_id: 4162,
        id_metadato: 57,
        codigo_bloque: 'BM2177',
        id_bloque: 5646,
      },
      {
        id_documento: 795,
        doc_comun_id: 4162,
        id_metadato: 336,
        codigo_bloque: 'BM2172',
        id_bloque: 5641,
      },
    ],
    metadatosTransferidos: [
      {
        id_metadato_origen: 1536,
        id_metadato_destino: 1536,
        id_documento_origen: 795,
        id_documento_destino: 802,
        codigo_bloque_origen: 'BM1576',
        id_bloque_origen: 4527,
        codigo_bloque_destino: 'BM2219',
        id_bloque_destino: 5755,
        doc_comun_id_origen: 4162,
        doc_comun_id_destino: 4164,
        metadato_transferido_id: 87016,
      },
    ],
    timers: [],
    mensajes: [],
    ...overrides,
  };
}

describe('tareas-proceso.mapper', () => {
  it('normaliza la clave del elemento (espacio → guion bajo)', () => {
    expect(claveDeActividad(actividadBase())).toBe('Tarea_280202116428506');
  });

  it('mapea la configuración de tarea desde la actividad', () => {
    const config = construirTareaConfigDesdeActividad(actividadBase(), FORMULARIOS);

    expect(config.activityId).toBe(58736);
    expect(config.nombre).toBe('Ingresar Solicitud');
    expect(config.duracionValor).toBe(2);
    expect(config.duracionUnidad).toBe('dias');
    expect(config.cargo).toBe('46');
    expect(config.funcionalidad).toBe('cmf');
    expect(config.ejecutaFuncionalidad).toBeTrue();
    expect(config.tipoEjecucion).toBe('normal');
    expect(config.aplicarJornadaLaboral).toBeTrue();
    expect(config.jornada).toBe('2');
    expect(config.calendario).toBe('4');
    expect(config.agregarRegistrosExternos).toBeTrue();
    expect(config.notificarViaEmail).toBeTrue();
    expect(config.dispositivoMovil).toBeTrue();
    expect(config.agenda).toBeTrue();
    expect(config.tareaWeb).toBeTrue();
    expect(config.conservarVistosBuenos).toBeTrue();
    expect(config.imprimirFormulario).toBeTrue();
    expect(config.filtrarUsuariosPorMetadatos).toBeTrue();
    expect(config.alertas).toBeTrue();
    expect(config.checkpoint).toBeTrue();
    expect(config.usuarios).toEqual(['abravo', 'mrojas']);
  });

  it('convierte activity_time a número cuando llega como string', () => {
    const actividad = actividadBase({
      activity_time: '5' as unknown as number,
    });

    const config = construirTareaConfigDesdeActividad(actividad, FORMULARIOS);

    expect(config.duracionValor).toBe(5);
  });

  it('mapea la selección de metadatos del formulario', () => {
    const config = construirTareaConfigDesdeActividad(actividadBase(), FORMULARIOS);
    const seleccion = config.formularioRequeridoSeleccionado;

    expect(seleccion).toEqual(
      jasmine.objectContaining({
        idFormulario: 795,
        nombre: 'Flag',
        nombreDocumento: 'Flag Solicitud',
        visibilidad: 'privado',
        metadatosSeleccionados: ['BM2177-57', 'BM2172-336'],
        tieneMetadatosTransferidos: 'false',
      }),
    );
  });

  it('usa el doc_comun_id del documentoComunActividad como formulario seleccionado', () => {
    const actividad = actividadBase({
      documentoComunActividad: [
        { doc_comun_id: 4164, activity_id: 58736, tiene_metadatos_transferidos: 'false' },
      ],
    });

    const config = construirTareaConfigDesdeActividad(actividad, FORMULARIOS);

    expect(config.formularioRequeridoSeleccionado?.idFormulario).toBe(802);
    expect(config.formularioRequeridoSeleccionado?.nombre).toBe('Rendición');
    expect(config.formularioRequeridoSeleccionado?.metadatosSeleccionados).toEqual([]);
  });

  it('normaliza el flag de traspasos a true', () => {
    const actividad = actividadBase({
      documentoComunActividad: [
        { doc_comun_id: 4162, activity_id: 58736, tiene_metadatos_transferidos: 'true' },
      ],
    });

    const config = construirTareaConfigDesdeActividad(actividad, FORMULARIOS);

    expect(config.formularioRequeridoSeleccionado?.tieneMetadatosTransferidos).toBe('true');
  });

  it('mapea los traspasos planos a la configuración con claves compuestas', () => {
    const traspasos = construirTraspasosDesdeActividad(actividadBase(), FORMULARIOS);

    expect(traspasos.length).toBe(1);
    expect(traspasos[0].origen).toEqual(
      jasmine.objectContaining({
        idFormulario: 795,
        nombreFormulario: 'Flag',
        clave: 'BM1576-1536',
        idMetadato: 1536,
        codigoBloque: 'BM1576',
      }),
    );
    expect(traspasos[0].destino).toEqual(
      jasmine.objectContaining({
        idFormulario: 802,
        nombreFormulario: 'Rendición',
        clave: 'BM2219-1536',
        idMetadato: 1536,
        codigoBloque: 'BM2219',
      }),
    );
  });

  it('mapea timer en modo tiempo', () => {
    const actividad = actividadBase({
      activitytype_id: 'timer',
      es_timer: true,
      timers: [
        {
          es_fecha: false,
          es_tiempo: true,
          es_dato_fijo: true,
          es_met_formulario: false,
          dato_fijo: '2',
          fecha: '',
          hora: '',
          id_unidad_tiempo: 'dias',
          id_metadato: 0,
          id_bloque: 0,
          doc_comun_id: -1,
        },
      ],
    });

    const config = construirTimerConfigDesdeActividad(actividad);

    expect(config.modo).toBe('datoFijo');
    expect(config.datoFijoTipo).toBe('tiempo');
    expect(config.duracionValor).toBe(2);
    expect(config.duracionUnidad).toBe('dias');
    expect(config.idDocumento).toBeNull();
    expect(config.activityId).toBe(actividad.activity_id);
  });

  it('mapea timer en modo fecha', () => {
    const actividad = actividadBase({
      activitytype_id: 'timer',
      es_timer: true,
      timers: [
        {
          es_fecha: true,
          es_tiempo: false,
          es_dato_fijo: true,
          es_met_formulario: false,
          dato_fijo: null,
          fecha: '2026-01-31',
          hora: '10:30',
          id_unidad_tiempo: '',
          id_metadato: 0,
          id_bloque: 0,
          doc_comun_id: -1,
        },
      ],
    });

    const config = construirTimerConfigDesdeActividad(actividad);

    expect(config.datoFijoTipo).toBe('fecha');
    expect(config.fecha).toBe('2026-01-31');
    expect(config.hora).toBe('10:30');
    expect(config.duracionValor).toBeNull();
  });

  it('marca el pendiente de resolución para timer en modo metadato', () => {
    const actividad = actividadBase({
      activitytype_id: 'timer',
      es_timer: true,
      timers: [
        {
          es_fecha: false,
          es_tiempo: false,
          es_dato_fijo: false,
          es_met_formulario: true,
          dato_fijo: null,
          fecha: '',
          hora: '',
          id_unidad_tiempo: '',
          id_metadato: 57,
          id_bloque: 5646,
          doc_comun_id: 4164,
        },
      ],
    });

    const config = construirTimerConfigDesdeActividad(actividad);

    expect(config.modo).toBe('metadatoFormulario');
    expect(config.idDocumento).toBeNull();
    expect(config.idMetadato).toBeNull();
    expect(timerMetadatoPendiente(actividad, 'Timer_1')).toEqual({
      claveElemento: 'Timer_1',
      docComunId: 4164,
      idMetadato: 57,
    });
  });

  it('mapea el mensaje con destinatarios, referencias y copia', () => {
    const actividad = actividadBase({
      activitytype_id: 'mensaje',
      mensajes: [
        {
          id_mensaje: 12301,
          activity_id: 58828,
          asunto: 'Notificación',
          contenido: 'Hola',
          envia_a_cargo: true,
          encabezado: true,
          envia_formulario_externo: true,
          usuarios: ['jperez', 'mrojas'],
          roles: [],
          documentos: [],
          documentosComunesAdjuntos: [
            { id_mensaje: 12305, nombre_documento_comun: 'Flag' },
            { id_mensaje: 12305, nombre_documento_comun: 'Rendición de Viático' },
          ],
          metadatosDestino: [
            { doc_comun_id: 4162, id_bloque: 5646, id_metadato: 57 },
          ],
          metadatosDestinoCC: [
            { doc_comun_id: 4164, id_bloque: 5641, id_metadato: 336 },
          ],
        },
      ],
    });

    const config = construirMensajeConfigDesdeActividad(actividad, FORMULARIOS);

    expect(config.asunto).toBe('Notificación');
    expect(config.contenido).toBe('Hola');
    expect(config.enviarACargo).toBeTrue();
    expect(config.encabezadoInfoProceso).toBeTrue();
    expect(config.completarFormulario).toBe('externo');
    expect(config.adjuntarPdfIds).toEqual([795, 802]);
    expect(config.destinatarios.usuariosSistema).toEqual(['jperez', 'mrojas']);
    expect(config.destinatarios.referencias).toEqual([
      { idDocumento: 795, idMetadato: '57' },
    ]);
    expect(config.destinatariosCc.referencias).toEqual([
      { idDocumento: 802, idMetadato: '336' },
    ]);
  });

  it('descarta adjuntos cuyo nombre_documento_comun no matchea formularios', () => {
    const actividad = actividadBase({
      activitytype_id: 'mensaje',
      mensajes: [
        {
          id_mensaje: 12306,
          asunto: '',
          contenido: '',
          documentosComunesAdjuntos: [
            { id_mensaje: 12307, nombre_documento_comun: 'Inexistente' },
            { id_mensaje: 12308, nombre_documento_comun: 'Flag' },
          ],
        },
      ],
    });

    const config = construirMensajeConfigDesdeActividad(actividad, FORMULARIOS);

    expect(config.adjuntarPdfIds).toEqual([795]);
  });

  it('mapea referencias cc aunque no venga con_copia', () => {
    const actividad = actividadBase({
      activitytype_id: 'mensaje',
      mensajes: [
        {
          id_mensaje: 12302,
          asunto: '',
          contenido: '',
          con_copia: false,
          metadatosDestinoCC: [
            { doc_comun_id: 4164, id_bloque: 5641, id_metadato: 336 },
          ],
        },
      ],
    });

    const config = construirMensajeConfigDesdeActividad(actividad, FORMULARIOS);

    expect(config.destinatarios.referencias).toEqual([]);
    expect(config.destinatariosCc.referencias).toEqual([
      { idDocumento: 802, idMetadato: '336' },
    ]);
  });

  it('usa clave provisional cruda cuando la referencia no tiene doc_comun_id conocido', () => {
    const actividad = actividadBase({
      activitytype_id: 'mensaje',
      mensajes: [
        {
          id_mensaje: 12303,
          asunto: '',
          contenido: '',
          metadatosDestino: [
            { doc_comun_id: 9999, id_metadato: 57 },
          ],
        },
      ],
    });

    const config = construirMensajeConfigDesdeActividad(actividad, FORMULARIOS);

    expect(config.destinatarios.referencias).toEqual([
      { idDocumento: null, idMetadato: '57' },
    ]);
  });
});

describe('tareas-proceso.mapper - transiciones', () => {
  it('mapea la transición con reglas de negocio desde el REST', () => {
    const transicion: TransicionTareaProceso = {
      transition_id: 79320,
      process_id: 1248,
      activity_id_source: 58776,
      activity_id_destination: 58737,
      transition_name: 'Con regla',
      levanta_form: false,
      tiene_timer: false,
            timers: [],
reglasUsuario: [],
      reglasNegocio: [
        {
          id_regla_negocio: 49940,
          id_operador_regla: 'ctn',
          operador: 'Contiene',
          id_tipo_dato: 'ALF',
          izq_es_doc: true,
          izq_id_metadato: 866,
          izq_id_bloque: 5646,
          izq_doc_comun_id: 4162,
          izq_codigo_bloque: 'BM2177',
          izq_id_tipo_dato: 'ALF',
          der_es_doc: false,
          der_valor_operando: ' ',
        },
        {
          id_regla_negocio: 49943,
          id_operador_regla: 'rbc',
          id_tipo_dato: 'RBT',
          izq_es_doc: true,
          izq_id_metadato: 1309,
          izq_doc_comun_id: 4162,
          izq_codigo_bloque: 'BM2181',
          der_es_doc: true,
          der_id_metadato: 336,
          der_doc_comun_id: 4164,
          der_codigo_bloque: 'BM2219',
        },
      ],
    };

    const config = construirTransicionConfigDesdeActividad(transicion, FORMULARIOS);

    expect(config.transitionId).toBe(79320);
    expect(config.requiereTimer).toBeFalse();

    expect(config.reglasNegocio.length).toBe(2);
    expect(config.reglasNegocio[0]).toEqual(
      jasmine.objectContaining({
        idDocumento: 795,
        idMetadato: 'BM2177-866',
        operador: 'contiene',
        idOperadorRegla: 'ctn',
        fuenteValor: 'valor',
        valorTexto: ' ',
      }),
    );
    expect(config.reglasNegocio[1]).toEqual(
      jasmine.objectContaining({
        idDocumento: 795,
        idMetadato: 'BM2181-1309',
        operador: 'contiene',
        idOperadorRegla: 'rbc',
        fuenteValor: 'otroMetadato',
        idDocumentoValor: 802,
        idMetadatoValor: 'BM2219-336',
      }),
    );
  });
});

describe('tareas-proceso.mapper - reglas de usuario', () => {
  it('mapea las reglas de usuario desde el REST', () => {
    const transicion: TransicionTareaProceso = {
      transition_id: 79280,
      process_id: 1248,
      activity_id_source: 58735,
      activity_id_destination: 58736,
      transition_name: '',
      levanta_form: false,
      tiene_timer: false,
            timers: [],
reglasUsuario: [
        {
          id_regla_usuario: 18639,
          transition_id: 79280,
          id_doc_izq: 4162,
          id_bloq_izq: 5641,
          codigo_bloq_izq: 'BM2172',
          id_met_izq: 1724,
          id_rol_der: 38,
          id_bloq_der: 3978,
          codigo_bloq_der: 'BM1191',
          id_met_der: 873,
          campo_valor2: false,
        },
      ],
      reglasNegocio: [],
    };

    const config = construirTransicionConfigDesdeActividad(transicion, FORMULARIOS);

    expect(config.reglasUsuario.length).toBe(1);
    expect(config.reglasUsuario[0]).toEqual(
      jasmine.objectContaining({
        idDocumento: 795,
        idMetadato: 'BM2172-1724',
        interpretacion: 'texto',
        idCargo: 38,
        idMetadatoValor: '873',
        idReglaUsuario: 18639,
      }),
    );
  });

  it('mapea interpretación id cuando campo_valor2 es true', () => {
    const transicion: TransicionTareaProceso = {
      transition_id: 79281,
      process_id: 1248,
      activity_id_source: 58735,
      activity_id_destination: 58736,
      transition_name: '',
      levanta_form: false,
      tiene_timer: false,
            timers: [],
reglasUsuario: [
        {
          id_regla_usuario: 18640,
          id_doc_izq: 4162,
          codigo_bloq_izq: 'BM2172',
          id_met_izq: 1724,
          id_rol_der: 38,
          codigo_bloq_der: 'BM1191',
          id_met_der: 873,
          campo_valor2: true,
        },
      ],
      reglasNegocio: [],
    };

    const config = construirTransicionConfigDesdeActividad(transicion, FORMULARIOS);

    expect(config.reglasUsuario[0]).toEqual(
      jasmine.objectContaining({
        interpretacion: 'id',
      }),
    );
  });
});

describe('tareas-proceso.mapper - decisión', () => {
  it('mapea la configuración de decisión desde la actividad', () => {
    const actividad = actividadBase({ activitytype_id: 'decision', funcionality: 'freg' });

    const config = construirDecisionConfigDesdeActividad(actividad, FORMULARIOS);

    expect(config.activityId).toBe(58736);
    expect(config.nombre).toBe('Ingresar Solicitud');
    expect(config.duracionValor).toBe(2);
    expect(config.duracionUnidad).toBe('dias');
    expect(config.cargo).toBe('46');
    expect(config.usuarios).toEqual(['abravo', 'mrojas']);
    expect(config.tipoEjecucion).toBe('normal');
    expect(config.ejecutaFuncionalidad).toBeTrue();
    expect(config.funcionalidad).toBe('freg');
    expect(config.documento).toBe(795);
    expect(config.aplicarJornadaLaboral).toBeTrue();
    expect(config.jornada).toBe('2');
    expect(config.calendario).toBe('4');
    expect(config.dispositivoMovil).toBeTrue();
    expect(config.alertas).toBeTrue();
    expect(config.alertaSeleccionada).toBeNull();
    expect(config.notificarViaEmail).toBeTrue();
    expect(config.activarMetadatosSistema).toBeFalse();
  });

  it('deja funcionalidad null cuando no es freg', () => {
    const actividad = actividadBase({ activitytype_id: 'decision', funcionality: 'cmf' });

    const config = construirDecisionConfigDesdeActividad(actividad, FORMULARIOS);

    expect(config.funcionalidad).toBeNull();
    expect(config.ejecutaFuncionalidad).toBeTrue();
  });
});

describe('tareas-proceso.mapper - documentoComunActividad decisión', () => {
  it('resuelve el documento de decisión vía doc_comun_id cuando funcionalidad es freg', () => {
    const actividad = actividadBase({
      activitytype_id: 'decision',
      funcionality: 'freg',
      documentoComunActividad: [
        { doc_comun_id: 4164, activity_id: 58738, tiene_metadatos_transferidos: 'false' },
      ],
    });

    const config = construirDecisionConfigDesdeActividad(actividad, FORMULARIOS);

    expect(config.documento).toBe(802);
  });

  it('usa metadatosDisponibles como fallback si el doc_comun_id no resuelve', () => {
    const actividad = actividadBase({
      activitytype_id: 'decision',
      funcionality: 'freg',
      documentoComunActividad: [{ doc_comun_id: 9999, activity_id: 58738 }],
    });

    const config = construirDecisionConfigDesdeActividad(actividad, FORMULARIOS);

    expect(config.documento).toBe(795);
  });

  it('deja documento null cuando la funcionalidad no es freg', () => {
    const actividad = actividadBase({
      activitytype_id: 'decision',
      funcionality: 'cmf',
      documentoComunActividad: [
        { doc_comun_id: 4164, activity_id: 58738, tiene_metadatos_transferidos: 'false' },
      ],
    });

    const config = construirDecisionConfigDesdeActividad(actividad, FORMULARIOS);

    expect(config.documento).toBeNull();
  });
});

describe('tareas-proceso.mapper - id_accion_transicion', () => {
  it('activa requiere acción y selecciona la acción cuando es válida', () => {
    const transicion: TransicionTareaProceso = {
      transition_id: 79320,
      process_id: 1248,
      activity_id_source: 58776,
      activity_id_destination: 58737,
      transition_name: '',
      levanta_form: false,
      tiene_timer: false,
            timers: [],
id_accion_transicion: 'FIRMAR_TOKEN',
      reglasUsuario: [],
      reglasNegocio: [],
    };

    const config = construirTransicionConfigDesdeActividad(transicion, FORMULARIOS);

    expect(config.accionRequerida).toBeTrue();
    expect(config.accion).toBe('FIRMAR_TOKEN');
  });

  it('ignora valores de acción desconocidos', () => {
    const transicion: TransicionTareaProceso = {
      transition_id: 79320,
      process_id: 1248,
      activity_id_source: 58776,
      activity_id_destination: 58737,
      transition_name: '',
      levanta_form: false,
      tiene_timer: false,
            timers: [],
id_accion_transicion: 'NO_EXISTE',
      reglasUsuario: [],
      reglasNegocio: [],
    };

    const config = construirTransicionConfigDesdeActividad(transicion, FORMULARIOS);

    expect(config.accionRequerida).toBeFalse();
    expect(config.accion).toBeNull();
  });
});

describe('tareas-proceso.mapper - timer de transición e interrupción', () => {
  const TRANSICION_BASE: TransicionTareaProceso = {
    transition_id: 79294,
    process_id: 1248,
    activity_id_source: 58751,
    activity_id_destination: 58838,
    transition_name: '',
    levanta_form: false,
    tiene_timer: true,
      timers: [],
    con_interrupcion: true,
    reglasUsuario: [],
    reglasNegocio: [],
  };

  it('mapea timer de transición en modo metadato formulario', () => {
    const transicion: TransicionTareaProceso = {
      ...TRANSICION_BASE,
      timers: [
        {
          es_fecha: false,
          doc_comun_id: 4162,
          hora: '',
          id_unidad_tiempo: '',
          es_tiempo: false,
          id_timer_proceso: 1834,
          fecha: '',
          id_metadato: 1483,
          es_dato_fijo: false,
          id_bloque: 5646,
          dato_fijo: '0',
          transition_id: 79294,
          es_met_formulario: true,
        },
      ],
    };

    const config = construirTransicionConfigDesdeActividad(transicion, FORMULARIOS);

    expect(config.requiereTimer).toBeTrue();
    expect(config.interrupcion).toBeTrue();
    expect(config.timer.modo).toBe('metadatoFormulario');
    expect(config.timer.idDocumento).toBe(795);
    expect(config.timer.idMetadato).toBeNull();
  });

  it('mapea timer de transición en modo tiempo', () => {
    const transicion: TransicionTareaProceso = {
      ...TRANSICION_BASE,
      timers: [
        {
          es_fecha: false,
          doc_comun_id: null,
          hora: '',
          id_unidad_tiempo: 'dias',
          es_tiempo: true,
          id_timer_proceso: 1834,
          fecha: '',
          id_metadato: 0,
          es_dato_fijo: true,
          id_bloque: 0,
          dato_fijo: '3',
          transition_id: 79294,
          es_met_formulario: false,
        },
      ],
    };

    const config = construirTransicionConfigDesdeActividad(transicion, FORMULARIOS);

    expect(config.timer.datoFijoTipo).toBe('tiempo');
    expect(config.timer.duracionValor).toBe(2);
    expect(config.timer.duracionUnidad).toBe('dias');
    expect(config.timer.idDocumento).toBeNull();
  });

  it('mapea timer de transición en modo fecha', () => {
    const transicion: TransicionTareaProceso = {
      ...TRANSICION_BASE,
      timers: [
        {
          es_fecha: true,
          doc_comun_id: null,
          hora: '10:30',
          id_unidad_tiempo: '',
          es_tiempo: false,
          id_timer_proceso: 1834,
          fecha: '2026-01-31',
          id_metadato: 0,
          es_dato_fijo: true,
          id_bloque: 0,
          dato_fijo: null,
          transition_id: 79294,
          es_met_formulario: false,
        },
      ],
    };

    const config = construirTransicionConfigDesdeActividad(transicion, FORMULARIOS);

    expect(config.timer.datoFijoTipo).toBe('fecha');
    expect(config.timer.fecha).toBe('2026-01-31');
    expect(config.timer.hora).toBe('10:30');
  });

  it('deja interrupción false cuando no viene con_interrupcion', () => {
    const transicion: TransicionTareaProceso = {
      ...TRANSICION_BASE,
      con_interrupcion: undefined,
    };

    const config = construirTransicionConfigDesdeActividad(transicion, FORMULARIOS);

    expect(config.interrupcion).toBeFalse();
  });
});

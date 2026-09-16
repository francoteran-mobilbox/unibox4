import {
  DecisionConfig,
} from '../models/decision-config.model';
import {
  LegacyBpmnNodeSnapshot,
  LegacyBpmnSnapshot,
} from '../models/diagrama.model';
import {
  MensajeConfig,
  MensajeDestinatarios,
} from '../models/mensaje-config.model';
import {
  TimerConfig,
} from '../models/timer-config.model';
import {
  TareaConfig,
} from '../models/tarea-config.model';
import {
  TransicionConfig,
  TransicionReglaNegocio,
  TransicionReglaUsuario,
} from '../models/transicion-config.model';
import { ResultadoValidacionDiagrama } from '../models/validacion-diagrama.model';

export type KindNodoDiagrama =
  | 'inicio'
  | 'tarea'
  | 'decision'
  | 'reglaNegocio'
  | 'mensaje'
  | 'timer'
  | 'fin'
  | 'finTerminate'
  | 'paralelo';

function esEventoInicio(nodo: LegacyBpmnNodeSnapshot): boolean {
  return nodo.type === 'bpmn:StartEvent';
}

function esEventoFin(nodo: LegacyBpmnNodeSnapshot): boolean {
  return nodo.type === 'bpmn:EndEvent';
}

export function kindDeNodo(nodo: LegacyBpmnNodeSnapshot): KindNodoDiagrama {
  switch (nodo.type) {
    case 'bpmn:StartEvent':
      return 'inicio';
    case 'bpmn:Task':
      return 'tarea';
    case 'bpmn:ParallelGateway':
      return 'paralelo';
    case 'bpmn:ExclusiveGateway':
      return 'reglaNegocio';
    case 'bpmn:InclusiveGateway':
      return 'decision';
    case 'bpmn:IntermediateThrowEvent':
      return 'mensaje';
    case 'bpmn:IntermediateCatchEvent':
      return 'timer';
    case 'bpmn:EndEvent':
      return nodo.hasTerminateEventDefinition ? 'finTerminate' : 'fin';
    default:
      return 'tarea';
  }
}

export function nombreDeNodo(nodo: LegacyBpmnNodeSnapshot): string {
  const nombre = nodo.name.trim();

  return nombre !== '' ? nombre : 'Sin nombre';
}

interface GrafoDiagrama {
  readonly nodos: readonly LegacyBpmnNodeSnapshot[];
  readonly entradas: ReadonlyMap<string, readonly string[]>;
  readonly salidas: ReadonlyMap<string, readonly string[]>;
}

function construirGrafo(snapshot: LegacyBpmnSnapshot): GrafoDiagrama {
  const idsValidos = new Set(snapshot.nodes.map((nodo) => nodo.id));
  const entradas = new Map<string, string[]>();
  const salidas = new Map<string, string[]>();

  for (const nodo of snapshot.nodes) {
    entradas.set(nodo.id, []);
    salidas.set(nodo.id, []);
  }

  for (const flujo of snapshot.transitions) {
    if (!idsValidos.has(flujo.sourceId) || !idsValidos.has(flujo.targetId)) {
      continue;
    }

    entradas.get(flujo.targetId)?.push(flujo.sourceId);
    salidas.get(flujo.sourceId)?.push(flujo.targetId);
  }

  return { nodos: snapshot.nodes, entradas, salidas };
}

function resultadoNodo(
  nivel: 'error' | 'advertencia',
  nodo: LegacyBpmnNodeSnapshot,
  mensaje: string,
): ResultadoValidacionDiagrama {
  return {
    nivel,
    mensaje,
    elementoId: nodo.id,
    elementoNombre: nombreDeNodo(nodo),
  };
}

function alcanzablesDesde(
  inicios: readonly LegacyBpmnNodeSnapshot[],
  salidas: ReadonlyMap<string, readonly string[]>,
): Set<string> {
  const alcanzables = new Set<string>();
  const pendientes = inicios.map((nodo) => nodo.id);

  while (pendientes.length > 0) {
    const id = pendientes.pop() ?? '';

    if (alcanzables.has(id)) {
      continue;
    }

    alcanzables.add(id);

    for (const destino of salidas.get(id) ?? []) {
      if (!alcanzables.has(destino)) {
        pendientes.push(destino);
      }
    }
  }

  return alcanzables;
}

export function validarEstructuraDiagrama(
  snapshot: LegacyBpmnSnapshot,
): readonly ResultadoValidacionDiagrama[] {
  // Snapshot vacío = no hay diagrama renderizado: nada que validar estructuralmente.
  if (snapshot.nodes.length === 0) {
    return [];
  }

  const resultados: ResultadoValidacionDiagrama[] = [];
  const grafo = construirGrafo(snapshot);
  const inicios = grafo.nodos.filter(esEventoInicio);
  const fines = grafo.nodos.filter(esEventoFin);

  if (inicios.length === 0) {
    resultados.push({ nivel: 'error', mensaje: 'El diagrama no tiene evento de inicio.' });
  }

  if (fines.length === 0) {
    resultados.push({ nivel: 'error', mensaje: 'El diagrama no tiene evento de fin.' });
  }

  for (const nodo of grafo.nodos) {
    const kind = kindDeNodo(nodo);
    const entradas = grafo.entradas.get(nodo.id) ?? [];
    const salidas = grafo.salidas.get(nodo.id) ?? [];

    if (kind === 'inicio' && salidas.length === 0) {
      resultados.push(
        resultadoNodo(
          'error',
          nodo,
          `El evento de inicio «${nombreDeNodo(nodo)}» (${nodo.id}) no tiene conexiones salientes.`,
        ),
      );
    }

    if (kind === 'inicio' && entradas.length > 0) {
      resultados.push(
        resultadoNodo(
          'error',
          nodo,
          `El evento de inicio no puede recibir conexiones entrantes.`,
        ),
      );
    }

    if (esEventoFin(nodo) && entradas.length === 0) {
      resultados.push(
        resultadoNodo(
          'error',
          nodo,
          `El evento de fin «${nombreDeNodo(nodo)}» (${nodo.id}) no tiene conexiones entrantes.`,
        ),
      );
    }

    if (esEventoFin(nodo) && salidas.length > 0) {
      resultados.push(
        resultadoNodo(
          'error',
          nodo,
          `El evento de fin no puede tener conexiones salientes.`,
        ),
      );
    }

    if (kind !== 'inicio' && !esEventoFin(nodo) && entradas.length === 0) {
      resultados.push(
        resultadoNodo(
          'error',
          nodo,
          `«${nombreDeNodo(nodo)}» (${nodo.id}) no tiene conexiones entrantes.`,
        ),
      );
    }

    if (!esEventoFin(nodo) && kind !== 'inicio' && salidas.length === 0) {
      resultados.push(
        resultadoNodo(
          'error',
          nodo,
          `«${nombreDeNodo(nodo)}» (${nodo.id}) no tiene conexiones salientes.`,
        ),
      );
    }

    if (nodo.type === 'bpmn:ExclusiveGateway' && entradas.length === 1 && salidas.length === 1) {
      resultados.push(
        resultadoNodo(
          'advertencia',
          nodo,
          `El gateway «${nombreDeNodo(nodo)}» (${nodo.id}) tiene una única entrada y una única salida.`,
        ),
      );
    }
  }

  if (inicios.length > 0) {
    const alcanzables = alcanzablesDesde(inicios, grafo.salidas);

    for (const nodo of grafo.nodos) {
      if (!esEventoInicio(nodo) && !alcanzables.has(nodo.id)) {
        resultados.push(
          resultadoNodo(
            'error',
            nodo,
            `«${nombreDeNodo(nodo)}» (${nodo.id}) no es alcanzable desde el inicio.`,
          ),
        );
      }
    }
  }

  return resultados;
}

// ====== Capa dominio ======

export interface EntradaValidacionDiagrama {
  readonly tareaConfigs?: Readonly<Record<string, TareaConfig>>;
  readonly timerConfigs?: Readonly<Record<string, TimerConfig>>;
  readonly mensajeConfigs?: Readonly<Record<string, MensajeConfig>>;
  readonly decisionConfigs?: Readonly<Record<string, DecisionConfig>>;
  readonly transicionConfigs?: Readonly<Record<string, TransicionConfig>>;
  readonly omitirValidacionMensaje?: boolean;
}

function destinoMensajeConfigurado(destino: MensajeDestinatarios): boolean {
  return (
    destino.usuariosSistema.length > 0 ||
    destino.usuariosExternos.length > 0 ||
    destino.referencias.some(
      (referencia) =>
        referencia.idDocumento !== null &&
        referencia.idMetadato !== null &&
        referencia.idMetadato.trim() !== '',
    )
  );
}

function timerTransicionIncompleto(timer: TimerConfig): string | null {
  if (timer.modo === 'datoFijo' && timer.datoFijoTipo === 'tiempo') {
    if (timer.duracionValor === null || timer.duracionValor < 1 || timer.duracionUnidad === null) {
      return 'completa la duración del timer (valor y unidad)';
    }
  }

  if (timer.modo === 'datoFijo' && timer.datoFijoTipo === 'fecha') {
    if (timer.fecha === null) {
      return 'selecciona la fecha del timer';
    }
  }

  if (timer.modo === 'metadatoFormulario') {
    if (timer.idDocumento === null || timer.idMetadato === null) {
      return 'selecciona documento y metadato del timer';
    }
  }

  return null;
}

function validarTareaNodo(
  nodo: LegacyBpmnNodeSnapshot,
  config: TareaConfig | undefined,
  resultados: ResultadoValidacionDiagrama[],
): void {
  if (config === undefined) {
    resultados.push(
      resultadoNodo(
        'error',
        nodo,
        `La tarea «${nombreDeNodo(nodo)}» (${nodo.id}) no está configurada.`,
      ),
    );
    return;
  }

  if (config.nombre.trim() === '') {
    resultados.push(resultadoNodo('error', nodo, `La tarea no tiene nombre.`));
  }

  // La duración no se valida a nivel diagrama: activity_time puede ser 0.

  if (config.cargo === null || config.cargo.trim() === '') {
    resultados.push(resultadoNodo('error', nodo, `La tarea «${nombreDeNodo(nodo)}» (${nodo.id}) no tiene cargo seleccionado.`));
  }

  if (config.ejecutaFuncionalidad === true && config.funcionalidad === null) {
    resultados.push(
      resultadoNodo('error', nodo, `La tarea «${nombreDeNodo(nodo)}» (${nodo.id}) no tiene funcionalidad seleccionada.`),
    );
  }

  const esCmf = config.ejecutaFuncionalidad === true && config.funcionalidad === 'cmf';

  if (esCmf) {
    const seleccion = config.formularioRequeridoSeleccionado;

    if (seleccion === null || seleccion.idFormulario === 0) {
      resultados.push(
        resultadoNodo(
          'error',
          nodo,
          `La tarea «${nombreDeNodo(nodo)}» (${nodo.id}) no tiene formulario de proceso seleccionado.`,
        ),
      );
    }
    // Los metadatos seleccionados pueden estar vacíos: no se validan.
  }
}

function validarTimerNodo(
  nodo: LegacyBpmnNodeSnapshot,
  config: TimerConfig | undefined,
  resultados: ResultadoValidacionDiagrama[],
): void {
  if (config === undefined) {
    resultados.push(
      resultadoNodo(
        'error',
        nodo,
        `El timer «${nombreDeNodo(nodo)}» (${nodo.id}) no está configurado.`,
      ),
    );
    return;
  }

  const detalle = timerTransicionIncompleto(config);

  if (detalle !== null) {
    resultados.push(
      resultadoNodo('error', nodo, `El timer «${nombreDeNodo(nodo)}» (${nodo.id}) está incompleto: ${detalle}.`),
    );
  }
}

function validarDecisionNodo(
  nodo: LegacyBpmnNodeSnapshot,
  config: DecisionConfig | undefined,
  resultados: ResultadoValidacionDiagrama[],
): void {
  if (config === undefined) {
    resultados.push(
      resultadoNodo(
        'error',
        nodo,
        `La decisión «${nombreDeNodo(nodo)}» (${nodo.id}) no está configurada.`,
      ),
    );
    return;
  }

  if (config.nombre.trim() === '') {
    resultados.push(resultadoNodo('error', nodo, `La decisión «${nombreDeNodo(nodo)}» (${nodo.id}) no tiene nombre.`));
  }

  if (config.duracionValor === null || config.duracionValor < 1) {
    resultados.push(resultadoNodo('error', nodo, `La decisión «${nombreDeNodo(nodo)}» (${nodo.id}) no tiene duración válida.`));
  }

  if (config.duracionUnidad === null) {
    resultados.push(resultadoNodo('error', nodo, `La decisión «${nombreDeNodo(nodo)}» (${nodo.id}) no tiene unidad de duración.`));
  }

  if (config.cargo === null || config.cargo.trim() === '') {
    resultados.push(resultadoNodo('error', nodo, `La decisión «${nombreDeNodo(nodo)}» (${nodo.id}) no tiene cargo seleccionado.`));
  }

  const freg = config.ejecutaFuncionalidad === true && config.funcionalidad === 'freg';

  if (freg && config.documento === null) {
    resultados.push(
      resultadoNodo(
        'error',
        nodo,
        `La decisión «${nombreDeNodo(nodo)}» (${nodo.id}) no tiene documento seleccionado.`,
      ),
    );
  }

  if (config.aplicarJornadaLaboral === true && (config.jornada === null || config.calendario === null)) {
    resultados.push(
      resultadoNodo('error', nodo, `La decisión «${nombreDeNodo(nodo)}» (${nodo.id}) no tiene jornada y calendario completos.`),
    );
  }
}

function validarMensajeNodo(
  nodo: LegacyBpmnNodeSnapshot,
  config: MensajeConfig | undefined,
  resultados: ResultadoValidacionDiagrama[],
): void {
  if (config === undefined) {
    resultados.push(
      resultadoNodo(
        'error',
        nodo,
        `El mensaje «${nombreDeNodo(nodo)}» (${nodo.id}) no está configurado.`,
      ),
    );
    return;
  }

  const faltantes: string[] = [];

  if (config.asunto.trim() === '') {
    faltantes.push('asunto');
  }

  if (config.contenido.trim() === '') {
    faltantes.push('contenido');
  }

  const destinoOk =
    config.enviarACargo === true ||
    destinoMensajeConfigurado(config.destinatarios) ||
    destinoMensajeConfigurado(config.destinatariosCc);

  if (!destinoOk) {
    faltantes.push('destinatarios');
  }

  if (faltantes.length > 0) {
    resultados.push(
      resultadoNodo(
        'error',
        nodo,
        `El mensaje «${nombreDeNodo(nodo)}» (${nodo.id}) está incompleto: ${faltantes.join(', ')}.`,
      ),
    );
  }
}

function reglasUsuarioIncompletas(reglas: readonly TransicionReglaUsuario[]): boolean {
  return reglas.some((regla) => {
    const tieneDoc = regla.idDocumento !== null && regla.idDocumento !== 0;
    const tieneMet = regla.idMetadato !== null && regla.idMetadato.trim() !== '';

    return (tieneDoc || tieneMet) && !(tieneDoc && tieneMet);
  });
}

function reglasNegocioIncompletas(reglas: readonly TransicionReglaNegocio[]): boolean {
  return reglas.some((regla) => {
    const tieneDoc = regla.idDocumento !== null && regla.idDocumento !== 0;
    const tieneMet = regla.idMetadato !== null && regla.idMetadato.trim() !== '';
    const vacia = !tieneDoc && !tieneMet;

    if (vacia) {
      return false;
    }

    if (!(tieneDoc && tieneMet)) {
      return true;
    }

    return regla.fuenteValor === 'valor'
      ? regla.valorTexto === ''
      : regla.idDocumentoValor === null ||
          regla.idDocumentoValor === 0 ||
          regla.idMetadatoValor === null ||
          regla.idMetadatoValor.trim() === '';
  });
}

export function validarDominioDiagrama(
  snapshot: LegacyBpmnSnapshot,
  entrada: EntradaValidacionDiagrama,
): readonly ResultadoValidacionDiagrama[] {
  const resultados: ResultadoValidacionDiagrama[] = [];
  const grafo = construirGrafo(snapshot);
  const porId = new Map(grafo.nodos.map((nodo) => [nodo.id, nodo]));
  const tareaConfigs = entrada.tareaConfigs ?? {};
  const timerConfigs = entrada.timerConfigs ?? {};
  const mensajeConfigs = entrada.mensajeConfigs ?? {};
  const decisionConfigs = entrada.decisionConfigs ?? {};
  const transicionConfigs = entrada.transicionConfigs ?? {};

  for (const nodo of grafo.nodos) {
    const kind = kindDeNodo(nodo);

    if (kind === 'tarea') {
      validarTareaNodo(nodo, tareaConfigs[nodo.id], resultados);
    } else if (kind === 'timer') {
      validarTimerNodo(nodo, timerConfigs[nodo.id], resultados);
    } else if (kind === 'mensaje') {
      if (entrada.omitirValidacionMensaje !== true) {
        validarMensajeNodo(nodo, mensajeConfigs[nodo.id], resultados);
      }
    } else if (kind === 'decision') {
      validarDecisionNodo(nodo, decisionConfigs[nodo.id], resultados);
    }
  }

  for (const flujo of snapshot.transitions) {
    const origen = porId.get(flujo.sourceId);
    const destino = porId.get(flujo.targetId);

    if (origen === undefined || destino === undefined) {
      continue;
    }

    const kindOrigen = kindDeNodo(origen);
    const config = transicionConfigs[flujo.id];

    if (kindOrigen === 'reglaNegocio' || kindOrigen === 'decision') {
      // Las salidas de decisión con acción configurada no requieren reglas de negocio.
      const exentaPorAccion =
        kindOrigen === 'decision' &&
        config !== undefined &&
        config.accion !== null;

      if (!exentaPorAccion && (config === undefined || config.reglasNegocio.length === 0)) {
        resultados.push(
          resultadoNodo(
            'error',
            origen,
            `El gateway «${nombreDeNodo(origen)}» (${origen.id}) no tiene reglas de negocio en la salida hacia «${nombreDeNodo(destino)}».`,
          ),
        );
      }
    }

    if (config === undefined) {
      continue;
    }

    if (config.requiereTimer === true) {
      const detalle = timerTransicionIncompleto(config.timer);

      if (detalle !== null) {
        resultados.push(
          resultadoNodo(
            'error',
            origen,
            `La transición hacia «${nombreDeNodo(destino)}» tiene un timer incompleto: ${detalle}.`,
          ),
        );
      }
    }

    if (config.reglasUsuario.length > 0 && reglasUsuarioIncompletas(config.reglasUsuario)) {
      resultados.push(
        resultadoNodo(
          'error',
          origen,
          `La transición hacia «${nombreDeNodo(destino)}» tiene reglas de usuario incompletas.`,
        ),
      );
    }

    if (config.reglasNegocio.length > 0 && reglasNegocioIncompletas(config.reglasNegocio)) {
      resultados.push(
        resultadoNodo(
          'error',
          origen,
          `La transición hacia «${nombreDeNodo(destino)}» tiene reglas de negocio incompletas.`,
        ),
      );
    }
  }

  return resultados;
}

export function validarDiagrama(
  snapshot: LegacyBpmnSnapshot,
  entrada: EntradaValidacionDiagrama,
): readonly ResultadoValidacionDiagrama[] {
  const resultados = [
    ...validarEstructuraDiagrama(snapshot),
    ...validarDominioDiagrama(snapshot, entrada),
  ];

  return [
    ...resultados.filter((resultado) => resultado.nivel === 'error'),
    ...resultados.filter((resultado) => resultado.nivel === 'advertencia'),
  ];
}

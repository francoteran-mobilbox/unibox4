import {
  DecisionConfig,
  buildDefaultDecisionConfig,
} from '../models/decision-config.model';
import {
  LegacyBpmnNodeSnapshot,
  LegacyBpmnSnapshot,
  LegacyBpmnTransitionSnapshot,
} from '../models/diagrama.model';
import {
  MensajeConfig,
  buildDefaultMensajeConfig,
} from '../models/mensaje-config.model';
import {
  TimerConfig,
  buildDefaultTimerConfig,
} from '../models/timer-config.model';
import {
  TareaConfig,
  buildDefaultTareaConfig,
} from '../models/tarea-config.model';
import {
  TransicionConfig,
  buildDefaultTransicionConfig,
} from '../models/transicion-config.model';
import {
  validarDiagrama,
  validarDominioDiagrama,
  validarEstructuraDiagrama,
} from './validador-diagrama';

function nodo(
  id: string,
  type: string,
  overrides: Partial<LegacyBpmnNodeSnapshot> = {},
): LegacyBpmnNodeSnapshot {
  return {
    id,
    type,
    name: '',
    x: 0,
    y: 0,
    width: 100,
    height: 60,
    hasMessageEventDefinition: false,
    hasTimerEventDefinition: false,
    hasTerminateEventDefinition: false,
    ...overrides,
  };
}

function flujo(
  id: string,
  sourceId: string,
  targetId: string,
): LegacyBpmnTransitionSnapshot {
  return { id, sourceId, targetId, name: '' };
}

function mensajesDe(resultados: readonly { mensaje: string }[]): string[] {
  return resultados.map((resultado) => resultado.mensaje);
}

function entrada(configs: {
  tareaConfigs?: Readonly<Record<string, TareaConfig>>;
  timerConfigs?: Readonly<Record<string, TimerConfig>>;
  mensajeConfigs?: Readonly<Record<string, MensajeConfig>>;
  decisionConfigs?: Readonly<Record<string, DecisionConfig>>;
  transicionConfigs?: Readonly<Record<string, TransicionConfig>>;
  omitirValidacionMensaje?: boolean;
}): {
  tareaConfigs: Record<string, TareaConfig>;
  timerConfigs: Record<string, TimerConfig>;
  mensajeConfigs: Record<string, MensajeConfig>;
  decisionConfigs: Record<string, DecisionConfig>;
  transicionConfigs: Record<string, TransicionConfig>;
  omitirValidacionMensaje?: boolean;
} {
  return {
    tareaConfigs: configs.tareaConfigs ?? {},
    timerConfigs: configs.timerConfigs ?? {},
    mensajeConfigs: configs.mensajeConfigs ?? {},
    decisionConfigs: configs.decisionConfigs ?? {},
    transicionConfigs: configs.transicionConfigs ?? {},
    omitirValidacionMensaje: configs.omitirValidacionMensaje,
  };
}

describe('validarEstructuraDiagrama', () => {
  it('snapshot vacío no genera falsos "sin evento de inicio/fin"', () => {
    expect(validarEstructuraDiagrama({ nodes: [], transitions: [] })).toEqual([]);
  });

  it('valida un diagrama completo sin errores ni advertencias', () => {
    const snapshot = {
      nodes: [
        nodo('S', 'bpmn:StartEvent', { name: 'Inicio' }),
        nodo('T', 'bpmn:Task', { name: 'Tarea' }),
        nodo('F', 'bpmn:EndEvent', { name: 'Fin' }),
      ],
      transitions: [flujo('f1', 'S', 'T'), flujo('f2', 'T', 'F')],
    };

    expect(validarEstructuraDiagrama(snapshot)).toEqual([]);
  });

  it('reporta la ausencia de evento de inicio', () => {
    const snapshot = {
      nodes: [nodo('T', 'bpmn:Task'), nodo('F', 'bpmn:EndEvent')],
      transitions: [flujo('f1', 'T', 'F')],
    };

    const resultados = validarEstructuraDiagrama(snapshot);

    expect(mensajesDe(resultados)).toContain('El diagrama no tiene evento de inicio.');
  });

  it('reporta la ausencia de evento de fin', () => {
    const snapshot = {
      nodes: [nodo('S', 'bpmn:StartEvent'), nodo('T', 'bpmn:Task')],
      transitions: [flujo('f1', 'S', 'T')],
    };

    const resultados = validarEstructuraDiagrama(snapshot);

    expect(mensajesDe(resultados)).toContain('El diagrama no tiene evento de fin.');
  });

  it('detecta nodos sin conexiones entrantes', () => {
    const snapshot = {
      nodes: [
        nodo('S', 'bpmn:StartEvent', { name: 'Inicio' }),
        nodo('A', 'bpmn:Task', { name: 'Tarea A' }),
        nodo('F', 'bpmn:EndEvent', { name: 'Fin' }),
      ],
      transitions: [flujo('f2', 'A', 'F'), flujo('f3', 'S', 'F')],
    };
    // A tiene salidas pero ninguna entrada (huérfano).

    const resultados = validarEstructuraDiagrama(snapshot);

    expect(
      resultados.some(
        (r) =>
          r.elementoId === 'A' && r.mensaje.includes('no tiene conexiones entrantes'),
      ),
    ).toBeTrue();
  });

  it('detecta nodos sin conexiones salientes', () => {
    const snapshot = {
      nodes: [
        nodo('S', 'bpmn:StartEvent', { name: 'Inicio' }),
        nodo('A', 'bpmn:Task', { name: 'Tarea A' }),
        nodo('F', 'bpmn:EndEvent', { name: 'Fin' }),
      ],
      transitions: [flujo('f1', 'S', 'A'), flujo('f2', 'S', 'F')],
    };

    const resultados = validarEstructuraDiagrama(snapshot);

    expect(
      resultados.some(
        (r) =>
          r.elementoId === 'A' && r.mensaje.includes('no tiene conexiones salientes'),
      ),
    ).toBeTrue();
  });

  it('detecta nodos no alcanzables desde el inicio', () => {
    const snapshot = {
      nodes: [
        nodo('S', 'bpmn:StartEvent', { name: 'Inicio' }),
        nodo('A', 'bpmn:Task', { name: 'Tarea A' }),
        nodo('F', 'bpmn:EndEvent', { name: 'Fin' }),
        nodo('X', 'bpmn:Task', { name: 'Tarea X' }),
        nodo('Y', 'bpmn:Task', { name: 'Tarea Y' }),
      ],
      transitions: [flujo('f1', 'S', 'A'), flujo('f2', 'A', 'F'), flujo('f3', 'X', 'Y')],
    };
    // X e Y están conectados entre sí pero inalcanzables desde S.

    const resultados = validarEstructuraDiagrama(snapshot);

    expect(
      resultados.some(
        (r) => r.elementoId === 'Y' && r.mensaje.includes('no es alcanzable'),
      ),
    ).toBeTrue();
  });

  it('marca como advertencia el gateway passthrough', () => {
    const snapshot = {
      nodes: [
        nodo('S', 'bpmn:StartEvent', { name: 'Inicio' }),
        nodo('G', 'bpmn:ExclusiveGateway', { name: 'Gateway' }),
        nodo('F', 'bpmn:EndEvent', { name: 'Fin' }),
      ],
      transitions: [flujo('f1', 'S', 'G'), flujo('f2', 'G', 'F')],
    };

    const resultados = validarEstructuraDiagrama(snapshot);

    expect(
      resultados.some(
        (r) =>
          r.elementoId === 'G' &&
          r.nivel === 'advertencia' &&
          r.mensaje.includes('única entrada y una única salida'),
      ),
    ).toBeTrue();
  });

  it('no marca passthrough en la decisión (inclusive) con única entrada y salida', () => {
    const snapshot = {
      nodes: [
        nodo('S', 'bpmn:StartEvent', { name: 'Inicio' }),
        nodo('D', 'bpmn:InclusiveGateway', { name: 'Decisión' }),
        nodo('F', 'bpmn:EndEvent', { name: 'Fin' }),
      ],
      transitions: [flujo('f1', 'S', 'D'), flujo('f2', 'D', 'F')],
    };

    const resultados = validarEstructuraDiagrama(snapshot);

    expect(resultados.some((r) => r.mensaje.includes('única entrada y una única salida'))).toBeFalse();
  });

  it('rechaza entradas al inicio y salidas desde el fin', () => {
    const snapshot = {
      nodes: [
        nodo('S', 'bpmn:StartEvent', { name: 'Inicio' }),
        nodo('T', 'bpmn:Task', { name: 'Tarea' }),
        nodo('F', 'bpmn:EndEvent', { name: 'Fin' }),
      ],
      transitions: [flujo('f1', 'S', 'T'), flujo('f2', 'F', 'T'), flujo('f3', 'F', 'S')],
    };

    const mensajes = mensajesDe(validarEstructuraDiagrama(snapshot));

    expect(mensajes).toContain('El evento de inicio no puede recibir conexiones entrantes.');
    expect(mensajes).toContain('El evento de fin no puede tener conexiones salientes.');
  });

  it('incluye nombre e id del elemento en los resultados por nodo', () => {
    const snapshot = {
      nodes: [
        nodo('S', 'bpmn:StartEvent', { name: 'Inicio' }),
        nodo('A', 'bpmn:Task', { name: 'Tarea A' }),
        nodo('F', 'bpmn:EndEvent', { name: 'Fin' }),
      ],
      transitions: [flujo('f1', 'S', 'A')],
    };

    const resultados = validarEstructuraDiagrama(snapshot);
    const resultadoA = resultados.find((r) => r.elementoId === 'A');

    expect(resultadoA?.elementoNombre).toBe('Tarea A');
  });
});

describe('validarDominioDiagrama', () => {
  it('reporta tarea sin configurar', () => {
    const resultados = validarDominioDiagrama(snapshotBase(), entrada({}));

    expect(mensajesDe(resultados)).toContain('La tarea «Tarea» (T) no está configurada.');
  });

  it('reporta tarea cmf sin formulario de proceso', () => {
    const tareaConfig: TareaConfig = {
      ...buildDefaultTareaConfig('Tarea'),
      duracionValor: 1,
      duracionUnidad: 'dias',
      cargo: '46',
      ejecutaFuncionalidad: true,
      funcionalidad: 'cmf',
      formularioRequeridoSeleccionado: null,
    };

    const resultados = validarDominioDiagrama(
      snapshotBase(),
      entrada({ tareaConfigs: { T: tareaConfig } }),
    );

    expect(
      resultados.some((r) => r.mensaje.includes('no tiene formulario de proceso seleccionado')),
    ).toBeTrue();
  });

  it('permite tarea cmf sin metadatos seleccionados', () => {
    const tareaConfig: TareaConfig = {
      ...buildDefaultTareaConfig('Tarea'),
      duracionValor: 1,
      duracionUnidad: 'dias',
      cargo: '46',
      ejecutaFuncionalidad: true,
      funcionalidad: 'cmf',
      formularioRequeridoSeleccionado: {
        idFormulario: 795,
        nombre: 'Flag',
        visibilidad: 'privado',
        metadatosSeleccionados: [],
      },
    };

    const resultados = validarDominioDiagrama(
      snapshotBase(),
      entrada({ tareaConfigs: { T: tareaConfig } }),
    );

    expect(resultados.some((r) => r.mensaje.includes('no tiene metadatos seleccionados'))).toBeFalse();
  });

  it('reporta tarea sin cargo', () => {
    const tareaConfig: TareaConfig = {
      ...buildDefaultTareaConfig('Tarea'),
      duracionValor: 1,
      duracionUnidad: 'dias',
    };

    const resultados = validarDominioDiagrama(
      snapshotBase(),
      entrada({ tareaConfigs: { T: tareaConfig } }),
    );

    expect(resultados.some((r) => r.mensaje.includes('no tiene cargo seleccionado'))).toBeTrue();
  });

  it('valida tarea configurada correctamente sin resultados', () => {
    const tareaConfig: TareaConfig = {
      ...buildDefaultTareaConfig('Tarea'),
      duracionValor: 1,
      duracionUnidad: 'dias',
      cargo: '46',
    };

    const resultados = validarDominioDiagrama(
      snapshotBase(),
      entrada({ tareaConfigs: { T: tareaConfig } }),
    );

    expect(resultados).toEqual([]);
  });

  it('reporta timer incompleto según modo', () => {
    const timerConfig: TimerConfig = {
      ...buildDefaultTimerConfig(),
      modo: 'datoFijo',
      datoFijoTipo: 'tiempo',
      duracionValor: 2,
      duracionUnidad: null,
    };

    const snapshot = {
      nodes: [
        nodo('S', 'bpmn:StartEvent', { name: 'Inicio' }),
        nodo('W', 'bpmn:IntermediateCatchEvent', { name: 'Timer', hasTimerEventDefinition: true }),
        nodo('F', 'bpmn:EndEvent', { name: 'Fin' }),
      ],
      transitions: [flujo('f1', 'S', 'W'), flujo('f2', 'W', 'F')],
    };

    const resultados = validarDominioDiagrama(snapshot, entrada({ timerConfigs: { W: timerConfig } }));

    expect(resultados.some((r) => r.mensaje.includes('está incompleto'))).toBeTrue();
  });

  it('reporta mensaje sin destino ni asunto', () => {
    const mensajeConfig: MensajeConfig = buildDefaultMensajeConfig();

    const snapshot = {
      nodes: [
        nodo('S', 'bpmn:StartEvent', { name: 'Inicio' }),
        nodo('M', 'bpmn:IntermediateThrowEvent', { name: 'Mensaje', hasMessageEventDefinition: true }),
        nodo('F', 'bpmn:EndEvent', { name: 'Fin' }),
      ],
      transitions: [flujo('f1', 'S', 'M'), flujo('f2', 'M', 'F')],
    };

    const resultados = validarDominioDiagrama(
      snapshot,
      entrada({ mensajeConfigs: { M: mensajeConfig } }),
    );

    expect(
      resultados.some((r) => r.mensaje.includes('está incompleto: asunto, contenido, destinatarios')),
    ).toBeTrue();
  });

  it('omite la validación de mensaje cuando omitirValidacionMensaje es true', () => {
    const mensajeConfig: MensajeConfig = buildDefaultMensajeConfig();

    const snapshot = {
      nodes: [
        nodo('S', 'bpmn:StartEvent', { name: 'Inicio' }),
        nodo('M', 'bpmn:IntermediateThrowEvent', { name: 'Mensaje', hasMessageEventDefinition: true }),
        nodo('F', 'bpmn:EndEvent', { name: 'Fin' }),
      ],
      transitions: [flujo('f1', 'S', 'M'), flujo('f2', 'M', 'F')],
    };

    const resultados = validarDominioDiagrama(
      snapshot,
      entrada({
        mensajeConfigs: { M: mensajeConfig },
        omitirValidacionMensaje: true,
      }),
    );

    expect(resultados.some((r) => r.mensaje.includes('está incompleto'))).toBeFalse();
    expect(resultados.some((r) => r.mensaje.includes('no está configurado'))).toBeFalse();
  });

  it('reporta decisión freg sin documento', () => {
    const decisionConfig: DecisionConfig = {
      ...buildDefaultDecisionConfig('Decisión'),
      duracionValor: 1,
      duracionUnidad: 'dias',
      cargo: '46',
      ejecutaFuncionalidad: true,
      funcionalidad: 'freg',
      documento: null,
    };

    const snapshot = {
      nodes: [
        nodo('S', 'bpmn:StartEvent', { name: 'Inicio' }),
        nodo('D', 'bpmn:InclusiveGateway', { name: 'Decisión' }),
        nodo('F', 'bpmn:EndEvent', { name: 'Fin' }),
      ],
      transitions: [flujo('f1', 'S', 'D'), flujo('f2', 'D', 'F')],
    };

    const resultados = validarDominioDiagrama(
      snapshot,
      entrada({ decisionConfigs: { D: decisionConfig } }),
    );

    expect(resultados.some((r) => r.mensaje.includes('no tiene documento seleccionado'))).toBeTrue();
  });

  it('reporta gateway sin reglas de negocio en su salida', () => {
    const resultados = validarDominioDiagrama(snapshotConGateway(), entrada({}));

    expect(
      resultados.some(
        (r) => r.elementoId === 'G' && r.mensaje.includes('no tiene reglas de negocio'),
      ),
    ).toBeTrue();
  });

  it('acepta gateway con reglas de negocio en su salida', () => {
    const transicionConfig: TransicionConfig = {
      ...buildDefaultTransicionConfig(),
      reglasNegocio: [
        {
          idDocumento: 795,
          idMetadato: 'BM2177-866',
          operador: 'contiene',
          fuenteValor: 'valor',
          valorTexto: 'A',
          idDocumentoValor: null,
          idMetadatoValor: null,
        },
      ],
    };

    const resultados = validarDominioDiagrama(
      snapshotConGateway(),
      entrada({ transicionConfigs: { f2: transicionConfig } }),
    );

    expect(resultados.some((r) => r.mensaje.includes('no tiene reglas de negocio'))).toBeFalse();
  });

  it('reporta transición con requiereTimer incompleto', () => {
    const transicionConfig: TransicionConfig = {
      ...buildDefaultTransicionConfig(),
      requiereTimer: true,
      timer: {
        ...buildDefaultTimerConfig(),
        modo: 'datoFijo',
        datoFijoTipo: 'tiempo',
        duracionValor: 2,
        duracionUnidad: null,
      },
    };

    const resultados = validarDominioDiagrama(
      snapshotBase(),
      entrada({ transicionConfigs: { 'S-T': transicionConfig } }),
    );

    expect(resultados.some((r) => r.mensaje.includes('timer incompleto'))).toBeTrue();
  });

  it('reporta reglas de usuario incompletas', () => {
    const transicionConfig: TransicionConfig = {
      ...buildDefaultTransicionConfig(),
      reglasUsuario: [
        {
          idDocumento: 795,
          idMetadato: null,
          interpretacion: 'id',
        },
      ],
    };

    const resultados = validarDominioDiagrama(
      snapshotBase(),
      entrada({ transicionConfigs: { 'S-T': transicionConfig } }),
    );

    expect(resultados.some((r) => r.mensaje.includes('reglas de usuario incompletas'))).toBeTrue();
  });
});

describe('validarDiagrama (combinada)', () => {
  it('ordena errores primero y advertencias después', () => {
    const snapshot = {
      nodes: [
        nodo('S', 'bpmn:StartEvent', { name: 'Inicio' }),
        nodo('T', 'bpmn:Task', { name: 'Tarea' }),
        nodo('G', 'bpmn:ExclusiveGateway', { name: 'Gateway' }),
        nodo('F', 'bpmn:EndEvent', { name: 'Fin' }),
      ],
      transitions: [flujo('f1', 'S', 'T'), flujo('f2', 'T', 'G'), flujo('f3', 'G', 'F')],
    };

    const resultados = validarDiagrama(snapshot, entrada({}));

    const primerAdvertencia = resultados.findIndex((r) => r.nivel === 'advertencia');
    const ultimoError = resultados.reduce(
      (ultimo, r, indice) => (r.nivel === 'error' ? indice : ultimo),
      -1,
    );

    expect(primerAdvertencia).toBeGreaterThan(-1);
    expect(ultimoError).toBeLessThan(primerAdvertencia);
    expect(resultados.some((r) => r.nivel === 'error' && r.mensaje.includes('no está configurada'))).toBeTrue();
    expect(resultados.some((r) => r.nivel === 'advertencia' && r.mensaje.includes('única entrada'))).toBeTrue();
  });
});

function snapshotBase(): LegacyBpmnSnapshot {
  return {
    nodes: [
      nodo('S', 'bpmn:StartEvent', { name: 'Inicio' }),
      nodo('T', 'bpmn:Task', { name: 'Tarea' }),
      nodo('F', 'bpmn:EndEvent', { name: 'Fin' }),
    ],
    transitions: [flujo('S-T', 'S', 'T'), flujo('T-F', 'T', 'F')],
  };
}

function snapshotConGateway(): LegacyBpmnSnapshot {
  return {
    nodes: [
      nodo('S', 'bpmn:StartEvent', { name: 'Inicio' }),
      nodo('G', 'bpmn:ExclusiveGateway', { name: 'Gateway' }),
      nodo('T1', 'bpmn:Task', { name: 'Rama A' }),
      nodo('F', 'bpmn:EndEvent', { name: 'Fin' }),
    ],
    transitions: [flujo('f1', 'S', 'G'), flujo('f2', 'G', 'T1'), flujo('f3', 'T1', 'F')],
  };
}

describe('validador-diagrama - ajustes', () => {
  it('tolera tarea con duración 0 (sin error de duración)', () => {
    const tareaConfig: TareaConfig = {
      ...buildDefaultTareaConfig('Tarea'),
      duracionValor: 0,
      duracionUnidad: 'dias',
      cargo: '46',
    };

    const resultados = validarDominioDiagrama(
      snapshotBase(),
      entrada({ tareaConfigs: { T: tareaConfig } }),
    );

    expect(resultados.some((r) => r.mensaje.includes('duración'))).toBeFalse();
  });

  it('acepta regla de negocio con valor compuesto solo por espacios', () => {
    const transicionConfig: TransicionConfig = {
      ...buildDefaultTransicionConfig(),
      reglasNegocio: [
        {
          idDocumento: 795,
          idMetadato: 'BM2177-866',
          operador: 'contiene',
          fuenteValor: 'valor',
          valorTexto: ' ',
          idDocumentoValor: null,
          idMetadatoValor: null,
        },
      ],
    };

    const snapshot = {
      nodes: [
        nodo('S', 'bpmn:StartEvent', { name: 'Inicio' }),
        nodo('R', 'bpmn:ExclusiveGateway', { name: 'Regla Negocio' }),
        nodo('F', 'bpmn:EndEvent', { name: 'Fin' }),
      ],
      transitions: [flujo('f1', 'S', 'R'), flujo('f2', 'R', 'F')],
    };

    const resultados = validarDominioDiagrama(
      snapshot,
      entrada({ transicionConfigs: { f2: transicionConfig } }),
    );

    expect(resultados.some((r) => r.mensaje.includes('reglas de negocio incompletas'))).toBeFalse();
  });

  it('exenta la salida de decisión con acción de la regla de negocio', () => {
    const transicionConfig: TransicionConfig = {
      ...buildDefaultTransicionConfig(),
      accionRequerida: true,
      accion: 'FIRMAR_TOKEN',
    };

    const snapshot = {
      nodes: [
        nodo('S', 'bpmn:StartEvent', { name: 'Inicio' }),
        nodo('D', 'bpmn:InclusiveGateway', { name: 'Decisión' }),
        nodo('F', 'bpmn:EndEvent', { name: 'Fin' }),
      ],
      transitions: [flujo('f1', 'S', 'D'), flujo('f2', 'D', 'F')],
    };

    const resultados = validarDominioDiagrama(
      snapshot,
      entrada({ transicionConfigs: { f2: transicionConfig } }),
    );

    expect(resultados.some((r) => r.mensaje.includes('no tiene reglas de negocio'))).toBeFalse();
  });

  it('mantiene la exigencia de reglas en salida de gateway exclusivo aunque tenga acción', () => {
    const transicionConfig: TransicionConfig = {
      ...buildDefaultTransicionConfig(),
      accionRequerida: true,
      accion: 'FIRMAR_TOKEN',
    };

    const snapshot = {
      nodes: [
        nodo('S', 'bpmn:StartEvent', { name: 'Inicio' }),
        nodo('R', 'bpmn:ExclusiveGateway', { name: 'Regla Negocio' }),
        nodo('F', 'bpmn:EndEvent', { name: 'Fin' }),
      ],
      transitions: [flujo('f1', 'S', 'R'), flujo('f2', 'R', 'F')],
    };

    const resultados = validarDominioDiagrama(
      snapshot,
      entrada({ transicionConfigs: { f2: transicionConfig } }),
    );

    expect(resultados.some((r) => r.mensaje.includes('no tiene reglas de negocio'))).toBeTrue();
  });
});

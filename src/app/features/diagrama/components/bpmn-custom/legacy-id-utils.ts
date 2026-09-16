import type { ModuleDeclaration } from 'didi';

export interface BpmnBusinessObject {
  id?: string;
  $type?: string;
  eventDefinitions?: readonly { $type?: string }[];
}

export interface BpmnElementRegistry {
  get(id: string): unknown;
  getAll?(): Array<{ id: string }>;
}

export const LEGACY_ID_PATTERN =
  /^(Tarea|Mensaje|Timer|Paralelo|ReglaNegocio|Decision|Inicio|Fin|Termino|Transicion)_\d+$/;

const PREFIX_BY_TYPE: Record<string, string> = {
  'bpmn:Task': 'Tarea',
  'bpmn:StartEvent': 'Inicio',
  'bpmn:EndEvent': 'Fin',
  'bpmn:ExclusiveGateway': 'ReglaNegocio',
  'bpmn:ParallelGateway': 'Paralelo',
  'bpmn:InclusiveGateway': 'Decision',
  'bpmn:SequenceFlow': 'Transicion',
};

const ID_DIGIT_LENGTH = 15;
const CORRELATIVO_DIGIT_LENGTH = 3;

export function resolvePrefix(
  type: string,
  businessObject?: BpmnBusinessObject,
): string | null {
  if (type === 'bpmn:EndEvent') {
    const hasTerminate =
      businessObject?.eventDefinitions?.some(
        (definition) => definition.$type === 'bpmn:TerminateEventDefinition',
      ) ?? false;

    return hasTerminate ? 'Termino' : 'Fin';
  }

  if (
    type === 'bpmn:IntermediateThrowEvent' &&
    businessObject?.eventDefinitions?.some(
      (definition) => definition.$type === 'bpmn:MessageEventDefinition',
    )
  ) {
    return 'Mensaje';
  }

  if (
    type === 'bpmn:IntermediateCatchEvent' &&
    businessObject?.eventDefinitions?.some(
      (definition) => definition.$type === 'bpmn:TimerEventDefinition',
    )
  ) {
    return 'Timer';
  }

  return PREFIX_BY_TYPE[type] ?? null;
}

function construirFechaCorrelativo(): string {
  const ahora = new Date();
  const pad2 = (valor: number) => String(valor).padStart(2, '0');

  return (
    `${pad2(ahora.getDate())}${pad2(ahora.getMonth() + 1)}${ahora.getFullYear()}` +
    `${pad2(ahora.getHours())}${pad2(ahora.getMinutes())}`
  );
}

function parsearCorrelativoFecha(sufijo: string): bigint | null {
  if (sufijo.length !== ID_DIGIT_LENGTH) {
    return null;
  }

  const fecha = sufijo.slice(0, 12);
  const dia = Number(fecha.slice(0, 2));
  const mes = Number(fecha.slice(2, 4));
  const hora = Number(fecha.slice(8, 10));
  const minuto = Number(fecha.slice(10, 12));

  if (dia < 1 || dia > 31 || mes < 1 || mes > 12 || hora > 23 || minuto > 59) {
    return null;
  }

  return BigInt(sufijo.slice(12));
}

function incrementarSufijo(prefijo: string, sufijo: string): string {
  const siguiente = (BigInt(sufijo) + 1n).toString();

  return `${prefijo}_${siguiente.padStart(sufijo.length, '0')}`;
}

function generarIdCorrelativo(prefijo: string, elementRegistry: BpmnElementRegistry): string {
  const regex = new RegExp(`^${prefijo}_(\\d+)$`);
  const sufijos = new Set<string>();

  for (const elemento of elementRegistry.getAll?.() ?? []) {
    const match = elemento.id?.match(regex);

    if (match) {
      sufijos.add(match[1]);
    }
  }

  if (sufijos.size === 0) {
    return `${prefijo}_${construirFechaCorrelativo()}${'1'.padStart(CORRELATIVO_DIGIT_LENGTH, '0')}`;
  }

  const sufijosLista = [...sufijos];
  const todosFormatoFecha = sufijosLista.every(
    (sufijo) => parsearCorrelativoFecha(sufijo) !== null,
  );

  if (todosFormatoFecha) {
    let maxCorrelativo = 0n;

    for (const sufijo of sufijosLista) {
      const correlativo = parsearCorrelativoFecha(sufijo);

      if (correlativo !== null && correlativo > maxCorrelativo) {
        maxCorrelativo = correlativo;
      }
    }

    return `${prefijo}_${construirFechaCorrelativo()}${(maxCorrelativo + 1n)
      .toString()
      .padStart(CORRELATIVO_DIGIT_LENGTH, '0')}`;
  }

  let maxSufijo = sufijosLista[0];

  for (const sufijo of sufijosLista) {
    if (BigInt(sufijo) > BigInt(maxSufijo)) {
      maxSufijo = sufijo;
    }
  }

  return incrementarSufijo(prefijo, maxSufijo);
}

export function generarIdLegacy(
  type: string,
  businessObject: BpmnBusinessObject | undefined,
  elementRegistry: BpmnElementRegistry,
): string | null {
  const prefijo = resolvePrefix(type, businessObject);

  if (!prefijo) {
    return null;
  }

  const regex = new RegExp(`^${prefijo}_(\\d+)$`);
  let id = generarIdCorrelativo(prefijo, elementRegistry);

  let intentos = 0;

  while (elementRegistry.get(id) && intentos < 100) {
    const match = id.match(regex);

    if (!match) {
      break;
    }

    id = incrementarSufijo(prefijo, match[1]);
    intentos += 1;
  }

  return id;
}

export function createLegacyId(
  type: string,
  eventDefinitionType: string | undefined,
  elementRegistry: BpmnElementRegistry,
): string | null {
  const businessObjectStub = eventDefinitionType
    ? { eventDefinitions: [{ $type: eventDefinitionType }] }
    : undefined;

  return generarIdLegacy(type, businessObjectStub, elementRegistry);
}

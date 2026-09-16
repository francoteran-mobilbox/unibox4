export type BpmnElementoKind =
  | 'tarea'
  | 'mensaje'
  | 'timer'
  | 'reglaNegocio'
  | 'paralelo'
  | 'decision'
  | 'transicion';

export type BpmnShapeKind = Exclude<BpmnElementoKind, 'transicion'>;

export type BpmnNodoKind = BpmnShapeKind | 'inicio' | 'fin' | 'finTerminate';

export interface BpmnShapeInfo {
  readonly kind: BpmnShapeKind;
  readonly label: string;
  readonly nombre: string;
  readonly id: string;
}

export interface BpmnTransicionInfo {
  readonly kind: 'transicion';
  readonly label: string;
  readonly nombre: string;
  readonly id: string;
  readonly origen: BpmnNodoKind;
  readonly destino: BpmnNodoKind;
  readonly origenId?: string | null;
  readonly destinoId?: string | null;
}

export type BpmnElementoInfo = BpmnShapeInfo | BpmnTransicionInfo;

interface BpmnResolvableElement {
  readonly id?: string;
  readonly type?: string;
  readonly businessObject?: {
    readonly $type?: string;
    readonly name?: string;
    readonly eventDefinitions?: readonly { readonly $type?: string }[];
  };
}

interface BpmnResolvableConnection extends BpmnResolvableElement {
  readonly source?: BpmnResolvableElement;
  readonly target?: BpmnResolvableElement;
}

const ELEMENT_KIND_LABELS: Record<BpmnShapeKind, string> = {
  tarea: 'Tarea',
  mensaje: 'Mensaje',
  timer: 'Timer',
  reglaNegocio: 'Regla de negocio',
  paralelo: 'Paralelo',
  decision: 'Decisión',
};

const TRANSICION_LABEL = 'Transición';

export const BPMN_NODO_KIND_LABELS: Record<BpmnNodoKind, string> = {
  tarea: 'Tarea',
  mensaje: 'Mensaje',
  timer: 'Timer',
  reglaNegocio: 'Regla de negocio',
  paralelo: 'Enlace paralelo',
  decision: 'Decisión',
  inicio: 'Inicio',
  fin: 'Fin',
  finTerminate: 'Fin (terminación)',
};

function hasEventDefinition(element: BpmnResolvableElement, definitionType: string): boolean {
  return (
    element.businessObject?.eventDefinitions?.some(
      (definition) => definition.$type === definitionType,
    ) ?? false
  );
}

function mapearKindNodo(element: BpmnResolvableElement): BpmnNodoKind | null {
  const type = element.type ?? element.businessObject?.$type ?? '';

  switch (type) {
    case 'bpmn:Task':
      return 'tarea';
    case 'bpmn:IntermediateThrowEvent':
      return hasEventDefinition(element, 'bpmn:MessageEventDefinition') ? 'mensaje' : null;
    case 'bpmn:IntermediateCatchEvent':
      return hasEventDefinition(element, 'bpmn:TimerEventDefinition') ? 'timer' : null;
    case 'bpmn:ExclusiveGateway':
      return 'reglaNegocio';
    case 'bpmn:ParallelGateway':
      return 'paralelo';
    case 'bpmn:InclusiveGateway':
      return 'decision';
    case 'bpmn:StartEvent':
      return 'inicio';
    case 'bpmn:EndEvent':
      return hasEventDefinition(element, 'bpmn:TerminateEventDefinition')
        ? 'finTerminate'
        : 'fin';
    default:
      return null;
  }
}

export function resolverBpmnElementoInfo(element: BpmnResolvableElement): BpmnShapeInfo | null {
  const kind = mapearKindNodo(element);

  if (kind === null || kind === 'inicio' || kind === 'fin' || kind === 'finTerminate') {
    return null;
  }

  return {
    kind,
    label: ELEMENT_KIND_LABELS[kind],
    nombre: element.businessObject?.name ?? '',
    id: element.id ?? '',
  };
}

export function resolverBpmnTransicionInfo(
  element: BpmnResolvableConnection,
): BpmnTransicionInfo | null {
  const type = element.type ?? element.businessObject?.$type ?? '';

  if (type !== 'bpmn:SequenceFlow' || !element.id) {
    return null;
  }

  const origen = element.source ? mapearKindNodo(element.source) : null;
  const destino = element.target ? mapearKindNodo(element.target) : null;

  if (!origen || !destino) {
    return null;
  }

  return {
    kind: 'transicion',
    label: TRANSICION_LABEL,
    nombre: element.businessObject?.name ?? '',
    id: element.id,
    origen,
    destino,
    origenId: element.source?.id ?? null,
    destinoId: element.target?.id ?? null,
  };
}

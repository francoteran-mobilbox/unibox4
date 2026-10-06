import { BpmnElementRegistry, createLegacyId } from './legacy-id-utils';

export interface BpmnElementRegistryConNombres extends BpmnElementRegistry {
  getAll?(): Array<{ id: string; businessObject?: { name?: string } }>;
}

export interface BpmnShapeAttrsSource {
  readonly type: string;
  readonly eventDefinitionType?: string;
  [key: string]: unknown;
}

export interface BpmnFactoryConAtributos {
  create(type: string, attrs?: Record<string, unknown>): unknown;
}

export interface BpmnElementFactoryConBusinessObject {
  createShape(attrs: Record<string, unknown>): unknown;
}

const PREFIJOS_NOMBRE_BY_TYPE: Record<string, string> = {
  'bpmn:Task': 'Actividad',
  'bpmn:StartEvent': 'Inicio',
  'bpmn:EndEvent': 'Fin',
  'bpmn:ExclusiveGateway': 'Regla de negocio',
  'bpmn:ParallelGateway': 'Enlace paralelo',
  'bpmn:InclusiveGateway': 'Decisión',
};

export function resolvePrefijoNombre(
  type: string,
  businessObject?: { readonly eventDefinitions?: readonly { readonly $type?: string }[] },
): string | null {
  if (type === 'bpmn:EndEvent') {
    const hasTerminate =
      businessObject?.eventDefinitions?.some(
        (definition) => definition.$type === 'bpmn:TerminateEventDefinition',
      ) ?? false;

    return hasTerminate ? 'Término' : 'Fin';
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

  return PREFIJOS_NOMBRE_BY_TYPE[type] ?? null;
}

export function siguienteNombreDefault(
  type: string,
  eventDefinitionType: string | undefined,
  elementRegistry: BpmnElementRegistryConNombres,
): string | null {
  const prefijo = resolvePrefijoNombre(
    type,
    eventDefinitionType
      ? { eventDefinitions: [{ $type: eventDefinitionType }] }
      : undefined,
  );

  if (prefijo === null) {
    return null;
  }

  const regex = new RegExp(`^${prefijo} (\\d+)$`);
  let max = 0;

  for (const elemento of elementRegistry.getAll?.() ?? []) {
    const match = elemento.businessObject?.name?.match(regex);

    if (match) {
      max = Math.max(max, Number(match[1]));
    }
  }

  return `${prefijo} ${max + 1}`;
}

export function crearShapeConNombreDefault(
  kind: BpmnShapeAttrsSource,
  deps: {
    readonly elementRegistry: BpmnElementRegistryConNombres;
    readonly bpmnFactory: BpmnFactoryConAtributos;
    readonly elementFactory: BpmnElementFactoryConBusinessObject;
  },
): unknown {
  const id = createLegacyId(kind.type, kind.eventDefinitionType, deps.elementRegistry);
  const nombre = siguienteNombreDefault(
    kind.type,
    kind.eventDefinitionType,
    deps.elementRegistry,
  );

  if (id === null) {
    return deps.elementFactory.createShape({ ...kind });
  }

  const businessObject = deps.bpmnFactory.create(kind.type, {
    id,
    ...(nombre !== null ? { name: nombre } : {}),
  });

  return deps.elementFactory.createShape({
    type: kind.type,
    ...(kind.eventDefinitionType ? { eventDefinitionType: kind.eventDefinitionType } : {}),
    businessObject,
  });
}

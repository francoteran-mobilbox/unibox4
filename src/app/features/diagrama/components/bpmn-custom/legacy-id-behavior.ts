import CommandInterceptor from 'diagram-js/lib/command/CommandInterceptor';
import type { ModuleDeclaration } from 'didi';
import {
  BpmnBusinessObject,
  BpmnElementRegistry,
  LEGACY_ID_PATTERN,
  createLegacyId,
  generarIdLegacy,
} from './legacy-id-utils';

interface ModelingService {
  updateProperties(element: unknown, properties: Record<string, unknown>): void;
}

interface BpmnShapeLike {
  id: string;
  type: string;
  businessObject?: BpmnBusinessObject;
}

interface BpmnConnectionLike {
  id: string;
  type: string;
  businessObject?: BpmnBusinessObject;
}

interface ShapeCreateContext {
  shape: BpmnShapeLike;
}

interface ConnectionCreateContext {
  connection: BpmnConnectionLike;
}

class LegacyIdBehavior extends CommandInterceptor {
  private readonly elementRegistry: BpmnElementRegistry;
  private readonly modeling: ModelingService;

  constructor(eventBus: any, elementRegistry: BpmnElementRegistry, modeling: ModelingService) {
    super(eventBus);
    this.elementRegistry = elementRegistry;
    this.modeling = modeling;

    this.preExecute('shape.create', this.onShapeCreate.bind(this));
    this.preExecute('connection.create', this.onConnectionCreate.bind(this));
    this.postExecuted('shape.create', this.onShapeCreated.bind(this));
    this.postExecuted('connection.create', this.onConnectionCreated.bind(this));

    eventBus.on('connection.added', (event: { element: unknown }) => {
      this.ensureLegacyId(event.element as BpmnConnectionLike | undefined, 'bpmn:SequenceFlow');
    });

    console.debug('[legacy-id] LegacyIdBehavior activo');
  }

  private onShapeCreate(context: ShapeCreateContext): void {
    const { shape } = context;

    if (!shape || LEGACY_ID_PATTERN.test(shape.id)) {
      return;
    }

    const id = createLegacyId(shape.type, undefined, this.elementRegistry);

    if (!id) {
      return;
    }

    shape.id = id;

    if (shape.businessObject) {
      shape.businessObject.id = id;
    }
  }

  private onConnectionCreate(context: ConnectionCreateContext): void {
    const { connection } = context;

    if (!connection || LEGACY_ID_PATTERN.test(connection.id)) {
      return;
    }

    const id = createLegacyId('bpmn:SequenceFlow', undefined, this.elementRegistry);

    if (!id) {
      return;
    }

    connection.id = id;

    if (connection.businessObject) {
      connection.businessObject.id = id;
    }
  }

  private onShapeCreated(context: ShapeCreateContext): void {
    const { shape } = context;
    this.ensureLegacyId(shape);
  }

  private onConnectionCreated(context: ConnectionCreateContext): void {
    const { connection } = context;
    this.ensureLegacyId(connection, 'bpmn:SequenceFlow');
  }

  private ensureLegacyId(
    element: BpmnShapeLike | BpmnConnectionLike | undefined,
    fallbackType?: string,
  ): void {
    if (!element || LEGACY_ID_PATTERN.test(element.id)) {
      return;
    }

    const type = fallbackType ?? element.type;
    const eventDefinitionType = element.businessObject?.eventDefinitions?.[0]?.$type;
    const id = createLegacyId(type, eventDefinitionType, this.elementRegistry);

    if (!id) {
      return;
    }

    const idAlAgendar = element.id;

    try {
      setTimeout(() => {
        if (element.id !== idAlAgendar) {
          return;
        }

        this.modeling.updateProperties(element, { id });
      }, 0);
    } catch {
      // Si el renombrado post-creación falla, se deja el id por defecto.
    }
  }
}

(LegacyIdBehavior as unknown as { $inject: string[] }).$inject = [
  'eventBus',
  'elementRegistry',
  'modeling',
];

export const legacyIdBehaviorModule: ModuleDeclaration = {
  __init__: ['legacyIdBehavior'],
  legacyIdBehavior: ['type', LegacyIdBehavior],
};

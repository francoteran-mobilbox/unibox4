import type { ModuleDeclaration } from 'didi';
import { createLegacyId } from './legacy-id-utils';
import type {
  AutoPlaceService,
  BpmnContextPadEntries,
  ConnectService,
  ContextPadService,
  CreateService,
  ElementFactoryService,
  ElementRegistryService,
} from './palette-entry';

type PadElement = {
  readonly type: string;
  readonly labelTarget?: unknown;
  readonly waypoints?: unknown;
  readonly businessObject?: {
    readonly $type?: string;
  };
};

const CONNECTABLE_TYPES = new Set([
  'bpmn:StartEvent',
  'bpmn:EndEvent',
  'bpmn:Task',
  'bpmn:ExclusiveGateway',
  'bpmn:ParallelGateway',
  'bpmn:InclusiveGateway',
  'bpmn:IntermediateThrowEvent',
  'bpmn:IntermediateCatchEvent',
]);

const CREATE_ACTIONS: ReadonlyArray<readonly [string, string, string]> = [
  ['append.start-event', 'bpmn-icon-start-event-none', 'Crear evento de inicio'],
  ['append.end-event', 'bpmn-icon-end-event-none', 'Crear evento de fin'],
  ['append.end-event-terminate', 'bpmn-icon-end-event-terminate', 'Crear evento de terminación'],
  ['append.intermediate-event-message-throw', 'bpmn-icon-intermediate-event-throw-message', 'Crear evento de mensaje (lanzar)'],
  ['append.intermediate-event-timer-catch', 'bpmn-icon-intermediate-event-catch-timer', 'Crear evento de temporizador (capturar)'],
  ['append.task', 'bpmn-icon-task', 'Crear tarea'],
  ['append.exclusive-gateway', 'bpmn-icon-gateway-xor', 'Crear gateway exclusivo'],
  ['append.parallel-gateway', 'bpmn-icon-gateway-parallel', 'Crear gateway paralelo'],
  ['append.inclusive-gateway', 'bpmn-icon-gateway-none', 'Crear gateway inclusivo'],
];

const CREATE_KINDS: Record<string, { type: string; eventDefinitionType?: string }> = {
  'append.start-event': { type: 'bpmn:StartEvent' },
  'append.end-event': { type: 'bpmn:EndEvent' },
  'append.end-event-terminate': {
    type: 'bpmn:EndEvent',
    eventDefinitionType: 'bpmn:TerminateEventDefinition',
  },
  'append.intermediate-event-message-throw': {
    type: 'bpmn:IntermediateThrowEvent',
    eventDefinitionType: 'bpmn:MessageEventDefinition',
  },
  'append.intermediate-event-timer-catch': {
    type: 'bpmn:IntermediateCatchEvent',
    eventDefinitionType: 'bpmn:TimerEventDefinition',
  },
  'append.task': { type: 'bpmn:Task' },
  'append.exclusive-gateway': { type: 'bpmn:ExclusiveGateway' },
  'append.parallel-gateway': { type: 'bpmn:ParallelGateway' },
  'append.inclusive-gateway': { type: 'bpmn:InclusiveGateway' },
};

export class CustomContextPadProvider {
  static readonly $inject = [
    'contextPad',
    'create',
    'elementFactory',
    'elementRegistry',
    'autoPlace',
    'connect',
  ];

  constructor(
    contextPad: ContextPadService,
    private readonly create: CreateService,
    private readonly elementFactory: ElementFactoryService,
    private readonly elementRegistry: ElementRegistryService,
    private readonly autoPlace: AutoPlaceService,
    private readonly connect: ConnectService,
  ) {
    contextPad.registerProvider(this);
  }

  getContextPadEntries(element: PadElement): BpmnContextPadEntries {
    if (element.type === 'label' || element.labelTarget || element.waypoints) {
      return {};
    }

    const businessObjectType = element.businessObject?.$type ?? '';
    if (!CONNECTABLE_TYPES.has(businessObjectType)) {
      return {};
    }

    const entries: BpmnContextPadEntries = {
      connect: {
        group: 'connect',
        className: 'bpmn-icon-connection-multi',
        title: 'Conectar',
        action: {
          click: (event, source) => this.connect.start(event, source),
          dragstart: (event, source) => this.connect.start(event, source),
        },
      },
    };

    for (const [entryId, className, title] of CREATE_ACTIONS) {
      entries[entryId] = this.buildAppendEntry(entryId, className, title);
    }

    return entries;
  }

  private buildAppendEntry(
    entryId: string,
    className: string,
    title: string,
  ): BpmnContextPadEntries[string] {
    const kind = CREATE_KINDS[entryId];

    const createShape = (): unknown => {
      const id = createLegacyId(kind.type, kind.eventDefinitionType, this.elementRegistry);
      return this.elementFactory.createShape(id ? { ...kind, id } : { ...kind });
    };

    const appendStart = (event: MouseEvent, element: unknown): void => {
      const shape = createShape();
      this.create.start(event, shape, { source: element });
    };

    return {
      group: 'model',
      className,
      title,
      action: {
        dragstart: appendStart,
        click: (_event, element) => {
          const shape = createShape();
          this.autoPlace.append(element, shape);
        },
      },
    };
  }
}

export const customContextPadModule: ModuleDeclaration = {
  __init__: ['contextPadProvider'],
  contextPadProvider: ['type', CustomContextPadProvider],
};

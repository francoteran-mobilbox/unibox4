import type { ModuleDeclaration } from 'didi';
import { createLegacyId } from './legacy-id-utils';
import type {
  BpmnPaletteEntries,
  BpmnPaletteEntry,
  CreateService,
  ElementFactoryService,
  ElementRegistryService,
  GlobalConnectService,
  HandToolService,
  LassoToolService,
  PaletteService,
} from './palette-entry';

type ElementKind = {
  readonly type: string;
  readonly eventDefinitionType?: string;
  readonly group: string;
};

const ELEMENT_KINDS: Record<string, ElementKind> = {
  'create.start-event': { type: 'bpmn:StartEvent', group: 'event' },
  'create.end-event': { type: 'bpmn:EndEvent', group: 'event' },
  'create.end-event-terminate': {
    type: 'bpmn:EndEvent',
    eventDefinitionType: 'bpmn:TerminateEventDefinition',
    group: 'event',
  },
  'create.intermediate-event-message-throw': {
    type: 'bpmn:IntermediateThrowEvent',
    eventDefinitionType: 'bpmn:MessageEventDefinition',
    group: 'event',
  },
  'create.intermediate-event-timer-catch': {
    type: 'bpmn:IntermediateCatchEvent',
    eventDefinitionType: 'bpmn:TimerEventDefinition',
    group: 'event',
  },
  'create.task': { type: 'bpmn:Task', group: 'activity' },
  'create.exclusive-gateway': { type: 'bpmn:ExclusiveGateway', group: 'gateway' },
  'create.parallel-gateway': { type: 'bpmn:ParallelGateway', group: 'gateway' },
  'create.inclusive-gateway': { type: 'bpmn:InclusiveGateway', group: 'gateway' },
};

export class CustomPaletteProvider {
  static readonly $inject = [
    'palette',
    'create',
    'elementFactory',
    'elementRegistry',
    'handTool',
    'lassoTool',
    'globalConnect',
  ];

  constructor(
    palette: PaletteService,
    private readonly create: CreateService,
    private readonly elementFactory: ElementFactoryService,
    private readonly elementRegistry: ElementRegistryService,
    private readonly handTool: HandToolService,
    private readonly lassoTool: LassoToolService,
    private readonly globalConnect: GlobalConnectService,
  ) {
    palette.registerProvider(this);
  }

  getPaletteEntries(): BpmnPaletteEntries {
    const entries: BpmnPaletteEntries = {
      'hand-tool': {
        group: 'tools',
        className: 'bpmn-icon-hand-tool',
        title: 'Herramienta mano',
        action: {
          click: (event) => this.handTool.activateHand(event),
        },
      },
      'lasso-tool': {
        group: 'tools',
        className: 'bpmn-icon-lasso-tool',
        title: 'Herramienta lazo',
        action: {
          click: (event) => this.lassoTool.activateSelection(event),
        },
      },
      'global-connect-tool': {
        group: 'tools',
        className: 'bpmn-icon-connection-multi',
        title: 'Herramienta conectar',
        action: {
          click: (event) => this.globalConnect.start(event),
        },
      },
    };

    for (const [entryId, kind] of Object.entries(ELEMENT_KINDS)) {
      entries[entryId] = this.buildCreateEntry(entryId, kind);
    }

    return entries;
  }

  private buildCreateEntry(entryId: string, kind: ElementKind): BpmnPaletteEntry {
    const startCreate = (event: MouseEvent): void => {
      const id = createLegacyId(kind.type, kind.eventDefinitionType, this.elementRegistry);
      const shape = this.elementFactory.createShape(id ? { ...kind, id } : { ...kind });
      this.create.start(event, shape);
    };

    return {
      group: kind.group,
      className: PALETTE_ICONS[entryId],
      title: PALETTE_TITLES[entryId],
      action: {
        click: startCreate,
        dragstart: startCreate,
      },
    };
  }
}

const PALETTE_ICONS: Record<string, string> = {
  'create.start-event': 'bpmn-icon-start-event-none',
  'create.end-event': 'bpmn-icon-end-event-none',
  'create.end-event-terminate': 'bpmn-icon-end-event-terminate',
  'create.intermediate-event-message-throw': 'bpmn-icon-intermediate-event-throw-message',
  'create.intermediate-event-timer-catch': 'bpmn-icon-intermediate-event-catch-timer',
  'create.task': 'bpmn-icon-task',
  'create.exclusive-gateway': 'bpmn-icon-gateway-xor',
  'create.parallel-gateway': 'bpmn-icon-gateway-parallel',
  'create.inclusive-gateway': 'bpmn-icon-gateway-none',
};

const PALETTE_TITLES: Record<string, string> = {
  'create.start-event': 'Crear evento de inicio',
  'create.end-event': 'Crear evento de fin',
  'create.end-event-terminate': 'Crear evento de terminación',
  'create.intermediate-event-message-throw': 'Crear evento de mensaje (lanzar)',
  'create.intermediate-event-timer-catch': 'Crear evento de temporizador (capturar)',
  'create.task': 'Crear tarea',
  'create.exclusive-gateway': 'Crear gateway exclusivo',
  'create.parallel-gateway': 'Crear gateway paralelo',
  'create.inclusive-gateway': 'Crear gateway inclusivo',
};

export const customPaletteModule: ModuleDeclaration = {
  __init__: ['paletteProvider'],
  paletteProvider: ['type', CustomPaletteProvider],
};

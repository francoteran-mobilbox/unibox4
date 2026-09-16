import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnDestroy,
  Output,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import Modeler from 'bpmn-js/lib/Modeler';
import {
  LegacyBpmnNodeSnapshot,
  LegacyBpmnSnapshot,
  LegacyBpmnTransitionSnapshot,
  LegacyFlowProgress,
} from '../models/diagrama.model';
import {
  BpmnElementoInfo,
  resolverBpmnElementoInfo,
  resolverBpmnTransicionInfo,
} from '../models/bpmn-elemento.model';
import { LegacyXmlSerializerService } from '../services/legacy-xml-serializer.service';
import { CUSTOM_BPMN_MODULES } from './bpmn-custom';

type LegacyElementKind =
  | 'inicio'
  | 'tarea'
  | 'decision'
  | 'reglaNegocio'
  | 'mensaje'
  | 'timer'
  | 'fin'
  | 'enlaceParalelo';

interface LegacyDiagramElement {
  readonly id: string;
  readonly type: string;
  readonly name: string;
  readonly x: number;
  readonly y: number;
  readonly esTimer?: boolean;
  readonly esMensaje?: boolean;
}

interface LegacyTransition {
  readonly id?: string;
  readonly source: string;
  readonly target: string;
}

interface LegacyColoringState {
  readonly executedElementIds: readonly string[];
  readonly flowProgressItems: readonly LegacyFlowProgress[];
}

const INCLUSIVE_GATEWAY_PLAIN_MARKER = 'ubx-gateway-inclusive-plain';
const MARCADOR_VALIDACION_ERROR = 'diagrama__validacion-error';

const BPMN_TEMPLATE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
  id="Definitions_1"
  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="false" />
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1" />
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

const BASE_DIAGRAM_XML = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
  id="Definitions_1"
  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="false" />
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1" />
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

@Component({
  selector: 'app-bpmn-base-preview',
  standalone: true,
  template: `
    <div class="bpmn-preview" [class.bpmn-preview--readonly]="!editable">
      @if (errorMessage()) {
        <div class="bpmn-preview__error">{{ errorMessage() }}</div>
      }
      <div #canvas class="bpmn-preview__canvas" [style.height]="canvasHeight" aria-label="Diagrama BPMN base"></div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
      }

      .bpmn-preview {
        width: 100%;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        background: #f8fafc;
        min-height: 400px;
        overflow: hidden;
      }

      .bpmn-preview__canvas {
        width: 100%;
        height: 400px;
      }

      .bpmn-preview__error {
        padding: 0.5rem 0.75rem;
        border-bottom: 1px solid #e2e8f0;
        color: #b91c1c;
        font-size: 0.8125rem;
      }

      .bpmn-preview--readonly ::ng-deep .djs-palette,
      .bpmn-preview--readonly ::ng-deep .djs-context-pad {
        display: none !important;
      }

      .bpmn-preview ::ng-deep .ubx-gateway-inclusive-plain .djs-visual > circle {
        display: none !important;
      }

      .bpmn-preview ::ng-deep .diagrama__validacion-error .djs-visual > :first-child {
        stroke: #ef4444 !important;
        stroke-width: 2.5px !important;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BpmnBasePreviewComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas', { static: true })
  private readonly canvasRef!: ElementRef<HTMLDivElement>;

  @Input() canvasHeight = '400px';

  @Input() editable = false;

  @Input()
  set legacyXml(value: string | null | undefined) {
    this.legacyXmlValue = value?.trim() ?? '';
    this.scheduleRender();
  }

  @Input()
  set executedElementIds(value: readonly string[] | null | undefined) {
    this.executedElementIdsValue = this.normalizeIds(value ?? []);
    this.scheduleRender();
  }

  @Input()
  set flowProgressItems(value: readonly LegacyFlowProgress[] | null | undefined) {
    this.flowProgressItemsValue = value ?? [];
    this.scheduleRender();
  }

  @Output()
  readonly diagramEdited = new EventEmitter<void>();

  @Output()
  readonly elementActivated = new EventEmitter<BpmnElementoInfo>();

  private readonly ngZone = inject(NgZone);
  private readonly legacyXmlSerializer = inject(LegacyXmlSerializerService);
  private modeler: Modeler | null = null;
  private legacyXmlValue = '';
  private executedElementIdsValue: readonly string[] = [];
  private flowProgressItemsValue: readonly LegacyFlowProgress[] = [];
  private viewReady = false;
  private renderQueued = false;
  private suppressDiagramEditedEvent = false;
  private marcadoresValidacion: readonly string[] = [];

  readonly errorMessage = signal('');

  async ngAfterViewInit(): Promise<void> {
    this.viewReady = true;
    this.scheduleRender();
  }

  ngOnDestroy(): void {
    this.destroyModeler();
  }

  async exportLegacyXml(templateXml: string): Promise<string> {
    if (!this.modeler) {
      throw new Error('El modelador BPMN no está inicializado.');
    }

    const snapshot = this.buildLegacySnapshot();
    return this.legacyXmlSerializer.serializeFromSnapshot(templateXml, snapshot);
  }

  obtenerSnapshot(): LegacyBpmnSnapshot {
    return this.buildLegacySnapshot();
  }

  marcarErroresValidacion(ids: readonly string[]): void {
    this.limpiarMarcadoresValidacion();

    if (!this.modeler) {
      return;
    }

    const canvas = this.modeler.get('canvas') as {
      addMarker?: (element: unknown, marker: string) => void;
    } | undefined;
    const elementRegistry = this.modeler.get('elementRegistry') as {
      get?: (id: string) => unknown;
    } | undefined;

    if (!canvas || !elementRegistry) {
      return;
    }

    const marcados: string[] = [];

    for (const id of ids) {
      const element = elementRegistry.get?.(id);

      if (!element) {
        continue;
      }

      canvas.addMarker?.(element, MARCADOR_VALIDACION_ERROR);
      marcados.push(id);
    }

    this.marcadoresValidacion = marcados;
  }

  limpiarMarcadoresValidacion(): void {
    if (this.modeler) {
      const canvas = this.modeler.get('canvas') as {
        removeMarker?: (element: unknown, marker: string) => void;
      } | undefined;
      const elementRegistry = this.modeler.get('elementRegistry') as {
        get?: (id: string) => unknown;
      } | undefined;

      if (canvas && elementRegistry) {
        for (const id of this.marcadoresValidacion) {
          const element = elementRegistry.get?.(id);

          if (element) {
            canvas.removeMarker?.(element, MARCADOR_VALIDACION_ERROR);
          }
        }
      }
    }

    this.marcadoresValidacion = [];
  }

  private scheduleRender(): void {
    if (!this.viewReady || this.renderQueued) {
      return;
    }

    this.renderQueued = true;
    queueMicrotask(() => {
      this.renderQueued = false;
      void this.renderDiagram();
    });
  }

  private async renderDiagram(): Promise<void> {
    this.errorMessage.set('');

    await this.ngZone.runOutsideAngular(async () => {
      try {
        this.destroyModeler();
        this.suppressDiagramEditedEvent = true;
        this.modeler = new Modeler({
          container: this.canvasRef.nativeElement,
          additionalModules: this.editable ? CUSTOM_BPMN_MODULES : [],
        });
        this.registerDiagramEditedListener();
        this.registerInclusiveGatewayPlainStyleListener();

        if (this.editable) {
          this.registerDiagramElementActivatedListener();
        }

        if (this.legacyXmlValue !== '') {
          const legacyDiagram = this.parseLegacyXml(this.legacyXmlValue);
          await this.modeler.importXML(BPMN_TEMPLATE_XML);
          this.renderLegacyDiagram(legacyDiagram.elements, legacyDiagram.transitions);
          this.applyLegacyColoring({
            executedElementIds: this.executedElementIdsValue,
            flowProgressItems: this.flowProgressItemsValue,
          });
        } else {
          await this.modeler.importXML(BASE_DIAGRAM_XML);
        }

        this.centerOnStartEvent();
        this.applyInclusiveGatewayPlainStyle();
        this.suppressDiagramEditedEvent = false;
      } catch {
        this.destroyModeler();
        this.suppressDiagramEditedEvent = false;
        this.errorMessage.set('Vista BPMN no disponible. Verifica la dependencia bpmn-js.');
      }
    });
  }

  private destroyModeler(): void {
    this.modeler?.destroy?.();
    this.modeler = null;
    this.marcadoresValidacion = [];
  }

  private registerDiagramEditedListener(): void {
    if (!this.modeler) {
      return;
    }

    const eventBus = this.modeler.get('eventBus') as {
      on: (eventName: string, handler: () => void) => void;
    };

    eventBus.on('commandStack.changed', () => {
      if (this.suppressDiagramEditedEvent) {
        return;
      }

      this.diagramEdited.emit();
    });
  }

  private registerInclusiveGatewayPlainStyleListener(): void {
    if (!this.modeler) {
      return;
    }

    const eventBus = this.modeler.get('eventBus') as {
      on: (
        eventName: string,
        handler: (context: { element: { type: string } }) => void,
      ) => void;
    };

    eventBus.on('shape.added', ({ element }) => {
      if (element.type !== 'bpmn:InclusiveGateway') {
        return;
      }

      this.addInclusiveGatewayPlainMarker(element);
    });
  }

  private registerDiagramElementActivatedListener(): void {
    if (!this.modeler) {
      return;
    }

    const eventBus = this.modeler.get('eventBus') as {
      on: (
        eventName: string,
        priority: number,
        handler: (event: { element: unknown; stopPropagation: () => void }) => void,
      ) => void;
    };

    eventBus.on('element.dblclick', 2000, (event) => {
      const info =
        resolverBpmnElementoInfo(
          event.element as Parameters<typeof resolverBpmnElementoInfo>[0],
        ) ??
        resolverBpmnTransicionInfo(
          event.element as Parameters<typeof resolverBpmnTransicionInfo>[0],
        );

      if (!info) {
        return;
      }

      event.stopPropagation();
      this.elementActivated.emit(info);
    });
  }

  renameElement(id: string, name: string): void {
    if (!this.modeler) {
      return;
    }

    try {
      const elementRegistry = this.modeler.get('elementRegistry') as {
        get?: (id: string) => unknown;
      } | undefined;
      const modeling = this.modeler.get('modeling') as {
        updateProperties?: (element: unknown, properties: Record<string, string>) => void;
      } | undefined;
      const element = elementRegistry?.get?.(id);

      if (!element || !modeling?.updateProperties) {
        return;
      }

      modeling.updateProperties(element, { name });
    } catch {
      // Ignore non-critical rename failures.
    }
  }

  private applyInclusiveGatewayPlainStyle(): void {
    if (!this.modeler) {
      return;
    }

    const elementRegistry = this.modeler.get('elementRegistry') as {
      filter?: (matcher: (element: { type: string }) => boolean) => Array<{ id: string; type: string }>;
    } | undefined;
    const inclusiveGateways =
      elementRegistry?.filter?.((element) => element.type === 'bpmn:InclusiveGateway') ?? [];

    for (const element of inclusiveGateways) {
      this.addInclusiveGatewayPlainMarker(element);
    }
  }

  private addInclusiveGatewayPlainMarker(element: unknown): void {
    if (!this.modeler) {
      return;
    }

    try {
      const canvas = this.modeler.get('canvas') as {
        addMarker?: (element: unknown, marker: string) => void;
      } | undefined;

      canvas?.addMarker?.(element, INCLUSIVE_GATEWAY_PLAIN_MARKER);
    } catch {
      // Ignore non-critical styling failures.
    }
  }

  private buildLegacySnapshot(): LegacyBpmnSnapshot {
    const elementRegistry = this.modeler?.get('elementRegistry') as {
      getAll: () => Array<{
        id: string;
        type: string;
        x?: number;
        y?: number;
        width?: number;
        height?: number;
        source?: { id: string };
        target?: { id: string };
        businessObject?: { name?: string; eventDefinitions?: Array<{ $type?: string }> };
      }>;
    };

    if (!elementRegistry) {
      return { nodes: [], transitions: [] };
    }

    const elements = elementRegistry.getAll();
    const nodes: LegacyBpmnNodeSnapshot[] = [];
    const transitions: LegacyBpmnTransitionSnapshot[] = [];

    for (const element of elements) {
      if (this.isSupportedNodeType(element.type)) {
        const eventDefinitions = element.businessObject?.eventDefinitions ?? [];
        const eventTypes = new Set(eventDefinitions.map((eventDefinition) => eventDefinition.$type ?? ''));

        nodes.push({
          id: element.id,
          name: element.businessObject?.name ?? '',
          type: element.type,
          x: Number.isFinite(element.x) ? Number(element.x) : 0,
          y: Number.isFinite(element.y) ? Number(element.y) : 0,
          width: Number.isFinite(element.width) ? Number(element.width) : 100,
          height: Number.isFinite(element.height) ? Number(element.height) : 60,
          hasMessageEventDefinition: eventTypes.has('bpmn:MessageEventDefinition'),
          hasTimerEventDefinition: eventTypes.has('bpmn:TimerEventDefinition'),
          hasTerminateEventDefinition: eventTypes.has('bpmn:TerminateEventDefinition'),
        });
        continue;
      }

      if (element.type === 'bpmn:SequenceFlow' && element.source?.id && element.target?.id) {
        transitions.push({
          id: element.id,
          sourceId: element.source.id,
          targetId: element.target.id,
          name: element.businessObject?.name ?? '',
        });
      }
    }

    return { nodes, transitions };
  }

  private isSupportedNodeType(type: string): boolean {
    return (
      type === 'bpmn:StartEvent' ||
      type === 'bpmn:Task' ||
      type === 'bpmn:ParallelGateway' ||
      type === 'bpmn:ExclusiveGateway' ||
      type === 'bpmn:InclusiveGateway' ||
      type === 'bpmn:IntermediateThrowEvent' ||
      type === 'bpmn:IntermediateCatchEvent' ||
      type === 'bpmn:EndEvent'
    );
  }

  private fitViewport(): void {
    try {
      const canvas = this.modeler?.get('canvas') as { zoom?: (level: string) => void } | undefined;
      canvas?.zoom?.('fit-viewport');
    } catch {
      // Ignore non-critical viewport adjustments when the diagram was already rendered.
    }
  }

  private centerOnStartEvent(): void {
    try {
      const canvas = this.modeler?.get('canvas') as {
        zoom?: (level: string) => void;
        viewbox?: (box: { x: number; y: number; width: number; height: number }) => void;
      } | undefined;
      const elementRegistry = this.modeler?.get('elementRegistry') as {
        filter?: (matcher: (element: { type: string }) => boolean) => Array<{
          x: number;
          y: number;
          width: number;
          height: number;
        }>;
      } | undefined;
      const startEvent = elementRegistry?.filter?.((element) => element.type === 'bpmn:StartEvent')?.[0];

      if (!canvas || !startEvent) {
        this.fitViewport();
        return;
      }

      const rect = this.canvasRef.nativeElement.getBoundingClientRect();
      const zoom = Math.min(1.2, Math.max(0.75, rect.height / 400));
      canvas.zoom?.(zoom.toString());
      const viewportWidth = rect.width / zoom;
      const viewportHeight = rect.height / zoom;
      canvas.viewbox?.({
        x: startEvent.x + startEvent.width / 2 - viewportWidth / 2,
        y: startEvent.y + startEvent.height / 2 - viewportHeight / 2,
        width: viewportWidth,
        height: viewportHeight,
      });
    } catch {
      this.fitViewport();
    }
  }

  private parseLegacyXml(xml: string): { elements: LegacyDiagramElement[]; transitions: LegacyTransition[] } {
    const parser = new DOMParser();
    const documentXml = parser.parseFromString(xml, 'text/xml');

    if (documentXml.querySelector('parsererror')) {
      throw new Error('Invalid legacy XML');
    }

    const elements: LegacyDiagramElement[] = [];
    const transitions: LegacyTransition[] = [];

    const addStartNode = (tagName: string, kind: LegacyElementKind): void => {
      const nodes = Array.from(documentXml.getElementsByTagName(tagName));

      for (const node of nodes) {
        const transition = node.querySelector('transition');
        if (!transition) {
          continue;
        }

        const id = this.normalizeId(node.getAttribute('id'));
        elements.push({
          id,
          type: this.getTypeBPMNElement(kind),
          name: node.getAttribute('name') ?? '',
          x: this.readPosition(node.getAttribute('x'), 80),
          y: this.readPosition(node.getAttribute('y'), 80),
        });

        const transitionId = this.normalizeId(transition.getAttribute('id')) || undefined;

        transitions.push({
          id: transitionId,
          source: id,
          target: this.normalizeId(transition.getAttribute('to')),
        });
      }
    };

    addStartNode('start-state', 'inicio');
    this.addLegacyNodes(documentXml, 'task-node', 'tarea', elements, transitions);
    this.addLegacyNodes(documentXml, 'decision', 'decision', elements, transitions);
    this.addLegacyNodes(documentXml, 'enlace-paralelo', 'enlaceParalelo', elements, transitions);
    this.addLegacyNodes(documentXml, 'regla-negocio', 'reglaNegocio', elements, transitions);
    this.addLegacyNodes(documentXml, 'mensaje', 'mensaje', elements, transitions, true);
    this.addLegacyNodes(documentXml, 'timer', 'timer', elements, transitions, false, true);
    this.addLegacyNodes(documentXml, 'end-state', 'fin', elements, transitions, false, false, true);
    this.addLegacyNodes(documentXml, 'terminate-state', 'fin', elements, transitions, false, false, true);

    return { elements, transitions };
  }

  private addLegacyNodes(
    documentXml: Document,
    tagName: string,
    kind: LegacyElementKind,
    elements: LegacyDiagramElement[],
    transitions: LegacyTransition[],
    esMensaje = false,
    esTimer = false,
    isEnd = false,
  ): void {
    const nodes = Array.from(documentXml.getElementsByTagName(tagName));

    for (const node of nodes) {
      const id = this.normalizeId(node.getAttribute('id'));
      elements.push({
        id,
        type: this.getTypeBPMNElement(kind),
        name: node.getAttribute('name') ?? '',
        x: this.readPosition(node.getAttribute('x'), elements.length * 180 + 80),
        y: this.readPosition(node.getAttribute('y'), 120),
        ...(esMensaje ? { esMensaje: true } : {}),
        ...(esTimer ? { esTimer: true } : {}),
      });

      const transitionNodes = Array.from(node.getElementsByTagName('transition'));
      for (const transitionNode of transitionNodes) {
        const transitionId = this.normalizeId(transitionNode.getAttribute('id')) || undefined;
        const target = this.normalizeId(transitionNode.getAttribute('to'));
        transitions.push({
          id: transitionId,
          source: id,
          target,
        });
      }

      if (isEnd) {
        continue;
      }
    }
  }

  private renderLegacyDiagram(elements: LegacyDiagramElement[], transitions: LegacyTransition[]): void {
    if (!this.modeler) {
      return;
    }

    const canvas = this.modeler.get('canvas') as { getRootElement: () => unknown; zoom?: (level: string) => void };
    const elementFactory = this.modeler.get('elementFactory') as {
      createShape: (config: { type: string; id: string }) => { businessObject: { name?: string; eventDefinitions?: unknown[] } };
    };
    const modeling = this.modeler.get('modeling') as {
      createShape: (shape: { businessObject: { name?: string; eventDefinitions?: unknown[] } }, position: { x: number; y: number }, parent: unknown) => void;
      connect: (source: unknown, target: unknown) => { id: string } | null;
      updateProperties?: (element: unknown, properties: Record<string, string>) => void;
    };
    const elementRegistry = this.modeler.get('elementRegistry') as {
      get: (id: string) => unknown;
    };
    const bpmnFactory = this.modeler.get('bpmnFactory') as {
      create: (type: string) => unknown;
    };

    for (const element of elements) {
      const shape = elementFactory.createShape({ type: element.type, id: element.id });
      shape.businessObject.name = element.name;

      if (element.esTimer === true) {
        shape.businessObject.eventDefinitions = [bpmnFactory.create('bpmn:TimerEventDefinition')];
      }

      if (element.esMensaje === true) {
        shape.businessObject.eventDefinitions = [bpmnFactory.create('bpmn:MessageEventDefinition')];
      }

      modeling.createShape(shape, { x: element.x, y: element.y }, canvas.getRootElement());
    }

    for (const transition of transitions) {
      const source = elementRegistry.get(transition.source);
      const target = elementRegistry.get(transition.target);

      if (!source || !target) {
        continue;
      }

      const connection = modeling.connect(source, target);

      if (!transition.id || !connection || elementRegistry.get(transition.id)) {
        continue;
      }

      modeling.updateProperties?.(connection, { id: transition.id });
    }
  }

  private applyLegacyColoring(coloringState: LegacyColoringState): void {
    if (!this.modeler) {
      return;
    }

    const modeling = this.modeler.get('modeling') as {
      setColor: (element: unknown, colors: { fill?: string; stroke?: string }) => void;
      updateProperties: (element: unknown, properties: Record<string, string>) => void;
    };
    const elementRegistry = this.modeler.get('elementRegistry') as {
      get: (id: string) => unknown;
      getAll: () => Array<{ id: string; type: string; source?: { id: string } }>;
    };

    const executedIds = new Set(coloringState.executedElementIds.map((id) => this.normalizeId(id)));
    const progressBySource = new Map<string, number>();

    for (const item of coloringState.flowProgressItems) {
      const sourceId = this.normalizeId(item.elemento);
      if (!sourceId) {
        continue;
      }

      const total = Number(item.total);
      const count = Number(item.cuenta);
      if (!Number.isFinite(total) || total <= 0 || !Number.isFinite(count)) {
        continue;
      }

      progressBySource.set(sourceId, Math.trunc((count * 100) / total));
    }

    const colorizedElementIds = new Set<string>([...executedIds, ...progressBySource.keys()]);

    for (const elementId of colorizedElementIds) {
      const element = elementRegistry.get(elementId);
      if (element) {
        modeling.setColor(element, {
          fill: '#d0ffcc',
          stroke: '#000000',
        });
      }
    }

    const allConnections = elementRegistry.getAll().filter((element) => element.type === 'bpmn:SequenceFlow');

    for (const connection of allConnections) {
      const sourceId = this.normalizeId(connection.source?.id ?? '');

      if (progressBySource.has(sourceId)) {
        const porcentaje = progressBySource.get(sourceId) ?? 0;
        const colorFill = this.getProgressColor(porcentaje);

        modeling.updateProperties(connection, {
          name: `${porcentaje}%`,
        });

        if (porcentaje > 0) {
          modeling.setColor(connection, {
            stroke: colorFill,
            fill: colorFill,
          });
        }
        continue;
      }

      if (executedIds.has(sourceId)) {
        modeling.setColor(connection, {
          stroke: '#1f7301',
          fill: '#1f7301',
        });
      }
    }
  }

  private normalizeId(value: string | null): string {
    return (value ?? '').replace(/ /g, '_');
  }

  private normalizeIds(values: readonly string[]): readonly string[] {
    return values.map((value) => this.normalizeId(value));
  }

  private readPosition(value: string | null, fallback: number): number {
    const parsed = Number.parseFloat(value ?? '');
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  private getProgressColor(percentage: number): string {
    if (percentage > 0 && percentage < 25) {
      return '#fc0303';
    }

    if (percentage >= 25 && percentage < 50) {
      return '#fc6f03';
    }

    if (percentage >= 50 && percentage < 75) {
      return '#b8b500';
    }

    return '#1f7301';
  }

  private getTypeBPMNElement(tipo: LegacyElementKind): string {
    switch (tipo) {
      case 'inicio':
        return 'bpmn:StartEvent';
      case 'tarea':
        return 'bpmn:Task';
      case 'fin':
        return 'bpmn:EndEvent';
      case 'decision':
        return 'bpmn:InclusiveGateway';
      case 'enlaceParalelo':
        return 'bpmn:ParallelGateway';
      case 'mensaje':
        return 'bpmn:IntermediateThrowEvent';
      case 'reglaNegocio':
        return 'bpmn:ExclusiveGateway';
      case 'timer':
        return 'bpmn:IntermediateCatchEvent';
    }
  }
}

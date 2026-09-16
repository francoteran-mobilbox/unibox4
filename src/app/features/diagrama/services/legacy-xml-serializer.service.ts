import { Injectable } from '@angular/core';
import {
  LegacyBpmnNodeSnapshot,
  LegacyBpmnSnapshot,
  LegacyBpmnTransitionSnapshot,
} from '../models/diagrama.model';

type LegacyTagName =
  | 'start-state'
  | 'task-node'
  | 'decision'
  | 'regla-negocio'
  | 'mensaje'
  | 'timer'
  | 'enlace-paralelo'
  | 'end-state'
  | 'terminate-state';

const LEGACY_FLOW_TAGS: readonly LegacyTagName[] = [
  'start-state',
  'task-node',
  'decision',
  'regla-negocio',
  'mensaje',
  'timer',
  'enlace-paralelo',
  'end-state',
  'terminate-state',
];

@Injectable({ providedIn: 'root' })
export class LegacyXmlSerializerService {
  serializeFromSnapshot(templateXml: string, snapshot: LegacyBpmnSnapshot): string {
    const parser = new DOMParser();
    const serializer = new XMLSerializer();
    const documentXml = parser.parseFromString(templateXml, 'text/xml');

    if (documentXml.querySelector('parsererror')) {
      throw new Error('El XML legacy base no es válido.');
    }

    const processDefinition = documentXml.documentElement;
    if (!processDefinition) {
      throw new Error('No se encontró process-definition en el XML legacy base.');
    }

    const declaration = this.extractXmlDeclaration(templateXml);
    const nodeTemplateMap = this.buildNodeTemplateMap(processDefinition);
    const transitionTemplateMap = this.buildTransitionTemplateMap(processDefinition);
    const normalizedIdToOriginal = new Map<string, string>();

    for (const [normalizedId, template] of nodeTemplateMap.entries()) {
      normalizedIdToOriginal.set(normalizedId, template.getAttribute('id') ?? normalizedId);
    }

    for (const tagName of LEGACY_FLOW_TAGS) {
      const nodes = Array.from(processDefinition.getElementsByTagName(tagName));
      for (const node of nodes) {
        node.parentNode?.removeChild(node);
      }
    }

    const orderedNodes = [...snapshot.nodes].sort((a, b) => a.x - b.x || a.y - b.y);
    const transitionsBySource = this.groupTransitionsBySource(snapshot.transitions);
    const insertionAnchor = processDefinition.getElementsByTagName('SubProcesosAsociados')[0] ?? null;
    const insertionParent = insertionAnchor?.parentNode ?? processDefinition;
    let insertAfter = insertionAnchor;

    for (const node of orderedNodes) {
      const tagName = this.resolveLegacyTagName(node);
      const normalizedId = this.normalizeId(node.id);
      const templateNode = nodeTemplateMap.get(normalizedId);
      const nodeElement = templateNode
        ? (templateNode.cloneNode(true) as Element)
        : documentXml.createElement(tagName);

      const originalNodeId = normalizedIdToOriginal.get(normalizedId) ?? this.denormalizeId(node.id);
      normalizedIdToOriginal.set(normalizedId, originalNodeId);

      if (nodeElement.tagName !== tagName) {
        const rebuiltNode = documentXml.createElement(tagName);
        this.copyElementAttributes(nodeElement, rebuiltNode, ['id', 'name', 'x', 'y', 'width', 'height']);
        nodeElement.parentNode?.replaceChild(rebuiltNode, nodeElement);
      }

      nodeElement.setAttribute('id', originalNodeId);
      nodeElement.setAttribute('name', node.name);
      nodeElement.setAttribute('x', this.formatCoordinate(node.x));
      nodeElement.setAttribute('y', this.formatCoordinate(node.y));
      nodeElement.setAttribute('width', this.formatCoordinate(node.width));
      nodeElement.setAttribute('height', this.formatCoordinate(node.height));

      if (tagName === 'task-node' && nodeElement.getElementsByTagName('task').length === 0) {
        nodeElement.appendChild(documentXml.createElement('task'));
      }

      const transitionChildren = Array.from(nodeElement.getElementsByTagName('transition'));
      for (const transitionChild of transitionChildren) {
        transitionChild.parentNode?.removeChild(transitionChild);
      }

      const outgoingTransitions = transitionsBySource.get(node.id) ?? [];
      for (const transition of outgoingTransitions) {
        const transitionElement = this.buildTransitionElement(
          documentXml,
          transition,
          transitionTemplateMap,
          normalizedIdToOriginal,
        );
        nodeElement.appendChild(transitionElement);
      }

      if (insertAfter) {
        insertAfter.after(nodeElement);
      } else {
        insertionParent.appendChild(nodeElement);
      }

      insertAfter = nodeElement;
    }

    const serializedXml = serializer.serializeToString(documentXml);
    return `${declaration}${this.stripXmlDeclaration(serializedXml)}`;
  }

  private extractXmlDeclaration(xml: string): string {
    const match = xml.match(/^\s*(<\?xml[^>]*\?>\s*)/i);
    return match ? match[1] : '<?xml version="1.0" encoding="UTF-8"?>\n';
  }

  private stripXmlDeclaration(xml: string): string {
    return xml.replace(/^\s*<\?xml[^>]*\?>\s*/i, '');
  }

  private buildNodeTemplateMap(processDefinition: Element): Map<string, Element> {
    const map = new Map<string, Element>();

    for (const tagName of LEGACY_FLOW_TAGS) {
      const nodes = Array.from(processDefinition.getElementsByTagName(tagName));
      for (const node of nodes) {
        const id = node.getAttribute('id');
        if (!id) {
          continue;
        }
        map.set(this.normalizeId(id), node);
      }
    }

    return map;
  }

  private buildTransitionTemplateMap(processDefinition: Element): Map<string, Element[]> {
    const map = new Map<string, Element[]>();

    for (const tagName of LEGACY_FLOW_TAGS) {
      const nodes = Array.from(processDefinition.getElementsByTagName(tagName));
      for (const node of nodes) {
        const sourceId = node.getAttribute('id');
        if (!sourceId) {
          continue;
        }

        const sourceNormalized = this.normalizeId(sourceId);
        const transitions = Array.from(node.getElementsByTagName('transition'));
        for (const transition of transitions) {
          const targetNormalized = this.normalizeId(transition.getAttribute('to') ?? '');
          const key = `${sourceNormalized}->${targetNormalized}`;
          if (!map.has(key)) {
            map.set(key, []);
          }
          map.get(key)?.push(transition);
        }
      }
    }

    return map;
  }

  private groupTransitionsBySource(
    transitions: readonly LegacyBpmnTransitionSnapshot[],
  ): Map<string, LegacyBpmnTransitionSnapshot[]> {
    const map = new Map<string, LegacyBpmnTransitionSnapshot[]>();

    for (const transition of transitions) {
      const sourceId = this.normalizeId(transition.sourceId);
      if (!map.has(sourceId)) {
        map.set(sourceId, []);
      }

      map.get(sourceId)?.push(transition);
    }

    return map;
  }

  private buildTransitionElement(
    documentXml: Document,
    transition: LegacyBpmnTransitionSnapshot,
    transitionTemplateMap: Map<string, Element[]>,
    normalizedIdToOriginal: Map<string, string>,
  ): Element {
    const sourceNormalized = this.normalizeId(transition.sourceId);
    const targetNormalized = this.normalizeId(transition.targetId);
    const key = `${sourceNormalized}->${targetNormalized}`;
    const templateTransition = transitionTemplateMap.get(key)?.shift();
    const transitionElement = templateTransition
      ? (templateTransition.cloneNode(true) as Element)
      : documentXml.createElement('transition');

    const originalTargetId =
      normalizedIdToOriginal.get(targetNormalized) ?? this.denormalizeId(transition.targetId);
    const originalTransitionId =
      transitionElement.getAttribute('id') ?? this.buildLegacyTransitionId(transition.id);

    transitionElement.setAttribute('id', originalTransitionId);
    transitionElement.setAttribute('to', originalTargetId);

    if (transition.name && transition.name.trim() !== '') {
      transitionElement.setAttribute('name', transition.name.trim());
    }

    return transitionElement;
  }

  private resolveLegacyTagName(node: LegacyBpmnNodeSnapshot): LegacyTagName {
    switch (node.type) {
      case 'bpmn:StartEvent':
        return 'start-state';
      case 'bpmn:Task':
        return 'task-node';
      case 'bpmn:ParallelGateway':
        return 'enlace-paralelo';
      case 'bpmn:ExclusiveGateway':
        return 'regla-negocio';
      case 'bpmn:InclusiveGateway':
        return 'decision';
      case 'bpmn:IntermediateThrowEvent':
        return node.hasMessageEventDefinition ? 'mensaje' : 'task-node';
      case 'bpmn:IntermediateCatchEvent':
        return node.hasTimerEventDefinition ? 'timer' : 'task-node';
      case 'bpmn:EndEvent':
        return node.hasTerminateEventDefinition ? 'terminate-state' : 'end-state';
      default:
        return 'task-node';
    }
  }

  private buildLegacyTransitionId(flowId: string): string {
    const safe = flowId.trim() || 'Flow';
    const plain = safe.replace(/_/g, ' ');

    if (plain.startsWith('Transicion ')) {
      return plain;
    }

    return `Transicion ${plain}`;
  }

  private formatCoordinate(value: number): string {
    if (!Number.isFinite(value)) {
      return '0';
    }

    return Number(value.toFixed(2)).toString();
  }

  private normalizeId(value: string): string {
    return value.replace(/ /g, '_');
  }

  private denormalizeId(value: string): string {
    return value.replace(/_/g, ' ');
  }

  private copyElementAttributes(source: Element, target: Element, skip: readonly string[]): void {
    const skipSet = new Set(skip);

    for (const attribute of Array.from(source.attributes)) {
      if (skipSet.has(attribute.name)) {
        continue;
      }

      target.setAttribute(attribute.name, attribute.value);
    }
  }
}
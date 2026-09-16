import BaseBpmnElementFactory from 'bpmn-js/lib/features/modeling/ElementFactory';
import type { ModuleDeclaration } from 'didi';
import {
  BpmnBusinessObject,
  BpmnElementRegistry,
  LEGACY_ID_PATTERN,
  createLegacyId,
  generarIdLegacy,
  resolvePrefix,
} from './legacy-id-utils';

function LegacyElementFactory(
  this: any,
  bpmnFactory: unknown,
  moddle: unknown,
  elementRegistry: BpmnElementRegistry,
): void {
  (BaseBpmnElementFactory as any).call(this, bpmnFactory as any, moddle as any);
  this._legacyElementRegistry = elementRegistry;
  console.debug('[legacy-id] LegacyElementFactory activo');
}

(LegacyElementFactory as unknown as { $inject: string[] }).$inject = [
  'bpmnFactory',
  'moddle',
  'elementRegistry',
];

LegacyElementFactory.prototype = Object.create(BaseBpmnElementFactory.prototype);
LegacyElementFactory.prototype.constructor = LegacyElementFactory;

LegacyElementFactory.prototype.createElement = function (
  this: any,
  elementType: string,
  attrs: Record<string, unknown>,
): unknown {
  const attrsCopy = { ...attrs };
  const type = (attrsCopy['type'] as string | undefined) ?? '';
  const explicitId = (attrsCopy['id'] as string | undefined) ?? '';
  const businessObject = attrsCopy['businessObject'] as BpmnBusinessObject | undefined;
  const eventDefinitionType = attrsCopy['eventDefinitionType'] as string | undefined;

  const businessObjectStub = eventDefinitionType
    ? { eventDefinitions: [{ $type: eventDefinitionType }] }
    : undefined;

  const isFreshInteractive =
    !businessObject &&
    explicitId === '' &&
    type !== '' &&
    resolvePrefix(type, businessObjectStub) !== null;

  if (isFreshInteractive) {
    const createAttrs = eventDefinitionType
      ? { eventDefinitions: [{ $type: eventDefinitionType }] }
      : {};
    const newBusinessObject = this._bpmnFactory.create(type, createAttrs);
    const id = generarIdLegacy(type, newBusinessObject, this._legacyElementRegistry);

    if (id && !LEGACY_ID_PATTERN.test(id)) {
      newBusinessObject.id = id;
    }

    attrsCopy['businessObject'] = newBusinessObject as unknown as Record<string, unknown>;
  }

  return (BaseBpmnElementFactory.prototype.createElement as any).call(this, elementType, attrsCopy);
};

export const legacyElementFactoryModule: ModuleDeclaration = {
  elementFactory: ['type', LegacyElementFactory],
};

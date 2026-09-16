import {
  BpmnElementRegistry,
  LEGACY_ID_PATTERN,
  createLegacyId,
  generarIdLegacy,
} from './legacy-id-utils';

class RegistryFake implements BpmnElementRegistry {
  private readonly elementos = new Set<string>();

  get(id: string): unknown {
    return this.elementos.has(id) ? { id } : null;
  }

  getAll(): Array<{ id: string }> {
    return [...this.elementos].map((id) => ({ id }));
  }

  registrar(id: string): void {
    this.elementos.add(id);
  }
}

describe('legacy-id-utils', () => {
  beforeEach(() => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date(2026, 8, 1, 11, 45, 0, 0));
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  describe('generarIdLegacy', () => {
    it('genera fecha + correlativo 001 en un diagrama vacío', () => {
      const registry = new RegistryFake();

      expect(generarIdLegacy('bpmn:SequenceFlow', undefined, registry)).toBe(
        'Transicion_010920261145001',
      );
    });

    it('actualiza la fecha a la actual y continúa el correlativo global', () => {
      const registry = new RegistryFake();
      registry.registrar('Transicion_310820262359001');
      registry.registrar('Transicion_010820261200002');

      expect(generarIdLegacy('bpmn:SequenceFlow', undefined, registry)).toBe(
        'Transicion_010920261145003',
      );
    });

    it('continúa desde máximo + 1 cuando existen ids legacy', () => {
      const registry = new RegistryFake();
      registry.registrar('Transicion_95202613732165');

      expect(generarIdLegacy('bpmn:SequenceFlow', undefined, registry)).toBe(
        'Transicion_95202613732166',
      );
    });

    it('continúa desde máximo + 1 cuando coexisten ids legacy y de formato fecha', () => {
      const registry = new RegistryFake();
      registry.registrar('Transicion_9520261373216196');
      registry.registrar('Transicion_010920261145005');

      expect(generarIdLegacy('bpmn:SequenceFlow', undefined, registry)).toBe(
        'Transicion_9520261373216197',
      );
    });

    it('trata un sufijo de 15 dígitos con fecha inválida como legacy', () => {
      const registry = new RegistryFake();
      registry.registrar('Transicion_133320261145001');

      expect(generarIdLegacy('bpmn:SequenceFlow', undefined, registry)).toBe(
        'Transicion_133320261145002',
      );
    });

    it('mantiene correlativos independientes por prefijo', () => {
      const registry = new RegistryFake();
      registry.registrar('Tarea_010920261145007');

      expect(generarIdLegacy('bpmn:SequenceFlow', undefined, registry)).toBe(
        'Transicion_010920261145001',
      );
    });

    it('permite que el correlativo crezca al superar 999', () => {
      const registry = new RegistryFake();
      registry.registrar('Transicion_310820262359999');

      expect(generarIdLegacy('bpmn:SequenceFlow', undefined, registry)).toBe(
        'Transicion_0109202611451000',
      );
    });

    it('resuelve colisión con el registry incrementando el sufijo', () => {
      const registry: BpmnElementRegistry = {
        get: (id: string) => (id === 'Transicion_010920261145002' ? { id } : null),
        getAll: () => [{ id: 'Transicion_010920261145001' }],
      };

      expect(generarIdLegacy('bpmn:SequenceFlow', undefined, registry)).toBe(
        'Transicion_010920261145003',
      );
    });

    it('genera sin getAll disponible', () => {
      const registry: BpmnElementRegistry = { get: () => null };

      expect(generarIdLegacy('bpmn:Task', undefined, registry)).toBe('Tarea_010920261145001');
    });

    it('retorna null para tipos sin prefijo', () => {
      const registry = new RegistryFake();

      expect(generarIdLegacy('bpmn:TextAnnotation', undefined, registry)).toBeNull();
    });
  });

  describe('createLegacyId', () => {
    it('mapea tipos bpmn y event definitions a prefijos legacy', () => {
      const registry = new RegistryFake();

      expect(createLegacyId('bpmn:Task', undefined, registry)).toBe('Tarea_010920261145001');
      expect(createLegacyId('bpmn:EndEvent', 'bpmn:TerminateEventDefinition', registry)).toBe(
        'Termino_010920261145001',
      );
      expect(
        createLegacyId('bpmn:IntermediateCatchEvent', 'bpmn:TimerEventDefinition', registry),
      ).toBe('Timer_010920261145001');
      expect(
        createLegacyId('bpmn:IntermediateThrowEvent', 'bpmn:MessageEventDefinition', registry),
      ).toBe('Mensaje_010920261145001');
    });
  });

  describe('LEGACY_ID_PATTERN', () => {
    it('acepta ids con correlativo de longitud variable', () => {
      expect(LEGACY_ID_PATTERN.test('Transicion_010920261145001')).toBeTrue();
      expect(LEGACY_ID_PATTERN.test('Transicion_95202613732166')).toBeTrue();
      expect(LEGACY_ID_PATTERN.test('Flow_1')).toBeFalse();
    });
  });
});

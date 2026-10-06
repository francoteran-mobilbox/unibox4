import {
  BpmnElementRegistryConNombres,
  crearShapeConNombreDefault,
  resolvePrefijoNombre,
  siguienteNombreDefault,
} from './nombre-default-utils';

class RegistryFake implements BpmnElementRegistryConNombres {
  private readonly elementos: Array<{
    id: string;
    businessObject?: { name?: string };
  }> = [];

  get(id: string): unknown {
    return this.elementos.find((elemento) => elemento.id === id) ?? null;
  }

  getAll(): Array<{ id: string; businessObject?: { name?: string } }> {
    return [...this.elementos];
  }

  registrar(id: string, name?: string): void {
    this.elementos.push({
      id,
      ...(name !== undefined ? { businessObject: { name } } : {}),
    });
  }

  eliminar(id: string): void {
    const indice = this.elementos.findIndex((elemento) => elemento.id === id);

    if (indice >= 0) {
      this.elementos.splice(indice, 1);
    }
  }
}

describe('nombre-default-utils', () => {
  beforeEach(() => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date(2026, 8, 1, 11, 45, 0, 0));
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  describe('resolvePrefijoNombre', () => {
    it('mapea cada tipo de nodo a su prefijo de nombre', () => {
      expect(resolvePrefijoNombre('bpmn:StartEvent')).toBe('Inicio');
      expect(resolvePrefijoNombre('bpmn:EndEvent')).toBe('Fin');
      expect(resolvePrefijoNombre('bpmn:Task')).toBe('Actividad');
      expect(resolvePrefijoNombre('bpmn:ExclusiveGateway')).toBe('Regla de negocio');
      expect(resolvePrefijoNombre('bpmn:ParallelGateway')).toBe('Enlace paralelo');
      expect(resolvePrefijoNombre('bpmn:InclusiveGateway')).toBe('Decisión');
      expect(resolvePrefijoNombre('bpmn:TextAnnotation')).toBeNull();
    });

    it('distingue fin normal de fin con terminate y los eventos intermedios', () => {
      expect(
        resolvePrefijoNombre('bpmn:EndEvent', {
          eventDefinitions: [{ $type: 'bpmn:TerminateEventDefinition' }],
        }),
      ).toBe('Término');
      expect(
        resolvePrefijoNombre('bpmn:EndEvent', {
          eventDefinitions: [{ $type: 'bpmn:MessageEventDefinition' }],
        }),
      ).toBe('Fin');
      expect(
        resolvePrefijoNombre('bpmn:IntermediateThrowEvent', {
          eventDefinitions: [{ $type: 'bpmn:MessageEventDefinition' }],
        }),
      ).toBe('Mensaje');
      expect(
        resolvePrefijoNombre('bpmn:IntermediateCatchEvent', {
          eventDefinitions: [{ $type: 'bpmn:TimerEventDefinition' }],
        }),
      ).toBe('Timer');
      expect(
        resolvePrefijoNombre('bpmn:IntermediateCatchEvent', {
          eventDefinitions: [{ $type: 'bpmn:MessageEventDefinition' }],
        }),
      ).toBeNull();
    });
  });

  describe('siguienteNombreDefault', () => {
    it('empieza en 1 en un diagrama vacío', () => {
      const registry = new RegistryFake();

      expect(siguienteNombreDefault('bpmn:StartEvent', undefined, registry)).toBe('Inicio 1');
      expect(siguienteNombreDefault('bpmn:Task', undefined, registry)).toBe('Actividad 1');
    });

    it('continúa desde el máximo N existente + 1 por tipo', () => {
      const registry = new RegistryFake();
      registry.registrar('Actividad_1', 'Actividad 3');
      registry.registrar('Inicio_1', 'Inicio 2');
      registry.registrar('Fin_1', 'Fin 1');

      expect(siguienteNombreDefault('bpmn:Task', undefined, registry)).toBe('Actividad 4');
      expect(siguienteNombreDefault('bpmn:StartEvent', undefined, registry)).toBe('Inicio 3');
      expect(siguienteNombreDefault('bpmn:EndEvent', undefined, registry)).toBe('Fin 2');
    });

    it('ignora nombres que no cumplen el patrón y nombres de otros tipos', () => {
      const registry = new RegistryFake();
      registry.registrar('Actividad_1', 'Actividad');
      registry.registrar('Actividad_2', 'Aprobación');
      registry.registrar('Inicio_1', 'Inicio 7');

      expect(siguienteNombreDefault('bpmn:Task', undefined, registry)).toBe('Actividad 1');
      expect(siguienteNombreDefault('bpmn:StartEvent', undefined, registry)).toBe('Inicio 8');
    });

    it('reutiliza el N cuando el máximo fue eliminado', () => {
      const registry = new RegistryFake();
      registry.registrar('Actividad_1', 'Actividad 1');
      registry.registrar('Actividad_2', 'Actividad 2');
      registry.eliminar('Actividad_2');

      expect(siguienteNombreDefault('bpmn:Task', undefined, registry)).toBe('Actividad 2');
    });

    it('usa el prefijo Término para el evento de fin con terminate', () => {
      const registry = new RegistryFake();

      expect(
        siguienteNombreDefault('bpmn:EndEvent', 'bpmn:TerminateEventDefinition', registry),
      ).toBe('Término 1');
    });
  });

  describe('crearShapeConNombreDefault', () => {
    function construirDeps(): {
      bpmnFactory: { create: jasmine.Spy };
      elementFactory: { createShape: jasmine.Spy };
    } {
      return {
        bpmnFactory: {
          create: jasmine
            .createSpy('create')
            .and.callFake((type: string, attrs?: Record<string, unknown>) => ({
              $type: type,
              ...attrs,
            })),
        },
        elementFactory: {
          createShape: jasmine
            .createSpy('createShape')
            .and.callFake((attrs: Record<string, unknown>) => ({ ...attrs })),
        },
      };
    }

    it('crea el shape con businessObject que trae id legacy y nombre default', () => {
      const registry = new RegistryFake();
      const deps = construirDeps();

      const shape = crearShapeConNombreDefault(
        { type: 'bpmn:Task' },
        {
          elementRegistry: registry,
          bpmnFactory: deps.bpmnFactory,
          elementFactory: deps.elementFactory,
        },
      ) as { businessObject?: { id?: string; name?: string } };

      expect(deps.bpmnFactory.create).toHaveBeenCalledWith('bpmn:Task', {
        id: 'Tarea_010920261145001',
        name: 'Actividad 1',
      });
      expect(shape.businessObject?.id).toBe('Tarea_010920261145001');
      expect(shape.businessObject?.name).toBe('Actividad 1');
      expect(deps.elementFactory.createShape).toHaveBeenCalledWith({
        type: 'bpmn:Task',
        businessObject: shape.businessObject,
      });
    });

    it('pasa el eventDefinitionType y usa el prefijo Término para terminate', () => {
      const registry = new RegistryFake();
      const deps = construirDeps();

      const shape = crearShapeConNombreDefault(
        {
          type: 'bpmn:EndEvent',
          eventDefinitionType: 'bpmn:TerminateEventDefinition',
        },
        {
          elementRegistry: registry,
          bpmnFactory: deps.bpmnFactory,
          elementFactory: deps.elementFactory,
        },
      ) as { businessObject?: { name?: string } };

      expect(deps.elementFactory.createShape).toHaveBeenCalledWith({
        type: 'bpmn:EndEvent',
        eventDefinitionType: 'bpmn:TerminateEventDefinition',
        businessObject: shape.businessObject,
      });
      expect(shape.businessObject?.name).toBe('Término 1');
    });

    it('usa el fallback sin businessObject cuando el tipo no tiene id legacy', () => {
      const registry = new RegistryFake();
      const deps = construirDeps();
      const kind = { type: 'bpmn:TextAnnotation', group: 'model' };

      crearShapeConNombreDefault(kind, {
        elementRegistry: registry,
        bpmnFactory: deps.bpmnFactory,
        elementFactory: deps.elementFactory,
      });

      expect(deps.bpmnFactory.create).not.toHaveBeenCalled();
      expect(deps.elementFactory.createShape).toHaveBeenCalledWith(kind);
    });
  });
});

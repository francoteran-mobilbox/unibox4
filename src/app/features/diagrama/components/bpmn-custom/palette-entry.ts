export interface BpmnToolAction {
  readonly click?: (event: MouseEvent) => void;
  readonly dragstart?: (event: MouseEvent) => void;
}

export interface BpmnPaletteEntry {
  readonly group?: string;
  readonly className?: string;
  readonly title?: string;
  readonly separator?: boolean;
  readonly action?: BpmnToolAction;
  [key: string]: unknown;
}

export type BpmnPaletteEntries = Record<string, BpmnPaletteEntry>;

export type BpmnContextPadEntry = {
  readonly group?: string;
  readonly className?: string;
  readonly title?: string;
  readonly action?: {
    readonly click?: (event: MouseEvent, element: unknown) => void;
    readonly dragstart?: (event: MouseEvent, element: unknown) => void;
  };
};

export type BpmnContextPadEntries = Record<string, BpmnContextPadEntry>;

export interface CreateService {
  start(event: MouseEvent, shapeOrShapes: unknown, context?: Record<string, unknown>): void;
}

export interface ElementFactoryService {
  createShape(attrs: { id?: string; type: string; eventDefinitionType?: string }): unknown;
}

export interface ElementRegistryService {
  get(id: string): unknown;
}

export interface HandToolService {
  activateHand(event: MouseEvent): void;
}

export interface LassoToolService {
  activateSelection(event: MouseEvent): void;
}

export interface GlobalConnectService {
  start(event: MouseEvent): void;
}

export interface ConnectService {
  start(event: MouseEvent, element: unknown): void;
}

export interface AutoPlaceService {
  append(source: unknown, shape: unknown): void;
}

export interface PaletteService {
  registerProvider(provider: unknown): void;
}

export interface ContextPadService {
  registerProvider(provider: unknown): void;
}

import type { ModuleDeclaration } from 'didi';
import { customPaletteModule } from './custom-palette-provider';
import { customContextPadModule } from './custom-context-pad-provider';
import { legacyIdBehaviorModule } from './legacy-id-behavior';
import { legacyElementFactoryModule } from './legacy-element-factory';

export const CUSTOM_BPMN_MODULES: ModuleDeclaration[] = [
  customPaletteModule,
  customContextPadModule,
  legacyIdBehaviorModule,
  legacyElementFactoryModule,
];

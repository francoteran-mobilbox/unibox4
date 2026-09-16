import { Injectable } from '@angular/core';
import Modeler from 'bpmn-js/lib/Modeler';

@Injectable({ providedIn: 'root' })
export class BpmnAdapterService {
  private preloaded = false;

  async preloadLibrary(): Promise<void> {
    if (this.preloaded) {
      return;
    }

    try {
      void Modeler;
      this.preloaded = true;
    } catch {
      this.preloaded = false;
    }
  }
}

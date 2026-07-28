import { afterNextRender, booleanAttribute, Directive, ElementRef, inject, input } from '@angular/core';

@Directive({ selector: '[appAutofocus]' })
export class AutofocusDirective {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly appAutofocus = input(true, { transform: booleanAttribute });

  constructor() {
    afterNextRender(() => {
      if (this.appAutofocus()) {
        this.host.nativeElement.focus();
      }
    });
  }
}

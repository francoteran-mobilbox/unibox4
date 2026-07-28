import { Injectable, signal } from '@angular/core';

const MOBILE_BREAKPOINT_QUERY = '(max-width: 991.98px)';

@Injectable({ providedIn: 'root' })
export class LayoutService {
  private readonly mediaQuery = window.matchMedia(MOBILE_BREAKPOINT_QUERY);

  readonly isMobile = signal<boolean>(this.mediaQuery.matches);
  readonly sidebarCollapsed = signal<boolean>(false);
  readonly mobileSidebarOpen = signal<boolean>(false);

  constructor() {
    this.mediaQuery.addEventListener('change', (event: MediaQueryListEvent) => {
      this.isMobile.set(event.matches);
      this.mobileSidebarOpen.set(false);
    });
  }

  toggleSidebar(): void {
    if (this.isMobile()) {
      this.mobileSidebarOpen.update((open) => !open);
      return;
    }
    this.sidebarCollapsed.update((collapsed) => !collapsed);
  }

  closeMobileSidebar(): void {
    this.mobileSidebarOpen.set(false);
  }
}

export class ARIAAnnouncer {
  private announcer: HTMLElement | null = null;

  constructor() {
    this.createAnnouncer();
  }

  private createAnnouncer() {
    if (typeof document === 'undefined') return;

    this.announcer = document.createElement('div');
    this.announcer.setAttribute('role', 'status');
    this.announcer.setAttribute('aria-live', 'polite');
    this.announcer.setAttribute('aria-atomic', 'true');
    this.announcer.className = 'sr-only';
    
    document.body.appendChild(this.announcer);
  }

  announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
    if (!this.announcer) return;

    this.announcer.setAttribute('aria-live', priority);
    this.announcer.textContent = message;

    setTimeout(() => {
      if (this.announcer) this.announcer.textContent = '';
    }, 1000);
  }

  destroy() {
    if (this.announcer) {
      document.body.removeChild(this.announcer);
      this.announcer = null;
    }
  }
}

export const ariaAnnouncer = new ARIAAnnouncer();

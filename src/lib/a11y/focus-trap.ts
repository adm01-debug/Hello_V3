export class FocusTrap {
  private element: HTMLElement;
  private previousFocus: HTMLElement | null = null;
  private cleanup: (() => void) | null = null;

  constructor(element: HTMLElement) {
    this.element = element;
  }

  activate() {
    this.previousFocus = document.activeElement as HTMLElement;
    
    const focusableElements = this.getFocusableElements();
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    this.element.addEventListener('keydown', handleTab);
    this.cleanup = () => this.element.removeEventListener('keydown', handleTab);
    
    firstElement.focus();
  }

  deactivate() {
    if (this.cleanup) {
      this.cleanup();
      this.cleanup = null;
    }
    
    if (this.previousFocus) {
      this.previousFocus.focus();
      this.previousFocus = null;
    }
  }

  private getFocusableElements(): HTMLElement[] {
    const selector = [
      'button:not([disabled])',
      '[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    return Array.from(this.element.querySelectorAll(selector));
  }
}

export function createFocusTrap(element: HTMLElement): FocusTrap {
  return new FocusTrap(element);
}

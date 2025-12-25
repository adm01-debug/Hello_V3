export function announceForScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcer = document.createElement('div');
  announcer.setAttribute('role', 'status');
  announcer.setAttribute('aria-live', priority);
  announcer.setAttribute('aria-atomic', 'true');
  announcer.className = 'sr-only';
  announcer.textContent = message;

  document.body.appendChild(announcer);

  setTimeout(() => {
    document.body.removeChild(announcer);
  }, 1000);
}

export function addScreenReaderLabel(element: HTMLElement, label: string) {
  const labelId = `sr-label-${Math.random().toString(36).substr(2, 9)}`;
  
  const labelElement = document.createElement('span');
  labelElement.id = labelId;
  labelElement.className = 'sr-only';
  labelElement.textContent = label;
  
  element.setAttribute('aria-labelledby', labelId);
  element.appendChild(labelElement);
}

export function hideFromScreenReader(element: HTMLElement) {
  element.setAttribute('aria-hidden', 'true');
}

export function showToScreenReader(element: HTMLElement) {
  element.removeAttribute('aria-hidden');
}

export class ScreenReaderUtils {
  static announce = announceForScreenReader;
  static addLabel = addScreenReaderLabel;
  static hide = hideFromScreenReader;
  static show = showToScreenReader;
}

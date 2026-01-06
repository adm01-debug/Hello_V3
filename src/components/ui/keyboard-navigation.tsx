import { useEffect, useCallback, useRef } from 'react';

interface KeyboardNavigationOptions {
  selector?: string;
  loop?: boolean;
  vertical?: boolean;
  horizontal?: boolean;
  onSelect?: (element: HTMLElement, index: number) => void;
  onEscape?: () => void;
}

/**
 * Hook for keyboard navigation within a container
 */
export function useKeyboardNavigation(
  containerRef: React.RefObject<HTMLElement>,
  options: KeyboardNavigationOptions = {}
) {
  const {
    selector = '[data-focusable="true"], button, a, input, select, textarea',
    loop = true,
    vertical = true,
    horizontal = false,
    onSelect,
    onEscape,
  } = options;

  const focusedIndexRef = useRef(-1);

  const getFocusableElements = useCallback((): HTMLElement[] => {
    if (!containerRef.current) return [];
    return Array.from(
      containerRef.current.querySelectorAll<HTMLElement>(selector)
    ).filter(el => !el.hasAttribute('disabled') && el.tabIndex !== -1);
  }, [containerRef, selector]);

  const focusElement = useCallback((index: number) => {
    const elements = getFocusableElements();
    if (elements.length === 0) return;

    let targetIndex = index;
    if (loop) {
      if (index < 0) targetIndex = elements.length - 1;
      if (index >= elements.length) targetIndex = 0;
    } else {
      targetIndex = Math.max(0, Math.min(index, elements.length - 1));
    }

    focusedIndexRef.current = targetIndex;
    elements[targetIndex]?.focus();
  }, [getFocusableElements, loop]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const elements = getFocusableElements();
    if (elements.length === 0) return;

    const currentIndex = focusedIndexRef.current;

    switch (event.key) {
      case 'ArrowDown':
        if (vertical) {
          event.preventDefault();
          focusElement(currentIndex + 1);
        }
        break;
      case 'ArrowUp':
        if (vertical) {
          event.preventDefault();
          focusElement(currentIndex - 1);
        }
        break;
      case 'ArrowRight':
        if (horizontal) {
          event.preventDefault();
          focusElement(currentIndex + 1);
        }
        break;
      case 'ArrowLeft':
        if (horizontal) {
          event.preventDefault();
          focusElement(currentIndex - 1);
        }
        break;
      case 'Home':
        event.preventDefault();
        focusElement(0);
        break;
      case 'End':
        event.preventDefault();
        focusElement(elements.length - 1);
        break;
      case 'Enter':
      case ' ':
        if (event.target === elements[currentIndex]) {
          onSelect?.(elements[currentIndex], currentIndex);
        }
        break;
      case 'Escape':
        onEscape?.();
        break;
    }
  }, [getFocusableElements, focusElement, vertical, horizontal, onSelect, onEscape]);

  // Track focus changes
  const handleFocusIn = useCallback((event: FocusEvent) => {
    const elements = getFocusableElements();
    const index = elements.indexOf(event.target as HTMLElement);
    if (index !== -1) {
      focusedIndexRef.current = index;
    }
  }, [getFocusableElements]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('keydown', handleKeyDown);
    container.addEventListener('focusin', handleFocusIn);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      container.removeEventListener('focusin', handleFocusIn);
    };
  }, [containerRef, handleKeyDown, handleFocusIn]);

  return {
    focusElement,
    focusFirst: () => focusElement(0),
    focusLast: () => focusElement(getFocusableElements().length - 1),
    getFocusedIndex: () => focusedIndexRef.current,
  };
}

/**
 * Hook for global keyboard shortcuts
 */
export function useGlobalShortcuts(shortcuts: Record<string, () => void>) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Build shortcut string
      const parts: string[] = [];
      if (event.metaKey || event.ctrlKey) parts.push('mod');
      if (event.shiftKey) parts.push('shift');
      if (event.altKey) parts.push('alt');
      parts.push(event.key.toLowerCase());
      
      const shortcut = parts.join('+');
      
      if (shortcuts[shortcut]) {
        event.preventDefault();
        shortcuts[shortcut]();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

/**
 * Component to trap focus within a container (for modals/dialogs)
 */
export function useFocusTrap(
  containerRef: React.RefObject<HTMLElement>,
  isActive: boolean = true
) {
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    // Store the currently focused element
    previousActiveElement.current = document.activeElement as HTMLElement;

    // Focus the first focusable element in the container
    const focusableElements = containerRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !containerRef.current) return;

      const focusableElements = containerRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Restore focus to previously focused element
      previousActiveElement.current?.focus();
    };
  }, [isActive, containerRef]);
}

/**
 * Skip link component for accessibility
 */
export function SkipLink({ 
  href = '#main-content',
  children = 'Ir para conteúdo principal'
}: {
  href?: string;
  children?: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="skip-link"
    >
      {children}
    </a>
  );
}

/**
 * Keyboard shortcut display component
 */
export function KeyboardShortcut({ 
  keys,
  className = ''
}: {
  keys: string[];
  className?: string;
}) {
  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  
  const formatKey = (key: string) => {
    const keyMap: Record<string, string> = {
      mod: isMac ? '⌘' : 'Ctrl',
      shift: isMac ? '⇧' : 'Shift',
      alt: isMac ? '⌥' : 'Alt',
      enter: '↵',
      escape: 'Esc',
      backspace: '⌫',
      delete: '⌦',
      arrowup: '↑',
      arrowdown: '↓',
      arrowleft: '←',
      arrowright: '→',
    };
    
    return keyMap[key.toLowerCase()] || key.toUpperCase();
  };

  return (
    <kbd className={`inline-flex items-center gap-0.5 ${className}`}>
      {keys.map((key, index) => (
        <span key={index}>
          <span className="px-1.5 py-0.5 text-xs font-medium bg-muted rounded border border-border">
            {formatKey(key)}
          </span>
          {index < keys.length - 1 && <span className="mx-0.5 text-muted-foreground">+</span>}
        </span>
      ))}
    </kbd>
  );
}

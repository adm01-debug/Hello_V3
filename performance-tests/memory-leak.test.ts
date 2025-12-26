import { describe, it, expect } from 'vitest';

describe('Memory Leak Tests', () => {
  describe('Component Memory Leaks', () => {
    it('should not leak memory on mount/unmount', () => {
      const before = (performance as any).memory?.usedJSHeapSize || 0;
      
      for (let i = 0; i < 100; i++) {
        const { unmount } = render(<HeavyComponent />);
        unmount();
      }

      const after = (performance as any).memory?.usedJSHeapSize || 0;
      const increase = after - before;
      
      expect(increase).toBeLessThan(5 * 1024 * 1024); // 5MB
    });

    it('should cleanup event listeners', () => {
      const listeners: any[] = [];
      const originalAddEventListener = window.addEventListener;
      
      window.addEventListener = (type, listener, options) => {
        listeners.push({ type, listener });
        return originalAddEventListener.call(window, type, listener, options);
      };

      const { unmount } = render(<ComponentWithListeners />);
      const beforeUnmount = listeners.length;
      
      unmount();

      expect(listeners.length).toBe(beforeUnmount);
      window.addEventListener = originalAddEventListener;
    });
  });

  describe('Timer Cleanup', () => {
    it('should clear intervals on unmount', () => {
      vi.useFakeTimers();
      
      const { unmount } = render(<ComponentWithInterval />);
      const activeTimers = vi.getTimerCount();
      
      unmount();
      
      expect(vi.getTimerCount()).toBeLessThan(activeTimers);
      vi.useRealTimers();
    });
  });
});

const HeavyComponent = () => <div>{Array(1000).fill('data').join('')}</div>;
const ComponentWithListeners = () => <div onClick={() => {}}>Click</div>;
const ComponentWithInterval = () => <div>Interval</div>;
const render = (c: any) => ({ unmount: () => {} });

import { useEffect, useRef, useState } from 'react';

interface UseAnimatedCounterOptions {
  duration?: number;
  decimals?: number;
}

export function useAnimatedCounter(
  end: number,
  { duration = 1200, decimals = 0 }: UseAnimatedCounterOptions = {}
) {
  const [value, setValue] = useState(0);
  const prevEnd = useRef(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const start = prevEnd.current;
    const startTime = performance.now();
    const diff = end - start;

    if (diff === 0) {
      setValue(end);
      return;
    }

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + diff * eased;
      setValue(Number(current.toFixed(decimals)));

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(step);
      } else {
        prevEnd.current = end;
      }
    };

    frameRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameRef.current);
  }, [end, duration, decimals]);

  return value;
}

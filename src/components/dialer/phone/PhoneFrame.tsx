import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PhoneFrameProps {
  children: ReactNode;
  className?: string;
}

/**
 * Moldura visual de smartphone (glass + neon) usada pelo discador.
 * Puramente apresentacional.
 */
export function PhoneFrame({ children, className }: PhoneFrameProps) {
  return (
    <div className={cn('mx-auto w-full max-w-[420px]', className)}>
      <div className="relative rounded-[2.5rem] border border-border/60 bg-card/70 p-3 shadow-2xl backdrop-blur-xl">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[2.5rem] bg-gradient-to-b from-primary/10 via-transparent to-primary/5"
        />
        <div className="relative flex min-h-[620px] flex-col rounded-[2rem] border border-border/40 bg-background/80 px-4 pb-6 pt-4">
          <div
            aria-hidden="true"
            className="mx-auto mb-4 h-1.5 w-24 rounded-full bg-muted"
          />
          {children}
        </div>
      </div>
    </div>
  );
}

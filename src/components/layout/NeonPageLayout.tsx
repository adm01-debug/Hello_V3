import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface NeonPageLayoutProps {
  children: ReactNode;
  className?: string;
  /** Show ambient mesh background */
  ambient?: boolean;
}

export function NeonPageLayout({ children, className, ambient = true }: NeonPageLayoutProps) {
  return (
    <div className={cn("space-y-6 relative", className)}>
      {ambient && (
        <div className="fixed inset-0 pointer-events-none gradient-mesh-intense opacity-30" />
      )}
      <div className="relative">
        {children}
      </div>
    </div>
  );
}

import { Loader2 } from 'lucide-react';

interface GlobalLoadingProps {
  message?: string;
  fullScreen?: boolean;
}

export function GlobalLoading({ message = 'Carregando...', fullScreen = false }: GlobalLoadingProps) {
  const containerClass = fullScreen
    ? 'fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm'
    : 'flex items-center justify-center min-h-[200px]';

  return (
    <div className={containerClass}>
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse">{message}</p>
      </div>
    </div>
  );
}

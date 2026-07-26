import { RefreshCw, X } from 'lucide-react';
import { formatOriginNotice } from '@/lib/device-identity';

interface RemoteOriginNoticeProps {
  /** Rótulo do que mudou, ex.: "Toque", "Filtro". */
  subject: string;
  device: string | null;
  updatedAt: number | null;
  onDismiss: () => void;
  className?: string;
}

/** Aviso "alterado em outro dispositivo" com origem e horário. */
export function RemoteOriginNotice({
  subject,
  device,
  updatedAt,
  onDismiss,
  className,
}: RemoteOriginNoticeProps) {
  if (updatedAt === null) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`mb-2 flex items-center gap-2 rounded-md border border-primary/40 bg-primary/10 px-2 py-1.5 text-[11px] text-foreground ${className ?? ''}`}
    >
      <RefreshCw className="h-3 w-3 shrink-0 text-primary" aria-hidden="true" />
      <span className="flex-1">{formatOriginNotice(subject, device, updatedAt)}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label={`Dispensar aviso de atualização (${subject})`}
        className="rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

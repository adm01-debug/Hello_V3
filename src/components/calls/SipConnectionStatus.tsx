import { Phone, PhoneOff, Loader2, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { SipStatus } from '@/hooks/useSipCall';
import { cn } from '@/lib/utils';

interface SipConnectionStatusProps {
  status: SipStatus;
  isRegistered: boolean;
  error?: string | null;
}

const STATUS_LABEL: Record<SipStatus, string> = {
  disconnected: 'Desconectado',
  connecting: 'Conectando...',
  registered: 'Linha SIP ativa',
  calling: 'Em chamada',
  ringing: 'Chamando',
  active: 'Em chamada',
  error: 'Erro SIP',
};

export function SipConnectionStatus({ status, isRegistered, error }: SipConnectionStatusProps) {
  const isOk = isRegistered || status === 'active' || status === 'calling' || status === 'ringing';
  const isLoading = status === 'connecting';
  const isError = status === 'error';

  const Icon = isError ? AlertTriangle : isLoading ? Loader2 : isOk ? Phone : PhoneOff;
  const variant = isError ? 'destructive' : isOk ? 'default' : 'outline';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant={variant}
          className={cn(
            'gap-1.5 font-mono text-[11px] uppercase tracking-wider px-2.5 py-1',
            isOk && 'bg-success/15 text-success border-success/30 shadow-[0_0_10px_hsl(var(--success)/0.25)]',
            isLoading && 'bg-warning/15 text-warning border-warning/30',
          )}
        >
          <Icon className={cn('h-3 w-3', isLoading && 'animate-spin')} />
          {STATUS_LABEL[status]}
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        <div className="space-y-1">
          <p className="font-semibold">Conexão da linha VoIP</p>
          <p className="text-muted-foreground">Status: {STATUS_LABEL[status]}</p>
          {error && <p className="text-destructive">Erro: {error}</p>}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

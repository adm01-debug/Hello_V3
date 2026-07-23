import { useExtensionAuditHistory } from '@/hooks/useExtensionAuditHistory';
import { Loader2, Network, PowerOff, Download, UserCog, Eye, FileEdit, Trash2, LogIn, History } from 'lucide-react';

import { ptBR } from 'date-fns/locale';

import { safeFormatDistanceToNow } from "@/lib/safe-date";
interface Props {
  agentId: string;
}

const actionMeta: Record<string, { icon: React.ElementType; label: string; tone: string }> = {
  bulk_assign_trunk: { icon: Network, label: 'Atribuição de trunk em massa', tone: 'text-primary' },
  bulk_force_offline: { icon: PowerOff, label: 'Forçado offline em massa', tone: 'text-warning' },
  bulk_export_csv: { icon: Download, label: 'Exportação CSV', tone: 'text-muted-foreground' },
  update: { icon: FileEdit, label: 'Atualização', tone: 'text-primary' },
  create: { icon: UserCog, label: 'Criação', tone: 'text-success' },
  delete: { icon: Trash2, label: 'Remoção', tone: 'text-destructive' },
  view: { icon: Eye, label: 'Visualização', tone: 'text-muted-foreground' },
  login: { icon: LogIn, label: 'Login', tone: 'text-success' },
};

export function ExtensionAuditTimeline({ agentId }: Props) {
  const { data, isLoading } = useExtensionAuditHistory(agentId);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        <History className="h-8 w-8 mx-auto mb-2 opacity-40" />
        Nenhuma ação registrada para este ramal.
      </div>
    );
  }

  return (
    <ol className="relative border-l border-border pl-5 space-y-4">
      {data.map(entry => {
        const meta = actionMeta[entry.action] ?? { icon: History, label: entry.action, tone: 'text-muted-foreground' };
        const Icon = meta.icon;
        const when = safeFormatDistanceToNow(entry.created_at, { addSuffix: true, locale: ptBR });
        const detailCount = entry.details && typeof entry.details === 'object' && 'count' in entry.details
          ? (entry.details as { count?: number }).count
          : undefined;
        return (
          <li key={entry.id} className="relative">
            <span className={`absolute -left-[27px] top-0 flex h-5 w-5 items-center justify-center rounded-full bg-card border border-border ${meta.tone}`}>
              <Icon className="h-3 w-3" />
            </span>
            <div className="rounded-lg border border-border/60 bg-card/50 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold">{meta.label}</p>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">{when}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {entry.user_email ?? 'Sistema'}
                {entry.user_role && <span className="ml-1 uppercase tracking-wider opacity-70">· {entry.user_role}</span>}
                {detailCount !== undefined && <span className="ml-1">· {detailCount} ramais</span>}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

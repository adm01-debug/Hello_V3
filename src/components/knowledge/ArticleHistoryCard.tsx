import { useState } from 'react';
import { History, Loader2, RefreshCw } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  kbHistoryActorLabel,
  kbHistoryChangeLabel,
  kbHistoryChangeTone,
  kbHistoryContentChanged,
  kbHistoryPreview,
  kbHistoryTitleChanged,
  useKbArticleHistory,
} from '@/hooks/useKbArticleHistory';
import { safeFormatDatePtBR } from '@/lib/safe-date';

const TONE_CLASS: Record<string, string> = {
  create: 'bg-success/10 text-success border-success/30',
  update: 'bg-primary/10 text-primary border-primary/30',
  status: 'bg-muted text-foreground border-border',
  neutral: 'bg-muted text-muted-foreground border-border',
};

const DATE_MASK = "dd/MM/yyyy 'às' HH:mm";

interface ArticleHistoryCardProps {
  articleId: string | null;
}

export function ArticleHistoryCard({ articleId }: ArticleHistoryCardProps) {
  const query = useKbArticleHistory(articleId);
  const [openId, setOpenId] = useState<string | null>(null);
  const entries = query.data ?? [];

  return (
    <Card className="space-y-2 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <h3 className="text-sm font-medium">Histórico de versões</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 text-xs"
          onClick={() => void query.refetch()}
          disabled={query.isFetching}
          aria-label="Atualizar histórico de versões"
        >
          {query.isFetching ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          Atualizar
        </Button>
      </div>

      {query.isLoading ? (
        <p className="text-xs text-muted-foreground" aria-busy="true">
          Carregando histórico...
        </p>
      ) : query.isError ? (
        <div className="space-y-2">
          <p className="text-xs text-destructive">Não foi possível ler o histórico de versões agora.</p>
          <Button variant="outline" size="sm" onClick={() => void query.refetch()}>
            Tentar de novo
          </Button>
        </div>
      ) : entries.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Nenhuma versão registrada. O histórico passa a ser gravado na próxima criação ou edição deste artigo.
        </p>
      ) : (
        <ul className="space-y-2">
          {entries.map((entry) => {
            const open = openId === entry.id;
            const panelId = `kb-history-${entry.id}`;
            return (
              <li key={entry.id} className="space-y-1 rounded-md border border-border/60 p-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${TONE_CLASS[kbHistoryChangeTone(entry.change_type)]}`}
                  >
                    {kbHistoryChangeLabel(entry.change_type)}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground">
                    {safeFormatDatePtBR(entry.created_at, DATE_MASK)}
                  </span>
                  <span className="text-[11px] text-muted-foreground">{kbHistoryActorLabel(entry.changed_by)}</span>
                </div>
                {kbHistoryTitleChanged(entry) && (
                  <p className="text-xs text-muted-foreground">
                    Título: “{entry.previous_title}” → “{entry.new_title}”
                  </p>
                )}
                {kbHistoryContentChanged(entry) && (
                  <div className="space-y-1">
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-xs"
                      aria-expanded={open}
                      aria-controls={panelId}
                      onClick={() => setOpenId(open ? null : entry.id)}
                    >
                      {open ? 'Ocultar o que mudou' : 'Ver o que mudou'}
                    </Button>
                    {open && (
                      <div id={panelId} className="grid gap-2 sm:grid-cols-2">
                        <div>
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Antes</p>
                          <p className="whitespace-pre-wrap text-xs">
                            {kbHistoryPreview(entry.previous_content) || '—'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Depois</p>
                          <p className="whitespace-pre-wrap text-xs">{kbHistoryPreview(entry.new_content) || '—'}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-[11px] text-muted-foreground">Visível apenas para administradores e supervisores.</p>
    </Card>
  );
}
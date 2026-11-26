import { useState } from 'react';
import { FileSearch, Loader2, RefreshCw } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  countRedactionSegments,
  redactionPatternList,
  redactionStatusLabel,
  redactionStatusTone,
  useRedactionLog,
  type RedactionLogEntry,
} from '@/hooks/useRedactionLog';
import { safeFormatDatePtBR } from '@/lib/safe-date';

const TONE_CLASS: Record<string, string> = {
  success: 'bg-success/10 text-success border-success/30',
  neutral: 'bg-muted text-muted-foreground border-border',
  danger: 'bg-destructive/10 text-destructive border-destructive/30',
};

function shortId(id: string | null): string {
  if (!id) return 'sem sessao';
  return id.length > 8 ? `${id.slice(0, 8)}...` : id;
}

function toPreview(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2) ?? '—';
  } catch {
    return String(value);
  }
}

/**
 * Historico do `redaction_log` gravado pela edge `redact-sensitive-audio`.
 * Sem esta leitura a tabela era escrita e nunca auditada.
 */
export function RedactionLogCard() {
  const { data, isLoading, isError, refetch, isFetching } = useRedactionLog();
  const [openId, setOpenId] = useState<string | null>(null);

  const entries: RedactionLogEntry[] = data ?? [];
  const totalOccurrences = entries.reduce((sum, e) => sum + (e.match_count ?? 0), 0);

  return (
    <Card className="p-5 bg-card/60 backdrop-blur border-primary/20">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h2 className="font-semibold flex items-center gap-2">
            <FileSearch className="h-5 w-5 text-primary" /> Historico de redacoes
          </h2>
          <p className="text-sm text-muted-foreground">
            Ultimas {entries.length || 0} execucoes registradas no log de auditoria
            {entries.length > 0 ? ` — ${totalOccurrences} ocorrencia(s) sensivel(is) no total` : ''}.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => void refetch()}
          disabled={isFetching}
          aria-label="Atualizar historico de redacoes"
        >
          {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Atualizar
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando historico...
        </p>
      ) : isError ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
          <p className="text-destructive mb-2">
            Nao foi possivel ler o log de redacoes agora. Tente novamente.
          </p>
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            Tentar novamente
          </Button>
        </div>
      ) : entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhuma redacao registrada ainda. Ao redatar uma transcricao, a execucao aparece aqui.
          {' '}A leitura deste log e restrita a administradores.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quando</TableHead>
                <TableHead>Sessao</TableHead>
                <TableHead>Padroes</TableHead>
                <TableHead className="text-right">Ocorrencias</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Segmentos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => {
                const patterns = redactionPatternList(entry.pattern_type);
                const segments = countRedactionSegments(entry.segments);
                const isOpen = openId === entry.id;
                return (
                  <TableRow key={entry.id}>
                    <TableCell className="whitespace-nowrap">
                      {safeFormatDatePtBR(entry.created_at, "dd/MM/yyyy 'as' HH:mm")}
                    </TableCell>
                    <TableCell className="font-mono text-xs" title={entry.call_session_id ?? ''}>
                      {shortId(entry.call_session_id)}
                    </TableCell>
                    <TableCell>
                      {patterns.length === 0 ? (
                        <span className="text-muted-foreground text-xs">nenhum padrao</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {patterns.map((p) => (
                            <Badge key={p} variant="outline" className="text-xs uppercase">
                              {p}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{entry.match_count}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={TONE_CLASS[redactionStatusTone(entry.status)]}
                      >
                        {redactionStatusLabel(entry.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {segments === 0 ? (
                        <span className="text-muted-foreground text-xs">—</span>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setOpenId(isOpen ? null : entry.id)}
                          aria-expanded={isOpen}
                          aria-label={`Ver segmentos sensiveis de ${shortId(entry.call_session_id)}`}
                        >
                          {segments}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {openId && (
        <div className="mt-3 rounded-md border border-primary/20 bg-background/50 p-3 text-sm">
          <p className="font-medium mb-2">Segmentos marcados</p>
          <pre className="text-xs text-muted-foreground max-h-64 overflow-auto">
            {toPreview(entries.find((e) => e.id === openId)?.segments)}
          </pre>
          {entries.find((e) => e.id === openId)?.error_message ? (
            <p className="text-destructive text-xs mt-2">
              Erro registrado: {entries.find((e) => e.id === openId)?.error_message}
            </p>
          ) : null}
        </div>
      )}
    </Card>
  );
}

export default RedactionLogCard;
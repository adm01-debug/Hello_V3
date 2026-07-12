import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Copy } from "lucide-react";
import { toast } from "sonner";
import type { WebhookHistoryEntry } from "@/lib/security-alerts-webhook-history";

/**
 * Linha de uma entrada do histórico de webhook com detalhes expansíveis.
 *
 * Mostra: status, filename, formato, contagem, badges (teste/HMAC), timestamp,
 * latência e erro. Ao expandir, revela request_id, URL de destino, headers
 * seguros da última resposta, snippet do corpo e trilha completa por tentativa
 * (attempt/status/duração/erro/snippet).
 */
export function WebhookHistoryEntryRow({ entry }: { entry: WebhookHistoryEntry }) {
  const [open, setOpen] = useState(false);

  const copyRequestId = () => {
    if (!entry.request_id) return;
    void navigator.clipboard.writeText(entry.request_id).then(
      () => toast.success("Request ID copiado"),
      () => toast.error("Não foi possível copiar"),
    );
  };

  const detailAttempts = entry.attempts_detail ?? [];

  return (
    <div className="p-2 text-[11px]">
      <div className="flex items-start gap-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="mt-0.5 text-muted-foreground hover:text-foreground"
          aria-label={open ? "Recolher detalhes" : "Expandir detalhes"}
          aria-expanded={open}
        >
          {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>
        <Badge
          variant={entry.ok ? "secondary" : "destructive"}
          className="font-mono min-w-[52px] justify-center"
        >
          {entry.status || "ERR"}
        </Badge>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 flex-wrap">
            <span className="font-medium truncate max-w-[220px]" title={entry.filename}>
              {entry.filename}
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="uppercase text-muted-foreground">{entry.format}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">{entry.count} alerta(s)</span>
            {entry.kind === "test" && (
              <Badge variant="outline" className="h-4 px-1 text-[9px]">
                teste
              </Badge>
            )}
            {entry.signed && (
              <Badge variant="outline" className="h-4 px-1 text-[9px]">
                HMAC
              </Badge>
            )}
            {typeof entry.attempts === "number" && entry.attempts > 1 && (
              <Badge variant="outline" className="h-4 px-1 text-[9px]">
                {entry.attempts}x
              </Badge>
            )}
          </div>
          <div className="text-muted-foreground truncate" title={entry.error ?? entry.url}>
            {new Date(entry.at).toLocaleString("pt-BR")} · {entry.latency_ms}ms
            {entry.error ? ` · ${entry.error}` : ""}
          </div>
        </div>
      </div>

      {open && (
        <div className="mt-2 ml-5 space-y-2 rounded-md border border-border/50 bg-muted/20 p-2">
          <div className="grid grid-cols-[max-content_1fr] gap-x-2 gap-y-1">
            <span className="text-muted-foreground">URL</span>
            <code className="font-mono break-all">{entry.url}</code>
            {entry.request_id && (
              <>
                <span className="text-muted-foreground">Request ID</span>
                <span className="flex items-center gap-1">
                  <code className="font-mono break-all">{entry.request_id}</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 px-1"
                    onClick={copyRequestId}
                    aria-label="Copiar Request ID"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </span>
              </>
            )}
          </div>

          {entry.response_headers && Object.keys(entry.response_headers).length > 0 && (
            <div>
              <div className="text-muted-foreground mb-0.5">Cabeçalhos da resposta</div>
              <pre className="font-mono text-[10px] whitespace-pre-wrap break-all rounded bg-background p-1.5 border border-border/40">
                {Object.entries(entry.response_headers)
                  .map(([k, v]) => `${k}: ${v}`)
                  .join("\n")}
              </pre>
            </div>
          )}

          {entry.response_snippet && (
            <div>
              <div className="text-muted-foreground mb-0.5">Corpo da resposta (trecho)</div>
              <pre className="font-mono text-[10px] whitespace-pre-wrap break-all rounded bg-background p-1.5 border border-border/40 max-h-32 overflow-auto">
                {entry.response_snippet}
              </pre>
            </div>
          )}

          {detailAttempts.length > 0 && (
            <div>
              <div className="text-muted-foreground mb-0.5">
                Trilha de tentativas ({detailAttempts.length})
              </div>
              <div className="space-y-1">
                {detailAttempts.map((a) => (
                  <div
                    key={`${entry.id}-${a.attempt}`}
                    className="flex items-start gap-2 rounded border border-border/40 bg-background/60 p-1.5"
                  >
                    <Badge
                      variant={a.ok ? "secondary" : "destructive"}
                      className="font-mono h-5 min-w-[40px] justify-center text-[10px]"
                    >
                      {a.status || "ERR"}
                    </Badge>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="font-medium">Tentativa {a.attempt}</span>
                        <span className="text-muted-foreground">
                          {new Date(a.started_at).toLocaleTimeString("pt-BR")}
                        </span>
                        <span className="text-muted-foreground">· {a.duration_ms}ms</span>
                        {a.error && <span className="text-destructive">· {a.error}</span>}
                      </div>
                      {a.response_snippet && (
                        <div
                          className="mt-1 font-mono text-[10px] text-muted-foreground break-all line-clamp-3"
                          title={a.response_snippet}
                        >
                          {a.response_snippet}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

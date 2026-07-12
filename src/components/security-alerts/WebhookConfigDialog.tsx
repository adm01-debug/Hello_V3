import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Trash2, Download, AlertCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  WEBHOOK_MAX_ATTEMPTS_MIN,
  WEBHOOK_MAX_ATTEMPTS_MAX,
  WEBHOOK_BASE_DELAY_MIN,
  WEBHOOK_BASE_DELAY_MAX,
  WEBHOOK_MAX_DELAY_MIN,
  WEBHOOK_MAX_DELAY_MAX,
} from "@/lib/security-alerts-webhook";
import {
  hasBlockingErrors,
  type WebhookValidationResult,
  type WebhookField,
} from "@/lib/security-alerts-webhook-validation";
import type { WebhookHistoryEntry } from "@/lib/security-alerts-webhook-history";


export interface WebhookConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  webhookUrl: string;
  webhookSecret: string;
  webhookDraft: string;
  setWebhookDraft: (v: string) => void;
  webhookSecretDraft: string;
  setWebhookSecretDraft: (v: string) => void;
  webhookMaxAttemptsDraft: number;
  setWebhookMaxAttemptsDraft: (v: number) => void;
  webhookBaseDelayDraft: number;
  setWebhookBaseDelayDraft: (v: number) => void;
  webhookMaxDelayDraft: number;
  setWebhookMaxDelayDraft: (v: number) => void;
  webhookValidation: WebhookValidationResult;
  webhookHistory: WebhookHistoryEntry[];
  webhookPendingCount: number;
  isTestingWebhook: boolean;
  isFlushingQueue: boolean;
  onSave: () => void;
  onTest: () => void;
  onFlushQueue: () => void;
  onClearQueue: () => void;
  onExportHistory: () => void;
  onClearHistory: () => void;
}

/** Renderiza mensagem inline de erro ou aviso sob um input. */
function FieldMessage({
  validation,
  field,
}: {
  validation: WebhookValidationResult;
  field: WebhookField;
}) {
  const err = validation.errors[field];
  const warn = validation.warnings[field];
  if (err) {
    return (
      <p role="alert" className="mt-1 flex items-start gap-1 text-xs text-destructive">
        <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
        <span>{err}</span>
      </p>
    );
  }
  if (warn) {
    return (
      <p className="mt-1 flex items-start gap-1 text-xs text-amber-600 dark:text-amber-500">
        <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
        <span>{warn}</span>
      </p>
    );
  }
  return null;
}

function inputErrorClass(v: WebhookValidationResult, field: WebhookField): string {
  return v.errors[field] ? "border-destructive focus-visible:ring-destructive" : "";
}


export function WebhookConfigDialog(props: WebhookConfigDialogProps) {
  const {
    open, onOpenChange,
    webhookUrl, webhookSecret,
    webhookDraft, setWebhookDraft,
    webhookSecretDraft, setWebhookSecretDraft,
    webhookMaxAttemptsDraft, setWebhookMaxAttemptsDraft,
    webhookBaseDelayDraft, setWebhookBaseDelayDraft,
    webhookMaxDelayDraft, setWebhookMaxDelayDraft,
    webhookValidation,
    webhookHistory, webhookPendingCount,
    isTestingWebhook, isFlushingQueue,
    onSave, onTest, onFlushQueue, onClearQueue, onExportHistory, onClearHistory,
  } = props;
  const blocked = hasBlockingErrors(webhookValidation);
  const canTest = !blocked && webhookValidation.normalizedUrl.length > 0;


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Webhook de exportação</DialogTitle>
          <DialogDescription>
            Toda exportação (CSV/PDF) dispara um POST JSON com <code className="font-mono">filename</code>,{" "}
            <code className="font-mono">format</code>, <code className="font-mono">count</code> e os filtros
            ativos. Deixe em branco para desativar.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="webhook-url">URL do webhook</Label>
          <Input
            id="webhook-url"
            placeholder="https://exemplo.com/hooks/security-alerts"
            value={webhookDraft}
            onChange={(e) => setWebhookDraft(e.target.value)}
            aria-invalid={!!webhookValidation.errors.url}
            aria-describedby="webhook-url-msg"
            className={cn(inputErrorClass(webhookValidation, "url"))}
            autoFocus
          />
          <div id="webhook-url-msg">
            <FieldMessage validation={webhookValidation} field="url" />
          </div>
          <p className="text-xs text-muted-foreground">
            Armazenado localmente neste navegador. Requer CORS habilitado no endpoint receptor.
          </p>
          <Label htmlFor="webhook-secret" className="pt-2 block">Segredo HMAC (opcional)</Label>
          <Input
            id="webhook-secret"
            type="password"
            placeholder="Deixe em branco para desativar assinatura"
            value={webhookSecretDraft}
            onChange={(e) => setWebhookSecretDraft(e.target.value)}
            aria-invalid={!!webhookValidation.errors.secret}
            aria-describedby="webhook-secret-msg"
            className={cn(inputErrorClass(webhookValidation, "secret"))}
            autoComplete="off"
          />
          <div id="webhook-secret-msg">
            <FieldMessage validation={webhookValidation} field="secret" />
          </div>
          <p className="text-xs text-muted-foreground">
            Quando definido, o POST inclui <code className="font-mono">X-Lovable-Signature: sha256=&lt;hmac&gt;</code>{" "}
            e <code className="font-mono">X-Lovable-Timestamp</code> (= <code className="font-mono">generated_at</code>).
            Valide no receptor recomputando HMAC-SHA256 do corpo bruto com o mesmo segredo.
          </p>
          <Label htmlFor="webhook-max-attempts" className="pt-2 block">
            Máximo de tentativas ({WEBHOOK_MAX_ATTEMPTS_MIN}–{WEBHOOK_MAX_ATTEMPTS_MAX})
          </Label>
          <Input
            id="webhook-max-attempts"
            type="number"
            min={WEBHOOK_MAX_ATTEMPTS_MIN}
            max={WEBHOOK_MAX_ATTEMPTS_MAX}
            step={1}
            value={webhookMaxAttemptsDraft}
            onChange={(e) => {
              const n = Number.parseInt(e.target.value, 10);
              setWebhookMaxAttemptsDraft(Number.isFinite(n) ? n : WEBHOOK_MAX_ATTEMPTS_MIN);
            }}
            aria-invalid={!!webhookValidation.errors.maxAttempts}
            className={cn("w-24", inputErrorClass(webhookValidation, "maxAttempts"))}
          />
          <FieldMessage validation={webhookValidation} field="maxAttempts" />
          <div className="grid grid-cols-2 gap-2 pt-2">
            <div>
              <Label htmlFor="webhook-base-delay" className="block">Backoff base (ms)</Label>
              <Input
                id="webhook-base-delay"
                type="number"
                min={WEBHOOK_BASE_DELAY_MIN}
                max={WEBHOOK_BASE_DELAY_MAX}
                step={50}
                value={webhookBaseDelayDraft}
                onChange={(e) => {
                  const n = Number.parseInt(e.target.value, 10);
                  setWebhookBaseDelayDraft(Number.isFinite(n) ? n : WEBHOOK_BASE_DELAY_MIN);
                }}
                aria-invalid={!!webhookValidation.errors.baseDelayMs}
                className={cn(inputErrorClass(webhookValidation, "baseDelayMs"))}
              />
              <FieldMessage validation={webhookValidation} field="baseDelayMs" />
            </div>
            <div>
              <Label htmlFor="webhook-max-delay" className="block">Backoff máx (ms)</Label>
              <Input
                id="webhook-max-delay"
                type="number"
                min={WEBHOOK_MAX_DELAY_MIN}
                max={WEBHOOK_MAX_DELAY_MAX}
                step={100}
                value={webhookMaxDelayDraft}
                onChange={(e) => {
                  const n = Number.parseInt(e.target.value, 10);
                  setWebhookMaxDelayDraft(Number.isFinite(n) ? n : WEBHOOK_MAX_DELAY_MIN);
                }}
                aria-invalid={!!webhookValidation.errors.maxDelayMs}
                className={cn(inputErrorClass(webhookValidation, "maxDelayMs"))}
              />
              <FieldMessage validation={webhookValidation} field="maxDelayMs" />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Retries usam backoff exponencial com jitter (AWS full-jitter): delay = random(0, min(máx, base·2^(n-1))).
            Só disparam em falhas transitórias (rede/timeout, 408, 429, 5xx); 4xx normais não retentam.
            Se máx &lt; base, será elevado ao valor de base ao salvar.
          </p>
          <pre className="text-[10px] p-2 rounded-md border bg-muted/30 overflow-auto font-mono">
{`{
  "event": "security_alerts.export",
  "filename": "alertas-seguranca-20260712-140033.csv",
  "format": "csv",
  "count": 42,
  "scope": "all",
  "filters": { "source": null, "q": null, "since_iso": "..." },
  "generated_at": "..."
}`}
          </pre>
          <div className="pt-3 space-y-2">
            <div className="flex items-center justify-between rounded-md border border-border/60 bg-muted/30 p-2">
              <div className="text-xs">
                <span className="font-medium">Fila pendente:</span>{" "}
                <Badge variant={webhookPendingCount > 0 ? "destructive" : "secondary"}>{webhookPendingCount}</Badge>
                <span className="ml-2 text-muted-foreground">
                  reenvia automaticamente ao voltar online / focar a aba
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onFlushQueue}
                  disabled={isFlushingQueue || webhookPendingCount === 0}
                  className="h-7 px-2"
                >
                  <RefreshCw className={`w-3 h-3 mr-1 ${isFlushingQueue ? "animate-spin" : ""}`} />
                  Reenviar agora
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearQueue}
                  disabled={webhookPendingCount === 0}
                  className="h-7 px-2"
                >
                  <Trash2 className="w-3 h-3 mr-1" /> Limpar fila
                </Button>
              </div>
            </div>
          </div>
          <div className="pt-3 space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Histórico ({webhookHistory.length})
              </Label>
              {webhookHistory.length > 0 && (
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={onExportHistory} className="h-7 px-2">
                    <Download className="w-3 h-3 mr-1" /> Exportar CSV
                  </Button>
                  <Button variant="ghost" size="sm" onClick={onClearHistory} className="h-7 px-2">
                    <Trash2 className="w-3 h-3 mr-1" /> Limpar
                  </Button>
                </div>
              )}
            </div>
            {webhookHistory.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                Nenhum envio registrado ainda. Exporte ou clique em Testar.
              </p>
            ) : (
              <div className="max-h-48 overflow-auto rounded-md border divide-y divide-border/50">
                {webhookHistory.map((h) => (
                  <div key={h.id} className="p-2 text-[11px] flex items-center gap-2">
                    <Badge
                      variant={h.ok ? "secondary" : "destructive"}
                      className="font-mono min-w-[52px] justify-center"
                    >
                      {h.status || "ERR"}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="font-medium truncate max-w-[220px]" title={h.filename}>
                          {h.filename}
                        </span>
                        <span className="text-muted-foreground">·</span>
                        <span className="uppercase text-muted-foreground">{h.format}</span>
                        <span className="text-muted-foreground">·</span>
                        <span className="text-muted-foreground">{h.count} alerta(s)</span>
                        {h.kind === "test" && (
                          <Badge variant="outline" className="h-4 px-1 text-[9px]">teste</Badge>
                        )}
                        {h.signed && (
                          <Badge variant="outline" className="h-4 px-1 text-[9px]">HMAC</Badge>
                        )}
                      </div>
                      <div className="text-muted-foreground truncate" title={h.error ?? h.url}>
                        {new Date(h.at).toLocaleString("pt-BR")} · {h.latency_ms}ms
                        {h.error ? ` · ${h.error}` : ""}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          {(webhookUrl || webhookSecret) && (
            <Button
              variant="outline"
              onClick={() => {
                setWebhookDraft("");
                setWebhookSecretDraft("");
              }}
            >
              <Trash2 className="w-4 h-4 mr-1" /> Limpar
            </Button>
          )}
          <Button
            variant="secondary"
            onClick={onTest}
            disabled={isTestingWebhook || !canTest}
            title={
              !webhookValidation.normalizedUrl
                ? "Informe uma URL para testar"
                : blocked
                  ? "Corrija os campos destacados antes de testar"
                  : undefined
            }
          >
            {isTestingWebhook ? "Testando…" : "Testar"}
          </Button>
          <Button
            onClick={onSave}
            disabled={blocked}
            title={blocked ? "Corrija os campos destacados antes de salvar" : undefined}
          >
            Salvar
          </Button>

        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

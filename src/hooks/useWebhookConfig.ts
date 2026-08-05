import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  loadWebhookUrl,
  saveWebhookUrl,
  loadWebhookSecret,
  saveWebhookSecret,
  loadWebhookMaxAttempts,
  saveWebhookMaxAttempts,
  loadWebhookBaseDelayMs,
  saveWebhookBaseDelayMs,
  loadWebhookMaxDelayMs,
  saveWebhookMaxDelayMs,
  WEBHOOK_MAX_ATTEMPTS_MIN,
  WEBHOOK_BASE_DELAY_MIN,
  WEBHOOK_MAX_DELAY_MIN,
} from "@/lib/security-alerts-webhook";
import {
  validateWebhookConfig,
  hasBlockingErrors,
  summarizeErrors,
  type WebhookValidationResult,
} from "@/lib/security-alerts-webhook-validation";

/**
 * Hook: consolida a configuração persistente do webhook de exportação
 * (URL, secret HMAC, políticas de retry) com um par draft/committed.
 *
 * A validação delega para `validateWebhookConfig` — o hook expõe o resultado
 * (`validation`) para a UI renderizar mensagens inline por campo e bloqueia
 * `save`/`test` quando há erros. Coerência base>max continua sendo elevada
 * silenciosamente ao salvar (aparece como aviso na UI antes disso).
 */
export function useWebhookConfig() {
  const [url, setUrl] = useState<string>(() => loadWebhookUrl());
  const [secret, setSecret] = useState<string>(() => loadWebhookSecret());
  const [maxAttempts, setMaxAttempts] = useState<number>(() => loadWebhookMaxAttempts());
  const [baseDelayMs, setBaseDelayMs] = useState<number>(() => loadWebhookBaseDelayMs());
  const [maxDelayMs, setMaxDelayMs] = useState<number>(() => loadWebhookMaxDelayMs());

  const [dialogOpen, setDialogOpen] = useState(false);
  const [urlDraft, setUrlDraft] = useState<string>("");
  const [secretDraft, setSecretDraft] = useState<string>("");
  const [maxAttemptsDraft, setMaxAttemptsDraft] = useState<number>(WEBHOOK_MAX_ATTEMPTS_MIN);
  const [baseDelayDraft, setBaseDelayDraft] = useState<number>(WEBHOOK_BASE_DELAY_MIN);
  const [maxDelayDraft, setMaxDelayDraft] = useState<number>(WEBHOOK_MAX_DELAY_MIN);

  const validation: WebhookValidationResult = useMemo(
    () =>
      validateWebhookConfig({
        url: urlDraft,
        secret: secretDraft,
        maxAttempts: maxAttemptsDraft,
        baseDelayMs: baseDelayDraft,
        maxDelayMs: maxDelayDraft,
      }),
    [urlDraft, secretDraft, maxAttemptsDraft, baseDelayDraft, maxDelayDraft],
  );

  const openDialog = useCallback(() => {
    setUrlDraft(url);
    setSecretDraft(secret);
    setMaxAttemptsDraft(maxAttempts);
    setBaseDelayDraft(baseDelayMs);
    setMaxDelayDraft(maxDelayMs);
    setDialogOpen(true);
  }, [url, secret, maxAttempts, baseDelayMs, maxDelayMs]);

  const save = useCallback(() => {
    if (hasBlockingErrors(validation)) {
      toast.error(`Corrija os campos: ${summarizeErrors(validation)}`);
      return;
    }
    const trimmedUrl = validation.normalizedUrl;
    const trimmedSecret = validation.normalizedSecret;
    // base já validado; garantimos apenas que max >= base ao persistir
    const finalMax = Math.max(baseDelayDraft, maxDelayDraft);

    saveWebhookUrl(trimmedUrl);
    saveWebhookSecret(trimmedSecret);
    saveWebhookMaxAttempts(maxAttemptsDraft);
    saveWebhookBaseDelayMs(baseDelayDraft);
    saveWebhookMaxDelayMs(finalMax);

    setUrl(trimmedUrl);
    setSecret(trimmedSecret);
    setMaxAttempts(maxAttemptsDraft);
    setBaseDelayMs(baseDelayDraft);
    setMaxDelayMs(finalMax);
    setDialogOpen(false);
    toast.success(trimmedUrl ? "Webhook salvo" : "Webhook removido");
  }, [validation, baseDelayDraft, maxDelayDraft, maxAttemptsDraft]);

  return {
    // committed
    url, secret, maxAttempts, baseDelayMs, maxDelayMs,
    // draft
    urlDraft, setUrlDraft,
    secretDraft, setSecretDraft,
    maxAttemptsDraft, setMaxAttemptsDraft,
    baseDelayDraft, setBaseDelayDraft,
    maxDelayDraft, setMaxDelayDraft,
    // dialog
    dialogOpen, setDialogOpen, openDialog,
    // validação (para UI inline)
    validation,
    // actions
    save,
  };
}


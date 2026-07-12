import { useCallback, useState } from "react";
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
  WEBHOOK_MAX_ATTEMPTS_MAX,
  WEBHOOK_BASE_DELAY_MIN,
  WEBHOOK_BASE_DELAY_MAX,
  WEBHOOK_MAX_DELAY_MIN,
  WEBHOOK_MAX_DELAY_MAX,
  isValidHttpUrl,
} from "@/lib/security-alerts-webhook";

/**
 * Hook: consolida a configuração persistente do webhook de exportação
 * (URL, secret HMAC, políticas de retry) com um par draft/committed. O draft
 * viabiliza edição dentro do WebhookConfigDialog sem mutar o valor efetivo
 * até o usuário confirmar. `save` aplica clamps min/max defensivos e valida
 * a URL, evitando persistência de valores fora dos intervalos suportados.
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

  const openDialog = useCallback(() => {
    setUrlDraft(url);
    setSecretDraft(secret);
    setMaxAttemptsDraft(maxAttempts);
    setBaseDelayDraft(baseDelayMs);
    setMaxDelayDraft(maxDelayMs);
    setDialogOpen(true);
  }, [url, secret, maxAttempts, baseDelayMs, maxDelayMs]);

  const save = useCallback(() => {
    const trimmed = urlDraft.trim();
    if (trimmed && !isValidHttpUrl(trimmed)) {
      toast.error("URL inválida — use http(s)://…");
      return;
    }
    const clampedAttempts = Math.max(
      WEBHOOK_MAX_ATTEMPTS_MIN,
      Math.min(WEBHOOK_MAX_ATTEMPTS_MAX, Math.floor(maxAttemptsDraft || WEBHOOK_MAX_ATTEMPTS_MIN)),
    );
    const clampedBase = Math.max(
      WEBHOOK_BASE_DELAY_MIN,
      Math.min(WEBHOOK_BASE_DELAY_MAX, Math.floor(baseDelayDraft || WEBHOOK_BASE_DELAY_MIN)),
    );
    let clampedMax = Math.max(
      WEBHOOK_MAX_DELAY_MIN,
      Math.min(WEBHOOK_MAX_DELAY_MAX, Math.floor(maxDelayDraft || WEBHOOK_MAX_DELAY_MIN)),
    );
    if (clampedMax < clampedBase) clampedMax = clampedBase;

    saveWebhookUrl(trimmed);
    saveWebhookSecret(secretDraft);
    saveWebhookMaxAttempts(clampedAttempts);
    saveWebhookBaseDelayMs(clampedBase);
    saveWebhookMaxDelayMs(clampedMax);

    setUrl(trimmed);
    setSecret(secretDraft.trim());
    setMaxAttempts(clampedAttempts);
    setBaseDelayMs(clampedBase);
    setMaxDelayMs(clampedMax);
    setDialogOpen(false);
    toast.success(trimmed ? "Webhook salvo" : "Webhook removido");
  }, [urlDraft, secretDraft, maxAttemptsDraft, baseDelayDraft, maxDelayDraft]);

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
    // actions
    save,
  };
}

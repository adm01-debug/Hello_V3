import { useMemo, useState } from "react";
import { Copy, Eye, EyeOff, KeyRound, Loader2, Plus, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  WEBHOOK_SECRET_CONSUMERS,
  WEBHOOK_SECRET_MIN_LENGTH,
  generateWebhookSecret,
  maskSecret,
  normalizeProvider,
  useWebhookSecrets,
  validateProvider,
  validateSecret,
  type WebhookSecret,
} from "@/hooks/useWebhookSecrets";

type FormMode = "create" | "rotate";

interface WebhookSecretsCardProps {
  className?: string;
}

const formatDateTime = (value: string | null): string =>
  value ? new Date(value).toLocaleString("pt-BR") : "—";

export function WebhookSecretsCard({ className }: WebhookSecretsCardProps) {
  const { secrets, isLoading, error, refetch, saveSecret, isSaving, deleteSecret, isDeleting } =
    useWebhookSecrets();

  const [formOpen, setFormOpen] = useState(false);
  const [mode, setMode] = useState<FormMode>("create");
  const [provider, setProvider] = useState("");
  const [secret, setSecret] = useState("");
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<WebhookSecret | null>(null);

  const providerError = submitted ? validateProvider(provider) : null;
  const secretError = submitted ? validateSecret(secret) : null;

  const existingProviders = useMemo(
    () => Array.from(new Set([...Object.keys(WEBHOOK_SECRET_CONSUMERS), ...secrets.map((s) => s.provider)])),
    [secrets],
  );

  const openCreate = () => {
    setMode("create");
    setProvider("");
    setSecret(generateWebhookSecret());
    setSubmitted(false);
    setFormOpen(true);
  };

  const openRotate = (row: WebhookSecret) => {
    setMode("rotate");
    setProvider(row.provider);
    setSecret(generateWebhookSecret());
    setSubmitted(false);
    setFormOpen(true);
  };

  const toggleReveal = (id: string) =>
    setRevealed((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleCopy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copiado`);
    } catch {
      toast.error("O navegador bloqueou a cópia", { description: "Revele o segredo e copie manualmente." });
    }
  };

  const handleSubmit = async () => {
    setSubmitted(true);
    if (validateProvider(provider) || validateSecret(secret)) return;
    await saveSecret({ provider: normalizeProvider(provider), secret: secret.trim(), mode });
    setFormOpen(false);
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    await deleteSecret(pendingDelete.id);
    setPendingDelete(null);
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-4 w-4" aria-hidden="true" />
            Segredos de webhook (entrada)
          </CardTitle>
          <CardDescription>
            Assinatura HMAC-SHA256 em hexadecimal sobre o corpo bruto da requisição. Sem segredo
            cadastrado para o provedor, a edge responde 401 e a chamada é descartada.
          </CardDescription>
        </div>
        <Button type="button" onClick={openCreate} aria-label="Cadastrar novo segredo de webhook">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Novo segredo
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Não foi possível carregar os segredos</AlertTitle>
            <AlertDescription className="space-y-2">
              <p>{error.message}</p>
              <Button type="button" variant="outline" size="sm" onClick={() => void refetch()}>
                Tentar novamente
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}

        {isLoading ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Carregando segredos…
          </p>
        ) : secrets.length === 0 ? (
          <div className="rounded-md border border-dashed p-6 text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Nenhum provedor com segredo cadastrado. Toda chamada assinada é recusada com 401 até
              você cadastrar o primeiro.
            </p>
            <Button type="button" variant="outline" onClick={openCreate}>
              Cadastrar o primeiro segredo
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Provedor</TableHead>
                <TableHead>Consumidor</TableHead>
                <TableHead>Segredo</TableHead>
                <TableHead>Atualizado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {secrets.map((row) => {
                const consumer = WEBHOOK_SECRET_CONSUMERS[row.provider];
                const isRevealed = Boolean(revealed[row.id]);
                return (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.provider}</TableCell>
                    <TableCell>
                      {consumer ? (
                        <div className="space-y-1">
                          <Badge variant="secondary">{consumer.edge}</Badge>
                          <p className="text-xs text-muted-foreground">header {consumer.header}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          não lido por nenhuma edge hoje
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <code className="font-mono text-xs">
                        {isRevealed ? row.secret_key : maskSecret(row.secret_key)}
                      </code>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDateTime(row.updated_at ?? row.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={isRevealed ? `Ocultar segredo de ${row.provider}` : `Revelar segredo de ${row.provider}`}
                          onClick={() => toggleReveal(row.id)}
                        >
                          {isRevealed ? (
                            <EyeOff className="h-4 w-4" aria-hidden="true" />
                          ) : (
                            <Eye className="h-4 w-4" aria-hidden="true" />
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Copiar segredo de ${row.provider}`}
                          onClick={() => void handleCopy(row.secret_key, "Segredo")}
                        >
                          <Copy className="h-4 w-4" aria-hidden="true" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Rotacionar segredo de ${row.provider}`}
                          onClick={() => openRotate(row)}
                        >
                          <RefreshCw className="h-4 w-4" aria-hidden="true" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Excluir segredo de ${row.provider}`}
                          onClick={() => setPendingDelete(row)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {mode === "rotate" ? "Rotacionar segredo" : "Novo segredo de webhook"}
            </DialogTitle>
            <DialogDescription>
              O provedor deve enviar a assinatura HMAC-SHA256 (hex) do corpo bruto no header
              informado. Gere o segredo aqui e cole no painel do provedor.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="webhook-secret-provider">Provedor</Label>
              <Input
                id="webhook-secret-provider"
                aria-label="Provedor do webhook"
                value={provider}
                list="webhook-secret-providers"
                disabled={mode === "rotate"}
                placeholder="generic-provider"
                onChange={(event) => setProvider(event.target.value)}
              />
              <datalist id="webhook-secret-providers">
                {existingProviders.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </datalist>
              {providerError ? <p className="text-xs text-destructive">{providerError}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="webhook-secret-value">Segredo</Label>
              <div className="flex gap-2">
                <Input
                  id="webhook-secret-value"
                  aria-label="Segredo compartilhado"
                  className="font-mono text-xs"
                  value={secret}
                  onChange={(event) => setSecret(event.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  aria-label="Gerar segredo aleatório"
                  onClick={() => setSecret(generateWebhookSecret())}
                >
                  Gerar
                </Button>
              </div>
              {secretError ? (
                <p className="text-xs text-destructive">{secretError}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Mínimo de {WEBHOOK_SECRET_MIN_LENGTH} caracteres.
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={() => void handleSubmit()} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
              {mode === "rotate" ? "Rotacionar" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(pendingDelete)} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir segredo de {pendingDelete?.provider}?</AlertDialogTitle>
            <AlertDialogDescription>
              As chamadas assinadas por esse provedor passam a ser recusadas com 401 até um novo
              segredo ser cadastrado. A ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleDelete()} disabled={isDeleting}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
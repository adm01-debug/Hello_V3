import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";
import { Archive, CheckCircle2, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  normalizeSeverity,
  severityBadgeVariant,
  type SecurityNotification,
} from "@/components/security-alerts/VirtualTimeline";

interface AlertDetailsDialogProps {
  alert: SecurityNotification | null;
  onOpenChange: (open: boolean) => void;
  onMarkRead: (id: string) => void | Promise<void>;
  onMarkResolved: (id: string) => void | Promise<void>;
}

export function AlertDetailsDialog({ alert, onOpenChange, onMarkRead, onMarkResolved }: AlertDetailsDialogProps) {
  const open = alert !== null;
  const sev = alert ? normalizeSeverity(alert.severity) : "info";
  const payload = alert?.metadata ?? null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        {alert && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={severityBadgeVariant(sev)}>{sev}</Badge>
                {alert.source_type && (
                  <Badge variant="outline" className="font-mono text-xs">
                    {alert.source_type}
                  </Badge>
                )}
                <Badge variant="outline" className="font-mono text-xs">
                  {alert.type}
                </Badge>
              </div>
              <DialogTitle className="text-left">{alert.title}</DialogTitle>
              <DialogDescription className="text-left whitespace-pre-wrap">
                {alert.message}
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="p-3 rounded-md border bg-muted/30">
                <div className="text-xs uppercase text-muted-foreground">Criado em</div>
                <div className="font-mono">
                  {format(new Date(alert.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                </div>
              </div>
              <div className="p-3 rounded-md border bg-muted/30">
                <div className="text-xs uppercase text-muted-foreground">Lido em</div>
                <div className="font-mono">
                  {alert.read_at
                    ? format(new Date(alert.read_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })
                    : "—"}
                </div>
              </div>
            </div>

            <div>
              <div className="text-xs uppercase text-muted-foreground mb-1">Payload completo</div>
              <pre className="text-xs p-3 rounded-md border bg-muted/30 overflow-auto max-h-72 font-mono">
                {payload && Object.keys(payload).length > 0
                  ? JSON.stringify(payload, null, 2)
                  : "// sem metadata"}
              </pre>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              {alert.action_url && (
                <Button asChild variant="outline">
                  <Link to={alert.action_url}>
                    <ExternalLink className="w-4 h-4 mr-1" />
                    {alert.action_label ?? "Abrir"}
                  </Link>
                </Button>
              )}
              {!alert.is_read && (
                <Button variant="secondary" onClick={() => onMarkRead(alert.id)}>
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Marcar como lido
                </Button>
              )}
              <Button variant="default" onClick={() => onMarkResolved(alert.id)}>
                <Archive className="w-4 h-4 mr-1" />
                Marcar como resolvido
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

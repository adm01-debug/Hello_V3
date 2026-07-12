import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertOctagon,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  MailWarning,
  RefreshCw,
  ShieldAlert,
  Webhook,
} from "lucide-react";

export type ExportFormat = "csv" | "pdf";
export type ExportScope = "all" | "critical" | "unread";

interface AlertsHeaderProps {
  onRefresh: () => void;
  onExport: (format: ExportFormat, scope: ExportScope) => void | Promise<void>;
  isExporting: boolean;
  onOpenWebhookDialog: () => void;
  webhookConfigured: boolean;
  onMarkAllRead: () => void;
  unreadCount: number;
  hasActiveFilters: boolean;
}

export function AlertsHeader({
  onRefresh,
  onExport,
  isExporting,
  onOpenWebhookDialog,
  webhookConfigured,
  onMarkAllRead,
  unreadCount,
  hasActiveFilters,
}: AlertsHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-primary" />
          Alertas de Segurança
        </h1>
        <p className="text-sm text-muted-foreground">
          Timeline dos últimos 30 dias — categoria <code className="font-mono">security</code>.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={isExporting}>
              <Download className="w-4 h-4 mr-2" />
              {isExporting ? "Exportando…" : "Exportar"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>Todos os alertas filtrados</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => void onExport("csv", "all")} disabled={isExporting}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              CSV (Excel / planilha)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => void onExport("pdf", "all")} disabled={isExporting}>
              <FileText className="w-4 h-4 mr-2" />
              PDF (relatório)
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <AlertOctagon className="w-4 h-4 mr-2 text-destructive" />
                Apenas críticos
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onClick={() => void onExport("csv", "critical")} disabled={isExporting}>
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => void onExport("pdf", "critical")} disabled={isExporting}>
                    <FileText className="w-4 h-4 mr-2" />
                    PDF
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <MailWarning className="w-4 h-4 mr-2" />
                Apenas não lidos
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onClick={() => void onExport("csv", "unread")} disabled={isExporting}>
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => void onExport("pdf", "unread")} disabled={isExporting}>
                    <FileText className="w-4 h-4 mr-2" />
                    PDF
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onOpenWebhookDialog}>
              <Webhook className="w-4 h-4 mr-2" />
              Configurar webhook…
              {webhookConfigured && (
                <span className="ml-auto text-[10px] text-muted-foreground font-mono">ativo</span>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          variant="secondary"
          size="sm"
          onClick={onMarkAllRead}
          disabled={unreadCount === 0}
        >
          <CheckCircle2 className="w-4 h-4 mr-2" />
          Marcar {hasActiveFilters ? "filtrados" : "todos"} como lidos ({unreadCount})
        </Button>
      </div>
    </div>
  );
}

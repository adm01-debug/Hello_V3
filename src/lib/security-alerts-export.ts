import Papa from "papaparse";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

export interface ExportableAlert {
  id: string;
  created_at: string;
  severity: string;
  type: string;
  source_type: string | null;
  title: string;
  message: string;
  is_read: boolean;
  read_at: string | null;
  action_url: string | null;
  metadata: Record<string, unknown> | null;
}

function timestamp(): string {
  return format(new Date(), "yyyyMMdd-HHmmss");
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportAlertsToCsv(alerts: ExportableAlert[]): string {
  const rows = alerts.map((a) => ({
    id: a.id,
    created_at: a.created_at,
    severity: a.severity,
    type: a.type,
    source_type: a.source_type ?? "",
    title: a.title,
    message: a.message,
    is_read: a.is_read ? "sim" : "não",
    read_at: a.read_at ?? "",
    action_url: a.action_url ?? "",
    metadata: a.metadata ? JSON.stringify(a.metadata) : "",
  }));

  // BOM garante que Excel abra UTF-8 corretamente com acentuação.
  const csv = Papa.unparse(rows, { quotes: true });
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
  const filename = `alertas-seguranca-${timestamp()}.csv`;
  triggerDownload(blob, filename);
  return filename;
}

export function exportAlertsToPdf(alerts: ExportableAlert[]): string {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const generatedAt = format(new Date(), "dd/MM/yyyy HH:mm:ss");

  doc.setFontSize(14);
  doc.text("Alertas de Segurança — últimos 30 dias", 40, 40);
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(`Gerado em ${generatedAt} · ${alerts.length} registro(s)`, 40, 58);
  doc.setTextColor(0);

  autoTable(doc, {
    startY: 76,
    head: [["Data/Hora", "Severidade", "Origem", "Título", "Mensagem", "Lido"]],
    body: alerts.map((a) => [
      format(new Date(a.created_at), "dd/MM/yyyy HH:mm:ss"),
      a.severity,
      a.source_type ?? "—",
      a.title,
      a.message.length > 220 ? `${a.message.slice(0, 217)}…` : a.message,
      a.is_read ? "sim" : "não",
    ]),
    styles: { fontSize: 8, cellPadding: 4, overflow: "linebreak", valign: "top" },
    headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    columnStyles: {
      0: { cellWidth: 90 },
      1: { cellWidth: 60 },
      2: { cellWidth: 110 },
      3: { cellWidth: 160 },
      4: { cellWidth: "auto" },
      5: { cellWidth: 40, halign: "center" },
    },
    margin: { left: 40, right: 40 },
  });

  const filename = `alertas-seguranca-${timestamp()}.pdf`;
  doc.save(filename);
  return filename;
}

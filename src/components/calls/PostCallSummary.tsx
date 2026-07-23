import { Download, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDuration } from "@/lib/utils";
import type { VoipQualitySample, QualityLabel } from "@/hooks/useVoipQualityMonitor";
import { toast } from "sonner";

export interface PostCallSummaryData {
  samples: VoipQualitySample[];
  durationSec: number;
  targetNumber?: string | null;
  channel: string;
  startedAt: number;
  endedAt: number;
}

interface Props {
  open: boolean;
  data: PostCallSummaryData | null;
  onClose: () => void;
}

interface Aggregates {
  mosAvg: number;
  mosMin: number;
  mosMax: number;
  jitterAvgMs: number;
  jitterMaxMs: number;
  rttAvgMs: number;
  rttMaxMs: number;
  packetLossPct: number;
  concealmentPct: number | null;
  totalLost: number;
  totalReceived: number;
  totalDiscarded: number;
  samples: number;
  label: QualityLabel;
}

function labelFromMos(mos: number): QualityLabel {
  if (mos >= 4.3) return "excellent";
  if (mos >= 4.0) return "good";
  if (mos >= 3.6) return "fair";
  return "poor";
}

function aggregate(samples: VoipQualitySample[]): Aggregates | null {
  if (samples.length === 0) return null;
  const mosValues = samples.map((s) => s.mos);
  const mosAvg = mosValues.reduce((a, b) => a + b, 0) / mosValues.length;
  const jitterAvg = samples.reduce((a, s) => a + s.jitterMs, 0) / samples.length;
  const rttAvg = samples.reduce((a, s) => a + s.rttMs, 0) / samples.length;
  const totalLost = samples.reduce((a, s) => a + s.packetsLost, 0);
  const totalReceived = samples.reduce((a, s) => a + s.packetsReceived, 0);
  const totalDiscarded = samples.reduce((a, s) => a + s.packetsDiscarded, 0);
  const packetLossPct =
    totalReceived + totalLost > 0 ? (totalLost / (totalLost + totalReceived)) * 100 : 0;
  const totalConcealed = samples.reduce((a, s) => a + s.concealedSamples, 0);
  const totalSamples = samples.reduce((a, s) => a + s.totalSamplesReceived, 0);
  const concealmentPct = totalSamples > 0 ? (totalConcealed / totalSamples) * 100 : null;
  return {
    mosAvg: Number(mosAvg.toFixed(2)),
    mosMin: Number(Math.min(...mosValues).toFixed(2)),
    mosMax: Number(Math.max(...mosValues).toFixed(2)),
    jitterAvgMs: Number(jitterAvg.toFixed(2)),
    jitterMaxMs: Number(Math.max(...samples.map((s) => s.jitterMs)).toFixed(2)),
    rttAvgMs: Number(rttAvg.toFixed(2)),
    rttMaxMs: Number(Math.max(...samples.map((s) => s.rttMs)).toFixed(2)),
    packetLossPct: Number(packetLossPct.toFixed(2)),
    concealmentPct: concealmentPct === null ? null : Number(concealmentPct.toFixed(2)),
    totalLost,
    totalReceived,
    totalDiscarded,
    samples: samples.length,
    label: labelFromMos(mosAvg),
  };
}

const labelBadge: Record<QualityLabel, { text: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  excellent: { text: "Excelente", variant: "default" },
  good: { text: "Boa", variant: "default" },
  fair: { text: "Regular", variant: "secondary" },
  poor: { text: "Ruim", variant: "destructive" },
  unknown: { text: "—", variant: "outline" },
};

function csvEscape(value: string | number | null): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n;]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function buildCsv(data: PostCallSummaryData, agg: Aggregates): string {
  const header = [
    "timestamp_iso",
    "elapsed_sec",
    "mos",
    "jitter_ms",
    "rtt_ms",
    "packets_lost",
    "packets_received",
    "packets_discarded",
    "fraction_lost",
    "concealed_samples",
    "total_samples_received",
    "audio_level",
  ];
  const rows = data.samples.map((s) => {
    const elapsed = ((s.ts - data.startedAt) / 1000).toFixed(2);
    return [
      new Date(s.ts).toISOString(),
      elapsed,
      s.mos,
      s.jitterMs.toFixed(2),
      s.rttMs.toFixed(2),
      s.packetsLost,
      s.packetsReceived,
      s.packetsDiscarded,
      s.fractionLost ?? "",
      s.concealedSamples,
      s.totalSamplesReceived,
      s.audioLevel.toFixed(3),
    ]
      .map(csvEscape)
      .join(",");
  });

  const meta = [
    "# Resumo pós-chamada",
    `# Destino,${csvEscape(data.targetNumber ?? "")}`,
    `# Canal,${csvEscape(data.channel)}`,
    `# Início,${new Date(data.startedAt).toISOString()}`,
    `# Fim,${new Date(data.endedAt).toISOString()}`,
    `# Duração (s),${data.durationSec}`,
    `# Amostras,${agg.samples}`,
    `# MOS médio,${agg.mosAvg}`,
    `# MOS mín/máx,${agg.mosMin}/${agg.mosMax}`,
    `# Jitter médio (ms),${agg.jitterAvgMs}`,
    `# Jitter máx (ms),${agg.jitterMaxMs}`,
    `# RTT médio (ms),${agg.rttAvgMs}`,
    `# RTT máx (ms),${agg.rttMaxMs}`,
    `# Perda de pacotes (%),${agg.packetLossPct}`,
    `# Concealment (%),${agg.concealmentPct ?? ""}`,
    `# Pacotes perdidos,${agg.totalLost}`,
    `# Pacotes recebidos,${agg.totalReceived}`,
    `# Pacotes descartados,${agg.totalDiscarded}`,
    `# Qualidade,${agg.label}`,
    "",
  ].join("\n");

  return `${meta}${header.join(",")}\n${rows.join("\n")}\n`;
}

function downloadCsv(data: PostCallSummaryData, agg: Aggregates) {
  try {
    const csv = buildCsv(data, agg);
    const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const stamp = new Date(data.endedAt).toISOString().replace(/[:.]/g, "-");
    link.href = url;
    link.download = `chamada-qualidade-${stamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("CSV exportado");
  } catch {
    toast.error("Falha ao exportar CSV");
  }
}

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-md border border-border bg-muted/40 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold text-foreground">{value}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function PostCallSummary({ open, data, onClose }: Props) {
  const agg = data ? aggregate(data.samples) : null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-3">
            <span>Resumo da chamada</span>
            {agg && (
              <Badge variant={labelBadge[agg.label].variant}>{labelBadge[agg.label].text}</Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {!data || !agg ? (
          <p className="text-sm text-muted-foreground">
            Sem amostras de qualidade coletadas nesta chamada.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Destino</p>
                <p className="font-medium">{data.targetNumber ?? "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Duração</p>
                <p className="font-medium">{formatDuration(data.durationSec)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              <Metric label="MOS médio" value={agg.mosAvg.toFixed(2)} hint={`mín ${agg.mosMin.toFixed(2)} / máx ${agg.mosMax.toFixed(2)}`} />
              <Metric label="Jitter" value={`${agg.jitterAvgMs.toFixed(1)} ms`} hint={`máx ${agg.jitterMaxMs.toFixed(1)} ms`} />
              <Metric label="RTT" value={`${agg.rttAvgMs.toFixed(0)} ms`} hint={`máx ${agg.rttMaxMs.toFixed(0)} ms`} />
              <Metric label="Perda de pacotes" value={`${agg.packetLossPct.toFixed(2)}%`} hint={`${agg.totalLost} perdidos`} />
              <Metric label="Concealment" value={agg.concealmentPct === null ? "—" : `${agg.concealmentPct.toFixed(2)}%`} />
              <Metric label="Amostras coletadas" value={String(agg.samples)} hint={`descartados: ${agg.totalDiscarded}`} />
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:justify-between">
          <Button variant="outline" onClick={onClose}>
            <X className="mr-2 h-4 w-4" />
            Fechar
          </Button>
          <Button onClick={() => data && agg && downloadCsv(data, agg)} disabled={!data || !agg}>
            <Download className="mr-2 h-4 w-4" />
            Baixar CSV
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

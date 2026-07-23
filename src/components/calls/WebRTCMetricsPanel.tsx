import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VoipQualityState } from "@/hooks/useVoipQualityMonitor";

interface Props {
  quality: VoipQualityState;
  className?: string;
}

function fmt(n: number | null | undefined, digits = 2): string {
  return typeof n === "number" && Number.isFinite(n) ? n.toFixed(digits) : "—";
}

function colorForLoss(pct: number | null): string {
  if (pct == null) return "text-muted-foreground";
  if (pct >= 5) return "text-destructive";
  if (pct >= 1) return "text-warning";
  return "text-success";
}

function colorForConcealment(pct: number | null): string {
  if (pct == null) return "text-muted-foreground";
  if (pct >= 7) return "text-destructive";
  if (pct >= 3) return "text-warning";
  return "text-success";
}

export function WebRTCMetricsPanel({ quality, className }: Props) {
  const current = quality.current;
  const lossInstant = current?.fractionLost != null ? current.fractionLost * 100 : null;

  const items: Array<{
    label: string;
    value: string;
    unit?: string;
    color?: string;
    hint?: string;
  }> = [
    {
      label: "Perda (agora)",
      value: fmt(lossInstant),
      unit: "%",
      color: colorForLoss(lossInstant),
      hint: "fractionLost do remote-inbound-rtp",
    },
    {
      label: "Perda (média)",
      value: fmt(quality.packetLossPct),
      unit: "%",
      color: colorForLoss(quality.packetLossPct),
    },
    {
      label: "Descartados",
      value: fmt(current?.packetsDiscarded ?? null, 0),
      hint: "packetsDiscarded (jitter buffer)",
    },
    {
      label: "Concealed",
      value: fmt(current?.concealedSamples ?? null, 0),
      hint: "Amostras ocultas por PLC",
    },
    {
      label: "Concealment",
      value: fmt(quality.concealmentPct),
      unit: "%",
      color: colorForConcealment(quality.concealmentPct),
      hint: "concealedSamples / totalSamplesReceived",
    },
    {
      label: "Jitter",
      value: fmt(quality.jitterAvgMs),
      unit: "ms",
    },
  ];

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card/40 p-3 space-y-2",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Activity className="h-3.5 w-3.5" />
          Métricas WebRTC em tempo real
        </div>
        <span className="text-[10px] text-muted-foreground">
          {quality.samplesCount} amostras · 2s
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {items.map((it) => (
          <div
            key={it.label}
            title={it.hint}
            className="rounded-md bg-background/60 border border-border/50 p-2"
          >
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground truncate">
              {it.label}
            </div>
            <div className={cn("text-sm font-mono font-semibold", it.color)}>
              {it.value}
              {it.unit && (
                <span className="text-[10px] text-muted-foreground ml-0.5">
                  {it.unit}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

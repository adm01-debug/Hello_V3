import { useState, useMemo } from 'react';
import { FlaskConical, TrendingUp, ShieldCheck, Users, AlertTriangle, Zap } from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip as RTooltip, CartesianGrid, Legend } from 'recharts';
import { useVoipRecommendationSimulate } from '@/hooks/useVoipRecommendationSimulate';
import type { VoipRecommendation } from '@/hooks/useVoipRecommendations';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type Preset = 'conservador' | 'realista' | 'otimista';

const PRESETS: Record<Preset, { mos: number; jitter: number; packetLoss: number }> = {
  conservador: { mos: 0.2, jitter: -10, packetLoss: -0.5 },
  realista:    { mos: 0.5, jitter: -25, packetLoss: -1.5 },
  otimista:    { mos: 0.8, jitter: -50, packetLoss: -3.0 },
};

interface Props {
  recommendation: VoipRecommendation;
  onApplyWithSimulation?: (notes: string) => void;
}

export function WhatIfSimulatorDialog({ recommendation, onApplyWithSimulation }: Props) {
  const [open, setOpen] = useState(false);
  const [dMos, setDMos] = useState(0.5);
  const [dJitter, setDJitter] = useState(-25);
  const [dPl, setDPl] = useState(-1.5);
  const simulate = useVoipRecommendationSimulate();

  const applyPreset = (p: Preset) => {
    const v = PRESETS[p];
    setDMos(v.mos);
    setDJitter(v.jitter);
    setDPl(v.packetLoss);
  };

  const runSimulation = () => {
    simulate.mutate({
      recommendationId: recommendation.id,
      mos: dMos,
      jitter: dJitter,
      packetLoss: dPl,
    });
  };

  const chartData = useMemo(() => {
    const r = simulate.data;
    if (!r) return [];
    return [
      { metric: 'MOS', atual: r.baseline.avgMos ?? 0, projetado: r.projected.avgMos ?? 0 },
      { metric: 'Jitter (ms)', atual: r.baseline.avgJitter ?? 0, projetado: r.projected.avgJitter ?? 0 },
      { metric: 'Loss (%)', atual: r.baseline.avgPacketLoss ?? 0, projetado: r.projected.avgPacketLoss ?? 0 },
    ];
  }, [simulate.data]);

  const handleApply = () => {
    if (!simulate.data) return;
    const r = simulate.data;
    const notes = `Simulação what-if: ΔMOS=${dMos.toFixed(2)} ΔJit=${dJitter}ms ΔLoss=${dPl}% → ${r.projected.alertsAvoided} alertas evitados, ${r.projected.affectedUsersPct}% usuários recuperados`;
    onApplyWithSimulation?.(notes);
    toast.success('Aplicado com base na simulação', { description: notes });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5 text-xs">
          <FlaskConical className="h-3.5 w-3.5" /> Simular
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-primary" /> Simulação What-If
          </DialogTitle>
          <DialogDescription>
            Projete o impacto hipotético de "{recommendation.title}" sobre os últimos 7 dias.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Presets */}
          <div className="flex gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground self-center mr-1">Presets:</span>
            {(Object.keys(PRESETS) as Preset[]).map(p => (
              <Button key={p} size="sm" variant="outline" className="text-xs capitalize" onClick={() => applyPreset(p)}>
                {p}
              </Button>
            ))}
          </div>

          {/* Sliders */}
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1.5">
                <Label className="text-xs">Δ MOS (ganho de qualidade)</Label>
                <span className="text-xs font-mono text-primary">+{dMos.toFixed(2)}</span>
              </div>
              <Slider value={[dMos]} min={0} max={2} step={0.05} onValueChange={(v) => setDMos(v[0])} />
            </div>
            <div>
              <div className="flex justify-between mb-1.5">
                <Label className="text-xs">Δ Jitter (redução em ms)</Label>
                <span className="text-xs font-mono text-primary">{dJitter}ms</span>
              </div>
              <Slider value={[dJitter]} min={-100} max={0} step={1} onValueChange={(v) => setDJitter(v[0])} />
            </div>
            <div>
              <div className="flex justify-between mb-1.5">
                <Label className="text-xs">Δ Packet Loss (redução em %)</Label>
                <span className="text-xs font-mono text-primary">{dPl.toFixed(1)}%</span>
              </div>
              <Slider value={[dPl]} min={-10} max={0} step={0.1} onValueChange={(v) => setDPl(v[0])} />
            </div>
          </div>

          <Button onClick={runSimulation} disabled={simulate.isPending} className="w-full gap-1.5">
            <TrendingUp className="h-4 w-4" />
            {simulate.isPending ? 'Calculando projeção…' : 'Executar simulação'}
          </Button>

          {/* Resultados */}
          {simulate.isPending && <Skeleton className="h-48 w-full" />}

          {simulate.error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> Falha ao simular. Tente novamente.
            </div>
          )}

          {simulate.data && (
            <>
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg border border-border/40 bg-muted/20 p-3 text-center">
                  <ShieldCheck className="h-4 w-4 mx-auto text-success mb-1" />
                  <div className="text-2xl font-mono font-bold text-success">{simulate.data.projected.alertsAvoided}</div>
                  <div className="text-[10px] text-muted-foreground">alertas evitados</div>
                </div>
                <div className="rounded-lg border border-border/40 bg-muted/20 p-3 text-center">
                  <TrendingUp className="h-4 w-4 mx-auto text-primary mb-1" />
                  <div className="text-2xl font-mono font-bold text-primary">
                    {simulate.data.projected.avgMos !== null && simulate.data.baseline.avgMos !== null
                      ? `+${(simulate.data.projected.avgMos - simulate.data.baseline.avgMos).toFixed(2)}`
                      : '—'}
                  </div>
                  <div className="text-[10px] text-muted-foreground">ganho MOS médio</div>
                </div>
                <div className="rounded-lg border border-border/40 bg-muted/20 p-3 text-center">
                  <Users className="h-4 w-4 mx-auto text-warning mb-1" />
                  <div className="text-2xl font-mono font-bold text-warning">{simulate.data.projected.affectedUsersPct}%</div>
                  <div className="text-[10px] text-muted-foreground">usuários recuperados</div>
                </div>
              </div>

              <div className="rounded-lg border border-border/40 bg-muted/10 p-3">
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Atual vs Projetado</div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="metric" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <RTooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="atual" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="projetado" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="text-[10px] text-muted-foreground text-center">
                Baseline: {simulate.data.baseline.sampleSize} amostras · {simulate.data.baseline.totalAlerts} alertas · {simulate.data.baseline.uniqueAgents} agentes
              </div>
            </>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>Fechar</Button>
          <Button
            onClick={handleApply}
            disabled={!simulate.data}
            className={cn('gap-1.5', simulate.data && 'bg-success hover:bg-success/90')}
          >
            <Zap className="h-4 w-4" /> Aplicar com esta projeção
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

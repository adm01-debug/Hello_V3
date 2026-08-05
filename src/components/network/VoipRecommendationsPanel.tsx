import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lightbulb, Clock, ExternalLink, Zap, Check, Sparkles, X, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useVoipRecommendations, type VoipRecommendation, type RecPeriod } from '@/hooks/useVoipRecommendations';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { RecommendationHistoryDrawer } from './RecommendationHistoryDrawer';
import { WhatIfSimulatorDialog } from './WhatIfSimulatorDialog';
import { scheduleCoachingCheck, processCoachingQueue } from '@/lib/voipRecommendationCoaching';

const log = logger.create('VoipRecommendationsPanel');
const SNOOZE_KEY = 'voip-rec-snoozed';
const AUTO_APPLY_KEY = 'voip-rec-auto-apply';
const AUTO_APPLIED_KEY = 'voip-rec-auto-applied'; // ids já auto-aplicados nesta sessão
const SNOOZE_HOURS = 24;
const AUTO_APPLY_DELAY_MS = 3000;

interface SnoozedMap { [id: string]: number }

function loadJsonMap(key: string): SnoozedMap {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as SnoozedMap;
    const now = Date.now();
    return Object.fromEntries(Object.entries(parsed).filter(([, t]) => t > now));
  } catch {
    return {};
  }
}

function saveJsonMap(key: string, map: SnoozedMap) {
  try { localStorage.setItem(key, JSON.stringify(map)); } catch { /* noop */ }
}

const SEVERITY_STYLES: Record<VoipRecommendation['severity'], string> = {
  critical: 'border-destructive/40 bg-destructive/5 text-destructive',
  warning: 'border-warning/40 bg-warning/5 text-warning',
  info: 'border-primary/40 bg-primary/5 text-primary',
};

const CATEGORY_LABEL: Record<VoipRecommendation['category'], string> = {
  capacity: 'Capacidade',
  quality: 'Qualidade',
  infra: 'Infraestrutura',
  process: 'Processo',
};

interface Props {
  period?: RecPeriod;
}

export function VoipRecommendationsPanel({ period = 'week' }: Props) {
  const { data, isLoading, error, refetch } = useVoipRecommendations(period);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [snoozed, setSnoozed] = useState<SnoozedMap>(() => loadJsonMap(SNOOZE_KEY));
  const [autoApply, setAutoApply] = useState<boolean>(() => {
    try { return localStorage.getItem(AUTO_APPLY_KEY) === '1'; } catch { return false; }
  });
  const [pendingAuto, setPendingAuto] = useState<{ id: string; secondsLeft: number } | null>(null);
  const autoTimerRef = useRef<number | null>(null);
  const autoAppliedRef = useRef<Set<string>>(new Set());

  const visible = useMemo(() => {
    const list = data?.recommendations ?? [];
    return list.filter(r => !snoozed[r.id]);
  }, [data, snoozed]);

  const recordAction = useCallback(async (
    rec: VoipRecommendation,
    outcome: 'applied' | 'snoozed' | 'dismissed' | 'auto_applied',
    notes?: string,
  ) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) return;
      await supabase.from('voip_recommendation_actions').insert([{
        user_id: userId,
        recommendation_id: rec.id,
        category: rec.category,
        severity: rec.severity,
        action_type: rec.action_type,
        action_payload: rec.action_payload as never,
        outcome,
        notes: notes ?? null,
      }]);
      queryClient.invalidateQueries({ queryKey: ['voip-recommendation-history'] });
    } catch (err) {
      log.warn('Falha ao registrar ação no histórico', err);
    }
  }, [queryClient]);

  const executeAction = useCallback((rec: VoipRecommendation) => {
    if (rec.action_type === 'link') {
      const route = rec.action_payload.route as string | undefined;
      if (route) {
        const [path, hash] = route.split('#');
        navigate(path);
        if (hash) setTimeout(() => {
          document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 200);
      }
    } else if (rec.action_type === 'function') {
      const action = rec.action_payload.action as string | undefined;
      if (action === 'run_connectivity_test') {
        window.dispatchEvent(new CustomEvent('voip:run-connectivity-test'));
      }
    }
  }, [navigate]);

  const handleApply = useCallback((rec: VoipRecommendation) => {
    log.info('Aplicando recomendação', { id: rec.id });
    executeAction(rec);
    toast.success(`Aplicado: ${rec.action_label}`);
    void recordAction(rec, 'applied');
    void scheduleCoachingCheck(rec.id, rec.title);
  }, [executeAction, recordAction]);

  // Processa fila de coaching ao montar o painel (uma vez por sessão)
  useEffect(() => {
    void processCoachingQueue();
  }, []);

  const handleSnooze = useCallback((rec: VoipRecommendation) => {
    const next = { ...snoozed, [rec.id]: Date.now() + SNOOZE_HOURS * 3_600_000 };
    setSnoozed(next);
    saveJsonMap(SNOOZE_KEY, next);
    toast.info(`Adiada por ${SNOOZE_HOURS}h`);
    void recordAction(rec, 'snoozed', `${SNOOZE_HOURS}h`);
  }, [snoozed, recordAction]);

  const handleToggleAutoApply = useCallback((checked: boolean) => {
    setAutoApply(checked);
    try { localStorage.setItem(AUTO_APPLY_KEY, checked ? '1' : '0'); } catch { /* noop */ }
    toast.info(checked ? 'Auto-aplicar críticas seguras: ON' : 'Auto-aplicar: OFF');
  }, []);

  const cancelAutoApply = useCallback(() => {
    if (autoTimerRef.current) {
      window.clearInterval(autoTimerRef.current);
      autoTimerRef.current = null;
    }
    if (pendingAuto) {
      const rec = visible.find(r => r.id === pendingAuto.id);
      if (rec) void recordAction(rec, 'dismissed', 'Auto-apply cancelado pelo usuário');
    }
    setPendingAuto(null);
  }, [pendingAuto, visible, recordAction]);

  // Lógica de auto-apply: apenas critical + function (categoria infra implícita)
  useEffect(() => {
    if (!autoApply || pendingAuto) return;
    const candidate = visible.find(r =>
      r.severity === 'critical' &&
      r.action_type === 'function' &&
      !autoAppliedRef.current.has(r.id)
    );
    if (!candidate) return;

    autoAppliedRef.current.add(candidate.id);
    setPendingAuto({ id: candidate.id, secondsLeft: AUTO_APPLY_DELAY_MS / 1000 });

    let remaining = AUTO_APPLY_DELAY_MS / 1000;
    autoTimerRef.current = window.setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        if (autoTimerRef.current) window.clearInterval(autoTimerRef.current);
        autoTimerRef.current = null;
        executeAction(candidate);
        toast.success(`Auto-aplicado: ${candidate.action_label}`);
        void recordAction(candidate, 'auto_applied', 'Disparado automaticamente após countdown');
        void scheduleCoachingCheck(candidate.id, candidate.title);
        setPendingAuto(null);
      } else {
        setPendingAuto({ id: candidate.id, secondsLeft: remaining });
      }
    }, 1000);

    return () => {
      if (autoTimerRef.current) window.clearInterval(autoTimerRef.current);
    };
  }, [autoApply, visible, pendingAuto, executeAction, recordAction]);

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Lightbulb className="h-5 w-5 text-primary" /> Recomendações</CardTitle>
          <CardDescription>Analisando sinais...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="glass-card border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">Erro ao carregar recomendações</CardTitle>
          <CardDescription>Tente novamente em alguns instantes.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button size="sm" variant="outline" onClick={() => refetch()}>Tentar novamente</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            Recomendações Acionáveis
          </CardTitle>
          <CardDescription>
            {visible.length === 0
              ? 'Nenhuma ação necessária no momento'
              : `${visible.length} ação(ões) priorizada(s) para ${period === 'day' ? '24h' : '7 dias'}`}
          </CardDescription>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Switch id="auto-apply" checked={autoApply} onCheckedChange={handleToggleAutoApply} />
            <Label htmlFor="auto-apply" className="text-xs flex items-center gap-1 cursor-pointer">
              <ShieldCheck className="h-3.5 w-3.5 text-success" /> Auto-aplicar críticas
            </Label>
          </div>
          <RecommendationHistoryDrawer />
          {visible.length === 0 && (
            <Badge variant="outline" className="bg-success/10 text-success border-success/30 gap-1">
              <Sparkles className="h-3 w-3" /> Tudo saudável
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {pendingAuto && (() => {
          const rec = visible.find(r => r.id === pendingAuto.id);
          if (!rec) return null;
          return (
            <div className="rounded-lg border-2 border-success/50 bg-success/10 p-3 flex items-center justify-between gap-3 animate-pulse">
              <div className="flex items-center gap-2 text-sm">
                <ShieldCheck className="h-4 w-4 text-success" />
                <span className="font-semibold">Auto-aplicando em {pendingAuto.secondsLeft}s:</span>
                <span className="text-muted-foreground">{rec.title}</span>
              </div>
              <Button size="sm" variant="outline" onClick={cancelAutoApply} className="gap-1.5">
                <X className="h-3.5 w-3.5" /> Cancelar
              </Button>
            </div>
          );
        })()}

        {visible.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Sparkles className="h-10 w-10 mx-auto mb-2 text-success/60" />
            <p className="text-sm">Sistema operando dentro dos parâmetros. Continue monitorando.</p>
          </div>
        ) : visible.map(rec => (
          <div
            key={rec.id}
            className={cn('rounded-lg border p-4 transition-all hover:shadow-md', SEVERITY_STYLES[rec.severity])}
          >
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Badge variant="outline" className={cn('text-[10px] uppercase', SEVERITY_STYLES[rec.severity])}>
                    {rec.severity}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] uppercase bg-muted/40">
                    {CATEGORY_LABEL[rec.category]}
                  </Badge>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    Prioridade {rec.priority_score}
                  </span>
                </div>
                <h4 className="font-semibold text-foreground text-sm">{rec.title}</h4>
                <p className="text-xs text-muted-foreground mt-1">{rec.description}</p>
                <p className="text-xs mt-2 italic opacity-80">💡 {rec.impact_estimate}</p>
              </div>
              <div className="flex flex-col gap-1.5 shrink-0">
                <Button size="sm" variant="default" onClick={() => handleApply(rec)} className="gap-1.5">
                  {rec.action_type === 'link' && <ExternalLink className="h-3.5 w-3.5" />}
                  {rec.action_type === 'function' && <Zap className="h-3.5 w-3.5" />}
                  {rec.action_type === 'acknowledge' && <Check className="h-3.5 w-3.5" />}
                  {rec.action_label}
                </Button>
                <WhatIfSimulatorDialog
                  recommendation={rec}
                  onApplyWithSimulation={(notes) => {
                    executeAction(rec);
                    void recordAction(rec, 'applied', notes);
                    void scheduleCoachingCheck(rec.id, rec.title);
                  }}
                />
                <Button size="sm" variant="ghost" onClick={() => handleSnooze(rec)} className="gap-1.5 text-xs">
                  <Clock className="h-3 w-3" /> Adiar 24h
                </Button>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

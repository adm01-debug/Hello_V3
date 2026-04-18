import { useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lightbulb, Clock, ExternalLink, Zap, Check, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useVoipRecommendations, type VoipRecommendation, type RecPeriod } from '@/hooks/useVoipRecommendations';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

const log = logger.create('VoipRecommendationsPanel');
const SNOOZE_KEY = 'voip-rec-snoozed';
const SNOOZE_HOURS = 24;

interface SnoozedMap { [id: string]: number }

function loadSnoozed(): SnoozedMap {
  try {
    const raw = localStorage.getItem(SNOOZE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as SnoozedMap;
    const now = Date.now();
    // limpa expirados
    return Object.fromEntries(Object.entries(parsed).filter(([, t]) => t > now));
  } catch {
    return {};
  }
}

function saveSnoozed(map: SnoozedMap) {
  try { localStorage.setItem(SNOOZE_KEY, JSON.stringify(map)); } catch { /* noop */ }
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
  const [snoozed, setSnoozed] = useState<SnoozedMap>(() => loadSnoozed());

  const visible = useMemo(() => {
    const list = data?.recommendations ?? [];
    return list.filter(r => !snoozed[r.id]);
  }, [data, snoozed]);

  const handleApply = useCallback((rec: VoipRecommendation) => {
    log.info('Aplicando recomendação', { id: rec.id, type: rec.action_type });
    if (rec.action_type === 'link') {
      const route = rec.action_payload.route as string | undefined;
      if (route) {
        const [path, hash] = route.split('#');
        navigate(path);
        if (hash) setTimeout(() => {
          const el = document.getElementById(hash);
          el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 200);
        toast.success(`Navegando: ${rec.action_label}`);
      }
    } else if (rec.action_type === 'function') {
      const action = rec.action_payload.action as string | undefined;
      if (action === 'run_connectivity_test') {
        // dispara evento global capturado pela página
        window.dispatchEvent(new CustomEvent('voip:run-connectivity-test'));
        toast.info('Iniciando teste de conexão...');
      } else {
        toast.info('Ação registrada');
      }
    } else {
      toast.success('Recomendação reconhecida');
    }
  }, [navigate]);

  const handleSnooze = useCallback((rec: VoipRecommendation) => {
    const next = { ...snoozed, [rec.id]: Date.now() + SNOOZE_HOURS * 3_600_000 };
    setSnoozed(next);
    saveSnoozed(next);
    toast.info(`Adiada por ${SNOOZE_HOURS}h`);
  }, [snoozed]);

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
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
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
        {visible.length === 0 && (
          <Badge variant="outline" className="bg-success/10 text-success border-success/30 gap-1">
            <Sparkles className="h-3 w-3" /> Tudo saudável
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
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

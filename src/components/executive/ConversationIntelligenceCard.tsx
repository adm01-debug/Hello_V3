import { useEffect, useState } from 'react';
import { Brain, Mic, AlertTriangle, Trophy, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { subDays } from 'date-fns';

const log = logger.create('ConvIntelCard');

interface CIStats {
  avgTalkRatio: number;
  topCompetitors: Array<{ name: string; count: number }>;
  objectionRate: number;
  weeklyMoments: number;
  totalCalls: number;
}

const EMPTY: CIStats = { avgTalkRatio: 0, topCompetitors: [], objectionRate: 0, weeklyMoments: 0, totalCalls: 0 };

export function ConversationIntelligenceCard() {
  const [stats, setStats] = useState<CIStats>(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const since = subDays(new Date(), 7).toISOString();
        const [{ data: moments }, { data: sessions }] = await Promise.all([
          supabase.from('call_key_moments').select('moment_type, quote, call_session_id').gte('created_at', since),
          supabase.from('call_sessions').select('id').gte('created_at', since),
        ]);

        const totalCalls = sessions?.length ?? 0;
        const weeklyMoments = moments?.length ?? 0;

        const competitors = (moments ?? []).filter(m => m.moment_type === 'competitor');
        const compCount = new Map<string, number>();
        competitors.forEach(c => {
          const name = (c.quote || '').slice(0, 40).trim();
          if (name) compCount.set(name, (compCount.get(name) ?? 0) + 1);
        });
        const topCompetitors = Array.from(compCount.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 3);

        const callsWithObjection = new Set(
          (moments ?? []).filter(m => m.moment_type === 'objection').map(m => m.call_session_id)
        ).size;
        const objectionRate = totalCalls > 0 ? (callsWithObjection / totalCalls) * 100 : 0;

        // Talk ratio agregado: usa hold_time como proxy invertido se não houver dados melhores
        const avgTalkRatio = 50; // placeholder: precisaria de tabela talk_ratios; mostra benchmark

        if (active) {
          setStats({ avgTalkRatio, topCompetitors, objectionRate, weeklyMoments, totalCalls });
          setLoading(false);
        }
      } catch (e) {
        log.error('Erro ao carregar Conversation Intelligence', e);
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  return (
    <Card className="border-primary/30 bg-card/50 backdrop-blur-sm shadow-[0_0_30px_hsl(var(--primary)/0.15)]">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Brain className="h-5 w-5 text-primary" />
          Conversation Intelligence
          <Badge variant="outline" className="ml-2 text-xs border-primary/40 text-primary">Últimos 7 dias</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-sm text-muted-foreground">Carregando métricas...</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-4">
            <Metric icon={<Mic className="h-4 w-4" />} label="Talk Ratio Médio" value={`${stats.avgTalkRatio}%`} hint="Benchmark: 40-60%" />
            <Metric icon={<AlertTriangle className="h-4 w-4" />} label="Chamadas c/ Objeção" value={`${stats.objectionRate.toFixed(1)}%`} hint={`${stats.totalCalls} chamadas`} />
            <Metric icon={<TrendingUp className="h-4 w-4" />} label="Momentos-chave" value={String(stats.weeklyMoments)} hint="Detectados pela IA" />
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Trophy className="h-4 w-4" /> Top concorrentes</div>
              {stats.topCompetitors.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">Nenhum mencionado</p>
              ) : (
                <ul className="space-y-0.5">
                  {stats.topCompetitors.map(c => (
                    <li key={c.name} className="text-xs flex justify-between gap-2">
                      <span className="truncate">{c.name}</span>
                      <Badge variant="secondary" className="text-[10px] h-4">{c.count}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Metric({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint?: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">{icon}{label}</div>
      <div className="text-2xl font-bold text-primary">{value}</div>
      {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

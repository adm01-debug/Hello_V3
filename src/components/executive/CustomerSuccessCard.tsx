import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, ShieldAlert, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

interface CSMetrics {
  avg_health: number;
  at_risk: number;
  active_signals: number;
  pipeline_renewal: number;
  weighted_renewal: number;
}

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

export function CustomerSuccessCard() {
  const [metrics, setMetrics] = useState<CSMetrics | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [accountsRes, signalsRes, renewalsRes] = await Promise.all([
          supabase.from('accounts').select('health_score, churn_risk_score'),
          supabase.from('churn_risk_signals').select('id', { count: 'exact', head: true }).eq('is_active', true),
          supabase.from('renewals').select('proposed_value, probability, status').in('status', ['open', 'in_negotiation']),
        ]);
        const accounts = accountsRes.data ?? [];
        const renewals = renewalsRes.data ?? [];
        setMetrics({
          avg_health: accounts.length
            ? Math.round(accounts.reduce((a, x) => a + (x.health_score ?? 0), 0) / accounts.length) : 0,
          at_risk: accounts.filter((a) => (a.churn_risk_score ?? 0) >= 70).length,
          active_signals: signalsRes.count ?? 0,
          pipeline_renewal: renewals.reduce((a, r) => a + Number(r.proposed_value || 0), 0),
          weighted_renewal: renewals.reduce(
            (a, r) => a + Number(r.proposed_value || 0) * ((r.probability ?? 0) / 100), 0,
          ),
        });
      } catch (err) {
        logger.error('CustomerSuccessCard load failed', err);
      }
    })();
  }, []);

  if (!metrics) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-pink-500" /> Customer Success
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-4">
        <div>
          <div className="text-xs text-muted-foreground">Health médio</div>
          <div className="text-2xl font-bold">{metrics.avg_health}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <ShieldAlert className="h-3 w-3" /> Em risco
          </div>
          <div className="text-2xl font-bold text-destructive">{metrics.at_risk}</div>
          <Badge variant="outline" className="mt-1 text-xs">{metrics.active_signals} sinais ativos</Badge>
        </div>
        <div>
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> Pipeline renovação
          </div>
          <div className="text-2xl font-bold">{fmt(metrics.pipeline_renewal)}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Weighted</div>
          <div className="text-2xl font-bold">{fmt(metrics.weighted_renewal)}</div>
        </div>
      </CardContent>
    </Card>
  );
}

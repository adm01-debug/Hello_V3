import { useMemo } from 'react';
import { Sparkles, TrendingUp, ShieldAlert, Target } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { useAgentAssistHistory } from '@/hooks/useLiveAssist';
import {
  calculateAcceptanceRate,
  countByIntent,
  INTENT_LABELS,
} from '@/lib/agent-assist-utils';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export function AgentAssistDashboardCard() {
  const { data, isLoading } = useAgentAssistHistory({ limit: 500 });

  const stats = useMemo(() => {
    const cutoff = Date.now() - SEVEN_DAYS_MS;
    const recent = (data ?? []).filter(
      (s: { created_at: string }) => new Date(s.created_at).getTime() >= cutoff
    );
    const total = recent.length;
    const acceptance = calculateAcceptanceRate(recent as Array<{ was_used: boolean }>);
    const counts = countByIntent(recent as Array<{ intent: string }>);
    const compliance = counts.compliance_violation ?? 0;
    const topIntent = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return {
      total,
      acceptance,
      compliance,
      topIntent: topIntent ? { intent: topIntent[0], count: topIntent[1] } : null,
    };
  }, [data]);

  return (
    <Card className="p-5 bg-card/60 backdrop-blur border-primary/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Agent Assist (7d)</h3>
        </div>
        <Link
          to="/agent-assist"
          className="text-xs text-primary hover:underline"
        >
          ver tudo →
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-md" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Metric
            icon={Sparkles}
            label="Sinais gerados"
            value={String(stats.total)}
            tone="primary"
          />
          <Metric
            icon={TrendingUp}
            label="Taxa de aceitação"
            value={`${stats.acceptance}%`}
            tone={stats.acceptance >= 40 ? 'success' : 'warning'}
          />
          <Metric
            icon={Target}
            label="Top intent"
            value={
              stats.topIntent
                ? `${INTENT_LABELS[stats.topIntent.intent] ?? stats.topIntent.intent}`
                : '—'
            }
            sub={stats.topIntent ? `${stats.topIntent.count} ocorrências` : undefined}
            tone="primary"
          />
          <Metric
            icon={ShieldAlert}
            label="Compliance"
            value={String(stats.compliance)}
            sub={stats.compliance > 0 ? 'requer revisão' : 'sem violações'}
            tone={stats.compliance > 0 ? 'destructive' : 'success'}
          />
        </div>
      )}
    </Card>
  );
}

interface MetricProps {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  tone: 'primary' | 'success' | 'warning' | 'destructive';
}

function Metric({ icon: Icon, label, value, sub, tone }: MetricProps) {
  const toneClasses = {
    primary: 'border-primary/30 text-primary',
    success: 'border-success/30 text-success',
    warning: 'border-warning/30 text-warning',
    destructive: 'border-destructive/30 text-destructive',
  }[tone];

  return (
    <div className={`rounded-md border bg-background/50 p-3 space-y-1 ${toneClasses}`}>
      <div className="flex items-center gap-1 text-xs">
        <Icon className="h-3 w-3" />
        <span>{label}</span>
      </div>
      <p className="text-xl font-bold text-foreground">{value}</p>
      {sub && (
        <Badge variant="outline" className="text-[10px] px-1 py-0">
          {sub}
        </Badge>
      )}
    </div>
  );
}

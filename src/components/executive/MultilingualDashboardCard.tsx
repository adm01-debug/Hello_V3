import { useEffect, useState } from 'react';
import { Languages, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { langFlag, langLabel } from '@/lib/language-detection';

export function MultilingualDashboardCard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, avgLatency: 0, topLangs: [] as { lang: string; count: number }[] });

  useEffect(() => {
    (async () => {
      try {
        const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const { data, error } = await supabase
          .from('call_translations')
          .select('target_lang, latency_ms')
          .gte('created_at', since);
        if (error) throw error;
        const rows = data ?? [];
        const counts: Record<string, number> = {};
        let lat = 0;
        for (const r of rows) {
          counts[r.target_lang] = (counts[r.target_lang] ?? 0) + 1;
          lat += r.latency_ms ?? 0;
        }
        const topLangs = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([lang, count]) => ({ lang, count }));
        setStats({
          total: rows.length,
          avgLatency: rows.length ? Math.round(lat / rows.length) : 0,
          topLangs,
        });
      } catch (e) {
        logger.error('MultilingualDashboardCard', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <Card className="hover:border-primary/40 transition-colors cursor-pointer" onClick={() => navigate('/translation-center')}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Languages className="h-4 w-4 text-primary" />
            Tradução Multilíngue (7d)
          </span>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? <Skeleton className="h-20" /> : (
          <div className="space-y-3">
            <div className="flex items-baseline gap-4">
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">traduções</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.avgLatency}<span className="text-sm">ms</span></p>
                <p className="text-xs text-muted-foreground">latência média</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              {stats.topLangs.length === 0 ? (
                <p className="text-xs text-muted-foreground">Sem traduções neste período.</p>
              ) : stats.topLangs.map((l) => (
                <Badge key={l.lang} variant="secondary" className="text-xs">
                  {langFlag(l.lang)} {langLabel(l.lang)} · {l.count}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

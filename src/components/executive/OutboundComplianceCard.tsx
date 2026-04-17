import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Clock, Phone, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export function OutboundComplianceCard() {
  const navigate = useNavigate();

  const { data: stats } = useQuery({
    queryKey: ['outbound-compliance-stats'],
    queryFn: async () => {
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const [consentsRes, optOutsRes, patternsRes] = await Promise.all([
        supabase.from('consent_records').select('id', { count: 'exact', head: true }).gte('created_at', since),
        supabase.from('consent_records').select('id', { count: 'exact', head: true }).eq('granted', false).gte('created_at', since),
        supabase.from('contact_engagement_patterns').select('answer_rate').gte('total_attempts', 3),
      ]);

      const avgAnswerRate = (patternsRes.data ?? []).length > 0
        ? (patternsRes.data ?? []).reduce((sum, p) => sum + (p.answer_rate ?? 0), 0) / (patternsRes.data ?? []).length
        : 0;

      return {
        consents: consentsRes.count ?? 0,
        optOuts: optOutsRes.count ?? 0,
        patternsCount: patternsRes.data?.length ?? 0,
        avgAnswerRate,
      };
    },
    refetchInterval: 60_000,
  });

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Outbound Compliance & Score</CardTitle>
              <CardDescription>TCPA/LGPD • janela ótima • score preditivo (7d)</CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/outbound-compliance')} className="gap-1">
            Abrir <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-4">
          <Stat label="Consentimentos (7d)" value={stats?.consents ?? 0} icon={<ShieldCheck className="h-4 w-4" />} />
          <Stat label="Opt-outs (7d)" value={stats?.optOuts ?? 0} variant="destructive" icon={<Phone className="h-4 w-4" />} />
          <Stat label="Padrões calculados" value={stats?.patternsCount ?? 0} icon={<Clock className="h-4 w-4" />} />
          <Stat
            label="Taxa atend. média"
            value={`${((stats?.avgAnswerRate ?? 0) * 100).toFixed(1)}%`}
            icon={<Phone className="h-4 w-4" />}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value, icon, variant = 'default' }: { label: string; value: string | number; icon: React.ReactNode; variant?: 'default' | 'destructive' }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
        {icon}
        <span>{label}</span>
      </div>
      <Badge variant={variant === 'destructive' ? 'destructive' : 'secondary'} className="text-base font-bold">
        {value}
      </Badge>
    </div>
  );
}

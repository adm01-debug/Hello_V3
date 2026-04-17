import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Heart, AlertTriangle, RefreshCcw, ShieldAlert, Search } from 'lucide-react';
import { useAccounts } from '@/hooks/useAccounts';
import { usePageTitle } from '@/hooks/usePageTitle';
import { NeonPageLayout } from '@/components/layout/NeonPageLayout';

function healthVariant(score: number): 'default' | 'secondary' | 'destructive' {
  if (score >= 70) return 'default';
  if (score >= 40) return 'secondary';
  return 'destructive';
}

export default function Accounts() {
  usePageTitle('Customer Success — Contas');
  const { accounts, loading, recomputeHealth, detectChurn } = useAccounts();
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = useMemo(() => {
    return accounts.filter((a) => {
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;
      if (filter && !a.name.toLowerCase().includes(filter.toLowerCase())) return false;
      return true;
    });
  }, [accounts, filter, statusFilter]);

  const summary = useMemo(() => ({
    total: accounts.length,
    at_risk: accounts.filter((a) => a.churn_risk_score >= 70).length,
    avg_health: accounts.length
      ? Math.round(accounts.reduce((a, x) => a + x.health_score, 0) / accounts.length) : 0,
    arr_total: accounts.reduce((a, x) => a + Number(x.arr || 0), 0),
  }), [accounts]);

  return (
    <NeonPageLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Customer Success</h1>
          <p className="text-muted-foreground">Health 360°, churn risk e jornada do cliente</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="pt-6">
          <div className="text-sm text-muted-foreground">Contas ativas</div>
          <div className="text-3xl font-bold">{summary.total}</div>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <div className="text-sm text-muted-foreground">Em risco</div>
          <div className="text-3xl font-bold text-destructive">{summary.at_risk}</div>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <div className="text-sm text-muted-foreground">Health médio</div>
          <div className="text-3xl font-bold">{summary.avg_health}</div>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <div className="text-sm text-muted-foreground">ARR total</div>
          <div className="text-3xl font-bold">
            {summary.arr_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
          </div>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Carteira</CardTitle>
          <div className="flex gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Buscar conta..." className="pl-8" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos status</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="at_risk">Em risco</SelectItem>
                <SelectItem value="churned">Churned</SelectItem>
                <SelectItem value="paused">Pausados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Carregando...</p>
          ) : filtered.length === 0 ? (
            <p className="text-muted-foreground">Nenhuma conta encontrada</p>
          ) : (
            <div className="space-y-3">
              {filtered.map((a) => (
                <div key={a.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent/30 transition-colors">
                  <div className="flex-1">
                    <div className="font-semibold">{a.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {a.segment} · CSM: {a.csm_agent_name ?? '—'} · ARR {Number(a.arr).toLocaleString('pt-BR')}
                    </div>
                  </div>
                  <Badge variant={healthVariant(a.health_score)} className="gap-1">
                    <Heart className="h-3 w-3" /> {a.health_score}
                  </Badge>
                  {a.churn_risk_score >= 70 && (
                    <Badge variant="destructive" className="gap-1">
                      <ShieldAlert className="h-3 w-3" /> Risco {a.churn_risk_score}
                    </Badge>
                  )}
                  <Badge variant="outline">{a.current_stage}</Badge>
                  <Button size="sm" variant="ghost" onClick={() => recomputeHealth(a.id)} title="Recalcular health">
                    <RefreshCcw className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => detectChurn(a.id)} title="Detectar churn">
                    <AlertTriangle className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </NeonPageLayout>
  );
}

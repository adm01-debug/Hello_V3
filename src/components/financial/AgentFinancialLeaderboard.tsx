import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Download, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import {
  useAgentFinancialLeaderboard,
  agentLeaderboardToCSV,
} from '@/hooks/useAgentFinancialLeaderboard';

const brl = (cents: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);

interface Props {
  days: number;
}

export function AgentFinancialLeaderboard({ days }: Props) {
  const { data, isLoading } = useAgentFinancialLeaderboard(days);
  const rows = data ?? [];

  const handleExport = () => {
    if (!rows.length) {
      toast.info('Sem dados no período para exportar');
      return;
    }
    const csv = agentLeaderboardToCSV(rows);
    const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent-financial-leaderboard-${days}d-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.success('CSV exportado');
  };

  return (
    <Card className="bg-card/50 backdrop-blur border-primary/20 mt-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" /> Ranking por agente
        </CardTitle>
        <Button variant="outline" size="sm" onClick={handleExport} disabled={isLoading}>
          <Download className="h-4 w-4 mr-2" /> CSV
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            Sem dados no período selecionado.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-primary/20 text-left text-xs text-muted-foreground uppercase">
                  <th className="py-2 pr-3">#</th>
                  <th className="py-2 pr-3">Agente</th>
                  <th className="py-2 pr-3 text-right">Chamadas</th>
                  <th className="py-2 pr-3 text-right">Deals</th>
                  <th className="py-2 pr-3 text-right">Receita</th>
                  <th className="py-2 pr-3 text-right">Custo</th>
                  <th className="py-2 pr-3 text-right">Lucro</th>
                  <th className="py-2 pr-3 text-right">CAC</th>
                  <th className="py-2 pr-3 text-right">ROI</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const profitPositive = r.profit_cents >= 0;
                  return (
                    <tr
                      key={r.agent_name}
                      className="border-b border-primary/10 hover:bg-primary/5 transition-colors"
                    >
                      <td className="py-2 pr-3 text-muted-foreground">{i + 1}</td>
                      <td className="py-2 pr-3 font-medium">{r.agent_name}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">{r.total_calls}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">{r.deals_won}</td>
                      <td className="py-2 pr-3 text-right tabular-nums text-success">
                        {brl(Number(r.revenue_cents))}
                      </td>
                      <td className="py-2 pr-3 text-right tabular-nums text-destructive">
                        {brl(r.estimated_cost_cents)}
                      </td>
                      <td
                        className={`py-2 pr-3 text-right tabular-nums font-medium ${
                          profitPositive ? 'text-success' : 'text-destructive'
                        }`}
                      >
                        {brl(Number(r.profit_cents))}
                      </td>
                      <td className="py-2 pr-3 text-right tabular-nums">{brl(Number(r.cac_cents))}</td>
                      <td
                        className={`py-2 pr-3 text-right tabular-nums font-medium ${
                          Number(r.roi_percent) >= 0 ? 'text-success' : 'text-destructive'
                        }`}
                      >
                        {Number(r.roi_percent)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

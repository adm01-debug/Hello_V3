import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PhoneCall, DollarSign, User, GitBranch, Phone } from 'lucide-react';

export default function TollFreeNumbers() {
  const { data: numbers = [] } = useQuery({
    queryKey: ['toll-free-numbers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('toll_free_numbers').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <PhoneCall className="h-8 w-8 text-primary" />
          Números Gratuitos (0800)
        </h1>
        <p className="text-muted-foreground">Gerenciamento de números toll-free</p>
        <Badge variant="outline" className="mt-2">⚠️ Aguardando integração com operadora</Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><Phone className="h-5 w-5 text-primary" /></div>
          <div><p className="text-2xl font-bold">{numbers.length}</p><p className="text-xs text-muted-foreground">Números</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center"><PhoneCall className="h-5 w-5 text-success" /></div>
          <div><p className="text-2xl font-bold">{numbers.filter((n: any) => n.status === 'active').length}</p><p className="text-xs text-muted-foreground">Ativos</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center"><DollarSign className="h-5 w-5 text-amber-500" /></div>
          <div><p className="text-2xl font-bold">R$ {numbers.reduce((acc: number, n: any) => acc + (n.monthly_cost || 0), 0).toFixed(2)}</p><p className="text-xs text-muted-foreground">Custo Mensal</p></div>
        </CardContent></Card>
      </div>

      <div className="space-y-3">
        {numbers.length === 0 ? (
          <Card className="p-12 text-center">
            <PhoneCall className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-lg font-medium text-muted-foreground">Nenhum número 0800 provisionado</p>
            <p className="text-sm text-muted-foreground/60">Configure a integração com sua operadora para provisionar números</p>
          </Card>
        ) : numbers.map((num: any) => (
          <Card key={num.id} className="hover:shadow-md transition-all">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><Phone className="h-5 w-5 text-primary" /></div>
                <div>
                  <p className="font-medium font-mono text-lg">{num.number}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-3">
                    {num.friendly_name && <span>{num.friendly_name}</span>}
                    {num.assigned_to && <span className="flex items-center gap-1"><User className="h-3 w-3" /> {num.assigned_to}</span>}
                    {num.monthly_cost > 0 && <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" /> R$ {num.monthly_cost}/mês</span>}
                  </p>
                </div>
              </div>
              <Badge variant={num.status === 'active' ? 'default' : 'outline'}>{num.status}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

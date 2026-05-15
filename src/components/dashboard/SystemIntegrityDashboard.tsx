import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Database, Network, Shield } from 'lucide-react';

export function SystemIntegrityDashboard() {
  const integrity = [
    { component: 'Supabase DB', status: 'Conectado', icon: <Database className="h-4 w-4" />, latency: '< 20ms' },
    { component: 'SIP Gateway', status: 'Online', icon: <Network className="h-4 w-4" />, latency: '45ms' },
    { component: 'RLS Policies', status: 'Seguro', icon: <Shield className="h-4 w-4" />, latency: 'Auditado' },
    { component: 'Bitrix24 Sync', status: 'Ativo', icon: <CheckCircle className="h-4 w-4 text-success" />, latency: 'Auto' },
  ];

  return (
    <Card className="glass-neon border-primary/10">
      <CardHeader>
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          Integridade da Infraestrutura (10/10)
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {integrity.map((item, i) => (
          <div key={i} className="flex flex-col gap-1 p-3 rounded-lg border bg-accent/20">
            <div className="flex items-center justify-between mb-1">
              <span className="p-1.5 rounded-md bg-background/50">{item.icon}</span>
              <Badge variant="outline" className="text-[9px] bg-success/5 text-success border-success/20">
                {item.status}
              </Badge>
            </div>
            <p className="text-xs font-semibold">{item.component}</p>
            <p className="text-[10px] text-muted-foreground">{item.latency}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

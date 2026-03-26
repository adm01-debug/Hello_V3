import { useState, useMemo } from 'react';
import { 
  PhoneIncoming, 
  PhoneOutgoing, 
  PhoneMissed,
  Download,
  Calendar,
  Search,
  MoreHorizontal
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useCallHistoryData } from '@/hooks/useDashboardData';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const History = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { data: callHistory, isLoading } = useCallHistoryData();

  const filteredCalls = useMemo(() => {
    if (!callHistory) return [];
    return callHistory.filter(call => {
      const matchesSearch = !search || 
        (call.caller_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (call.caller_phone || '').includes(search);
      const matchesStatus = statusFilter === 'all' || call.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [callHistory, search, statusFilter]);

  const getCallIcon = (status: string | null) => {
    if (status === 'missed' || status === 'abandoned') return PhoneMissed;
    return PhoneIncoming;
  };

  const getCallColor = (status: string | null) => {
    switch (status) {
      case 'missed':
      case 'abandoned':
        return 'text-destructive bg-destructive/10';
      case 'completed':
        return 'text-success bg-success/10';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  const getStatusLabel = (status: string | null) => {
    switch (status) {
      case 'completed': return 'Atendida';
      case 'missed': return 'Perdida';
      case 'abandoned': return 'Abandonada';
      case 'active': return 'Ativa';
      default: return status || '—';
    }
  };

  const stats = useMemo(() => {
    const calls = callHistory || [];
    const withDuration = calls.filter(c => c.duration_seconds && c.duration_seconds > 0);
    return {
      total: calls.length,
      completed: calls.filter(c => c.status === 'completed').length,
      missed: calls.filter(c => c.status === 'missed' || c.status === 'abandoned').length,
      avgDuration: withDuration.length > 0
        ? Math.round(withDuration.reduce((acc, c) => acc + (c.duration_seconds || 0), 0) / withDuration.length)
        : 0,
    };
  }, [callHistory]);

  return (
    <div className="space-y-6 relative">
      <div className="fixed inset-0 pointer-events-none gradient-mesh-intense opacity-30" />
      <div className="relative space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gradient">Histórico de Chamadas</h1>
          <p className="text-muted-foreground">Visualize e exporte seu histórico completo</p>
        </div>
        
        <Button variant="neon" className="gap-2">
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {isLoading ? (
          [1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 rounded-lg" />)
        ) : (
          <>
            <Card variant="neon-interactive">
              <CardContent className="p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Total de Chamadas</p>
                <p className="text-2xl font-bold metric-value">{stats.total}</p>
              </CardContent>
            </Card>
            <Card variant="neon-interactive">
              <CardContent className="p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Atendidas</p>
                <p className="text-2xl font-bold text-success metric-value">{stats.completed}</p>
              </CardContent>
            </Card>
            <Card variant="neon-interactive">
              <CardContent className="p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Perdidas</p>
                <p className="text-2xl font-bold text-destructive metric-value">{stats.missed}</p>
              </CardContent>
            </Card>
            <Card variant="neon-interactive">
              <CardContent className="p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Duração Média</p>
                <p className="text-2xl font-bold metric-value">{formatDuration(stats.avgDuration)}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="completed">Atendidas</SelectItem>
            <SelectItem value="missed">Perdidas</SelectItem>
            <SelectItem value="abandoned">Abandonadas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Call List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Chamadas ({filteredCalls.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredCalls.map((call) => {
                const Icon = getCallIcon(call.status);
                
                return (
                  <div
                    key={call.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-full',
                        getCallColor(call.status)
                      )}>
                        <Icon className="h-4 w-4" />
                      </div>
                      
                      <div>
                        <p className="font-medium">{call.caller_name || 'Desconhecido'}</p>
                        <p className="text-sm text-muted-foreground">{call.caller_phone || '—'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm">
                          {format(new Date(call.started_at), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(call.started_at), "HH:mm", { locale: ptBR })}
                        </p>
                      </div>

                      <Badge variant={call.status === 'missed' || call.status === 'abandoned' ? 'destructive' : 'secondary'}>
                        {getStatusLabel(call.status)}
                      </Badge>

                      {call.duration_seconds && call.duration_seconds > 0 && (
                        <span className="w-16 text-right font-mono text-sm text-muted-foreground">
                          {formatDuration(call.duration_seconds)}
                        </span>
                      )}

                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}

              {filteredCalls.length === 0 && (
                <div className="py-12 text-center text-muted-foreground">
                  Nenhuma chamada encontrada
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
};

export default History;

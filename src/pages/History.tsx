import { useState } from 'react';
import { 
  PhoneIncoming, 
  PhoneOutgoing, 
  PhoneMissed,
  Play,
  Download,
  Filter,
  Calendar,
  Search,
  MoreHorizontal
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { mockCallHistory, formatDuration } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const History = () => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredCalls = mockCallHistory.filter(call => {
    const matchesSearch = call.contactName.toLowerCase().includes(search.toLowerCase()) ||
                          call.contactPhone.includes(search);
    const matchesType = typeFilter === 'all' || call.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || call.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const getCallIcon = (type: string, status: string) => {
    if (status === 'missed') return PhoneMissed;
    return type === 'incoming' ? PhoneIncoming : PhoneOutgoing;
  };

  const getCallColor = (status: string) => {
    switch (status) {
      case 'missed':
        return 'text-destructive bg-destructive/10';
      case 'completed':
        return 'text-success bg-success/10';
      case 'voicemail':
        return 'text-warning bg-warning/10';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Atendida';
      case 'missed': return 'Perdida';
      case 'voicemail': return 'Caixa postal';
      default: return status;
    }
  };

  const stats = {
    total: mockCallHistory.length,
    completed: mockCallHistory.filter(c => c.status === 'completed').length,
    missed: mockCallHistory.filter(c => c.status === 'missed').length,
    avgDuration: Math.round(
      mockCallHistory.filter(c => c.duration > 0).reduce((acc, c) => acc + c.duration, 0) / 
      mockCallHistory.filter(c => c.duration > 0).length
    ),
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Histórico de Chamadas</h1>
          <p className="text-muted-foreground">Visualize e exporte seu histórico completo</p>
        </div>
        
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total de Chamadas</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Atendidas</p>
            <p className="text-2xl font-bold text-success">{stats.completed}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Perdidas</p>
            <p className="text-2xl font-bold text-destructive">{stats.missed}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Duração Média</p>
            <p className="text-2xl font-bold">{formatDuration(stats.avgDuration)}</p>
          </CardContent>
        </Card>
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
        
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="incoming">Recebidas</SelectItem>
            <SelectItem value="outgoing">Realizadas</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="completed">Atendidas</SelectItem>
            <SelectItem value="missed">Perdidas</SelectItem>
            <SelectItem value="voicemail">Caixa postal</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" className="gap-2">
          <Calendar className="h-4 w-4" />
          Data
        </Button>
      </div>

      {/* Call List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Chamadas ({filteredCalls.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredCalls.map((call) => {
              const Icon = getCallIcon(call.type, call.status);
              
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
                      <p className="font-medium">{call.contactName}</p>
                      <p className="text-sm text-muted-foreground">{call.contactPhone}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm">
                        {format(call.timestamp, "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(call.timestamp, "HH:mm", { locale: ptBR })}
                      </p>
                    </div>

                    <Badge variant={call.status === 'missed' ? 'destructive' : 'secondary'}>
                      {getStatusLabel(call.status)}
                    </Badge>

                    {call.duration > 0 && (
                      <span className="w-16 text-right font-mono text-sm text-muted-foreground">
                        {formatDuration(call.duration)}
                      </span>
                    )}

                    <div className="flex items-center gap-1">
                      {call.recording && (
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
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
        </CardContent>
      </Card>
    </div>
  );
};

export default History;


import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Shield, Search, Filter, RefreshCw, Calendar, User, Activity, Info, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { safeFormatDate, safeFormatDatePtBR } from '@/lib/safe-date';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';
import { logger } from '@/lib/logger';
import { usePageTitle } from '@/hooks/usePageTitle';

type AuditLog = Tables<'call_control_audit_logs'>;

const actionLabels: Record<string, string> = {
  call_start: 'Início de Chamada',
  call_end: 'Fim de Chamada',
  hold_start: 'Início de Espera',
  hold_end: 'Fim de Espera',
  agent_status_change: 'Status do Agente',
  trunk_failover: 'Failover de Tronco',
  table_modification: 'Modificação de Tabela'
};

const resourceLabels: Record<string, string> = {
  contact: 'Contato',
  contact_interaction: 'Interação',
  call_session: 'Sessão de Chamada',
  call_transcription: 'Transcrição',
  call_recording: 'Gravação',
  call_analysis: 'Análise',
  call_summary: 'Resumo',
  agent: 'Agente',
  user_profile: 'Perfil de Usuário',
  coaching_recommendation: 'Coaching',
  scheduled_callback: 'Callback',
  dialer_campaign: 'Campanha',
  dialer_queue: 'Fila de Discagem'
};

const actionColors: Record<string, string> = {
  call_start: 'bg-success/10 text-success border-success/20',
  call_end: 'bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20',
  hold_start: 'bg-warning/10 text-warning border-warning/20',
  hold_end: 'bg-info/10 text-info border-info/20',
  agent_status_change: 'bg-primary/10 text-primary border-primary/20',
  trunk_failover: 'bg-destructive/10 text-destructive border-destructive/20',
  table_modification: 'bg-accent/40 text-accent-foreground border-accent'
};

export default function AuditLogs() {
  usePageTitle('Logs de Auditoria');

  const navigate = useNavigate();
  const { hasRole } = useAuthContext();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [resourceFilter, setResourceFilter] = useState<string>('all');

  useEffect(() => {
    if (!hasRole(['admin'])) {
      toast.error('Acesso negado. Apenas administradores podem ver logs de auditoria.');
      navigate('/');
      return;
    }
    fetchLogs();
  }, [hasRole, navigate]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('call_control_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      logger.error('Error fetching audit logs:', err);
      toast.error('Erro ao carregar logs de auditoria');
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.call_session_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.source?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      JSON.stringify(log.details).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = actionFilter === 'all' || log.event_type === actionFilter;
    const matchesResource = true; // No resource_type in call_control_audit_logs
    
    return matchesSearch && matchesAction && matchesResource;
  });

  const stats = {
    total: logs.length,
    today: logs.filter(l => {
      const today = new Date();
      const logDate = new Date(l.created_at);
      return logDate.toDateString() === today.toDateString();
    }).length,
    uniqueUsers: new Set(logs.map(l => l.source).filter(Boolean)).size,
    sensitiveAccess: logs.length
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Logs de Auditoria</h1>
            <p className="text-muted-foreground">
              Rastreamento de acessos a dados sensíveis
            </p>
          </div>
        </div>
        <Button onClick={fetchLogs} variant="outline" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Activity className="h-8 w-8 text-info" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total de Logs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-success" />
              <div>
                <p className="text-2xl font-bold">{stats.today}</p>
                <p className="text-sm text-muted-foreground">Hoje</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <User className="h-8 w-8 text-pending" />
              <div>
                <p className="text-2xl font-bold">{stats.uniqueUsers}</p>
                <p className="text-sm text-muted-foreground">Usuários Únicos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-destructive" />
              <div>
                <p className="text-2xl font-bold">{stats.sensitiveAccess}</p>
                <p className="text-sm text-muted-foreground">Acessos Sensíveis</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por email, ID ou detalhes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Ação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Ações</SelectItem>
                {Object.entries(actionLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={resourceFilter} onValueChange={setResourceFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Recurso" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Recursos</SelectItem>
                {Object.entries(resourceLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Registros ({filteredLogs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Fonte</TableHead>
                  <TableHead>Evento</TableHead>
                  <TableHead>Sessão</TableHead>
                  <TableHead>Detalhes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap">
                      {safeFormatDatePtBR(log.created_at, "dd/MM/yyyy HH:mm:ss")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {log.source || 'Sistema'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={actionColors[log.event_type] || ''}>
                        {actionLabels[log.event_type] || log.event_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {log.call_session_id || '-'}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate font-mono text-[10px]">
                      {log.details && typeof log.details === 'object' && Object.keys(log.details).length > 0 ? (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 gap-2 text-xs">
                              <Eye className="h-3 w-3" /> Ver Detalhes
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <Info className="h-5 w-5 text-primary" />
                                Detalhes do Evento
                              </DialogTitle>
                            </DialogHeader>
                            <div className="bg-muted p-4 rounded-lg overflow-auto max-h-[400px]">
                              <pre className="text-[10px] leading-relaxed">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-xs mt-2 border-t pt-4">
                              <div>
                                <p className="text-muted-foreground">ID do Log</p>
                                <p className="font-mono">{log.id}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Sessão</p>
                                <p className="font-mono">{log.call_session_id}</p>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      ) : (
                        <span className="text-muted-foreground italic">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredLogs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {loading ? 'Carregando...' : 'Nenhum log encontrado'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

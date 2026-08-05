import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, AlertTriangle, Search, Filter, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { safeFormatDate, safeFormatDatePtBR } from '@/lib/safe-date';
import { ptBR } from 'date-fns/locale';

export default function SecurityDashboard() {
  const [logs, setLogs] = useState<Database['public']['Tables']['audit_logs']['Row'][]>([]);
  const [filter, setFilter] = useState({
    user: '',
    type: 'all',
    date: ''
  });

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const fetchLogs = async () => {
    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (filter.type === 'validation_error') {
      query = query.eq('action', 'VALIDATION_ERROR');
    } else if (filter.type === 'security_critical') {
      query = query.in('action', ['WEBHOOK_SIGNATURE_FAILURE', 'UNAUTHORIZED_ACCESS']);
    }

    const { data } = await query.limit(100);
    setLogs(data || []);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-8 w-8 text-primary" />
        <h1 className="text-2xl font-bold">Painel de Segurança e Auditoria</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Search className="h-4 w-4" /> Buscar Usuário
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input 
              placeholder="ID do Usuário..." 
              value={filter.user}
              onChange={(e) => setFilter({...filter, user: e.target.value})}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Filter className="h-4 w-4" /> Tipo de Evento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={filter.type} onValueChange={(v) => setFilter({...filter, type: v})}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Eventos</SelectItem>
                <SelectItem value="validation_error">Falhas de Validação (422)</SelectItem>
                <SelectItem value="security_critical">Eventos Críticos / HMAC</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Filtro Rápido
            </CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Badge variant="outline" className="cursor-pointer">Últimas 24h</Badge>
            <Badge variant="outline" className="cursor-pointer">7 Dias</Badge>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Logs de Auditoria Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Usuário / IP</TableHead>
                <TableHead>Recurso</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-xs">
                    {safeFormatDatePtBR(log.created_at, "dd/MM HH:mm:ss")}
                  </TableCell>
                  <TableCell>
                    <Badge variant={log.action.includes('FAILURE') ? 'destructive' : 'secondary'}>
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs font-mono">
                    {log.user_id || log.ip_address}
                  </TableCell>
                  <TableCell className="text-xs">
                    {log.resource_type}: {log.resource_id}
                  </TableCell>
                  <TableCell>
                    {log.action === 'VALIDATION_ERROR' ? (
                      <span className="text-warning flex items-center gap-1 text-xs font-bold">
                        <AlertTriangle className="h-3 w-3" /> 422
                      </span>
                    ) : (
                      <span className="text-success text-xs font-bold">200/OK</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}


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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Search, Filter, RefreshCw, Calendar, User, Activity, Info, Eye, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { usePageTitle } from '@/hooks/usePageTitle';

export default function SecurityAuditDashboard() {
  usePageTitle('Painel de Auditoria de Segurança');

  const navigate = useNavigate();
  const { hasRole, user } = useAuthContext();
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [rlsLogs, setRlsLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    if (!hasRole(['admin'])) {
      toast.error('Acesso negado.');
      navigate('/');
      return;
    }
    fetchData();
  }, [hasRole]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [auditRes, rlsRes] = await Promise.all([
        supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(200),
        supabase.from('rls_audit_logs').select('*').order('created_at', { ascending: false }).limit(200)
      ]);

      if (auditRes.error) throw auditRes.error;
      if (rlsRes.error) throw rlsRes.error;

      setAuditLogs(auditRes.data || []);
      setRlsLogs(rlsRes.data || []);
    } catch (err) {
      logger.error('Error fetching security logs:', err);
      toast.error('Erro ao carregar logs');
    } finally {
      setLoading(false);
    }
  };

  const filteredAudit = auditLogs.filter(log => {
    const matchesSearch = 
      log.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      JSON.stringify(log.details).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || 
      (typeFilter === '422' && log.action === 'VALIDATION_ERROR') ||
      (typeFilter === 'auth' && log.action.includes('AUTH'));
    
    return matchesSearch && matchesType;
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-destructive" />
          <div>
            <h1 className="text-2xl font-bold">Segurança e Auditoria</h1>
            <p className="text-muted-foreground">Monitoramento de acessos, falhas de validação e eventos críticos</p>
          </div>
        </div>
        <Button onClick={fetchData} variant="outline" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <AlertTriangle className="h-8 w-8 text-warning" />
            <div>
              <p className="text-2xl font-bold">{auditLogs.filter(l => l.action === 'VALIDATION_ERROR').length}</p>
              <p className="text-sm text-muted-foreground">Erros de Validação (422)</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <Shield className="h-8 w-8 text-destructive" />
            <div>
              <p className="text-2xl font-bold">{rlsLogs.length}</p>
              <p className="text-sm text-muted-foreground">Violações de RLS</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <Activity className="h-8 w-8 text-info" />
            <div>
              <p className="text-2xl font-bold">{auditLogs.length + rlsLogs.length}</p>
              <p className="text-sm text-muted-foreground">Total de Eventos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Filtros de Auditoria</CardTitle>
            <div className="flex gap-2">
              <Input 
                placeholder="Buscar por email ou ação..." 
                className="w-64"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="422">Erro 422</SelectItem>
                  <SelectItem value="auth">Autenticação</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="audit">
            <TabsList className="mb-4">
              <TabsTrigger value="audit">Logs de Ações / Erros</TabsTrigger>
              <TabsTrigger value="rls">Eventos RLS</TabsTrigger>
            </TabsList>

            <TabsContent value="audit">
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Ação</TableHead>
                      <TableHead>IP</TableHead>
                      <TableHead>Detalhes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAudit.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-xs">
                          {format(new Date(log.created_at), "dd/MM/yy HH:mm")}
                        </TableCell>
                        <TableCell className="text-xs">{log.user_email || 'Anônimo'}</TableCell>
                        <TableCell>
                          <Badge variant={log.action === 'VALIDATION_ERROR' ? 'destructive' : 'outline'}>
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs font-mono">{log.ip_address}</TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader><DialogTitle>Detalhes do Log</DialogTitle></DialogHeader>
                              <pre className="p-4 bg-muted rounded text-[10px] overflow-auto max-h-96">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="rls">
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Tabela</TableHead>
                      <TableHead>Ação</TableHead>
                      <TableHead>Detalhes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rlsLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-xs">
                          {format(new Date(log.created_at), "dd/MM/yy HH:mm")}
                        </TableCell>
                        <TableCell><Badge variant="outline">{log.table_name}</Badge></TableCell>
                        <TableCell><Badge variant="destructive">{log.action}</Badge></TableCell>
                        <TableCell className="text-xs truncate max-w-xs">{JSON.stringify(log.details)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

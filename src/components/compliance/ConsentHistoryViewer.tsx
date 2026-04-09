import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, CheckCircle2, XCircle, Phone, Shield, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function ConsentHistoryViewer() {
  const { data: consents = [], isLoading } = useQuery({
    queryKey: ['consent-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consent_history')
        .select('*')
        .order('recorded_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading) return <div className="text-center py-8 text-muted-foreground">Carregando...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Histórico de Consentimento</CardTitle>
        <CardDescription>Registro de consentimentos obtidos e revogados</CardDescription>
      </CardHeader>
      <CardContent>
        {consents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">Nenhum registro de consentimento encontrado</div>
        ) : (
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Registrado por</TableHead>
                  <TableHead>Revogação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {consents.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-sm flex items-center gap-1">
                      <Phone className="h-3 w-3" />{c.phone}
                    </TableCell>
                    <TableCell><Badge variant="outline">{c.consent_type}</Badge></TableCell>
                    <TableCell>
                      {c.consent_given ? (
                        <Badge className="bg-emerald-500/15 text-emerald-600 gap-1"><CheckCircle2 className="h-3 w-3" />Dado</Badge>
                      ) : (
                        <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Negado</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{c.consent_method}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(c.recorded_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{c.recorded_by || '—'}</TableCell>
                    <TableCell>
                      {c.revoked_at ? (
                        <Badge variant="destructive" className="text-[10px]">
                          Revogado {format(new Date(c.revoked_at), 'dd/MM/yy', { locale: ptBR })}
                        </Badge>
                      ) : c.expires_at ? (
                        <Badge variant="secondary" className="text-[10px] gap-1">
                          <Clock className="h-3 w-3" />
                          Expira {format(new Date(c.expires_at), 'dd/MM/yy', { locale: ptBR })}
                        </Badge>
                      ) : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

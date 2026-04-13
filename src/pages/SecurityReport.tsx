import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, ShieldCheck, ShieldAlert, Lock, Users, Database, FileText, Eye, CheckCircle2, AlertTriangle, Info, Download, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { usePageTitle } from '@/hooks/usePageTitle';
import { securityFeatures, securityDecisions, rlsPolicies } from '@/lib/security/report-data';

const getStatusIcon = (status: string) => {
  switch (status) {
    case "implemented": return <CheckCircle2 className="h-5 w-5 text-success" />;
    case "partial": return <AlertTriangle className="h-5 w-5 text-warning" />;
    case "pending": return <Info className="h-5 w-5 text-info" />;
    default: return null;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "implemented": return <Badge className="bg-success/10 text-success border-success/20">Implementado</Badge>;
    case "partial": return <Badge className="bg-warning/10 text-warning border-warning/20">Parcial</Badge>;
    case "pending": return <Badge className="bg-info/10 text-info border-info/20">Pendente</Badge>;
    default: return null;
  }
};

const getRiskBadge = (risk: string) => {
  switch (risk) {
    case "low": return <Badge variant="outline" className="text-success border-success/30">Baixo</Badge>;
    case "medium": return <Badge variant="outline" className="text-warning border-warning/30">Médio</Badge>;
    case "high": return <Badge variant="outline" className="text-destructive border-destructive/30">Alto</Badge>;
    default: return null;
  }
};

const SecurityReport = () => {
  usePageTitle('Relatório de Segurança');
  const { profile, loading } = useAuth();
  const navigate = useNavigate();
  const [reportDate] = useState(new Date());

  useEffect(() => {
    if (!loading && (!profile || profile.role !== 'admin')) navigate('/unauthorized');
  }, [profile, loading, navigate]);

  const handleExportReport = () => {
    const content = `RELATÓRIO DE SEGURANÇA\n${'='.repeat(30)}\nGerado em: ${format(reportDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}\n\nFeatures: ${securityFeatures.filter(f => f.status === 'implemented').length}/${securityFeatures.length}\nPolíticas RLS: ${rlsPolicies.reduce((a, p) => a + p.policies, 0)}\nDecisões: ${securityDecisions.length}`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `relatorio-seguranca-${format(reportDate, 'yyyy-MM-dd')}.txt`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(a.href);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3"><Shield className="h-8 w-8 text-primary" />Relatório de Segurança</h1>
          <p className="text-muted-foreground mt-1">Gerado em {format(reportDate, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}</p>
        </div>
        <Button onClick={handleExportReport} className="gap-2"><Download className="h-4 w-4" />Exportar</Button>
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Tabelas Protegidas</CardTitle><Database className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">22</div><p className="text-xs text-muted-foreground">Com RLS ativo</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Políticas RLS</CardTitle><Lock className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{rlsPolicies.reduce((a, p) => a + p.policies, 0)}</div><p className="text-xs text-muted-foreground">Implementadas</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Features</CardTitle><ShieldCheck className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{securityFeatures.filter(f => f.status === 'implemented').length}/{securityFeatures.length}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Decisões</CardTitle><FileText className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{securityDecisions.length}</div></CardContent></Card>
      </div>

      {/* Features */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" />Funcionalidades de Segurança</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">
            {securityFeatures.map((f, i) => (
              <div key={i} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {getStatusIcon(f.status)}
                    <div>
                      <h4 className="font-medium">{f.name}</h4>
                      <p className="text-sm text-muted-foreground">{f.description}</p>
                      {f.details && <ul className="mt-2 space-y-1">{f.details.map((d, j) => <li key={j} className="text-sm text-muted-foreground flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />{d}</li>)}</ul>}
                    </div>
                  </div>
                  {getStatusBadge(f.status)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* RBAC */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Modelo de Acesso (RBAC)</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="border rounded-lg p-4 bg-destructive/5 border-destructive/20"><h4 className="font-medium flex items-center gap-2 text-destructive"><Shield className="h-4 w-4" />Admin</h4><ul className="mt-2 space-y-1 text-sm"><li>• Acesso total</li><li>• Audit logs</li><li>• Gestão de usuários</li></ul></div>
            <div className="border rounded-lg p-4 bg-warning/5 border-warning/20"><h4 className="font-medium flex items-center gap-2 text-warning"><Eye className="h-4 w-4" />Supervisor</h4><ul className="mt-2 space-y-1 text-sm"><li>• Dados operacionais</li><li>• Gestão de agentes</li><li>• Coaching</li></ul></div>
            <div className="border rounded-lg p-4 bg-success/5 border-success/20"><h4 className="font-medium flex items-center gap-2 text-success"><Users className="h-4 w-4" />Agent</h4><ul className="mt-2 space-y-1 text-sm"><li>• Dados próprios</li><li>• Callbacks atribuídos</li><li>• Estatísticas pessoais</li></ul></div>
          </div>
        </CardContent>
      </Card>

      {/* Decisions */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Decisões de Design</CardTitle></CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {securityDecisions.map((d, i) => (
                <div key={i} className="p-4 rounded-lg border">
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="outline">{d.category}</Badge>
                    {getRiskBadge(d.riskLevel)}
                  </div>
                  <p className="font-medium text-sm">{d.decision}</p>
                  <p className="text-sm text-muted-foreground mt-1">{d.justification}</p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* RLS Policies */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5" />Políticas RLS por Tabela</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-3">
            {rlsPolicies.map((p) => (
              <div key={p.table} className="flex items-center justify-between p-3 rounded-lg border">
                <div><p className="font-mono text-sm font-medium">{p.table}</p><p className="text-xs text-muted-foreground">{p.description}</p></div>
                <Badge variant="secondary">{p.policies}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityReport;

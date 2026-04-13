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
import { securityFeatures, securityDecisions, rlsPolicies } from '@/lib/security-report-data';

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
    const reportContent = `RELATÓRIO DE SEGURANÇA DO SISTEMA\n=================================\nGerado em: ${format(reportDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}\n\nRESUMO EXECUTIVO\n----------------\n- Tabelas com RLS: 22\n- Políticas implementadas: ${rlsPolicies.reduce((acc, p) => acc + p.policies, 0)}\n- Features de segurança: ${securityFeatures.filter(f => f.status === 'implemented').length}/${securityFeatures.length} implementadas\n- Decisões de design documentadas: ${securityDecisions.length}\n`;
    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-seguranca-${format(reportDate, 'yyyy-MM-dd')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) return (<div className="flex items-center justify-center h-64"><RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" /></div>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3"><Shield className="h-8 w-8 text-primary" />Relatório de Segurança</h1>
          <p className="text-muted-foreground mt-1">Gerado em {format(reportDate, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}</p>
        </div>
        <Button onClick={handleExportReport} className="gap-2"><Download className="h-4 w-4" />Exportar Relatório</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Tabelas Protegidas</CardTitle><Database className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">22</div><p className="text-xs text-muted-foreground">Com RLS ativo</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Políticas RLS</CardTitle><Lock className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{rlsPolicies.reduce((acc, p) => acc + p.policies, 0)}</div><p className="text-xs text-muted-foreground">Implementadas</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Features de Segurança</CardTitle><ShieldCheck className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{securityFeatures.filter(f => f.status === 'implemented').length}/{securityFeatures.length}</div><p className="text-xs text-muted-foreground">Implementadas</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Decisões Documentadas</CardTitle><FileText className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{securityDecisions.length}</div><p className="text-xs text-muted-foreground">Com justificativa</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" />Funcionalidades de Segurança</CardTitle><CardDescription>Status de implementação das principais features de segurança</CardDescription></CardHeader>
        <CardContent>
          <div className="space-y-4">
            {securityFeatures.map((feature, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {getStatusIcon(feature.status)}
                    <div>
                      <h4 className="font-medium">{feature.name}</h4>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                      {feature.details && (<ul className="mt-2 space-y-1">{feature.details.map((detail, i) => (<li key={i} className="text-sm text-muted-foreground flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />{detail}</li>))}</ul>)}
                    </div>
                  </div>
                  {getStatusBadge(feature.status)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Modelo de Acesso (RBAC)</CardTitle><CardDescription>Permissões por função no sistema</CardDescription></CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="border rounded-lg p-4 bg-destructive/5 border-destructive/20"><h4 className="font-medium flex items-center gap-2 text-destructive"><Shield className="h-4 w-4" />Admin</h4><ul className="mt-2 space-y-1 text-sm"><li>• Acesso total a todos os dados</li><li>• Visualização de audit logs</li><li>• Gestão de usuários e roles</li><li>• Configurações do sistema</li><li>• Relatórios de segurança</li></ul></div>
            <div className="border rounded-lg p-4 bg-warning/5 border-warning/20"><h4 className="font-medium flex items-center gap-2 text-warning"><Eye className="h-4 w-4" />Supervisor</h4><ul className="mt-2 space-y-1 text-sm"><li>• Visualização de todos os dados operacionais</li><li>• Gestão de agentes e equipes</li><li>• Coaching e recomendações</li><li>• Criação de contatos e callbacks</li><li>• Relatórios de desempenho</li></ul></div>
            <div className="border rounded-lg p-4 bg-success/5 border-success/20"><h4 className="font-medium flex items-center gap-2 text-success"><Users className="h-4 w-4" />Agent</h4><ul className="mt-2 space-y-1 text-sm"><li>• Apenas dados das próprias chamadas</li><li>• Contatos com histórico de interação</li><li>• Callbacks atribuídos</li><li>• Próprias estatísticas e badges</li><li>• Coaching recebido</li></ul></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Decisões de Design de Segurança</CardTitle><CardDescription>Justificativas para comportamentos intencionais do sistema</CardDescription></CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {securityDecisions.map((decision, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center gap-2"><Badge variant="secondary">{decision.category}</Badge>{getRiskBadge(decision.riskLevel)}</div>
                  <h4 className="font-medium mt-2">{decision.decision}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{decision.justification}</p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5" />Políticas RLS por Tabela</CardTitle><CardDescription>Detalhamento das políticas de segurança por tabela</CardDescription></CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {rlsPolicies.map((policy, index) => (
              <div key={index} className="border rounded-lg p-3 flex items-center justify-between">
                <div><code className="text-sm font-mono bg-muted px-1.5 py-0.5 rounded">{policy.table}</code><p className="text-xs text-muted-foreground mt-1">{policy.description}</p></div>
                <Badge variant="outline">{policy.policies}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-warning/30 bg-warning/5">
        <CardHeader><CardTitle className="flex items-center gap-2 text-warning"><ShieldAlert className="h-5 w-5" />Recomendações Pendentes</CardTitle></CardHeader>
        <CardContent>
          <ul className="space-y-2">
            <li className="flex items-start gap-2"><AlertTriangle className="h-4 w-4 text-warning mt-0.5" /><span>Ativar Leaked Password Protection no painel do Cloud</span></li>
            <li className="flex items-start gap-2"><Info className="h-4 w-4 text-info mt-0.5" /><span>Configurar alertas automáticos para padrões suspeitos de acesso</span></li>
            <li className="flex items-start gap-2"><Info className="h-4 w-4 text-info mt-0.5" /><span>Implementar expiração temporal de acesso para ex-funcionários</span></li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityReport;

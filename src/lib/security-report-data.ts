export interface SecurityFeature {
  name: string;
  status: 'implemented' | 'partial' | 'pending';
  /** De onde vem o estado acima: medicao, verificacao no codigo ou declaracao sem medicao. */
  evidence: string;
  description: string;
  details?: string[];
}

export interface SecurityDecision {
  category: string;
  decision: string;
  justification: string;
  riskLevel: 'low' | 'medium' | 'high';
}

export const securityFeatures: SecurityFeature[] = [
  {
    name: 'Row Level Security (RLS)',
    evidence: 'Medido nesta tela pela RPC check_all_tables_rls_status',
    status: 'implemented',
    description: 'Todas as tabelas possuem políticas RLS ativas',
    details: ['Políticas baseadas em funções (agent, supervisor, admin)', 'Funções SECURITY DEFINER para evitar recursão'],
  },
  {
    name: 'Controle de Acesso Baseado em Funções (RBAC)',
    evidence: 'Verificado nas migrations: get_user_role() e is_admin_or_supervisor()',
    status: 'implemented',
    description: 'Sistema de permissões por role implementado',
    details: ['3 níveis: Agent, Supervisor, Admin', 'Funções auxiliares: get_user_role(), is_admin_or_supervisor()', 'Proteção contra escalação de privilégios'],
  },
  {
    name: 'Proteção de Dados Sensíveis',
    evidence: 'Declarado nas politicas RLS; nao ha teste automatico que meca',
    status: 'implemented',
    description: 'Acesso a PII restrito por função',
    details: ['Emails de agentes: apenas próprio registro ou admin/supervisor', 'Contatos: apenas com histórico de interação', 'Telefones: apenas chamadas do próprio agente'],
  },
  {
    name: 'Sistema de Auditoria',
    evidence: 'Verificado nas migrations: audit_logs e log_audit_event()',
    status: 'implemented',
    description: 'Logs de auditoria para rastrear acessos',
    details: ['Tabela audit_logs com RLS (apenas admins)', 'Função log_audit_event() para registro seguro', 'Hook useAuditLog integrado em componentes sensíveis'],
  },
  {
    name: 'Validação de INSERT',
    evidence: 'Declarado nas politicas RLS; nao ha teste automatico que meca',
    status: 'implemented',
    description: 'Inserções validadas por função e contexto',
    details: ['Contatos: apenas supervisores/admins', 'Callbacks: apenas supervisores/admins', 'Transcrições/análises: validação por sessão de chamada'],
  },
  {
    name: 'Proteção contra Senhas Vazadas',
    evidence: 'Nao verificado: depende de ativacao no painel do Supabase',
    status: 'pending',
    description: 'HaveIBeenPwned integration',
    details: ['Requer ativação manual no painel do Cloud', 'Configuração de autenticação do Supabase'],
  },
];

export const securityDecisions: SecurityDecision[] = [
  { category: 'Acesso a Contatos', decision: 'Agentes veem contatos com quem interagiram', justification: 'Necessário para continuidade do atendimento e histórico de relacionamento com o cliente', riskLevel: 'low' },
  { category: 'Telefones em Chamadas', decision: 'Agentes acessam telefones de suas chamadas', justification: 'Operação de call center requer acesso a telefones para callbacks e relacionamento', riskLevel: 'low' },
  { category: 'Callbacks Atribuídos', decision: 'Agentes veem apenas callbacks atribuídos a eles', justification: 'Modelo padrão de distribuição de trabalho em call centers', riskLevel: 'low' },
  { category: 'Fila de Discagem', decision: 'Agentes veem itens da fila atribuídos', justification: 'Modelo de discador preditivo onde cada agente vê apenas sua fila', riskLevel: 'low' },
  { category: 'Perfis de Usuários', decision: 'Supervisores/admins veem todos os perfis', justification: 'Gestão de equipe requer visibilidade de informações dos membros', riskLevel: 'low' },
  { category: 'SECURITY DEFINER Functions', decision: 'Funções com privilégios elevados mantidas', justification: 'Necessárias para evitar recursão infinita em políticas RLS. Implementadas com search_path fixo', riskLevel: 'medium' },
  { category: 'Audit Logs INSERT', decision: 'Inserção via função validada', justification: 'Função log_audit_event() obtém dados do usuário autenticado automaticamente', riskLevel: 'low' },
];

export interface SecurityFeature {
  name: string;
  status: "implemented" | "partial" | "pending";
  description: string;
  details?: string[];
}

export interface SecurityDecision {
  category: string;
  decision: string;
  justification: string;
  riskLevel: "low" | "medium" | "high";
}

export interface RLSPolicy {
  table: string;
  policies: number;
  description: string;
}

export const securityFeatures: SecurityFeature[] = [
  { name: "Row Level Security (RLS)", status: "implemented", description: "Todas as tabelas possuem políticas RLS ativas", details: ["22 tabelas com RLS habilitado", "Políticas baseadas em funções (agent, supervisor, admin)", "Funções SECURITY DEFINER para evitar recursão"] },
  { name: "Controle de Acesso Baseado em Funções (RBAC)", status: "implemented", description: "Sistema de permissões por role implementado", details: ["3 níveis: Agent, Supervisor, Admin", "Funções auxiliares: get_user_role(), is_admin_or_supervisor()", "Proteção contra escalação de privilégios"] },
  { name: "Proteção de Dados Sensíveis", status: "implemented", description: "Acesso a PII restrito por função", details: ["Emails de agentes: apenas próprio registro ou admin/supervisor", "Contatos: apenas com histórico de interação", "Telefones: apenas chamadas do próprio agente"] },
  { name: "Sistema de Auditoria", status: "implemented", description: "Logs de auditoria para rastrear acessos", details: ["Tabela audit_logs com RLS (apenas admins)", "Função log_audit_event() para registro seguro", "Hook useAuditLog integrado em componentes sensíveis"] },
  { name: "Validação de INSERT", status: "implemented", description: "Inserções validadas por função e contexto", details: ["Contatos: apenas supervisores/admins", "Callbacks: apenas supervisores/admins", "Transcrições/análises: validação por sessão de chamada"] },
  { name: "Proteção contra Senhas Vazadas", status: "pending", description: "HaveIBeenPwned integration", details: ["Requer ativação manual no painel do Cloud", "Configuração de autenticação do Supabase"] },
];

export const securityDecisions: SecurityDecision[] = [
  { category: "Acesso a Contatos", decision: "Agentes veem contatos com quem interagiram", justification: "Necessário para continuidade do atendimento e histórico de relacionamento com o cliente", riskLevel: "low" },
  { category: "Telefones em Chamadas", decision: "Agentes acessam telefones de suas chamadas", justification: "Operação de call center requer acesso a telefones para callbacks e relacionamento", riskLevel: "low" },
  { category: "Callbacks Atribuídos", decision: "Agentes veem apenas callbacks atribuídos a eles", justification: "Modelo padrão de distribuição de trabalho em call centers", riskLevel: "low" },
  { category: "Fila de Discagem", decision: "Agentes veem itens da fila atribuídos", justification: "Modelo de discador preditivo onde cada agente vê apenas sua fila", riskLevel: "low" },
  { category: "Perfis de Usuários", decision: "Supervisores/admins veem todos os perfis", justification: "Gestão de equipe requer visibilidade de informações dos membros", riskLevel: "low" },
  { category: "SECURITY DEFINER Functions", decision: "Funções com privilégios elevados mantidas", justification: "Necessárias para evitar recursão infinita em políticas RLS. Implementadas com search_path fixo", riskLevel: "medium" },
  { category: "Audit Logs INSERT", decision: "Inserção via função validada", justification: "Função log_audit_event() obtém dados do usuário autenticado automaticamente", riskLevel: "low" },
];

export const rlsPolicies: RLSPolicy[] = [
  { table: "agents", policies: 2, description: "Próprio registro ou admin/supervisor" },
  { table: "contacts", policies: 4, description: "Baseado em interações + supervisor" },
  { table: "call_sessions", policies: 4, description: "Chamadas do próprio agente" },
  { table: "call_transcriptions", policies: 3, description: "Transcrições de próprias chamadas" },
  { table: "call_recordings", policies: 3, description: "Gravações de próprias chamadas" },
  { table: "call_analyses", policies: 3, description: "Análises de próprias chamadas" },
  { table: "call_summaries", policies: 3, description: "Resumos de próprias chamadas" },
  { table: "scheduled_callbacks", policies: 4, description: "Callbacks atribuídos + criados" },
  { table: "dialer_queue", policies: 3, description: "Fila atribuída ao agente" },
  { table: "contact_interactions", policies: 3, description: "Interações do próprio agente" },
  { table: "coaching_recommendations", policies: 4, description: "Recomendações do próprio agente" },
  { table: "user_profiles", policies: 4, description: "Próprio perfil ou admin/supervisor" },
  { table: "audit_logs", policies: 2, description: "Apenas admins podem visualizar" },
  { table: "whisper_messages", policies: 4, description: "Mensagens para o próprio agente" },
  { table: "contact_alerts", policies: 4, description: "Apenas supervisores/admins" },
];

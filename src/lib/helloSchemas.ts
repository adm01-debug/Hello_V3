import { z } from 'zod';

export const atendimentoSchema = z.object({
  protocolo: z.string().min(1),
  cliente_id: z.string().uuid().optional(),
  cliente_nome: z.string().optional(),
  cliente_telefone: z.string().optional(),
  canal: z.enum(['telefone', 'whatsapp', 'email', 'chat', 'presencial']),
  tipo: z.enum(['informacao', 'reclamacao', 'solicitacao', 'sugestao', 'venda']),
  status: z.enum(['aguardando', 'em_atendimento', 'transferido', 'finalizado', 'cancelado']).default('aguardando'),
  prioridade: z.enum(['baixa', 'normal', 'alta', 'urgente']).default('normal'),
  atendente_id: z.string().uuid().optional(),
  descricao: z.string().optional(),
  resolucao: z.string().optional(),
});

export const filaSchema = z.object({
  nome: z.string().min(1),
  descricao: z.string().optional(),
  ativa: z.coerce.boolean().default(true),
  tempo_max_espera: z.coerce.number().int().positive().optional(),
  prioridade: z.coerce.number().int().min(1).max(10).default(5),
});

export const helloImportTemplates = {
  atendimentos: [
    { key: 'protocolo', label: 'Protocolo', example: 'ATD-2024-001' },
    { key: 'cliente_nome', label: 'Cliente', example: 'João Silva' },
    { key: 'cliente_telefone', label: 'Telefone', example: '(11) 99999-9999' },
    { key: 'canal', label: 'Canal', example: 'telefone' },
    { key: 'tipo', label: 'Tipo', example: 'solicitacao' },
  ],
};

export const helloFilterConfigs = {
  atendimentos: [
    { key: 'status', label: 'Status', type: 'select' as const, options: [
      { value: 'aguardando', label: 'Aguardando' },
      { value: 'em_atendimento', label: 'Em Atendimento' },
      { value: 'transferido', label: 'Transferido' },
      { value: 'finalizado', label: 'Finalizado' },
    ]},
    { key: 'canal', label: 'Canal', type: 'select' as const, options: [
      { value: 'telefone', label: 'Telefone' },
      { value: 'whatsapp', label: 'WhatsApp' },
      { value: 'email', label: 'E-mail' },
      { value: 'chat', label: 'Chat' },
    ]},
    { key: 'prioridade', label: 'Prioridade', type: 'select' as const, options: [
      { value: 'baixa', label: 'Baixa' },
      { value: 'normal', label: 'Normal' },
      { value: 'alta', label: 'Alta' },
      { value: 'urgente', label: 'Urgente' },
    ]},
  ],
};

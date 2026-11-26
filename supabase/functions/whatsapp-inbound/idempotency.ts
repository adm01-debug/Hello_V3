/**
 * Regras de idempotência do recebimento de WhatsApp.
 *
 * Provedores reentregam a mesma mensagem quando não recebem HTTP 200 (timeout,
 * deploy, 5xx). Sem deduplicação, cada retry cria uma mensagem duplicada na
 * conversa e infla `unread_count`.
 *
 * Mantido puro e separado do handler para ser testável sem banco.
 */

export interface StoredMessageRef {
  id: string;
  conversation_id: string;
}

export interface ReplayResponse {
  success: true;
  idempotent_replay: true;
  conversation_id: string;
  message_id?: string;
  version: string;
}

/**
 * Decide se a entrega é uma repetição.
 *
 * @param alreadyStored mensagem já gravada com o mesmo `message_id`
 * @param conversationWithSameExternalId conversa cujo `external_id` bate
 * @returns payload de resposta 200 (replay) ou `null` para seguir com a inserção
 */
export function detectReplay(
  version: string,
  alreadyStored: StoredMessageRef | null | undefined,
  conversationWithSameExternalId: { id: string } | null | undefined,
): ReplayResponse | null {
  if (alreadyStored) {
    return {
      success: true,
      idempotent_replay: true,
      conversation_id: alreadyStored.conversation_id,
      message_id: alreadyStored.id,
      version,
    };
  }

  if (conversationWithSameExternalId) {
    return {
      success: true,
      idempotent_replay: true,
      conversation_id: conversationWithSameExternalId.id,
      version,
    };
  }

  return null;
}

/**
 * Erro de gravação que significa "essa mensagem já existe".
 *
 * `23505` é a violação do índice único parcial `idx_conversation_messages_msgid`
 * (etapa 017). É a barreira final: duas reentregas simultâneas passam as duas pela
 * leitura de deduplicação e só a segunda bate no índice.
 */
export function isDuplicateMessageError(error: { code?: string } | null | undefined): boolean {
  return error?.code === '23505';
}

/** Normaliza telefone para comparação (apenas dígitos). */
export function normalizePhone(raw: string): string {
  return raw.replace(/[^0-9]/g, "");
}
import type { ActionItem, MeetingSummary, ParticipantSentiment } from '@/hooks/useMeetingSummary';

const VALID_PRIORITIES = ['low', 'medium', 'high'] as const;
const VALID_SENTIMENTS = ['positive', 'neutral', 'negative'] as const;

export function isValidActionItem(value: unknown): value is ActionItem {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.description === 'string' &&
    v.description.length > 0 &&
    typeof v.priority === 'string' &&
    (VALID_PRIORITIES as readonly string[]).includes(v.priority)
  );
}

export function isValidParticipantSentiment(value: unknown): value is ParticipantSentiment {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.speaker === 'string' &&
    typeof v.sentiment === 'string' &&
    (VALID_SENTIMENTS as readonly string[]).includes(v.sentiment) &&
    typeof v.score === 'number' &&
    v.score >= 0 &&
    v.score <= 10
  );
}

export function serializeSummaryAsText(summary: MeetingSummary): string {
  const lines: string[] = [];
  lines.push('# Resumo da Reunião', '');

  if (summary.summary) {
    lines.push('## Resumo Executivo', summary.summary, '');
  }

  if (summary.key_points.length) {
    lines.push('## Pontos-chave');
    summary.key_points.forEach((p) => lines.push(`- ${p}`));
    lines.push('');
  }

  if (summary.action_items.length) {
    lines.push('## Itens de Ação');
    summary.action_items.forEach((a) => {
      const owner = a.owner ? ` (${a.owner})` : '';
      const due = a.due_suggestion ? ` — prazo: ${a.due_suggestion}` : '';
      lines.push(`- [${a.priority.toUpperCase()}]${owner} ${a.description}${due}`);
    });
    lines.push('');
  }

  if (summary.decisions.length) {
    lines.push('## Decisões');
    summary.decisions.forEach((d) => lines.push(`- ${d}`));
    lines.push('');
  }

  if (summary.next_steps.length) {
    lines.push('## Próximos Passos');
    summary.next_steps.forEach((n) => lines.push(`- ${n}`));
    lines.push('');
  }

  if (summary.participants_sentiment.length) {
    lines.push('## Sentimento por Participante');
    summary.participants_sentiment.forEach((p) => {
      lines.push(`- ${p.speaker}: ${p.sentiment} (${p.score.toFixed(1)})`);
    });
    lines.push('');
  }

  if (summary.follow_up_required) {
    lines.push('## Follow-up Necessário');
    lines.push(summary.follow_up_reason || 'Sem razão registrada.');
  }

  return lines.join('\n').trim();
}

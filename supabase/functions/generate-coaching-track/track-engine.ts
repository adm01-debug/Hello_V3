// Lógica pura de agregação e decisão de trilhas de coaching.
// Separada do `serve()` para ser testável em isolamento (deno test).

export interface CallSummary {
  agent_performance_score: number | null;
  customer_satisfaction: number | null;
  summary: string | null;
}

export interface CallSession {
  id: string;
  agent_name: string | null;
  started_at: string;
  call_summaries?: CallSummary[];
}

export interface AgentStat {
  agent_name: string;
  perfSum: number;
  satSum: number;
  count: number;
}

export interface Weakness {
  key: string;
  label: string;
  avg: number;
}

export interface TrackCandidate {
  agent_name: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  due_at: string;
  weakness: Weakness;
}

export interface Skipped {
  agent_name: string;
  reason: string;
}

export interface CoachingRules {
  min_samples: number;
  score_threshold: number;
  window_days: number;
}

export interface TrackResult {
  tracks_created: number;
  assignments: Array<{ agent_name: string; title: string; priority: string; status: string }>;
  skipped: Skipped[];
  rules: CoachingRules;
}

// Escala real dos scores: agent_performance_score e customer_satisfaction vão de 0 a 5.
export const SCORE_THRESHOLD = 3.0;
export const MIN_SAMPLES = 3;
export const WINDOW_DAYS = 14;

// Fonte única das regras: a interface exibe exatamente o que o motor aplica.
export const COACHING_RULES: CoachingRules = {
  min_samples: MIN_SAMPLES,
  score_threshold: SCORE_THRESHOLD,
  window_days: WINDOW_DAYS,
};

export function aggregateStats(sessions: CallSession[]): Map<string, AgentStat> {
  const stats = new Map<string, AgentStat>();
  for (const s of sessions) {
    const agent = s.agent_name;
    if (!agent) continue;
    for (const sm of s.call_summaries ?? []) {
      const stat = stats.get(agent) ?? { agent_name: agent, perfSum: 0, satSum: 0, count: 0 };
      stat.perfSum += sm.agent_performance_score ?? 0;
      stat.satSum += sm.customer_satisfaction ?? 0;
      stat.count += 1;
      stats.set(agent, stat);
    }
  }
  return stats;
}

export function computeWeaknesses(stat: AgentStat): Weakness[] {
  const avgPerf = stat.perfSum / stat.count;
  const avgSat = stat.satSum / stat.count;
  const weaknesses: Weakness[] = [];
  if (avgPerf < SCORE_THRESHOLD) weaknesses.push({ key: "performance", label: "desempenho geral", avg: avgPerf });
  if (avgSat < SCORE_THRESHOLD) weaknesses.push({ key: "satisfacao", label: "satisfação do cliente", avg: avgSat });
  return weaknesses;
}

export function buildTrackCandidates(
  sessions: CallSession[],
  openAgentNames: Set<string>,
  now = new Date(),
): { candidates: TrackCandidate[]; skipped: Skipped[] } {
  const stats = aggregateStats(sessions);
  const candidates: TrackCandidate[] = [];
  const skipped: Skipped[] = [];
  const dueAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

  for (const stat of stats.values()) {
    if (stat.count < MIN_SAMPLES) {
      skipped.push({ agent_name: stat.agent_name, reason: `apenas ${stat.count} chamada(s) analisada(s) (mínimo ${MIN_SAMPLES})` });
      continue;
    }
    const weaknesses = computeWeaknesses(stat);
    if (weaknesses.length === 0) {
      skipped.push({ agent_name: stat.agent_name, reason: "desempenho e satisfação dentro do alvo" });
      continue;
    }
    if (openAgentNames.has(stat.agent_name)) {
      skipped.push({ agent_name: stat.agent_name, reason: "já possui trilha aberta" });
      continue;
    }
    for (const w of weaknesses) {
      candidates.push({
        agent_name: stat.agent_name,
        title: `Trilha automática — ${w.label}`,
        description: `${w.label} médio de ${w.avg.toFixed(1)}/5 em ${stat.count} chamadas (últimos ${WINDOW_DAYS}d). ` +
          `Trilha gerada automaticamente para reforço de ${w.label}.`,
        priority: w.avg < 2.0 ? "high" : "normal",
        status: "open",
        due_at: dueAt,
        weakness: w,
      });
    }
  }
  return { candidates, skipped };
}

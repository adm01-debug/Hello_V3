/**
 * Lógica pura do painel BLF (Busy Lamp Field) — Onda #5 do roadmap 3CX.
 *
 * Deriva o estado de "lâmpada" de cada ramal a partir de três fontes voláteis:
 * agentes (`public.agents`), sessões ativas (`public.call_sessions`) e
 * chamadas estacionadas (`public.parked_calls`).
 *
 * Toda a lógica é determinística e livre de I/O para permitir PBT (ADR-051).
 * Nenhuma entrada é confiável: linhas podem vir com campos nulos, tipos
 * inesperados (payloads de realtime) ou datas inválidas.
 */

export const LAMP_STATES = [
  'talking',
  'ringing',
  'hold',
  'parked',
  'available',
  'away',
  'offline',
] as const;

export type LampState = (typeof LAMP_STATES)[number];

export const LAMP_LABELS: Record<LampState, string> = {
  talking: 'Em chamada',
  ringing: 'Chamando',
  hold: 'Em espera',
  parked: 'Estacionada',
  available: 'Disponível',
  away: 'Ausente',
  offline: 'Offline',
};

/** Ordem de exibição: estados críticos primeiro. */
export const LAMP_PRIORITY: Record<LampState, number> = {
  ringing: 0,
  talking: 1,
  hold: 2,
  parked: 3,
  available: 4,
  away: 5,
  offline: 6,
};

export interface BlfAgentRow {
  id: string;
  name: string;
  extension: string;
  status: string | null;
  department: string | null;
  avatar_url: string | null;
}

export interface BlfSessionRow {
  id: string;
  agent_name: string | null;
  caller_name: string | null;
  caller_phone: string | null;
  status: string | null;
  direction: string | null;
  started_at: string | null;
}

export interface BlfParkedRow {
  id: string;
  slot_number: number | null;
  contact_name: string | null;
  contact_phone: string | null;
  parked_at: string | null;
  status: string | null;
  parked_by_name: string | null;
}

export interface BlfLamp {
  agentId: string;
  name: string;
  extension: string;
  department: string | null;
  avatarUrl: string | null;
  state: LampState;
  /** Descrição curta do que está acontecendo (ex.: "João Silva • ****1234"). */
  detail: string | null;
  /** Segundos desde o início do evento corrente, ou null quando ocioso. */
  elapsedSeconds: number | null;
  sessionId: string | null;
  parkedSlot: number | null;
}

export interface BlfSummary {
  total: number;
  talking: number;
  ringing: number;
  hold: number;
  parked: number;
  available: number;
  away: number;
  offline: number;
  /** Percentual de ramais ocupados (talking+hold+ringing) sobre ramais online. */
  occupancyPercent: number;
}

/** Converte qualquer valor em texto aparado, ou null. */
export function safeText(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return null;
}

/** Chave de comparação de nomes de agente (case/acentos/espaços insensível). */
export function agentKey(value: unknown): string {
  const text = safeText(value);
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/** Mascara telefone preservando apenas os 4 últimos dígitos. */
export function maskPhone(value: unknown): string | null {
  const text = safeText(value);
  if (!text) return null;
  const digits = text.replace(/\D/g, '');
  if (digits.length === 0) return null;
  if (digits.length <= 4) return digits;
  return `****${digits.slice(-4)}`;
}

/** Segundos decorridos desde `iso`, nunca negativo; null se data inválida. */
export function elapsedFrom(iso: unknown, now: number): number | null {
  const text = safeText(iso);
  if (!text) return null;
  const ts = Date.parse(text);
  if (!Number.isFinite(ts)) return null;
  const reference = Number.isFinite(now) ? now : Date.now();
  return Math.max(0, Math.floor((reference - ts) / 1000));
}

/** Formata segundos como mm:ss (ou h:mm:ss acima de uma hora). */
export function formatElapsed(seconds: number | null): string {
  if (seconds === null || !Number.isFinite(seconds) || seconds < 0) return '--:--';
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

function sessionState(status: unknown): LampState | null {
  const value = agentKey(status);
  if (value === 'ringing') return 'ringing';
  if (value === 'on_hold' || value === 'hold' || value === 'held') return 'hold';
  if (value === 'active' || value === 'in_progress' || value === 'answered') return 'talking';
  return null;
}

function idleState(agentStatus: unknown): LampState {
  const value = agentKey(agentStatus);
  if (value === 'available') return 'available';
  if (value === 'busy') return 'talking';
  if (value === 'away' || value === 'break' || value === 'paused') return 'away';
  return 'offline';
}

/**
 * Constrói o mural de lâmpadas.
 *
 * Precedência por agente: ringing > talking > hold (sessão mais recente do
 * estado vencedor) > chamada estacionada por ele > status declarado.
 */
export function buildLampBoard(
  agents: readonly BlfAgentRow[],
  sessions: readonly BlfSessionRow[],
  parked: readonly BlfParkedRow[],
  now: number = Date.now(),
): BlfLamp[] {
  const byAgent = new Map<string, BlfSessionRow[]>();
  for (const session of sessions ?? []) {
    if (!session) continue;
    const key = agentKey(session.agent_name);
    if (!key) continue;
    const list = byAgent.get(key);
    if (list) list.push(session);
    else byAgent.set(key, [session]);
  }

  const parkedByAgent = new Map<string, BlfParkedRow[]>();
  for (const row of parked ?? []) {
    if (!row) continue;
    if (safeText(row.status) !== null && agentKey(row.status) !== 'parked') continue;
    const key = agentKey(row.parked_by_name);
    if (!key) continue;
    const list = parkedByAgent.get(key);
    if (list) list.push(row);
    else parkedByAgent.set(key, [row]);
  }

  const lamps: BlfLamp[] = [];

  for (const agent of agents ?? []) {
    if (!agent || !safeText(agent.id)) continue;
    const key = agentKey(agent.name);
    const agentSessions = key ? (byAgent.get(key) ?? []) : [];

    let winner: { session: BlfSessionRow; state: LampState } | null = null;
    for (const session of agentSessions) {
      const state = sessionState(session.status);
      if (!state) continue;
      if (
        !winner ||
        LAMP_PRIORITY[state] < LAMP_PRIORITY[winner.state] ||
        (LAMP_PRIORITY[state] === LAMP_PRIORITY[winner.state] &&
          (elapsedFrom(session.started_at, now) ?? Number.MAX_SAFE_INTEGER) <
            (elapsedFrom(winner.session.started_at, now) ?? Number.MAX_SAFE_INTEGER))
      ) {
        winner = { session, state };
      }
    }

    if (winner) {
      const caller = safeText(winner.session.caller_name);
      const phone = maskPhone(winner.session.caller_phone);
      const detail = [caller, phone].filter(Boolean).join(' • ') || null;
      lamps.push({
        agentId: agent.id,
        name: safeText(agent.name) ?? 'Sem nome',
        extension: safeText(agent.extension) ?? '—',
        department: safeText(agent.department),
        avatarUrl: safeText(agent.avatar_url),
        state: winner.state,
        detail,
        elapsedSeconds: elapsedFrom(winner.session.started_at, now),
        sessionId: safeText(winner.session.id),
        parkedSlot: null,
      });
      continue;
    }

    const parkedRows = key ? (parkedByAgent.get(key) ?? []) : [];
    if (parkedRows.length > 0) {
      const first = parkedRows.reduce((oldest, row) =>
        (elapsedFrom(row.parked_at, now) ?? -1) > (elapsedFrom(oldest.parked_at, now) ?? -1)
          ? row
          : oldest,
      );
      const contact = safeText(first.contact_name);
      const phone = maskPhone(first.contact_phone);
      const slot =
        typeof first.slot_number === 'number' && Number.isFinite(first.slot_number)
          ? Math.trunc(first.slot_number)
          : null;
      lamps.push({
        agentId: agent.id,
        name: safeText(agent.name) ?? 'Sem nome',
        extension: safeText(agent.extension) ?? '—',
        department: safeText(agent.department),
        avatarUrl: safeText(agent.avatar_url),
        state: 'parked',
        detail: [contact, phone].filter(Boolean).join(' • ') || null,
        elapsedSeconds: elapsedFrom(first.parked_at, now),
        sessionId: null,
        parkedSlot: slot,
      });
      continue;
    }

    lamps.push({
      agentId: agent.id,
      name: safeText(agent.name) ?? 'Sem nome',
      extension: safeText(agent.extension) ?? '—',
      department: safeText(agent.department),
      avatarUrl: safeText(agent.avatar_url),
      state: idleState(agent.status),
      detail: null,
      elapsedSeconds: null,
      sessionId: null,
      parkedSlot: null,
    });
  }

  return lamps;
}

/** Ordena por criticidade e, em empate, por ramal (numérico quando possível). */
export function sortLamps(lamps: readonly BlfLamp[]): BlfLamp[] {
  return [...(lamps ?? [])].sort((a, b) => {
    const diff = LAMP_PRIORITY[a.state] - LAMP_PRIORITY[b.state];
    if (diff !== 0) return diff;
    const na = Number(a.extension);
    const nb = Number(b.extension);
    if (Number.isFinite(na) && Number.isFinite(nb) && na !== nb) return na - nb;
    return a.name.localeCompare(b.name, 'pt-BR');
  });
}

/** Busca por nome, ramal ou departamento (case/acento insensível). */
export function filterLamps(
  lamps: readonly BlfLamp[],
  search: string,
  state: LampState | 'all' = 'all',
): BlfLamp[] {
  const term = agentKey(search);
  return (lamps ?? []).filter((lamp) => {
    if (state !== 'all' && lamp.state !== state) return false;
    if (!term) return true;
    return (
      agentKey(lamp.name).includes(term) ||
      agentKey(lamp.extension).includes(term) ||
      agentKey(lamp.department).includes(term)
    );
  });
}

export function summarizeLamps(lamps: readonly BlfLamp[]): BlfSummary {
  const summary: BlfSummary = {
    total: 0,
    talking: 0,
    ringing: 0,
    hold: 0,
    parked: 0,
    available: 0,
    away: 0,
    offline: 0,
    occupancyPercent: 0,
  };

  for (const lamp of lamps ?? []) {
    if (!lamp) continue;
    summary.total += 1;
    summary[lamp.state] += 1;
  }

  const online = summary.total - summary.offline;
  const busy = summary.talking + summary.ringing + summary.hold;
  summary.occupancyPercent = online > 0 ? Math.round((busy / online) * 100) : 0;
  return summary;
}

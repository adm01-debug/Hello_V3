/**
 * Cálculo de prazo em minutos úteis, respeitando o horário comercial da
 * operação (tabela `calling_hours_config` + `holidays`).
 *
 * Fuso: o runtime roda em UTC, então nada aqui usa `getHours()` — todo
 * cálculo de parede passa por `Intl.DateTimeFormat` com o `timeZone` da
 * configuração (A-033).
 */

export interface BusinessSchedule {
  timezone: string;
  weekdayStart: string; // "08:00:00"
  weekdayEnd: string;
  saturdayStart?: string | null;
  saturdayEnd?: string | null;
  sundayAllowed?: boolean;
  sundayStart?: string | null;
  sundayEnd?: string | null;
  holidaysAllowed: boolean;
  /** `YYYY-MM-DD` para feriado pontual; `MM-DD` para feriado recorrente. */
  holidays: string[];
}

const MINUTE_MS = 60_000;
const MAX_ITERATIONS = 400;

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function parseMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":");
  return Number(h) * 60 + Number(m ?? 0);
}

/** Deslocamento (ms) do fuso no instante dado, já considerando horário de verão. */
function offsetMs(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(instant);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? "0");
  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour") % 24,
    get("minute"),
    get("second"),
  );
  const truncated = instant.getTime() - (instant.getTime() % 1000);
  return asUtc - truncated;
}

interface LocalParts {
  year: number;
  month: number;
  day: number;
  dow: number;
  minuteOfDay: number;
}

function localParts(instant: Date, timeZone: string): LocalParts {
  const shifted = new Date(instant.getTime() + offsetMs(instant, timeZone));
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    dow: shifted.getUTCDay(),
    minuteOfDay: shifted.getUTCHours() * 60 + shifted.getUTCMinutes(),
  };
}

function partsToUtc(p: LocalParts, minuteOfDay: number, timeZone: string): Date {
  const guess = Date.UTC(p.year, p.month - 1, p.day, 0, 0) + minuteOfDay * MINUTE_MS;
  // duas passadas: a primeira estima o fuso com o palpite, a segunda corrige
  // quando o palpite caiu do outro lado de uma transição de horário de verão.
  const first = guess - offsetMs(new Date(guess), timeZone);
  return new Date(guess - offsetMs(new Date(first), timeZone));
}

function windowFor(
  dow: number,
  schedule: BusinessSchedule,
): { open: number; close: number } | null {
  if (dow === 0) {
    if (!schedule.sundayAllowed || !schedule.sundayStart || !schedule.sundayEnd) return null;
    return { open: parseMinutes(schedule.sundayStart), close: parseMinutes(schedule.sundayEnd) };
  }
  if (dow === 6) {
    if (!schedule.saturdayStart || !schedule.saturdayEnd) return null;
    return { open: parseMinutes(schedule.saturdayStart), close: parseMinutes(schedule.saturdayEnd) };
  }
  return { open: parseMinutes(schedule.weekdayStart), close: parseMinutes(schedule.weekdayEnd) };
}

function isHoliday(p: LocalParts, schedule: BusinessSchedule): boolean {
  if (schedule.holidaysAllowed) return false;
  const ymd = `${p.year}-${pad(p.month)}-${pad(p.day)}`;
  return schedule.holidays.includes(ymd) || schedule.holidays.includes(ymd.slice(5));
}

function nextDayStart(p: LocalParts, timeZone: string): Date {
  return partsToUtc({ ...p, day: p.day + 1 }, 0, timeZone);
}

/**
 * Soma `minutes` minutos úteis a `start` dentro das janelas da agenda.
 *
 * Fora do horário, o relógio só anda dentro das janelas de atendimento: um
 * ticket aberto sexta 18h com 60 min de SLA vence na segunda, não no sábado.
 * Feriado (pontual ou recorrente) não abre janela, salvo `holidaysAllowed`.
 */
export function addBusinessMinutes(
  start: Date,
  minutes: number,
  schedule: BusinessSchedule,
): Date {
  if (!Number.isFinite(minutes) || minutes <= 0) return new Date(start.getTime());

  let remaining = minutes;
  let cursor = new Date(start.getTime());

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const p = localParts(cursor, schedule.timezone);
    const window = isHoliday(p, schedule) ? null : windowFor(p.dow, schedule);

    if (!window || p.minuteOfDay >= window.close) {
      cursor = nextDayStart(p, schedule.timezone);
      continue;
    }
    if (p.minuteOfDay < window.open) {
      cursor = partsToUtc(p, window.open, schedule.timezone);
      continue;
    }

    const available = window.close - p.minuteOfDay;
    if (available >= remaining) {
      return partsToUtc(p, p.minuteOfDay + remaining, schedule.timezone);
    }
    remaining -= available;
    cursor = nextDayStart(p, schedule.timezone);
  }

  // Agenda sem nenhuma janela utilizável não pode travar o job: cai no prazo
  // por tempo corrido, que é o comportamento anterior.
  return new Date(start.getTime() + minutes * MINUTE_MS);
}

/** Monta a agenda a partir das linhas de `calling_hours_config` e `holidays`. */
export function scheduleFromRows(
  config: {
    timezone: string;
    weekday_start: string;
    weekday_end: string;
    saturday_start?: string | null;
    saturday_end?: string | null;
    sunday_allowed?: boolean | null;
    sunday_start?: string | null;
    sunday_end?: string | null;
    holidays_allowed?: boolean | null;
  },
  holidays: Array<{ date: string; recurring?: boolean | null }>,
): BusinessSchedule {
  return {
    timezone: config.timezone,
    weekdayStart: config.weekday_start,
    weekdayEnd: config.weekday_end,
    saturdayStart: config.saturday_start ?? null,
    saturdayEnd: config.saturday_end ?? null,
    sundayAllowed: Boolean(config.sunday_allowed),
    sundayStart: config.sunday_start ?? null,
    sundayEnd: config.sunday_end ?? null,
    holidaysAllowed: Boolean(config.holidays_allowed),
    holidays: holidays.map((h) => (h.recurring ? h.date.slice(5, 10) : h.date.slice(0, 10))),
  };
}
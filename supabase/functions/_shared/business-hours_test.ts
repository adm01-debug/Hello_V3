import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { addBusinessMinutes, scheduleFromRows, type BusinessSchedule } from "./business-hours.ts";

// America/Sao_Paulo = UTC-3 (sem horário de verão desde 2019).
// 2026-11-20 é sexta, 11-21 sábado, 11-22 domingo, 11-23 segunda.
const schedule: BusinessSchedule = {
  timezone: "America/Sao_Paulo",
  weekdayStart: "08:00:00",
  weekdayEnd: "18:00:00",
  saturdayStart: null,
  saturdayEnd: null,
  sundayAllowed: false,
  holidaysAllowed: false,
  holidays: ["2026-12-25"],
};

Deno.test("business-hours: dentro do horário soma tempo corrido", () => {
  const start = new Date("2026-11-20T13:00:00Z"); // sexta 10:00 local
  assertEquals(
    addBusinessMinutes(start, 60, schedule).toISOString(),
    "2026-11-20T14:00:00.000Z", // sexta 11:00
  );
});

Deno.test("business-hours: antes da abertura espera o horário de abertura", () => {
  const start = new Date("2026-11-20T10:00:00Z"); // sexta 07:00 local
  assertEquals(
    addBusinessMinutes(start, 60, schedule).toISOString(),
    "2026-11-20T12:00:00.000Z", // sexta 09:00
  );
});

Deno.test("business-hours: depois do fechamento empurra para o próximo dia útil", () => {
  const start = new Date("2026-11-20T20:30:00Z"); // sexta 17:30 local
  assertEquals(
    addBusinessMinutes(start, 60, schedule).toISOString(),
    "2026-11-23T11:30:00.000Z", // segunda 08:30
  );
});

Deno.test("business-hours: atravessa o fim de semana", () => {
  const start = new Date("2026-11-20T20:00:00Z"); // sexta 17:00 local
  assertEquals(
    addBusinessMinutes(start, 120, schedule).toISOString(),
    "2026-11-23T12:00:00.000Z", // segunda 09:00
  );
});

Deno.test("business-hours: feriado não abre janela", () => {
  const start = new Date("2026-12-24T20:30:00Z"); // quinta 17:30 local
  assertEquals(
    addBusinessMinutes(start, 60, schedule).toISOString(),
    "2026-12-28T11:30:00.000Z", // segunda 08:30 (sexta 25 é feriado)
  );
});

Deno.test("business-hours: feriado recorrente por MM-DD", () => {
  const recorrente: BusinessSchedule = { ...schedule, holidays: ["12-25"] };
  const start = new Date("2026-12-24T20:30:00Z");
  assertEquals(
    addBusinessMinutes(start, 60, recorrente).toISOString(),
    "2026-12-28T11:30:00.000Z",
  );
});

Deno.test("business-hours: holidays_allowed ignora feriado", () => {
  const aberto: BusinessSchedule = { ...schedule, holidaysAllowed: true };
  const start = new Date("2026-12-24T20:30:00Z"); // quinta 17:30
  assertEquals(
    addBusinessMinutes(start, 60, aberto).toISOString(),
    "2026-12-25T11:30:00.000Z", // sexta 08:30, feriado mas permitido
  );
});

Deno.test("business-hours: cruza a meia-noite em UTC sem errar o dia local", () => {
  // domingo 23:00 local = segunda 02:00 UTC — dia local é domingo (fechado)
  const start = new Date("2026-11-23T02:00:00Z");
  assertEquals(
    addBusinessMinutes(start, 30, schedule).toISOString(),
    "2026-11-23T11:30:00.000Z", // segunda 08:30 local
  );
});

Deno.test("business-hours: sábado configurado abre janela própria", () => {
  const comSabado: BusinessSchedule = {
    ...schedule,
    saturdayStart: "09:00:00",
    saturdayEnd: "13:00:00",
  };
  const start = new Date("2026-11-20T20:30:00Z"); // sexta 17:30
  assertEquals(
    addBusinessMinutes(start, 60, comSabado).toISOString(),
    "2026-11-21T12:30:00.000Z", // sábado 09:30 (30 min usados na sexta)
  );
});

Deno.test("business-hours: domingo só abre quando permitido", () => {
  const comDomingo: BusinessSchedule = {
    ...schedule,
    sundayAllowed: true,
    sundayStart: "10:00:00",
    sundayEnd: "12:00:00",
  };
  const start = new Date("2026-11-21T14:00:00Z"); // sábado 11:00 (fechado)
  assertEquals(
    addBusinessMinutes(start, 60, comDomingo).toISOString(),
    "2026-11-22T14:00:00.000Z", // domingo 11:00
  );
});

Deno.test("business-hours: zero minuto devolve o próprio instante", () => {
  const start = new Date("2026-11-20T10:00:00Z");
  assertEquals(addBusinessMinutes(start, 0, schedule).toISOString(), start.toISOString());
});

Deno.test("business-hours: agenda sem janela nenhuma cai no tempo corrido", () => {
  const fechada: BusinessSchedule = {
    ...schedule,
    weekdayStart: "00:00:01",
    weekdayEnd: "00:00:01",
  };
  const start = new Date("2026-11-20T13:00:00Z");
  assertEquals(
    addBusinessMinutes(start, 30, fechada).toISOString(),
    "2026-11-20T13:30:00.000Z",
  );
});

Deno.test("business-hours: scheduleFromRows converte linhas do banco", () => {
  const s = scheduleFromRows(
    {
      timezone: "America/Sao_Paulo",
      weekday_start: "08:00:00",
      weekday_end: "18:00:00",
      saturday_start: null,
      saturday_end: null,
      sunday_allowed: false,
      sunday_start: null,
      sunday_end: null,
      holidays_allowed: false,
    },
    [
      { date: "2026-12-25", recurring: false },
      { date: "2026-01-01", recurring: true },
    ],
  );
  assertEquals(s.holidays, ["2026-12-25", "01-01"]);
  assertEquals(s.sundayAllowed, false);
});
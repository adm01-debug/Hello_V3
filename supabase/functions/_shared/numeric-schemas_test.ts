import {
  assertEquals,
  assertThrows,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  amountCents,
  finiteInt,
  finiteNumber,
  latitude,
  longitude,
  nonNegativeInt,
  percent,
  positiveInt,
  unixTimestamp,
} from "./numeric-schemas.ts";

// Payloads hostis clássicos que quebram `z.number()` puro.
const hostileNumbers: unknown[] = [
  NaN,
  Infinity,
  -Infinity,
  "12",
  "12abc",
  null,
  undefined,
  {},
  [],
  true,
];

Deno.test("finiteNumber rejeita NaN/Infinity e não-números", () => {
  const schema = finiteNumber();
  for (const v of hostileNumbers) {
    const r = schema.safeParse(v);
    assertEquals(r.success, false, `deveria rejeitar ${String(v)}`);
  }
  assertEquals(schema.safeParse(3.14).success, true);
  assertEquals(schema.safeParse(0).success, true);
  assertEquals(schema.safeParse(-1e6).success, true);
});

Deno.test("finiteInt rejeita floats e valores hostis", () => {
  const s = finiteInt();
  assertEquals(s.safeParse(3.14).success, false);
  assertEquals(s.safeParse(NaN).success, false);
  assertEquals(s.safeParse(Infinity).success, false);
  assertEquals(s.safeParse(42).success, true);
});

Deno.test("nonNegativeInt / positiveInt aplicam pisos", () => {
  assertEquals(nonNegativeInt().safeParse(-1).success, false);
  assertEquals(nonNegativeInt().safeParse(0).success, true);
  assertEquals(positiveInt().safeParse(0).success, false);
  assertEquals(positiveInt().safeParse(1).success, true);
});

Deno.test("percent limita 0..100", () => {
  const s = percent();
  assertEquals(s.safeParse(-0.1).success, false);
  assertEquals(s.safeParse(100.01).success, false);
  assertEquals(s.safeParse(50).success, true);
});

Deno.test("latitude/longitude respeitam WGS84", () => {
  assertEquals(latitude().safeParse(-91).success, false);
  assertEquals(latitude().safeParse(90).success, true);
  assertEquals(longitude().safeParse(180.1).success, false);
  assertEquals(longitude().safeParse(-180).success, true);
});

Deno.test("unixTimestamp e amountCents são inteiros finitos não-negativos", () => {
  assertEquals(unixTimestamp().safeParse(-1).success, false);
  assertEquals(unixTimestamp().safeParse(1_700_000_000).success, true);
  assertEquals(amountCents().safeParse(-100).success, false);
  assertEquals(amountCents().safeParse(999_99).success, true);
});

// Simulação de fuzzing determinístico: gera 500 combinações aleatórias
// e garante que apenas números finitos sejam aceitos.
Deno.test("fuzz determinístico: finiteNumber sempre bloqueia hostis", () => {
  const rng = mulberry32(0xC0FFEE);
  const schema = finiteNumber();
  for (let i = 0; i < 500; i++) {
    const bucket = Math.floor(rng() * 4);
    let sample: unknown;
    switch (bucket) {
      case 0: sample = rng() * 1e9 - 5e8; break; // número finito válido
      case 1: sample = NaN; break;
      case 2: sample = rng() > 0.5 ? Infinity : -Infinity; break;
      default: sample = String(rng()); break; // string numérica: proibida
    }
    const r = schema.safeParse(sample);
    const shouldAccept = typeof sample === "number" && Number.isFinite(sample);
    assertEquals(r.success, shouldAccept, `iter ${i} sample=${String(sample)}`);
  }
});

// PRNG determinístico (Mulberry32) — evita depender de fast-check no runtime Deno.
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Evita warning de import não utilizado
void assertThrows;

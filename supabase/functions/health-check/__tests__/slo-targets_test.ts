// Etapa 170 - meta de SLO unica.
// O contrato publico (src/pages/Status.tsx: "SLA contratual: 99,9% mensal") passa a ser
// a fonte da meta: a edge devolve `slo_targets` e usa a MESMA meta no error budget e no
// status dos componentes. Antes a edge usava 99% e o painel declarava 99,9% por conta.
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { comBackendFalso, type Registro } from "../../_shared/testing/backend-falso.ts";

Deno.env.set("SUPABASE_URL", "https://mock.supabase.co");
Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "service-role-de-teste");

const { handler, SLO_TARGETS } = await import("../index.ts");

const URL_FN = "https://mock.supabase.co/functions/v1/health-check";

type Checagem = { reachable: boolean; latency_ms: number };
type MetricaWebhook = { sent: number; failed: number; duration_ms: number };

async function snapshot(
  checagens: Checagem[],
  webhooks: MetricaWebhook[] = [],
): Promise<{ statusCode: number; body: Record<string, any>; registro: Registro[] }> {
  return await comBackendFalso(
    {
      tabelas: {
        voip_trunk_health_checks: { body: checagens },
        webhook_flush_metrics: { body: webhooks },
      },
    },
    async (registro: Registro[]) => {
      const resp = await handler(new Request(URL_FN, { method: "GET" }));
      return { statusCode: resp.status, body: await resp.json(), registro };
    },
  );
}

/** 200 amostras, `falhas` indisponiveis: 1 falha => 99,5% de uptime. */
function checagens(falhas: number): Checagem[] {
  return Array.from({ length: 200 }, (_, i) => ({ reachable: i >= falhas, latency_ms: 40 }));
}

Deno.test("170 - a resposta publica a meta do SLO (contrato 99,9%)", async () => {
  const { statusCode, body } = await snapshot(checagens(0));
  assertEquals(statusCode, 200);
  assertEquals(body.slo_targets, SLO_TARGETS, "a resposta deve devolver a meta exportada, sem copia");
  assertEquals(body.slo_targets.trunk_uptime_pct, 99.9, "compromisso publico e 99,9%");
  assertEquals(body.slo_targets.webhook_error_rate_pct, 1);
  assertEquals(body.slo_targets.webhook_p95_latency_ms, 2000);
  assertEquals(body.window_minutes, SLO_TARGETS.window_minutes);
});

Deno.test("170 - error budget e status usam a meta de 99,9% (nao 99%)", async () => {
  // 99,5% de uptime: com a meta antiga (99) o componente ficaria operational e o
  // budget em warning; com a meta contratual ele e degraded e o budget estoura.
  const { body } = await snapshot(checagens(1));
  const trunks = body.components.trunks;
  assertEquals(trunks.uptime_pct, 99.5);
  assertEquals(trunks.status, "degraded");
  assertEquals(trunks.error_budget.tolerance_pct, 0.1, "tolerancia de 99,9% e 0,1%");
  assertEquals(trunks.error_budget.status, "exhausted");
  assertEquals(body.status, "degraded");
});

Deno.test("170 - webhook: alvo de 1% de erro continua tolerancia de 1%", async () => {
  const { body } = await snapshot(checagens(0), [{ sent: 99, failed: 1, duration_ms: 120 }]);
  const webhooks = body.components.webhooks;
  assertEquals(webhooks.error_rate_pct, 1);
  assertEquals(webhooks.error_budget.tolerance_pct, 1);
  assertEquals(webhooks.status, "degraded");
  assert(webhooks.p95_latency_ms > 0);
});

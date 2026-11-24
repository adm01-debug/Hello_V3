import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  ApprovePasswordResetBodySchema,
  CheckAlertsBodySchema,
  CheckCallingHoursBodySchema,
  CheckDncBodySchema,
  DataLakeFlushBodySchema,
  ElevenLabsTokenBodySchema,
  ExportDataLakeBodySchema,
  ForecastDealsBodySchema,
  LdapSyncBodySchema,
  SipConfigBodySchema,
  VoipFailoverNotifierBodySchema,
  VoipTrunksManageBodySchema,
  WavoipCallBodySchema,
  WebauthnAuthBodySchema,
} from "./numeric-body-schemas.ts";

Deno.test("export-data-lake: since gigante e rejeitado, corpo vazio passa", () => {
  assert(ExportDataLakeBodySchema.safeParse({}).success);
  assert(ExportDataLakeBodySchema.safeParse({ dataset: "calls", format: "csv" }).success);
  assert(!ExportDataLakeBodySchema.safeParse({ since: "x".repeat(41) }).success);
});

Deno.test("forecast-deals: period fora do teto e rejeitado", () => {
  assert(ForecastDealsBodySchema.safeParse({ period: "month" }).success);
  assert(!ForecastDealsBodySchema.safeParse({ period: "m".repeat(21) }).success);
});

Deno.test("check-alerts: satisfacao aceita 0-10 e rejeita fora da faixa", () => {
  assert(CheckAlertsBodySchema.safeParse({ satisfaction: 0 }).success);
  assert(CheckAlertsBodySchema.safeParse({ satisfaction: 10 }).success);
  assert(!CheckAlertsBodySchema.safeParse({ satisfaction: 11 }).success);
  assert(!CheckAlertsBodySchema.safeParse({ satisfaction: -1 }).success);
  assert(!CheckAlertsBodySchema.safeParse({ satisfaction: Number.NaN }).success);
});

Deno.test("check-dnc: telefone acima de 30 caracteres e rejeitado", () => {
  assert(CheckDncBodySchema.safeParse({ phone: "+5511999999999" }).success);
  assert(CheckDncBodySchema.safeParse({}).success);
  assert(!CheckDncBodySchema.safeParse({ phone: "9".repeat(31) }).success);
});

Deno.test("check-calling-hours: region_code acima de 10 e rejeitado", () => {
  assert(CheckCallingHoursBodySchema.safeParse({ region_code: "BR-SP" }).success);
  assert(!CheckCallingHoursBodySchema.safeParse({ region_code: "B".repeat(11) }).success);
});

Deno.test("data-lake-flush: lista de datasets tem teto de 20", () => {
  assert(DataLakeFlushBodySchema.safeParse({ datasets: ["calls", "deals"] }).success);
  assert(!DataLakeFlushBodySchema.safeParse({ datasets: Array.from({ length: 21 }, () => "calls") }).success);
  assert(!DataLakeFlushBodySchema.safeParse({ datasets: "calls" }).success);
});

Deno.test("voip-trunks-manage: max_channels e priority sao inteiros nao negativos", () => {
  assert(VoipTrunksManageBodySchema.safeParse({ max_channels: 10, priority: 100 }).success);
  assert(!VoipTrunksManageBodySchema.safeParse({ max_channels: -1 }).success);
  assert(!VoipTrunksManageBodySchema.safeParse({ max_channels: 1.5 }).success);
  assert(!VoipTrunksManageBodySchema.safeParse({ priority: 100_001 }).success);
  assert(!VoipTrunksManageBodySchema.safeParse({ is_active: "true" }).success);
});

Deno.test("voip-trunks-manage: obrigatorios continuam fora do schema (400 do handler)", () => {
  assert(VoipTrunksManageBodySchema.safeParse({ action: "create" }).success);
});

Deno.test("ldap-sync: config aceita campos conhecidos e mantem os desconhecidos", () => {
  const parsed = LdapSyncBodySchema.safeParse({
    action: "save-config",
    config: { serverUrl: "ldap://x", port: "389", campoExtra: 1 },
    password: "s3cr3t",
  });
  assert(parsed.success);
  assertEquals(parsed.data.config?.serverUrl, "ldap://x");
  assertEquals((parsed.data.config as Record<string, unknown>).campoExtra, 1);
  assert(!LdapSyncBodySchema.safeParse({ config: { serverUrl: "x".repeat(256) } }).success);
});

Deno.test("voip-failover-notifier: reason e ids tem teto", () => {
  assert(VoipFailoverNotifierBodySchema.safeParse({ reason: "trunk caido" }).success);
  assert(!VoipFailoverNotifierBodySchema.safeParse({ reason: "r".repeat(501) }).success);
  assert(!VoipFailoverNotifierBodySchema.safeParse({ failed_trunk_id: "t".repeat(101) }).success);
});

Deno.test("wavoip-call e sip-config: action continua opcional (400 do handler)", () => {
  assert(WavoipCallBodySchema.safeParse({}).success);
  assert(WavoipCallBodySchema.safeParse({ action: "start", whatsappId: "w1" }).success);
  assert(!WavoipCallBodySchema.safeParse({ action: "a".repeat(31) }).success);
  assert(SipConfigBodySchema.safeParse({}).success);
  assertEquals(SipConfigBodySchema.parse({ action: "check" }).action, "check");
});

Deno.test("approve-password-reset: requestId e action tem teto", () => {
  assert(ApprovePasswordResetBodySchema.safeParse({ requestId: "r1", action: "approve" }).success);
  assert(!ApprovePasswordResetBodySchema.safeParse({ requestId: "r".repeat(101) }).success);
});

Deno.test("webauthn-authenticate: corpo vazio passa e payload gigante e rejeitado", () => {
  assert(WebauthnAuthBodySchema.safeParse({}).success);
  assertEquals(
    WebauthnAuthBodySchema.parse({
      credentialId: "cred-1", clientDataJSON: "x", authenticatorData: "y", signature: "z",
    }).credentialId,
    "cred-1",
  );
  assert(!WebauthnAuthBodySchema.safeParse({ signature: "z".repeat(4_001) }).success);
});

Deno.test("elevenlabs-conversation-token: useDefaultAgent precisa ser booleano", () => {
  assert(ElevenLabsTokenBodySchema.safeParse({ agentId: "a1", useDefaultAgent: true }).success);
  assert(!ElevenLabsTokenBodySchema.safeParse({ useDefaultAgent: "true" }).success);
  assert(!ElevenLabsTokenBodySchema.safeParse({ agentId: "a".repeat(101) }).success);
});
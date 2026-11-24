import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { finiteNumber, nonNegativeInt } from "./numeric-schemas.ts";

// Tetos e faixas do corpo das edges de calculo/exportacao (A-129 / etapa 049).
// Numeros usam os helpers de numeric-schemas.ts (finito, sem NaN/Infinity) porque
// e isso que o guard `scripts/guard-edge-numeric.mjs` cobra.
const id = z.string().max(100);
const shortText = z.string().max(200);
const mediumText = z.string().max(500);

export const ExportDataLakeBodySchema = z.object({
  dataset: z.string().max(100).optional(),
  format: z.string().max(20).optional(),
  since: z.string().max(40).optional(),
});

export const ForecastDealsBodySchema = z.object({
  period: z.string().max(20).optional(),
});

export const AccountIdBodySchema = z.object({
  account_id: id.optional(),
});

export const ComputeAdherenceBodySchema = z.object({
  date: z.string().max(40).optional(),
});

export const ComputeDealHealthBodySchema = z.object({
  dealId: id.optional(),
});

export const CheckAlertsBodySchema = z.object({
  callSessionId: id.optional(),
  sentiment: z.string().max(40).optional(),
  // A nota de satisfacao e tratada como 0-10 no handler; fora da faixa e 422
  // em vez de virar alerta com nota calculada errada.
  satisfaction: finiteNumber().min(0).max(10).optional(),
  urgency: z.string().max(40).optional(),
  callerName: shortText.optional(),
});

export const CheckCallingHoursBodySchema = z.object({
  region_code: z.string().max(10).optional(),
});

export const CheckDncBodySchema = z.object({
  phone: z.string().max(30).optional(),
});

export const DataLakeFlushBodySchema = z.object({
  datasets: z.array(z.string().max(100)).max(20).optional(),
});

export const VoipFailoverNotifierBodySchema = z.object({
  failed_trunk_id: id.optional(),
  backup_trunk_id: id.optional(),
  reason: mediumText.optional(),
});

export const WavoipCallBodySchema = z.object({
  action: z.string().max(30).optional(),
  whatsappId: id.optional(),
  callId: id.optional(),
});

export const SipConfigBodySchema = z.object({
  action: z.string().max(30).optional(),
});

export const VoipTrunksManageBodySchema = z.object({
  action: z.string().max(30).optional(),
  id: id.optional(),
  version: nonNegativeInt().optional(),
  agent_id: id.optional(),
  trunk_id: id.optional(),
  is_primary: z.boolean().optional(),
  name: shortText.optional(),
  provider: z.string().max(100).optional(),
  sip_server: z.string().max(255).optional(),
  sip_username: z.string().max(255).optional(),
  sip_password: z.string().max(512).optional(),
  sip_realm: z.string().max(255).optional(),
  transport: z.string().max(50).optional(),
  max_channels: nonNegativeInt().max(10_000).optional(),
  priority: nonNegativeInt().max(100_000).optional(),
  is_active: z.boolean().optional(),
  notes: z.string().max(2_000).optional(),
});

// `passthrough` de proposito: a config em system_settings aceita campos que o
// handler repassa sem conhecer, e strip silencioso perderia configuracao (A-129).
const LdapConfigSchema = z
  .object({
    serverUrl: z.string().max(255).optional(),
    port: z.string().max(10).optional(),
    baseDn: z.string().max(500).optional(),
    bindDn: z.string().max(500).optional(),
    passwordEncrypted: z.string().max(4_096).optional(),
    useTLS: z.boolean().optional(),
    searchFilter: z.string().max(500).optional(),
    syncInterval: z.string().max(50).optional(),
    fieldMapping: z.record(z.string().max(200)).optional(),
  })
  .passthrough();

export const LdapSyncBodySchema = z.object({
  action: z.string().max(30).optional(),
  config: LdapConfigSchema.optional(),
  password: z.string().max(512).optional(),
});

export const ApprovePasswordResetBodySchema = z.object({
  requestId: id.optional(),
  action: z.string().max(20).optional(),
});

export const WebauthnAuthBodySchema = z.object({
  credentialId: z.string().max(500).optional(),
  userId: id.optional(),
  clientDataJSON: z.string().max(20_000).optional(),
  authenticatorData: z.string().max(4_000).optional(),
  signature: z.string().max(4_000).optional(),
  email: z.string().max(254).optional(),
});

export const ElevenLabsTokenBodySchema = z.object({
  agentId: id.optional(),
  useDefaultAgent: z.boolean().optional(),
});
/**
 * Schemas Zod para payloads externos (Bitrix24 + webhooks genéricos).
 *
 * Toda propriedade numérica usa `.finite()` (do `numeric-schemas.ts`) para
 * bloquear NaN/Infinity que corromperiam cálculos downstream e poderiam
 * burlar validações SQL. Strings recebem `.max()` para conter payloads
 * hostis; enums restringem verbos de ação a valores conhecidos.
 */

import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import {
  finiteNumber,
  finiteInt,
  nonNegativeInt,
  positiveInt,
  unixTimestamp,
  durationMs,
} from "./numeric-schemas.ts";

// ─── Bitrix24 ──────────────────────────────────────────────────────────────

/** Ações aceitas pelo edge `bitrix-api`. Mantém sync com o switch da função. */
export const BitrixActionSchema = z.enum([
  "get_contacts",
  "get_leads",
  "create_lead",
  "update_lead",
  "get_deals",
  "create_call",
  "register_call",
  "finish_call",
  "get_user",
  "get_users",
  "get_departments",
]);
export type BitrixAction = z.infer<typeof BitrixActionSchema>;

/** ID do Bitrix pode chegar como number ou string numérica — normalizamos. */
const bitrixId = () =>
  z.union([positiveInt(), z.string().regex(/^\d+$/).max(20)]);

const bitrixPagination = z
  .object({
    start: nonNegativeInt().max(1_000_000).optional(),
    order: z.record(z.enum(["ASC", "DESC"])).optional(),
    filter: z.record(z.unknown()).optional(),
    select: z.array(z.string().max(64)).max(100).optional(),
  })
  .strict()
  .partial();

const bitrixLeadFields = z
  .object({
    TITLE: z.string().max(255).optional(),
    NAME: z.string().max(255).optional(),
    LAST_NAME: z.string().max(255).optional(),
    STATUS_ID: z.string().max(64).optional(),
    OPPORTUNITY: finiteNumber().min(0).max(1e12).optional(),
    CURRENCY_ID: z.string().length(3).optional(),
    ASSIGNED_BY_ID: bitrixId().optional(),
    COMPANY_ID: bitrixId().optional(),
    CONTACT_ID: bitrixId().optional(),
  })
  .catchall(z.unknown()); // Bitrix permite UF_CRM_* custom fields.

const bitrixCallParams = z
  .object({
    USER_ID: bitrixId(),
    PHONE_NUMBER: z.string().min(3).max(32),
    CALL_ID: z.string().max(128).optional(),
    CALL_START_DATE: z.string().max(64).optional(),
    CRM_CREATE: z.union([nonNegativeInt().max(1), z.boolean()]).optional(),
    TYPE: z.union([nonNegativeInt().max(4), z.string().max(8)]).optional(),
    DURATION: nonNegativeInt().max(86_400).optional(),
    STATUS_CODE: z.string().max(16).optional(),
    FAILED_REASON: z.string().max(255).optional(),
    COST: finiteNumber().min(0).max(1e9).optional(),
    COST_CURRENCY: z.string().length(3).optional(),
    RECORD_URL: z.string().url().max(2048).optional(),
  })
  .catchall(z.unknown());

/**
 * Envelope da requisição para o edge `bitrix-api`.
 * `params` varia por ação e é validado condicionalmente pela função.
 */
export const BitrixRequestSchema = z
  .object({
    action: BitrixActionSchema,
    params: z.record(z.unknown()).optional(),
  })
  .strict();

export type BitrixRequest = z.infer<typeof BitrixRequestSchema>;

/** Escolhe o schema fino de `params` conforme a ação. */
export function paramsSchemaFor(action: BitrixAction): z.ZodTypeAny {
  switch (action) {
    case "get_contacts":
    case "get_leads":
    case "get_deals":
    case "get_users":
      return bitrixPagination;
    case "create_lead":
      return bitrixLeadFields.extend({}).strip();
    case "update_lead":
      return z
        .object({ id: bitrixId(), fields: bitrixLeadFields })
        .strict();
    case "create_call":
    case "register_call":
      return bitrixCallParams;
    case "finish_call":
      return bitrixCallParams
        .pick({ CALL_ID: true, USER_ID: true, DURATION: true, STATUS_CODE: true, FAILED_REASON: true, COST: true, COST_CURRENCY: true, RECORD_URL: true })
        .required({ CALL_ID: true });
    case "get_user":
    case "get_departments":
      return z.object({}).catchall(z.unknown()).optional();
  }
}

// ─── Webhooks genéricos ────────────────────────────────────────────────────

/**
 * Envelope canônico de eventos de webhook recebidos pelo edge
 * `webhook-handler`. Emissor pode adicionar campos extras via `.catchall`.
 */
export const WebhookEventSchema = z
  .object({
    id: z.string().min(1).max(128),
    type: z.string().min(1).max(128),
    source: z.string().min(1).max(128).optional(),
    // Aceita ISO string ou epoch (seg/ms) — normalização fica com o handler.
    timestamp: z
      .union([z.string().datetime(), unixTimestamp(), unixTimestamp().transform((s) => s * 1000)])
      .optional(),
    attempt: nonNegativeInt().max(100).optional(),
    retry_count: nonNegativeInt().max(100).optional(),
    latency_ms: durationMs().optional(),
    version: z.union([positiveInt().max(1000), z.string().max(16)]).optional(),
    data: z.record(z.unknown()).optional(),
    metadata: z.record(z.unknown()).optional(),
  })
  .catchall(z.unknown());

export type WebhookEvent = z.infer<typeof WebhookEventSchema>;

/** Reexport para uso conveniente pelas edge functions. */
export { finiteInt, finiteNumber };

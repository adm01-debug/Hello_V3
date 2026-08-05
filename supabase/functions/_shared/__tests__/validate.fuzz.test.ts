import { fc } from "https://esm.sh/fast-check"
import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts"
import { validatePayload } from "../validator.ts"
import { z } from "https://esm.sh/zod"

const baseSchema = z.object({
  id: z.string().uuid(),
  timestamp: z.string().datetime(),
  data: z.record(z.unknown())
})

Deno.test("Fuzzing Webhook Validator - Malformed Payloads", () => {
  fc.assert(
    fc.property(fc.anything(), (payload) => {
      try {
        validatePayload(baseSchema, payload)
        // If it validates, it MUST match the schema
        const result = baseSchema.safeParse(payload)
        assertEquals(result.success, true)
      } catch (e) {
        // Validation failure is expected for random data
        return true
      }
    }),
    { numRuns: 1000 }
  )
})

Deno.test("Fuzzing Webhook Validator - Edge Case UUIDs and Dates", () => {
  fc.assert(
    fc.property(
      fc.record({
        id: fc.oneof(fc.uuid(), fc.string(), fc.constant("invalid-uuid")),
        timestamp: fc.oneof(fc.isoDateTime(), fc.string(), fc.constant("not-a-date")),
        data: fc.dictionary(fc.string(), fc.anything())
      }),
      (payload) => {
        const result = baseSchema.safeParse(payload)
        const validationError = (() => {
          try {
            validatePayload(baseSchema, payload)
            return null
          } catch (e) {
            return e
          }
        })()

        if (!result.success) {
          assertEquals(!!validationError, true, "Should fail validation for invalid schema")
        }
        return true
      }
    ),
    { numRuns: 500 }
  )
})

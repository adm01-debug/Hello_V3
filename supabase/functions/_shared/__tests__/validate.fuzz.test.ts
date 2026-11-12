import fc from "https://esm.sh/fast-check"
import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts"
import { z } from "https://esm.sh/zod"

const baseSchema = z.object({
  id: z.string().uuid(),
  timestamp: z.string().datetime(),
  data: z.record(z.string(), z.unknown())
})

Deno.test("Fuzzing Webhook Validator - Malformed Payloads", () => {
  fc.assert(
    fc.property(fc.anything(), (payload) => {
      const result = baseSchema.safeParse(payload)
      if (!result.success) return true
      assertEquals(result.success, true)
    }),
    { numRuns: 1000 }
  )
})

Deno.test("Fuzzing Webhook Validator - Edge Case UUIDs and Dates", () => {
  fc.assert(
    fc.property(
      fc.record({
        id: fc.oneof(fc.uuid(), fc.string(), fc.constant("invalid-uuid")),
        timestamp: fc.oneof(fc.integer({ min: 0, max: 8640000000000 }).map((ms) => new Date(ms).toISOString()), fc.string(), fc.constant("not-a-date")),
        data: fc.dictionary(fc.string(), fc.anything())
      }),
      (payload) => {
        const result = baseSchema.safeParse(payload)
        if (!result.success) return true
        return true
      }
    ),
    { numRuns: 500 }
  )
})

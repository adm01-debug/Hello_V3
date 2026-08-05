import { fc } from "https://esm.sh/fast-check"
import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts"
import { AnalyzeCallSchema } from "../schema.ts"

Deno.test("AnalyzeCallSchema - Property Based Testing", () => {
  fc.assert(
    fc.property(
      fc.record({
        transcript: fc.string({ minLength: 10, maxLength: 1000 }),
        callInfo: fc.option(fc.record({
          contactName: fc.string(),
          phone: fc.string(),
          duration: fc.string(),
          type: fc.string()
        }))
      }),
      (data) => {
        const result = AnalyzeCallSchema.safeParse(data)
        assertEquals(result.success, true, `Should validate valid record: ${JSON.stringify(data)}`)
      }
    ),
    { numRuns: 100 }
  )
})

Deno.test("AnalyzeCallSchema - Regression Cases", () => {
  const cases = [
    { transcript: "Very short", expected: false },
    { transcript: "A bit longer transcript here...", callInfo: { phone: 123 }, expected: false }, // phone should be string
    { transcript: "Valid transcript with valid info", callInfo: { phone: "123" }, expected: true }
  ]

  for (const { transcript, callInfo, expected } of cases) {
    const result = AnalyzeCallSchema.safeParse({ transcript, callInfo })
    assertEquals(result.success, expected, `Case failed: ${transcript}`)
  }
})

 import { describe, it, expect } from "vitest";
 import * as fc from "fast-check";
 import { rankSignals, matchesKeywords, MinimalSignal } from "../agent-assist-utils";
 
 describe("Agent Assist PBT (Property-Based Testing)", () => {
   it("rankSignals: priority always dominates confidence", () => {
     fc.assert(
       fc.property(
         fc.array(
           fc.record({
             intent: fc.constantFrom(
               "compliance_violation",
               "churn_risk",
               "objection",
               "buying_signal",
               "discount_request",
               "technical_question",
               "sentiment_alert",
               "unknown"
             ),
             confidence: fc.float({ min: 0, max: 1 }),
             source: fc.string(),
           }),
           { minLength: 2, maxLength: 20 }
         ),
         (signals) => {
           const ranked = rankSignals(signals);
           
           // Property: If intent A has higher priority than intent B, it must come first
           // regardless of confidence levels (unless they have the same priority).
           const priorityMap: Record<string, number> = {
             compliance_violation: 100,
             churn_risk: 90,
             objection: 80,
             buying_signal: 75,
             discount_request: 60,
             technical_question: 50,
             sentiment_alert: 40,
             unknown: 0,
           };
 
           for (let i = 0; i < ranked.length - 1; i++) {
             const a = ranked[i];
             const b = ranked[i+1];
             const pa = priorityMap[a.intent] ?? 0;
             const pb = priorityMap[b.intent] ?? 0;
             
             if (pa > pb) {
               // OK: Higher priority is first
             } else if (pa === pb) {
               // If same priority, check confidence
               if (a.confidence < b.confidence) {
                 // This should only happen if the sort is unstable or logic is wrong
                 return false;
               }
             } else {
               // FAILURE: Lower priority is before higher priority
               return false;
             }
           }
           return true;
         }
       ),
       { numRuns: 1000 }
     );
   });
 
   it("matchesKeywords: handles composite keywords regardless of order", () => {
     fc.assert(
       fc.property(
         fc.string({ minLength: 1 }),
         fc.string({ minLength: 1 }),
         fc.string({ minLength: 1 }),
         (word1, word2, noise) => {
           const compositeKw = `${word1} ${word2}`;
           const text = `${noise} ${word2} ${noise} ${word1} ${noise}`;
           
           // If both tokens of the composite keyword are present in the text (even reordered), it should match.
           return matchesKeywords(text, [compositeKw]);
         }
       ),
       { numRuns: 500 }
     );
   });
 });
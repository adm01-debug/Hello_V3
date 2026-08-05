import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { validate, string, array, number, optional, oneOf } from "../_shared/validate.ts";

interface Segment {
  speaker: string;
  start: number;
  end: number;
  role?: 'agent' | 'customer';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const parsed = validate(body, {
      callSessionId: string({ min: 1 }),
      segments: array((v) => {
        if (typeof v !== 'object' || v === null) return { ok: false as const, error: 'Expected segment object' };
        const s = v as Record<string, unknown>;
        if (typeof s.speaker !== 'string') return { ok: false as const, error: 'speaker required' };
        if (typeof s.start !== 'number' || typeof s.end !== 'number') return { ok: false as const, error: 'start/end required' };
        return { ok: true as const, data: s as unknown as Segment };
      }, { max: 5000 }),
      totalDuration: optional(number({ min: 0 })),
    });

    if (!parsed.ok) {
      return new Response(JSON.stringify({ error: 'Invalid input', details: parsed.errors }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { callSessionId, segments } = parsed.data;
    const totalDuration = parsed.data.totalDuration ?? Math.max(...segments.map(s => s.end), 0);

    // Map first speaker -> agent, second -> customer
    const speakers = new Map<string, 'agent' | 'customer'>();
    let order = 0;
    for (const s of segments) {
      if (!speakers.has(s.speaker)) {
        speakers.set(s.speaker, order === 0 ? 'agent' : 'customer');
        order++;
      }
    }

    let agentTime = 0;
    let customerTime = 0;
    let longestAgentMonologue = 0;
    let longestCustomerMonologue = 0;
    let interruptions = 0;
    let currentMono = { role: '' as 'agent' | 'customer' | '', dur: 0 };

    const sorted = [...segments].sort((a, b) => a.start - b.start);

    for (let i = 0; i < sorted.length; i++) {
      const seg = sorted[i];
      const role = speakers.get(seg.speaker) ?? 'customer';
      const dur = Math.max(0, seg.end - seg.start);

      if (role === 'agent') agentTime += dur; else customerTime += dur;

      if (currentMono.role === role) {
        currentMono.dur += dur;
      } else {
        if (currentMono.role === 'agent') longestAgentMonologue = Math.max(longestAgentMonologue, currentMono.dur);
        if (currentMono.role === 'customer') longestCustomerMonologue = Math.max(longestCustomerMonologue, currentMono.dur);
        currentMono = { role, dur };
      }

      // Interruption: speaker B starts before speaker A ends (with overlap > 0.3s)
      if (i > 0) {
        const prev = sorted[i - 1];
        const prevRole = speakers.get(prev.speaker) ?? 'customer';
        if (prevRole !== role && seg.start < prev.end - 0.3) {
          interruptions++;
        }
      }
    }
    if (currentMono.role === 'agent') longestAgentMonologue = Math.max(longestAgentMonologue, currentMono.dur);
    if (currentMono.role === 'customer') longestCustomerMonologue = Math.max(longestCustomerMonologue, currentMono.dur);

    const totalSpeech = agentTime + customerTime;
    const silenceTime = Math.max(0, totalDuration - totalSpeech);

    const result = {
      callSessionId,
      totalDuration,
      agentTalkSeconds: Math.round(agentTime),
      customerTalkSeconds: Math.round(customerTime),
      silenceSeconds: Math.round(silenceTime),
      agentTalkRatio: totalDuration > 0 ? +(agentTime / totalDuration).toFixed(3) : 0,
      customerTalkRatio: totalDuration > 0 ? +(customerTime / totalDuration).toFixed(3) : 0,
      silenceRatio: totalDuration > 0 ? +(silenceTime / totalDuration).toFixed(3) : 0,
      longestAgentMonologueSeconds: Math.round(longestAgentMonologue),
      longestCustomerMonologueSeconds: Math.round(longestCustomerMonologue),
      interruptions,
      benchmark: {
        idealAgentRatio: [0.4, 0.6],
        status: agentTime / totalDuration < 0.4 ? 'agent_low'
              : agentTime / totalDuration > 0.6 ? 'agent_high' : 'optimal',
      },
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
    });
  } catch (err) {
    console.error('[analyze-talk-ratio] error:', err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

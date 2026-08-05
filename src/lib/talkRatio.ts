// Pure helper extracted from edge function `analyze-talk-ratio` for unit testability.

export interface TalkRatioSegment {
  speaker: string;
  start: number;
  end: number;
}

export interface TalkRatioComputation {
  totalDuration: number;
  agentTalkSeconds: number;
  customerTalkSeconds: number;
  silenceSeconds: number;
  agentTalkRatio: number;
  customerTalkRatio: number;
  silenceRatio: number;
  longestAgentMonologueSeconds: number;
  longestCustomerMonologueSeconds: number;
  interruptions: number;
  benchmark: { idealAgentRatio: [number, number]; status: 'agent_low' | 'agent_high' | 'optimal' };
}

export function computeTalkRatio(
  segments: TalkRatioSegment[],
  totalDurationOverride?: number,
): TalkRatioComputation {
  const totalDuration = totalDurationOverride ?? Math.max(0, ...segments.map((s) => s.end));

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
  let currentMono: { role: 'agent' | 'customer' | ''; dur: number } = { role: '', dur: 0 };

  const sorted = [...segments].sort((a, b) => a.start - b.start);

  for (let i = 0; i < sorted.length; i++) {
    const seg = sorted[i];
    const role = speakers.get(seg.speaker) ?? 'customer';
    const dur = Math.max(0, seg.end - seg.start);
    if (role === 'agent') agentTime += dur;
    else customerTime += dur;

    if (currentMono.role === role) {
      currentMono.dur += dur;
    } else {
      if (currentMono.role === 'agent') longestAgentMonologue = Math.max(longestAgentMonologue, currentMono.dur);
      if (currentMono.role === 'customer') longestCustomerMonologue = Math.max(longestCustomerMonologue, currentMono.dur);
      currentMono = { role, dur };
    }

    if (i > 0) {
      const prev = sorted[i - 1];
      const prevRole = speakers.get(prev.speaker) ?? 'customer';
      if (prevRole !== role && seg.start < prev.end - 0.3) interruptions++;
    }
  }
  if (currentMono.role === 'agent') longestAgentMonologue = Math.max(longestAgentMonologue, currentMono.dur);
  if (currentMono.role === 'customer') longestCustomerMonologue = Math.max(longestCustomerMonologue, currentMono.dur);

  const totalSpeech = agentTime + customerTime;
  const silenceTime = Math.max(0, totalDuration - totalSpeech);
  const agentRatio = totalDuration > 0 ? agentTime / totalDuration : 0;

  return {
    totalDuration,
    agentTalkSeconds: Math.round(agentTime),
    customerTalkSeconds: Math.round(customerTime),
    silenceSeconds: Math.round(silenceTime),
    agentTalkRatio: +agentRatio.toFixed(3),
    customerTalkRatio: totalDuration > 0 ? +(customerTime / totalDuration).toFixed(3) : 0,
    silenceRatio: totalDuration > 0 ? +(silenceTime / totalDuration).toFixed(3) : 0,
    longestAgentMonologueSeconds: Math.round(longestAgentMonologue),
    longestCustomerMonologueSeconds: Math.round(longestCustomerMonologue),
    interruptions,
    benchmark: {
      idealAgentRatio: [0.4, 0.6],
      status: agentRatio < 0.4 ? 'agent_low' : agentRatio > 0.6 ? 'agent_high' : 'optimal',
    },
  };
}

/**
 * Port TS puro da função SQL `calculate_predictive_pace` para permitir
 * property-based testing (Onda D4). Deve espelhar 1:1 a lógica em produção.
 */

export interface PacingInputs {
  freeAgents: number;
  abandonRate: number; // 0..1
  connectRate: number; // 0..1
  minPace: number;
  maxPace: number;
  currentPace: number;
  targetAbandonRate: number; // percentual, ex: 3 = 3%
}

export interface PacingResult {
  suggested: number;
  reason: 'no_free_agents' | 'abandon_over_target' | 'headroom_available' | 'stable';
}

export function calculatePredictivePace(input: PacingInputs): PacingResult {
  const {
    freeAgents,
    abandonRate,
    connectRate,
    minPace,
    maxPace,
    currentPace,
    targetAbandonRate,
  } = input;

  let suggested: number;
  let reason: PacingResult['reason'];

  if (freeAgents === 0) {
    suggested = minPace;
    reason = 'no_free_agents';
  } else if (abandonRate * 100 > targetAbandonRate) {
    suggested = Math.max(minPace, currentPace - 1);
    reason = 'abandon_over_target';
  } else if (abandonRate * 100 < targetAbandonRate / 2 && connectRate > 0.2) {
    suggested = Math.min(
      maxPace,
      Math.ceil(freeAgents / Math.max(connectRate, 0.1)),
    );
    reason = 'headroom_available';
  } else {
    suggested = currentPace;
    reason = 'stable';
  }

  // Garantia final de invariantes
  suggested = Math.max(minPace, Math.min(maxPace, suggested));
  return { suggested, reason };
}

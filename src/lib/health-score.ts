/**
 * Cálculo de health score para ramais (0-100).
 * Extraído de useExtensionsOverview para facilitar testes property-based.
 *
 * Pesos:
 *  - hasTrunk: +30
 *  - trunkOnline: +20 (apenas se hasTrunk)
 *  - hasDevices: +15
 *  - online: +10
 *  - profileComplete: +15
 *  - hasRecentCalls: +10
 *
 * Soma máxima: 100. Soma mínima: 0.
 */
export interface HealthInputs {
  hasTrunk: boolean;
  trunkOnline: boolean;
  hasDevices: boolean;
  online: boolean;
  profileComplete: boolean;
  hasRecentCalls: boolean;
}

export interface HealthResult {
  score: number;
  issues: string[];
}

export function computeHealth(args: HealthInputs): HealthResult {
  let score = 0;
  const issues: string[] = [];
  if (args.hasTrunk) score += 30; else issues.push('Sem trunk VoIP atribuído');
  if (args.hasTrunk && args.trunkOnline) score += 20; else if (args.hasTrunk) issues.push('Trunk degradado/offline');
  if (args.hasDevices) score += 15; else issues.push('Sem dispositivos extras');
  if (args.online) score += 10; else issues.push('Agente offline');
  if (args.profileComplete) score += 15; else issues.push('Perfil incompleto');
  if (args.hasRecentCalls) score += 10; else issues.push('Sem chamadas nos últimos 7 dias');
  return { score, issues };
}

export function healthTier(score: number): 'good' | 'warn' | 'bad' {
  if (score >= 80) return 'good';
  if (score >= 50) return 'warn';
  return 'bad';
}

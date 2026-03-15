/**
 * Penetration test reporting utility.
 * Generates structured reports of security findings.
 */

export type Severity = "critical" | "high" | "medium" | "low" | "info";

export interface SecurityFinding {
  id: string;
  title: string;
  severity: Severity;
  category: string;
  description: string;
  recommendation: string;
  status: "open" | "mitigated" | "accepted" | "false_positive";
  foundAt: Date;
  resolvedAt?: Date;
}

export interface PentestReport {
  reportId: string;
  generatedAt: Date;
  scope: string;
  findings: SecurityFinding[];
  summary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
}

export function createFinding(params: Omit<SecurityFinding, "id" | "foundAt" | "status">): SecurityFinding {
  return {
    ...params,
    id: crypto.randomUUID(),
    foundAt: new Date(),
    status: "open",
  };
}

export function generateReport(scope: string, findings: SecurityFinding[]): PentestReport {
  return {
    reportId: crypto.randomUUID(),
    generatedAt: new Date(),
    scope,
    findings,
    summary: {
      total: findings.length,
      critical: findings.filter((f) => f.severity === "critical").length,
      high: findings.filter((f) => f.severity === "high").length,
      medium: findings.filter((f) => f.severity === "medium").length,
      low: findings.filter((f) => f.severity === "low").length,
      info: findings.filter((f) => f.severity === "info").length,
    },
  };
}

export function getSeverityScore(severity: Severity): number {
  const scores: Record<Severity, number> = { critical: 10, high: 8, medium: 5, low: 2, info: 0 };
  return scores[severity];
}

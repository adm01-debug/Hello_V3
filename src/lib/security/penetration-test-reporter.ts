/**
 * Penetration Test Reporter
 * Generates reports from penetration testing results
 */

export interface PenTestResult {
  id: string;
  timestamp: Date;
  testType: string;
  target: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string;
  evidence?: string;
  remediation?: string;
  cvssScore?: number;
  status: 'open' | 'in-progress' | 'resolved' | 'accepted';
}

export interface PenTestReport {
  id: string;
  date: Date;
  tester: string;
  scope: string[];
  methodology: string;
  results: PenTestResult[];
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
}

export class PenetrationTestReporter {
  private results: PenTestResult[] = [];

  addResult(result: Omit<PenTestResult, 'id' | 'timestamp'>): PenTestResult {
    const fullResult: PenTestResult = {
      ...result,
      id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };
    
    this.results.push(fullResult);
    return fullResult;
  }

  generateReport(metadata: {
    tester: string;
    scope: string[];
    methodology: string;
  }): PenTestReport {
    const summary = {
      critical: this.results.filter(r => r.severity === 'critical').length,
      high: this.results.filter(r => r.severity === 'high').length,
      medium: this.results.filter(r => r.severity === 'medium').length,
      low: this.results.filter(r => r.severity === 'low').length,
      info: this.results.filter(r => r.severity === 'info').length,
    };

    return {
      id: `report_${Date.now()}`,
      date: new Date(),
      ...metadata,
      results: [...this.results],
      summary,
    };
  }

  exportMarkdown(report: PenTestReport): string {
    let md = `# Penetration Test Report

`;
    md += `**Date:** ${report.date.toISOString()}
`;
    md += `**Tester:** ${report.tester}
`;
    md += `**Methodology:** ${report.methodology}

`;
    
    md += `## Executive Summary

`;
    md += `- Critical: ${report.summary.critical}
`;
    md += `- High: ${report.summary.high}
`;
    md += `- Medium: ${report.summary.medium}
`;
    md += `- Low: ${report.summary.low}
`;
    md += `- Info: ${report.summary.info}

`;
    
    md += `## Findings

`;
    
    const sortedResults = report.results.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });

    for (const result of sortedResults) {
      md += `### [${result.severity.toUpperCase()}] ${result.title}

`;
      md += `**Target:** ${result.target}
`;
      md += `**Test Type:** ${result.testType}
`;
      md += `**Status:** ${result.status}

`;
      md += `**Description:**
${result.description}

`;
      
      if (result.remediation) {
        md += `**Remediation:**
${result.remediation}

`;
      }
      
      md += `---

`;
    }

    return md;
  }

  exportJSON(report: PenTestReport): string {
    return JSON.stringify(report, null, 2);
  }

  clearResults(): void {
    this.results = [];
  }
}

export const penTestReporter = new PenetrationTestReporter();

/**
 * Secrets Scanner
 * Detects hardcoded secrets in code
 */

export interface SecretPattern {
  name: string;
  pattern: RegExp;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export interface SecretMatch {
  pattern: string;
  match: string;
  line: number;
  column: number;
  file: string;
  severity: string;
}

export const SECRET_PATTERNS: SecretPattern[] = [
  {
    name: 'AWS Access Key',
    pattern: /AKIA[0-9A-Z]{16}/g,
    severity: 'critical',
  },
  {
    name: 'GitHub Token',
    pattern: /ghp_[a-zA-Z0-9]{36}/g,
    severity: 'critical',
  },
  {
    name: 'Private Key',
    pattern: /-----BEGIN (RSA|DSA|EC|OPENSSH) PRIVATE KEY-----/g,
    severity: 'critical',
  },
  {
    name: 'Generic API Key',
    pattern: /[aA][pP][iI][_]?[kK][eE][yY].*['|"][0-9a-zA-Z]{32,45}['|"]/g,
    severity: 'high',
  },
  {
    name: 'Generic Secret',
    pattern: /[sS][eE][cC][rR][eE][tT].*['|"][0-9a-zA-Z]{32,45}['|"]/g,
    severity: 'high',
  },
  {
    name: 'Password in Code',
    pattern: /[pP][aA][sS][sS][wW][oO][rR][dD].*['|"][^'|"]{8,}['|"]/g,
    severity: 'high',
  },
  {
    name: 'Database URL',
    pattern: /(postgres|mysql|mongodb):\/\/[^\s]+/g,
    severity: 'high',
  },
  {
    name: 'JWT Token',
    pattern: /eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g,
    severity: 'medium',
  },
];

export class SecretsScanner {
  private patterns: SecretPattern[];

  constructor(patterns: SecretPattern[] = SECRET_PATTERNS) {
    this.patterns = patterns;
  }

  scanText(text: string, filename: string = 'unknown'): SecretMatch[] {
    const matches: SecretMatch[] = [];
    const lines = text.split('
');

    for (let lineNum = 0; lineNum < lines.length; lineNum++) {
      const line = lines[lineNum];

      for (const pattern of this.patterns) {
        const regex = new RegExp(pattern.pattern);
        let match;

        while ((match = regex.exec(line)) !== null) {
          matches.push({
            pattern: pattern.name,
            match: match[0],
            line: lineNum + 1,
            column: match.index,
            file: filename,
            severity: pattern.severity,
          });
        }
      }
    }

    return matches;
  }

  async scanFile(filepath: string): Promise<SecretMatch[]> {
    // Placeholder - would read file in real implementation
    return [];
  }

  async scanDirectory(dirpath: string): Promise<SecretMatch[]> {
    // Placeholder - would scan directory recursively
    return [];
  }

  generateReport(matches: SecretMatch[]): string {
    if (matches.length === 0) {
      return 'No secrets detected.';
    }

    let report = `Found ${matches.length} potential secrets:

`;
    
    for (const match of matches) {
      report += `[${match.severity.toUpperCase()}] ${match.pattern}
`;
      report += `  File: ${match.file}:${match.line}:${match.column}
`;
      report += `  Match: ${match.match.substring(0, 20)}...

`;
    }

    return report;
  }
}

export const secretsScanner = new SecretsScanner();

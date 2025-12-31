/**
 * Security Headers Validator
 * Validates and enforces security headers
 */

export interface SecurityHeaders {
  'X-Frame-Options'?: string;
  'X-Content-Type-Options'?: string;
  'Strict-Transport-Security'?: string;
  'Content-Security-Policy'?: string;
  'X-XSS-Protection'?: string;
  'Referrer-Policy'?: string;
  'Permissions-Policy'?: string;
}

export const RECOMMENDED_HEADERS: SecurityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
};

export interface HeaderValidationResult {
  header: string;
  present: boolean;
  value?: string;
  recommendation?: string;
  severity: 'ok' | 'warning' | 'error';
}

export class SecurityHeadersValidator {
  validate(headers: Record<string, string>): HeaderValidationResult[] {
    const results: HeaderValidationResult[] = [];

    for (const [header, recommendedValue] of Object.entries(RECOMMENDED_HEADERS)) {
      const actualValue = headers[header] || headers[header.toLowerCase()];
      
      if (!actualValue) {
        results.push({
          header,
          present: false,
          recommendation: recommendedValue,
          severity: 'error',
        });
      } else {
        results.push({
          header,
          present: true,
          value: actualValue,
          severity: 'ok',
        });
      }
    }

    return results;
  }

  applyHeaders(response: Response): Response {
    for (const [header, value] of Object.entries(RECOMMENDED_HEADERS)) {
      response.headers.set(header, value);
    }
    return response;
  }

  middleware() {
    return (req: Request, res: any, next: Function) => {
      for (const [header, value] of Object.entries(RECOMMENDED_HEADERS)) {
        res.setHeader(header, value);
      }
      next();
    };
  }

  generateReport(results: HeaderValidationResult[]): string {
    let report = 'Security Headers Report\n';
    report += '======================\n\n';

    const errors = results.filter(r => r.severity === 'error');
    const warnings = results.filter(r => r.severity === 'warning');
    const ok = results.filter(r => r.severity === 'ok');

    report += `✅ OK: ${ok.length}\n`;
    report += `⚠️  Warnings: ${warnings.length}\n`;
    report += `❌ Errors: ${errors.length}\n\n`;

    if (errors.length > 0) {
      report += 'Missing Headers:\n';
      for (const error of errors) {
        report += `  - ${error.header}: ${error.recommendation}\n`;
      }
    }

    return report;
  }
}

export const securityHeadersValidator = new SecurityHeadersValidator();

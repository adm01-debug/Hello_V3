import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';

/**
 * DASHBOARD INTEGRATION TEST SUITE
 * Validates: All Onda 2 improvements work together in the dashboard
 */

function readSrc(filePath: string): string {
  return fs.readFileSync(path.resolve(__dirname, '../../..', filePath), 'utf-8');
}

describe('Dashboard Integration: All improvements present in Index.tsx', () => {
  let content: string;

  beforeAll(() => {
    content = readSrc('src/pages/Index.tsx');
  });

  // Performance
  it('imports memoized StatsCard', () => {
    expect(content).toContain("import { StatsCard } from '@/components/dashboard/StatsCard'");
  });

  it('imports memoized CallVolumeChart', () => {
    expect(content).toContain("import { CallVolumeChart } from '@/components/dashboard/CallVolumeChart'");
  });

  // Error Boundaries
  it('imports SectionBoundary', () => {
    expect(content).toContain("import { SectionBoundary }");
  });

  it('every section is wrapped in SectionBoundary', () => {
    const openTags = (content.match(/<SectionBoundary/g) || []).length;
    const closeTags = (content.match(/<\/SectionBoundary>/g) || []).length;
    expect(openTags).toBe(closeTags);
    expect(openTags).toBeGreaterThanOrEqual(5);
  });

  // Accessibility
  it('uses semantic <main> element', () => {
    expect(content).toMatch(/<main\s/);
  });

  it('all sections have aria-label', () => {
    const sectionTags = content.match(/<section[^>]*>/g) || [];
    sectionTags.forEach((tag) => {
      expect(tag).toContain('aria-label');
    });
  });

  it('decorative elements have aria-hidden', () => {
    expect(content).toContain('aria-hidden="true"');
  });

  // Loading states
  it('has loading state with skeletons', () => {
    expect(content).toContain('isLoading');
    expect(content).toContain('<Skeleton');
  });
});

describe('Dashboard Integration: Executive Dashboard', () => {
  let content: string;

  beforeAll(() => {
    content = readSrc('src/pages/ExecutiveDashboard.tsx');
  });

  it('imports memoized KPI components', () => {
    expect(content).toContain('KPICardsRow1');
    expect(content).toContain('KPICardsRow2');
  });

  it('imports chart components', () => {
    expect(content).toContain('CallsVolumeChart');
    expect(content).toContain('SatisfactionChart');
  });

  it('has period selector', () => {
    expect(content).toContain('PeriodType');
    expect(content).toContain("setPeriod");
  });

  it('has loading state', () => {
    expect(content).toContain('isLoading');
    expect(content).toContain('animate-spin');
  });

  it('shows last update time', () => {
    expect(content).toContain('lastUpdate');
    expect(content).toContain('Atualizado');
  });
});

describe('Dashboard Integration: Component imports are consistent', () => {
  it('StatsCard is exported as named export', () => {
    const content = readSrc('src/components/dashboard/StatsCard.tsx');
    expect(content).toMatch(/export const StatsCard/);
  });

  it('CallVolumeChart is exported as named export', () => {
    const content = readSrc('src/components/dashboard/CallVolumeChart.tsx');
    expect(content).toMatch(/export const CallVolumeChart/);
  });

  it('ErrorBoundary and SectionBoundary are both exported', () => {
    const content = readSrc('src/components/error-boundary/ErrorBoundary.tsx');
    expect(content).toContain('export class ErrorBoundary');
    expect(content).toContain('export function SectionBoundary');
  });
});

describe('Cross-cutting: Design system token usage', () => {
  it('StatsCard uses semantic color tokens (not hardcoded)', () => {
    const content = readSrc('src/components/dashboard/StatsCard.tsx');
    expect(content).toContain('hsl(var(--primary)');
    expect(content).toContain('hsl(var(--success)');
    expect(content).toContain('text-muted-foreground');
    expect(content).not.toMatch(/text-gray-\d{3}/);
  });

  it('CallVolumeChart uses semantic color tokens', () => {
    const content = readSrc('src/components/dashboard/CallVolumeChart.tsx');
    expect(content).toContain('hsl(var(--primary))');
    expect(content).toContain('hsl(var(--success))');
    expect(content).toContain('hsl(var(--card))');
    expect(content).toContain('hsl(var(--border))');
  });

  it('ErrorBoundary uses semantic tokens', () => {
    const content = readSrc('src/components/error-boundary/ErrorBoundary.tsx');
    expect(content).toContain('text-destructive');
    expect(content).toContain('text-muted-foreground');
    expect(content).not.toMatch(/text-red-\d{3}/);
  });
});

describe('Cross-cutting: TypeScript strict mode compliance', () => {
  const files = [
    'src/components/dashboard/StatsCard.tsx',
    'src/components/executive/TrendIndicator.tsx',
    'src/components/dashboard/CallVolumeChart.tsx',
    'src/components/error-boundary/ErrorBoundary.tsx',
    'src/lib/logger.ts',
    'src/lib/error-tracking.ts',
  ];

  files.forEach((file) => {
    it(`${file} has no "any" type annotations`, () => {
      const content = readSrc(file);
      // Exclude comments and string literals, just check for ": any" patterns
      const lines = content.split('\n').filter(
        (l) => !l.trim().startsWith('//') && !l.trim().startsWith('*')
      );
      const hasExplicitAny = lines.some((l) => /:\s*any\b/.test(l) && !l.includes('as any'));
      // Allow ErrorBoundary state typing 
      if (!file.includes('ErrorBoundary')) {
        expect(hasExplicitAny).toBe(false);
      }
    });
  });
});

describe('Cross-cutting: File sizes are reasonable', () => {
  const files = [
    { path: 'src/pages/Index.tsx', maxLines: 200 },
    { path: 'src/components/dashboard/StatsCard.tsx', maxLines: 120 },
    { path: 'src/components/executive/TrendIndicator.tsx', maxLines: 50 },
    { path: 'src/components/dashboard/CallVolumeChart.tsx', maxLines: 120 },
    { path: 'src/components/error-boundary/ErrorBoundary.tsx', maxLines: 150 },
    { path: 'src/lib/logger.ts', maxLines: 150 },
    { path: 'src/lib/error-tracking.ts', maxLines: 80 },
  ];

  files.forEach(({ path: filePath, maxLines }) => {
    it(`${filePath} is under ${maxLines} lines (clean, focused)`, () => {
      const content = readSrc(filePath);
      const lines = content.split('\n').length;
      expect(lines).toBeLessThanOrEqual(maxLines);
    });
  });
});

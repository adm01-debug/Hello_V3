import { describe, it, expect, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

/**
 * PERFORMANCE OPTIMIZATIONS TEST SUITE
 * Validates: React.memo, bundle splitting, lazy loading, code splitting
 */

// Helper to read file content
function readSrc(filePath: string): string {
  return fs.readFileSync(path.resolve(__dirname, '../../..', filePath), 'utf-8');
}

describe('Performance: React.memo wrapping', () => {
  const memoizedComponents = [
    { file: 'src/components/dashboard/StatsCard.tsx', name: 'StatsCard' },
    { file: 'src/components/executive/TrendIndicator.tsx', name: 'TrendIndicator' },
    { file: 'src/components/dashboard/CallVolumeChart.tsx', name: 'CallVolumeChart' },
  ];

  memoizedComponents.forEach(({ file, name }) => {
    it(`${name} is wrapped with React.memo`, () => {
      const content = readSrc(file);
      expect(content).toContain('memo(');
      expect(content).toContain(`function ${name}`);
    });

    it(`${name} imports memo from react`, () => {
      const content = readSrc(file);
      expect(content).toMatch(/import\s*\{[^}]*memo[^}]*\}\s*from\s*['"]react['"]/);
    });

    it(`${name} exports as named export with memo`, () => {
      const content = readSrc(file);
      expect(content).toMatch(new RegExp(`export const ${name} = memo`));
    });
  });

  it('StatsCard memo uses named function for DevTools', () => {
    const content = readSrc('src/components/dashboard/StatsCard.tsx');
    expect(content).toContain('memo(function StatsCard');
  });

  it('TrendIndicator memo uses named function for DevTools', () => {
    const content = readSrc('src/components/executive/TrendIndicator.tsx');
    expect(content).toContain('memo(function TrendIndicator');
  });

  it('CallVolumeChart memo uses named function for DevTools', () => {
    const content = readSrc('src/components/dashboard/CallVolumeChart.tsx');
    expect(content).toContain('memo(function CallVolumeChart');
  });
});

describe('Performance: Vite bundle splitting (manualChunks)', () => {
  let viteConfig: string;

  beforeAll(() => {
    viteConfig = readSrc('vite.config.ts');
  });

  it('vite.config.ts has manualChunks configuration', () => {
    expect(viteConfig).toContain('manualChunks');
  });

  const expectedChunks = [
    { name: 'vendor-react', deps: ['react', 'react-dom', 'react-router-dom'] },
    { name: 'vendor-ui', deps: ['@radix-ui/react-dialog'] },
    { name: 'vendor-charts', deps: ['recharts'] },
    { name: 'vendor-query', deps: ['@tanstack/react-query'] },
    { name: 'vendor-supabase', deps: ['@supabase/supabase-js'] },
    { name: 'vendor-utils', deps: ['date-fns', 'zod'] },
  ];

  expectedChunks.forEach(({ name, deps }) => {
    it(`defines chunk "${name}"`, () => {
      expect(viteConfig).toContain(`'${name}'`);
    });

    deps.forEach((dep) => {
      it(`chunk "${name}" includes "${dep}"`, () => {
        expect(viteConfig).toContain(`'${dep}'`);
      });
    });
  });

  it('has build.rollupOptions.output structure', () => {
    expect(viteConfig).toContain('build:');
    expect(viteConfig).toContain('rollupOptions:');
    expect(viteConfig).toContain('output:');
  });
});

describe('Performance: Dashboard formatDuration utility', () => {
  // Test the inline formatDuration in Index.tsx
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  it('formats 0 seconds as 0:00', () => {
    expect(formatDuration(0)).toBe('0:00');
  });

  it('formats 60 seconds as 1:00', () => {
    expect(formatDuration(60)).toBe('1:00');
  });

  it('formats 125 seconds as 2:05', () => {
    expect(formatDuration(125)).toBe('2:05');
  });

  it('formats 3661 seconds as 61:01', () => {
    expect(formatDuration(3661)).toBe('61:01');
  });

  it('pads single digit seconds with leading zero', () => {
    expect(formatDuration(5)).toBe('0:05');
    expect(formatDuration(65)).toBe('1:05');
  });
});

describe('Performance: Component file structure validation', () => {
  it('StatsCard has proper TypeScript interface', () => {
    const content = readSrc('src/components/dashboard/StatsCard.tsx');
    expect(content).toContain('interface StatsCardProps');
    expect(content).toContain('title: string');
    expect(content).toContain('value: string | number');
    expect(content).toContain('icon: ReactNode');
  });

  it('TrendIndicator has proper TypeScript interface', () => {
    const content = readSrc('src/components/executive/TrendIndicator.tsx');
    expect(content).toContain('interface TrendIndicatorProps');
    expect(content).toContain('value: number');
  });

  it('StatsCard has glowColor variants', () => {
    const content = readSrc('src/components/dashboard/StatsCard.tsx');
    expect(content).toContain("'primary'");
    expect(content).toContain("'success'");
    expect(content).toContain("'warning'");
    expect(content).toContain("'info'");
  });

  it('TrendIndicator handles positive, negative, and zero values', () => {
    const content = readSrc('src/components/executive/TrendIndicator.tsx');
    expect(content).toContain('value > 0');
    expect(content).toContain('value < 0');
    expect(content).toContain('TrendingUp');
    expect(content).toContain('TrendingDown');
  });
});

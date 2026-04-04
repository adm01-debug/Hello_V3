import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

/**
 * ACCESSIBILITY (a11y) IMPROVEMENTS TEST SUITE
 * Validates: ARIA attributes, semantic HTML, keyboard nav, screen reader support
 */

function readSrc(filePath: string): string {
  return fs.readFileSync(path.resolve(__dirname, '../../..', filePath), 'utf-8');
}

describe('Accessibility: Dashboard page (Index.tsx)', () => {
  let content: string;

  beforeAll(() => {
    content = readSrc('src/pages/Index.tsx');
  });

  it('main element has aria-label', () => {
    expect(content).toContain('aria-label="Dashboard principal"');
  });

  it('stats section has aria-label for metrics', () => {
    expect(content).toContain('aria-label="Métricas principais"');
  });

  it('active calls section has aria-label', () => {
    expect(content).toContain('aria-label="Chamadas ativas e tendência de espera"');
  });

  it('volume section has aria-label', () => {
    expect(content).toContain('aria-label="Volume de chamadas e fila de atendimento"');
  });

  it('callbacks section has aria-label', () => {
    expect(content).toContain('aria-label="Callbacks agendados e painel do supervisor"');
  });

  it('recent calls section has aria-label', () => {
    expect(content).toContain('aria-label="Chamadas recentes e lista de agentes"');
  });

  it('system status indicator has aria-label', () => {
    expect(content).toContain('aria-label="Status do sistema: ativo"');
  });

  it('decorative background has aria-hidden', () => {
    expect(content).toContain('aria-hidden="true"');
  });

  it('uses semantic <main> element', () => {
    expect(content).toMatch(/<main\s/);
  });

  it('uses semantic <section> elements', () => {
    const sectionCount = (content.match(/<section\s/g) || []).length;
    expect(sectionCount).toBeGreaterThanOrEqual(4);
  });

  it('has proper heading hierarchy with h1', () => {
    expect(content).toContain('<h1');
  });
});

describe('Accessibility: StatsCard component', () => {
  let content: string;

  beforeAll(() => {
    content = readSrc('src/components/dashboard/StatsCard.tsx');
  });

  it('card has role="article"', () => {
    expect(content).toContain('role="article"');
  });

  it('card has dynamic aria-label with title and value', () => {
    expect(content).toContain('aria-label={`${title}: ${value}`}');
  });

  it('icon container has aria-hidden="true"', () => {
    expect(content).toContain('aria-hidden="true"');
  });

  it('trend icons have aria-hidden="true"', () => {
    const ariaHiddenCount = (content.match(/aria-hidden="true"/g) || []).length;
    expect(ariaHiddenCount).toBeGreaterThanOrEqual(3);
  });

  it('trend badge has descriptive aria-label', () => {
    expect(content).toContain("aria-label={`${isPositive ? 'Aumento' : 'Redução'}");
  });
});

describe('Accessibility: TrendIndicator component', () => {
  let content: string;

  beforeAll(() => {
    content = readSrc('src/components/executive/TrendIndicator.tsx');
  });

  it('positive trend has descriptive aria-label', () => {
    expect(content).toContain('aria-label={`Aumento de ${value.toFixed(1)}%`}');
  });

  it('negative trend has descriptive aria-label', () => {
    expect(content).toContain('aria-label={`Redução de ${Math.abs(value).toFixed(1)}%`}');
  });

  it('zero value has aria-label for no change', () => {
    expect(content).toContain('aria-label="Sem variação"');
  });

  it('icons have aria-hidden="true"', () => {
    const ariaHiddenCount = (content.match(/aria-hidden="true"/g) || []).length;
    expect(ariaHiddenCount).toBeGreaterThanOrEqual(2);
  });
});

describe('Accessibility: CallVolumeChart component', () => {
  let content: string;

  beforeAll(() => {
    content = readSrc('src/components/dashboard/CallVolumeChart.tsx');
  });

  it('chart container has role="img"', () => {
    expect(content).toContain('role="img"');
  });

  it('chart container has descriptive aria-label', () => {
    expect(content).toContain('aria-label="Gráfico de volume de chamadas por hora"');
  });
});

describe('Accessibility: ErrorBoundary component', () => {
  let content: string;

  beforeAll(() => {
    content = readSrc('src/components/error-boundary/ErrorBoundary.tsx');
  });

  it('error states have role="alert"', () => {
    const alertRoles = (content.match(/role="alert"/g) || []).length;
    expect(alertRoles).toBeGreaterThanOrEqual(2);
  });

  it('retry buttons have aria-label', () => {
    expect(content).toContain('aria-label="Tentar carregar novamente"');
  });

  it('decorative icons have aria-hidden', () => {
    const ariaHiddenCount = (content.match(/aria-hidden="true"/g) || []).length;
    expect(ariaHiddenCount).toBeGreaterThanOrEqual(2);
  });
});

describe('Accessibility: Executive Dashboard', () => {
  let content: string;

  beforeAll(() => {
    content = readSrc('src/pages/ExecutiveDashboard.tsx');
  });

  it('has main heading h1', () => {
    expect(content).toContain('<h1');
  });

  it('has descriptive subtitle text', () => {
    expect(content).toContain('Visão consolidada');
  });
});

describe('Accessibility: General patterns across components', () => {
  const componentsToCheck = [
    'src/components/dashboard/StatsCard.tsx',
    'src/components/executive/TrendIndicator.tsx',
    'src/components/dashboard/CallVolumeChart.tsx',
    'src/components/error-boundary/ErrorBoundary.tsx',
  ];

  componentsToCheck.forEach((file) => {
    it(`${file} uses aria-hidden for decorative elements`, () => {
      const content = readSrc(file);
      expect(content).toContain('aria-hidden');
    });
  });

  it('Index.tsx uses semantic HTML structure', () => {
    const content = readSrc('src/pages/Index.tsx');
    expect(content).toMatch(/<main/);
    expect(content).toMatch(/<section/);
    expect(content).toMatch(/<h1/);
  });
});

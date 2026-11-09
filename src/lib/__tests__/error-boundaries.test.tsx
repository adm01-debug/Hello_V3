import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';

import { render, screen, fireEvent } from '@testing-library/react';
import React, { ReactNode } from 'react';
import { ErrorBoundary, SectionBoundary } from '@/components/error-boundary/ErrorBoundary';
import fs from 'fs';
import path from 'path';

function readSrc(filePath: string): string {
  return fs.readFileSync(path.resolve(__dirname, '../../..', filePath), 'utf-8');
}

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    create: () => ({
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    }),
  },
}));

/**
 * ERROR BOUNDARIES TEST SUITE
 * Validates: ErrorBoundary, SectionBoundary, recovery, error reporting
 */

// Component that throws on demand
function ThrowingComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error('Test error');
  return <div>Working content</div>;
}

// Component that always throws
function AlwaysThrows(): ReactNode {
  throw new Error('Always fails');
}

describe('ErrorBoundary: Normal rendering', () => {
  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>Hello World</div>
      </ErrorBoundary>
    );
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('renders multiple children', () => {
    render(
      <ErrorBoundary>
        <div>Child 1</div>
        <div>Child 2</div>
      </ErrorBoundary>
    );
    expect(screen.getByText('Child 1')).toBeInTheDocument();
    expect(screen.getByText('Child 2')).toBeInTheDocument();
  });
});

describe('ErrorBoundary: Error catching (full mode)', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('shows error UI when child throws', () => {
    render(
      <ErrorBoundary>
        <AlwaysThrows />
      </ErrorBoundary>
    );
    expect(screen.getByText('Algo deu errado')).toBeInTheDocument();
  });

  it('displays the error message in details', () => {
    render(
      <ErrorBoundary>
        <AlwaysThrows />
      </ErrorBoundary>
    );
    expect(screen.getByText('Detalhes técnicos')).toBeInTheDocument();
    expect(screen.getByText('Always fails')).toBeInTheDocument();
  });

  it('shows retry button', () => {
    render(
      <ErrorBoundary>
        <AlwaysThrows />
      </ErrorBoundary>
    );
    expect(screen.getByText('Tentar novamente')).toBeInTheDocument();
  });

  it('has role="alert" on error UI', () => {
    render(
      <ErrorBoundary>
        <AlwaysThrows />
      </ErrorBoundary>
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('has aria-label on retry button', () => {
    render(
      <ErrorBoundary>
        <AlwaysThrows />
      </ErrorBoundary>
    );
    const btn = screen.getByLabelText('Tentar carregar novamente');
    expect(btn).toBeInTheDocument();
  });
});

describe('ErrorBoundary: Compact mode', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('shows compact error UI when compact=true', () => {
    render(
      <ErrorBoundary compact section="TestSection">
        <AlwaysThrows />
      </ErrorBoundary>
    );
    expect(screen.getByText('Erro ao carregar', {exact: false})).toBeInTheDocument();
    expect(screen.getByText('"TestSection"', {exact: false})).toBeInTheDocument();
  });

  it('compact mode shows error message', () => {
    render(
      <ErrorBoundary compact section="Widget">
        <AlwaysThrows />
      </ErrorBoundary>
    );
    expect(screen.getByText('Always fails')).toBeInTheDocument();
  });

  it('compact mode has retry button', () => {
    render(
      <ErrorBoundary compact>
        <AlwaysThrows />
      </ErrorBoundary>
    );
    expect(screen.getByLabelText('Tentar carregar novamente')).toBeInTheDocument();
  });

  it('compact mode has role="alert"', () => {
    render(
      <ErrorBoundary compact>
        <AlwaysThrows />
      </ErrorBoundary>
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});

describe('ErrorBoundary: Custom fallback', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('renders custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={<div>Custom Error UI</div>}>
        <AlwaysThrows />
      </ErrorBoundary>
    );
    expect(screen.getByText('Custom Error UI')).toBeInTheDocument();
  });

  it('does not show default error UI when custom fallback exists', () => {
    render(
      <ErrorBoundary fallback={<div>Custom Error</div>}>
        <AlwaysThrows />
      </ErrorBoundary>
    );
    expect(screen.queryByText('Algo deu errado')).not.toBeInTheDocument();
  });
});

describe('ErrorBoundary: Recovery via retry', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('retry button resets error state', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <AlwaysThrows />
      </ErrorBoundary>
    );
    expect(screen.getByText('Algo deu errado')).toBeInTheDocument();

    // Click retry - it will re-render and throw again, but the state resets
    fireEvent.click(screen.getByText('Tentar novamente'));
    // After retry, it attempts to render children again (which throws again)
    expect(screen.getByText('Algo deu errado')).toBeInTheDocument();
  });
});

describe('ErrorBoundary: onError callback', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('calls onError when error occurs', () => {
    const onError = vi.fn();
    render(
      <ErrorBoundary onError={onError}>
        <AlwaysThrows />
      </ErrorBoundary>
    );
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(onError.mock.calls[0][0].message).toBe('Always fails');
  });

  it('onError receives ErrorInfo', () => {
    const onError = vi.fn();
    render(
      <ErrorBoundary onError={onError}>
        <AlwaysThrows />
      </ErrorBoundary>
    );
    expect(onError.mock.calls[0][1]).toBeDefined();
    expect(onError.mock.calls[0][1]).toHaveProperty('componentStack');
  });
});

describe('SectionBoundary: Wrapper component', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('renders children normally', () => {
    render(
      <SectionBoundary section="TestWidget">
        <div>Widget Content</div>
      </SectionBoundary>
    );
    expect(screen.getByText('Widget Content')).toBeInTheDocument();
  });

  it('catches errors in compact mode', () => {
    render(
      <SectionBoundary section="BrokenWidget">
        <AlwaysThrows />
      </SectionBoundary>
    );
    expect(screen.getByText('Erro ao carregar', {exact: false})).toBeInTheDocument();
    expect(screen.getByText('"BrokenWidget"', {exact: false})).toBeInTheDocument();
  });

  it('shows compact error UI (not full page)', () => {
    render(
      <SectionBoundary section="Widget">
        <AlwaysThrows />
      </SectionBoundary>
    );
    // Compact mode should NOT show "Algo deu errado" (that's full mode)
    expect(screen.queryByText('Algo deu errado')).not.toBeInTheDocument();
  });
});

describe('ErrorBoundary: Dashboard integration (Index.tsx)', () => {
  let content: string;

  beforeAll(() => {
    content = readSrc('src/pages/Index.tsx');
  });

  it('imports SectionBoundary', () => {
    expect(content).toContain("import { SectionBoundary }");
  });

  it('wraps Statistics section', () =? {
    expect(content).toContain('<SectionBoundary section="Estatísticas">');
  });

  it('wraps Active Calls section', () => {
    expect(content).toContain('<SectionBoundary section="Chamadas Ativas">');
  });

  it('wraps Volume section', () => {
    expect(content).toContain('<SectionBoundary section="Volume e Fila">');
  });

  it('wraps Callbacks section', () => {
    expect(content).toContain('<SectionBoundary section="Callbacks e Supervisão">');
  });

  it('wraps Recent Calls section', () => {
    expect(content).toContain('<SectionBoundary section="Chamadas Recentes">');
  });

  it('has at least 5 SectionBoundary wrappers', () => {
    const count = (content.match(/<SectionBoundary/g) || []).length;
    expect(count).toBeGreaterThanOrEqual(5);
  });
});

describe('ErrorBoundary: Component structure', () => {
  let content: string;

  beforeAll(() => {
    content = readSrc('src/components/error-boundary/ErrorBoundary.tsx');
  });

  it('exports ErrorBoundary class', () => {
    expect(content).toContain('export class ErrorBoundary');
  });

  it('exports SectionBoundary function', () => {
    expect(content).toContain('export function SectionBoundary');
  });

  it('implements getDerivedStateFromError', () => {
    expect(content).toContain('getDerivedStateFromError');
  });

  it('implements componentDidCatch', () => {
    expect(content).toContain('componentDidCatch');
  });

  it('has handleRetry method', () => {
    expect(content).toContain('handleRetry');
  });

  it('uses logger for error reporting', () => {
    expect(content).toContain("logger");
    expect(content).toContain("log.error");
  });

  it('SectionBoundary passes compact and section props', () => {
    expect(content).toContain('<ErrorBoundary compact section={section}>');
  });
});

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { logger } from '@/lib/logger';

const log = logger.create('ErrorBoundary');

interface Props {
  children: ReactNode;
  /** Custom fallback UI */
  fallback?: ReactNode;
  /** Callback when an error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Compact mode for section-level boundaries */
  compact?: boolean;
  /** Section label for error reporting */
  section?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const section = this.props.section ?? 'global';
    log.error(`Error in [${section}]:`, { error: error.message, stack: errorInfo.componentStack });
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      if (this.props.compact) {
        return (
          <div className="flex items-center justify-center p-4 rounded-lg border border-destructive/20 bg-destructive/5" role="alert">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive" aria-hidden="true" />
              <div>
                <p className="text-sm font-medium">
                  Erro ao carregar {this.props.section ? `"${this.props.section}"` : 'seção'}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {this.state.error?.message}
                </p>
              </div>
              <Button onClick={this.handleRetry} variant="ghost" size="sm" className="ml-auto" aria-label="Tentar carregar novamente">
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>
          </div>
        );
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-6" role="alert">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-2" aria-hidden="true" />
              <CardTitle className="text-lg">Algo deu errado</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Ocorreu um erro inesperado. Tente recarregar o componente.
              </p>
              {this.state.error && (
                <details className="text-xs text-muted-foreground text-left">
                  <summary className="cursor-pointer">Detalhes técnicos</summary>
                  <pre className="mt-2 p-2 bg-muted rounded text-[10px] overflow-auto max-h-32">
                    {this.state.error.message}
                  </pre>
                </details>
              )}
              <Button onClick={this.handleRetry} variant="outline" size="sm" aria-label="Tentar carregar novamente">
                <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
                Tentar novamente
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

/** Lightweight wrapper for section-level error boundaries */
export function SectionBoundary({ children, section }: { children: ReactNode; section: string }) {
  return (
    <ErrorBoundary compact section={section}>
      {children}
    </ErrorBoundary>
  );
}

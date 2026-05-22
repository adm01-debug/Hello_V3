import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { logger } from '@/lib/logger';
import { reportError } from '@/lib/error-tracking';

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
    
    // Log to standard logger
    log.error(`Error in [${section}]:`, { 
      error: error.message, 
      stack: errorInfo.componentStack 
    });

    // Report to central error tracking
    reportError({
      message: error.message,
      type: 'react-component',
      error: error,
      metadata: {
        section,
        componentStack: errorInfo.componentStack
      }
    });

    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  handleGoHome = () => {
    window.location.href = '/';
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
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  Erro ao carregar {this.props.section ? `"${this.props.section}"` : 'seção'}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {this.state.error?.message}
                </p>
              </div>
              <Button 
                onClick={this.handleRetry} 
                variant="ghost" 
                size="sm" 
                className="ml-auto flex-shrink-0" 
                aria-label="Tentar carregar novamente"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>
          </div>
        );
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-6 bg-background" role="alert">
          <Card className="max-w-md w-full border-2 border-destructive/20 shadow-lg">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="h-10 w-10 text-destructive" aria-hidden="true" />
              </div>
              <CardTitle className="text-2xl font-bold text-foreground">Algo deu errado</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <p className="text-base text-muted-foreground leading-relaxed">
                Tivemos um problema inesperado ao renderizar esta página. 
                Tentamos recuperar o estado automaticamente, mas o erro persistiu.
              </p>
              
              {this.state.error && (
                <div className="text-left bg-muted p-3 rounded-md overflow-hidden">
                  <p className="text-[10px] font-mono text-muted-foreground uppercase mb-1">Erro Detectado:</p>
                  <p className="text-xs font-mono text-destructive break-words">
                    {this.state.error.message}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button 
                  onClick={this.handleRetry} 
                  variant="default" 
                  className="w-full"
                  aria-label="Tentar carregar novamente"
                >
                  <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
                  Tentar novamente
                </Button>
                <Button 
                  onClick={this.handleGoHome} 
                  variant="outline" 
                  className="w-full"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Ir para Home
                </Button>
              </div>

              <div className="pt-4 border-t border-border/40">
                <p className="text-[10px] text-muted-foreground">
                  Se o erro persistir, entre em contato com o suporte técnico.
                </p>
              </div>
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


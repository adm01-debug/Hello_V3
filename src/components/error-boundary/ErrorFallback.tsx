import React from 'react';

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary?: () => void;
}

export function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="max-w-md rounded-lg border border-destructive bg-card p-6 text-center shadow-lg">
        <div className="mb-4 text-4xl">⚠️</div>
        <h2 className="mb-2 text-2xl font-bold text-destructive">
          Oops! Something went wrong
        </h2>
        <p className="mb-4 text-muted-foreground">{error.message}</p>
        {resetErrorBoundary && (
          <button
            onClick={resetErrorBoundary}
            className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
}

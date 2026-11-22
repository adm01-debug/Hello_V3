import { Suspense, lazy, ComponentType } from 'react';
import { GlobalLoading } from '@/components/loading/GlobalLoading';

export function createLazyComponent<T extends ComponentType<Record<string, unknown>>>(
  loader: () => Promise<{ default: T }>,
  loadingMessage?: string
) {
  const LazyComp = lazy(loader);

  return function LazyWrapper(props: React.ComponentProps<T>) {
    return (
      <Suspense fallback={<GlobalLoading message={loadingMessage || 'Carregando módulo...'} />}>
        {/* @ts-expect-error generic props spread onto lazy component is not narrowable */}
        <LazyComp {...props} />
      </Suspense>
    );
  };
}

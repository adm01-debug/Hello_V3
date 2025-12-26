// Dynamic import utilities

export interface DynamicImportOptions {
  timeout?: number;
  retries?: number;
  fallback?: any;
}

// Retry logic for dynamic imports
export async function importWithRetry<T>(
  importFn: () => Promise<T>,
  options: DynamicImportOptions = {}
): Promise<T> {
  const { timeout = 10000, retries = 3 } = options;
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Import timeout')), timeout);
      });
      
      return await Promise.race([importFn(), timeoutPromise]);
    } catch (error) {
      if (attempt === retries - 1) {
        if (options.fallback) {
          return options.fallback;
        }
        throw error;
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
    }
  }
  
  throw new Error('Import failed after retries');
}

// Route-based code splitting
export const routeImports = {
  Dashboard: () => importWithRetry(() => import('../pages/Dashboard')),
  Calls: () => importWithRetry(() => import('../pages/Calls')),
  Contacts: () => importWithRetry(() => import('../pages/Contacts')),
  Settings: () => importWithRetry(() => import('../pages/Settings')),
  Reports: () => importWithRetry(() => import('../pages/Reports')),
};

// Component lazy loading with prefetch
export class ComponentLoader {
  private cache: Map<string, any> = new Map();
  private prefetching: Set<string> = new Set();

  async load<T>(
    key: string,
    importFn: () => Promise<T>,
    options?: DynamicImportOptions
  ): Promise<T> {
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    const module = await importWithRetry(importFn, options);
    this.cache.set(key, module);
    return module;
  }

  prefetch<T>(key: string, importFn: () => Promise<T>) {
    if (this.cache.has(key) || this.prefetching.has(key)) {
      return;
    }

    this.prefetching.add(key);
    
    importFn()
      .then((module) => {
        this.cache.set(key, module);
        this.prefetching.delete(key);
      })
      .catch(() => {
        this.prefetching.delete(key);
      });
  }

  clear() {
    this.cache.clear();
    this.prefetching.clear();
  }
}

export const componentLoader = new ComponentLoader();

// React Suspense wrapper with error boundary
export function LazyComponent<T extends React.ComponentType<any>>({
  loader,
  fallback,
  errorFallback,
  ...props
}: {
  loader: () => Promise<{ default: T }>;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
} & React.ComponentProps<T>) {
  const Component = React.lazy(loader);

  return (
    <ErrorBoundary fallback={errorFallback}>
      <React.Suspense fallback={fallback || <div>Loading...</div>}>
        <Component {...props} />
      </React.Suspense>
    </ErrorBoundary>
  );
}

// Intersection Observer based lazy loading
export function useLazyLoad<T>(
  importFn: () => Promise<T>,
  options: { rootMargin?: string } = {}
) {
  const [component, setComponent] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !component && !loading) {
            setLoading(true);
            importFn()
              .then(setComponent)
              .catch(console.error)
              .finally(() => setLoading(false));
          }
        });
      },
      { rootMargin: options.rootMargin || '50px' }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [importFn, component, loading, options.rootMargin]);

  return { ref, component, loading };
}

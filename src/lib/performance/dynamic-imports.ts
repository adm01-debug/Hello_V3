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

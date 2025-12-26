export interface CacheStrategy {
  name: string;
  maxAge: number;
  staleWhileRevalidate?: number;
  cacheControl: string;
}

export const CACHE_STRATEGIES: Record<string, CacheStrategy> = {
  static: {
    name: 'static-assets',
    maxAge: 31536000, // 1 year
    cacheControl: 'public, max-age=31536000, immutable',
  },
  image: {
    name: 'images',
    maxAge: 2592000, // 30 days
    staleWhileRevalidate: 86400, // 1 day
    cacheControl: 'public, max-age=2592000, stale-while-revalidate=86400',
  },
  api: {
    name: 'api',
    maxAge: 300, // 5 minutes
    staleWhileRevalidate: 60, // 1 minute
    cacheControl: 'public, max-age=300, stale-while-revalidate=60',
  },
  dynamic: {
    name: 'dynamic',
    maxAge: 0,
    cacheControl: 'no-cache, must-revalidate',
  },
};

export class BrowserCache {
  // Cache API wrapper
  private cacheName: string;

  constructor(cacheName: string) {
    this.cacheName = cacheName;
  }

  async get(key: string): Promise<Response | undefined> {
    if (!('caches' in window)) return undefined;

    const cache = await caches.open(this.cacheName);
    return cache.match(key);
  }

  async set(key: string, response: Response): Promise<void> {
    if (!('caches' in window)) return;

    const cache = await caches.open(this.cacheName);
    await cache.put(key, response.clone());
  }

  async delete(key: string): Promise<boolean> {
    if (!('caches' in window)) return false;

    const cache = await caches.open(this.cacheName);
    return cache.delete(key);
  }

  async clear(): Promise<void> {
    if (!('caches' in window)) return;

    await caches.delete(this.cacheName);
  }
}

// HTTP cache headers middleware
export function cacheMiddleware(strategy: CacheStrategy) {
  return (req: any, res: any, next: any) => {
    res.setHeader('Cache-Control', strategy.cacheControl);
    
    if (strategy.maxAge > 0) {
      const expires = new Date(Date.now() + strategy.maxAge * 1000);
      res.setHeader('Expires', expires.toUTCString());
    }
    
    next();
  };
}

// Service Worker cache strategy
export function configureSWCache() {
  return `
    // Cache strategies for Service Worker
    const CACHE_VERSION = 'v1';
    const STATIC_CACHE = '${CACHE_STRATEGIES.static.name}-' + CACHE_VERSION;
    const IMAGE_CACHE = '${CACHE_STRATEGIES.image.name}-' + CACHE_VERSION;
    const API_CACHE = '${CACHE_STRATEGIES.api.name}-' + CACHE_VERSION;

    // Install event
    self.addEventListener('install', (event) => {
      event.waitUntil(
        caches.open(STATIC_CACHE).then((cache) => {
          return cache.addAll([
            '/',
            '/index.html',
            '/css/main.css',
            '/js/main.js',
          ]);
        })
      );
    });

    // Fetch event with cache strategies
    self.addEventListener('fetch', (event) => {
      const { request } = event;
      const url = new URL(request.url);

      // Static assets
      if (request.destination === 'script' || request.destination === 'style') {
        event.respondWith(
          caches.match(request).then((cached) => {
            return cached || fetch(request).then((response) => {
              return caches.open(STATIC_CACHE).then((cache) => {
                cache.put(request, response.clone());
                return response;
              });
            });
          })
        );
      }

      // Images
      else if (request.destination === 'image') {
        event.respondWith(
          caches.match(request).then((cached) => {
            const fetchPromise = fetch(request).then((response) => {
              return caches.open(IMAGE_CACHE).then((cache) => {
                cache.put(request, response.clone());
                return response;
              });
            });
            return cached || fetchPromise;
          })
        );
      }

      // API requests
      else if (url.pathname.startsWith('/api/')) {
        event.respondWith(
          fetch(request).then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(API_CACHE).then((cache) => {
                cache.put(request, clone);
              });
            }
            return response;
          }).catch(() => {
            return caches.match(request);
          })
        );
      }
    });
  `;
}

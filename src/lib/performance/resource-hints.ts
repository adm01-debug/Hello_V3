export interface ResourceHint {
  url: string;
  type: 'preconnect' | 'dns-prefetch' | 'prefetch' | 'preload' | 'prerender';
  as?: string;
  crossorigin?: boolean;
}

export const RESOURCE_HINTS: ResourceHint[] = [
  // Preconnect to external origins
  {
    url: 'https://api.hello.app',
    type: 'preconnect',
    crossorigin: true,
  },
  {
    url: 'https://cdn.hello.app',
    type: 'preconnect',
    crossorigin: true,
  },
  {
    url: 'https://fonts.googleapis.com',
    type: 'preconnect',
  },
  {
    url: 'https://fonts.gstatic.com',
    type: 'preconnect',
    crossorigin: true,
  },
  
  // DNS prefetch for analytics
  {
    url: 'https://www.google-analytics.com',
    type: 'dns-prefetch',
  },
  
  // Preload critical resources
  {
    url: '/fonts/inter-400-normal.woff2',
    type: 'preload',
    as: 'font',
    crossorigin: true,
  },
  {
    url: '/css/critical.css',
    type: 'preload',
    as: 'style',
  },
  
  // Prefetch likely navigation
  {
    url: '/dashboard',
    type: 'prefetch',
  },
];

// Generate HTML link tags
export function generateResourceHints(hints: ResourceHint[]): string {
  return hints
    .map((hint) => {
      const attrs: string[] = [
        `rel="${hint.type}"`,
        `href="${hint.url}"`,
      ];

      if (hint.as) {
        attrs.push(`as="${hint.as}"`);
      }

      if (hint.crossorigin) {
        attrs.push('crossorigin');
      }

      return `<link ${attrs.join(' ')}>`;
    })
    .join('\n');
}

// Programmatically add resource hints
export function addResourceHint(hint: ResourceHint) {
  if (typeof document === 'undefined') return;

  const link = document.createElement('link');
  link.rel = hint.type;
  link.href = hint.url;

  if (hint.as) {
    link.as = hint.as;
  }

  if (hint.crossorigin) {
    link.crossOrigin = '';
  }

  document.head.appendChild(link);
}

// Intelligent prefetching based on user behavior
export class IntelligentPrefetcher {
  private prefetchedUrls: Set<string> = new Set();
  private observer: IntersectionObserver | null = null;

  constructor() {
    this.setupIntersectionObserver();
  }

  private setupIntersectionObserver() {
    if (typeof IntersectionObserver === 'undefined') return;

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const link = entry.target as HTMLAnchorElement;
            this.prefetchUrl(link.href);
          }
        });
      },
      { rootMargin: '50px' }
    );
  }

  prefetchUrl(url: string) {
    if (this.prefetchedUrls.has(url)) return;

    addResourceHint({
      url,
      type: 'prefetch',
    });

    this.prefetchedUrls.add(url);
  }

  observeLink(element: HTMLElement) {
    if (this.observer) {
      this.observer.observe(element);
    }
  }

  disconnect() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

export const intelligentPrefetcher = new IntelligentPrefetcher();

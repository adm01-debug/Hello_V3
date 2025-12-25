export interface LazyLoadConfig {
  routes: Record<string, () => Promise<any>>;
  components: Record<string, () => Promise<any>>;
  threshold?: number;
  rootMargin?: string;
}

export const LAZY_ROUTES = {
  '/dashboard': () => import('@/pages/Index'),
  '/calls': () => import('@/pages/Calls'),
  '/contacts': () => import('@/pages/Contacts'),
  '/reports': () => import('@/pages/Reports'),
  '/settings': () => import('@/pages/Settings'),
};

export const LAZY_COMPONENTS = {
  'CallHistory': () => import('@/components/dashboard/CallHistory'),
  'Analytics': () => import('@/components/dashboard/Analytics'),
  'AgentPanel': () => import('@/components/supervisor/SupervisorPanel'),
};

export function setupLazyLoading(config: LazyLoadConfig = {
  routes: LAZY_ROUTES,
  components: LAZY_COMPONENTS,
  threshold: 0.1,
  rootMargin: '50px',
}) {
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const target = entry.target as HTMLElement;
            const componentName = target.dataset.lazyComponent;
            if (componentName && config.components[componentName]) {
              config.components[componentName]();
              observer.unobserve(target);
            }
          }
        });
      },
      {
        threshold: config.threshold,
        rootMargin: config.rootMargin,
      }
    );

    return observer;
  }

  return null;
}

export function preloadRoute(path: string) {
  const loader = LAZY_ROUTES[path];
  if (loader) {
    loader();
  }
}

export function preloadComponent(name: string) {
  const loader = LAZY_COMPONENTS[name];
  if (loader) {
    loader();
  }
}

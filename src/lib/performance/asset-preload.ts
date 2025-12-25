export interface PreloadConfig {
  fonts: string[];
  criticalCSS: string[];
  images: string[];
  scripts: string[];
}

export const PRELOAD_CONFIG: PreloadConfig = {
  fonts: [
    '/fonts/inter-var.woff2',
  ],
  criticalCSS: [
    '/styles/critical.css',
  ],
  images: [
    '/logo.svg',
    '/hero-bg.webp',
  ],
  scripts: [
    '/vendor.js',
    '/main.js',
  ],
};

export function preloadAssets(config: PreloadConfig = PRELOAD_CONFIG) {
  config.fonts.forEach((font) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'font';
    link.type = 'font/woff2';
    link.href = font;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });

  config.criticalCSS.forEach((css) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'style';
    link.href = css;
    document.head.appendChild(link);
  });

  config.images.forEach((image) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = image;
    document.head.appendChild(link);
  });

  config.scripts.forEach((script) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'script';
    link.href = script;
    document.head.appendChild(link);
  });
}

export function prefetchRoute(path: string) {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = path;
  document.head.appendChild(link);
}

export function dnsPrefetch(domain: string) {
  const link = document.createElement('link');
  link.rel = 'dns-prefetch';
  link.href = domain;
  document.head.appendChild(link);
}

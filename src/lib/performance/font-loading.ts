import React from 'react';

export interface FontLoadingStrategy {
  fonts: FontConfig[];
  display: 'auto' | 'block' | 'swap' | 'fallback' | 'optional';
  preconnect?: string[];
}

export interface FontConfig {
  family: string;
  weights: number[];
  styles: ('normal' | 'italic')[];
  display?: 'auto' | 'block' | 'swap' | 'fallback' | 'optional';
  preload?: boolean;
}

export const FONT_STRATEGY: FontLoadingStrategy = {
  fonts: [
    {
      family: 'Inter',
      weights: [400, 500, 600, 700],
      styles: ['normal'],
      display: 'swap',
      preload: true,
    },
    {
      family: 'JetBrains Mono',
      weights: [400, 500],
      styles: ['normal'],
      display: 'swap',
      preload: false,
    },
  ],
  display: 'swap',
  preconnect: [
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
  ],
};

// Generate font-face CSS
export function generateFontFaceCSS(config: FontConfig): string {
  const fontFaces: string[] = [];

  for (const weight of config.weights) {
    for (const style of config.styles) {
      fontFaces.push(`
        @font-face {
          font-family: '${config.family}';
          font-style: ${style};
          font-weight: ${weight};
          font-display: ${config.display || 'swap'};
          src: local('${config.family}'),
               url('/fonts/${config.family.toLowerCase().replace(' ', '-')}-${weight}-${style}.woff2') format('woff2'),
               url('/fonts/${config.family.toLowerCase().replace(' ', '-')}-${weight}-${style}.woff') format('woff');
        }
      `);
    }
  }

  return fontFaces.join('\n');
}

// Generate preload links
export function generateFontPreloads(strategy: FontLoadingStrategy): string {
  const preloads: string[] = [];

  // Preconnect
  if (strategy.preconnect) {
    for (const url of strategy.preconnect) {
      preloads.push(
        `<link rel="preconnect" href="${url}" crossorigin>`
      );
    }
  }

  // Preload fonts
  for (const font of strategy.fonts) {
    if (font.preload) {
      for (const weight of font.weights) {
        preloads.push(
          `<link rel="preload" href="/fonts/${font.family.toLowerCase().replace(' ', '-')}-${weight}-normal.woff2" as="font" type="font/woff2" crossorigin>`
        );
      }
    }
  }

  return preloads.join('\n');
}

// Font loading with Font Loading API
export class FontLoader {
  private fontsLoaded: Set<string> = new Set();

  async loadFont(config: FontConfig): Promise<void> {
    const fontKey = `${config.family}-${config.weights.join('-')}`;
    
    if (this.fontsLoaded.has(fontKey)) {
      return;
    }

    if ('fonts' in document) {
      const promises: Promise<FontFace>[] = [];

      for (const weight of config.weights) {
        for (const style of config.styles) {
          const fontFace = new FontFace(
            config.family,
            `url('/fonts/${config.family.toLowerCase().replace(' ', '-')}-${weight}-${style}.woff2') format('woff2')`,
            {
              weight: weight.toString(),
              style,
              display: config.display || 'swap',
            }
          );

          promises.push(fontFace.load());
        }
      }

      await Promise.all(promises);
      this.fontsLoaded.add(fontKey);
    }
  }

  async loadAll(strategy: FontLoadingStrategy): Promise<void> {
    await Promise.all(
      strategy.fonts.map((font) => this.loadFont(font))
    );
  }
}

// React hook for font loading
export function useFontLoading(strategy: FontLoadingStrategy) {
  const [loaded, setLoaded] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    const loader = new FontLoader();
    
    loader
      .loadAll(strategy)
      .then(() => setLoaded(true))
      .catch(setError);
  }, []);

  return { loaded, error };
}

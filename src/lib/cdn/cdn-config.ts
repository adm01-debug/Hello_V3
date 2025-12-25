export interface CDNConfig {
  providers: CDNProvider[];
  defaultProvider: string;
  failoverEnabled: boolean;
  cacheRules: CacheRule[];
}

export interface CDNProvider {
  name: string;
  endpoint: string;
  regions: string[];
  priority: number;
}

export interface CacheRule {
  pattern: RegExp;
  ttl: number;
  cacheControl: string;
}

export const CDN_CONFIG: CDNConfig = {
  providers: [
    {
      name: 'cloudflare',
      endpoint: 'https://cdn.cloudflare.com',
      regions: ['global'],
      priority: 1,
    },
    {
      name: 'fastly',
      endpoint: 'https://cdn.fastly.com',
      regions: ['us', 'eu'],
      priority: 2,
    },
  ],
  defaultProvider: 'cloudflare',
  failoverEnabled: true,
  cacheRules: [
    {
      pattern: /\.(jpg|jpeg|png|gif|webp|svg)$/i,
      ttl: 31536000,
      cacheControl: 'public, max-age=31536000, immutable',
    },
    {
      pattern: /\.(js|css)$/i,
      ttl: 86400,
      cacheControl: 'public, max-age=86400',
    },
    {
      pattern: /\.(woff|woff2|ttf|eot)$/i,
      ttl: 31536000,
      cacheControl: 'public, max-age=31536000, immutable',
    },
  ],
};

export class CDNManager {
  constructor(private config: CDNConfig = CDN_CONFIG) {}

  getCDNUrl(asset: string): string {
    const provider = this.getProvider();
    return `${provider.endpoint}/${asset}`;
  }

  private getProvider(): CDNProvider {
    const defaultProvider = this.config.providers.find(
      p => p.name === this.config.defaultProvider
    );
    return defaultProvider || this.config.providers[0];
  }

  getCacheControl(filename: string): string {
    for (const rule of this.config.cacheRules) {
      if (rule.pattern.test(filename)) {
        return rule.cacheControl;
      }
    }
    return 'public, max-age=3600';
  }

  async invalidateCache(paths: string[]): Promise<void> {
    console.log('Invalidating CDN cache for:', paths);
  }
}

export const cdnManager = new CDNManager();

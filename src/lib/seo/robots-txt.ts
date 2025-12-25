export interface RobotsConfig {
  userAgent?: string;
  allow?: string[];
  disallow?: string[];
  crawlDelay?: number;
  sitemap?: string;
}

export function generateRobotsTxt(configs: RobotsConfig[]): string {
  return configs.map(config => {
    const lines: string[] = [];
    
    lines.push(`User-agent: ${config.userAgent || '*'}`);
    
    if (config.allow) {
      config.allow.forEach(path => lines.push(`Allow: ${path}`));
    }
    
    if (config.disallow) {
      config.disallow.forEach(path => lines.push(`Disallow: ${path}`));
    }
    
    if (config.crawlDelay) {
      lines.push(`Crawl-delay: ${config.crawlDelay}`);
    }
    
    if (config.sitemap) {
      lines.push(`Sitemap: ${config.sitemap}`);
    }
    
    return lines.join('
');
  }).join('

');
}

export const defaultRobotsConfig: RobotsConfig[] = [
  {
    userAgent: '*',
    allow: ['/'],
    disallow: ['/api/', '/admin/'],
    sitemap: 'https://hello.app/sitemap.xml',
  },
];

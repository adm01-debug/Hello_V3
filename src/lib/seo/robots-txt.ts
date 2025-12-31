export interface RobotsTxtConfig {
  userAgent?: string;
  allow?: string[];
  disallow?: string[];
  sitemap?: string;
}

export function generateRobotsTxt(configs: RobotsTxtConfig[]): string {
  return configs.map(config => {
    const lines = [`User-agent: ${config.userAgent || '*'}`];
    
    config.allow?.forEach(path => lines.push(`Allow: ${path}`));
    config.disallow?.forEach(path => lines.push(`Disallow: ${path}`));
    
    if (config.sitemap) {
      lines.push(`Sitemap: ${config.sitemap}`);
    }
    
    return lines.join('\n');
  }).join('\n\n');
}

export const DEFAULT_ROBOTS: RobotsTxtConfig[] = [
  {
    userAgent: '*',
    allow: ['/'],
    disallow: ['/api/', '/admin/'],
    sitemap: 'https://hello.app/sitemap.xml',
  },
];

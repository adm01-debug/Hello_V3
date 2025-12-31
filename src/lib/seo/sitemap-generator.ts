export interface SitemapURL {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export function generateSitemap(urls: SitemapURL[]): string {
  const urlElements = urls.map(url => {
    let element = `  <url>\n    <loc>${url.loc}</loc>`;
    if (url.lastmod) element += `\n    <lastmod>${url.lastmod}</lastmod>`;
    if (url.changefreq) element += `\n    <changefreq>${url.changefreq}</changefreq>`;
    if (url.priority) element += `\n    <priority>${url.priority}</priority>`;
    element += '\n  </url>';
    return element;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlElements}\n</urlset>`;
}

export const DEFAULT_URLS: SitemapURL[] = [
  { loc: '/', changefreq: 'daily', priority: 1.0 },
  { loc: '/calls', changefreq: 'daily', priority: 0.8 },
  { loc: '/contacts', changefreq: 'weekly', priority: 0.7 },
  { loc: '/reports', changefreq: 'weekly', priority: 0.6 },
];

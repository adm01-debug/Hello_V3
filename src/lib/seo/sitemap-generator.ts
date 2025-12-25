export interface SitemapURL {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export function generateSitemap(urls: SitemapURL[]): string {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${url.loc}</loc>
    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
    ${url.changefreq ? `<changefreq>${url.changefreq}</changefreq>` : ''}
    ${url.priority ? `<priority>${url.priority}</priority>` : ''}
  </url>`).join('
')}
</urlset>`;

  return xml;
}

export const DEFAULT_URLS: SitemapURL[] = [
  { loc: '/', changefreq: 'daily', priority: 1.0 },
  { loc: '/calls', changefreq: 'daily', priority: 0.8 },
  { loc: '/contacts', changefreq: 'weekly', priority: 0.7 },
  { loc: '/reports', changefreq: 'weekly', priority: 0.6 },
];

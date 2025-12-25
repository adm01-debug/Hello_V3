export interface MetaTags {
  title: string;
  description: string;
  keywords?: string[];
  author?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  twitterCard?: 'summary' | 'summary_large_image';
}

export function generateMetaTags(tags: MetaTags): string {
  const meta: string[] = [];

  // Basic meta tags
  meta.push(`<title>${tags.title}</title>`);
  meta.push(`<meta name="description" content="${tags.description}" />`);
  
  if (tags.keywords) {
    meta.push(`<meta name="keywords" content="${tags.keywords.join(', ')}" />`);
  }
  
  if (tags.author) {
    meta.push(`<meta name="author" content="${tags.author}" />`);
  }

  // Open Graph
  meta.push(`<meta property="og:title" content="${tags.title}" />`);
  meta.push(`<meta property="og:description" content="${tags.description}" />`);
  meta.push(`<meta property="og:type" content="${tags.type || 'website'}" />`);
  
  if (tags.url) {
    meta.push(`<meta property="og:url" content="${tags.url}" />`);
  }
  
  if (tags.image) {
    meta.push(`<meta property="og:image" content="${tags.image}" />`);
  }

  // Twitter Card
  meta.push(`<meta name="twitter:card" content="${tags.twitterCard || 'summary'}" />`);
  meta.push(`<meta name="twitter:title" content="${tags.title}" />`);
  meta.push(`<meta name="twitter:description" content="${tags.description}" />`);
  
  if (tags.image) {
    meta.push(`<meta name="twitter:image" content="${tags.image}" />`);
  }

  return meta.join('
');
}

export function setMetaTags(tags: MetaTags) {
  document.title = tags.title;
  
  const setMeta = (name: string, content: string, property = false) => {
    const attribute = property ? 'property' : 'name';
    let meta = document.querySelector(`meta[${attribute}="${name}"]`);
    
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute(attribute, name);
      document.head.appendChild(meta);
    }
    
    meta.setAttribute('content', content);
  };

  setMeta('description', tags.description);
  setMeta('og:title', tags.title, true);
  setMeta('og:description', tags.description, true);
  setMeta('twitter:title', tags.title);
  setMeta('twitter:description', tags.description);
  
  if (tags.image) {
    setMeta('og:image', tags.image, true);
    setMeta('twitter:image', tags.image);
  }
  
  if (tags.url) {
    setMeta('og:url', tags.url, true);
  }
}

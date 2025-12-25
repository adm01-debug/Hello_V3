export interface MetaTag {
  name?: string;
  property?: string;
  content: string;
}

export interface SEOConfig {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: string;
  author?: string;
}

export function generateMetaTags(config: SEOConfig): MetaTag[] {
  const tags: MetaTag[] = [
    { name: 'description', content: config.description },
    { property: 'og:title', content: config.title },
    { property: 'og:description', content: config.description },
    { name: 'twitter:title', content: config.title },
    { name: 'twitter:description', content: config.description },
    { name: 'twitter:card', content: 'summary_large_image' },
  ];

  if (config.keywords) {
    tags.push({ name: 'keywords', content: config.keywords.join(', ') });
  }

  if (config.image) {
    tags.push(
      { property: 'og:image', content: config.image },
      { name: 'twitter:image', content: config.image }
    );
  }

  if (config.url) {
    tags.push({ property: 'og:url', content: config.url });
  }

  if (config.type) {
    tags.push({ property: 'og:type', content: config.type });
  }

  if (config.author) {
    tags.push({ name: 'author', content: config.author });
  }

  return tags;
}

export function applyMetaTags(config: SEOConfig) {
  document.title = config.title;
  
  const tags = generateMetaTags(config);
  tags.forEach(tag => {
    const key = tag.name || tag.property;
    if (!key) return;

    let element = document.querySelector(`meta[${tag.name ? 'name' : 'property'}="${key}"]`);
    
    if (!element) {
      element = document.createElement('meta');
      if (tag.name) element.setAttribute('name', tag.name);
      if (tag.property) element.setAttribute('property', tag.property);
      document.head.appendChild(element);
    }
    
    element.setAttribute('content', tag.content);
  });
}

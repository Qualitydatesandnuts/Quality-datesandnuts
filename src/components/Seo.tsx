import { useEffect } from 'react';

const SITE_NAME = 'Quality Dates and Nuts';
const SITE_URL = 'https://qualitydatesandnuts.com';

interface SeoProps {
  title: string;
  description: string;
  path?: string;
  image?: string;
  jsonLd?: object | object[];
}

/**
 * Per-page SEO: document title, meta description, canonical, Open Graph /
 * Twitter cards and JSON-LD structured data (Product, FAQPage, Breadcrumb…).
 */
export default function Seo({ title, description, path = '', image, jsonLd }: SeoProps) {
  useEffect(() => {
    document.title = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;

    const ensure = (selector: string, create: () => HTMLElement) => {
      let el = document.head.querySelector(selector) as HTMLElement | null;
      if (!el) {
        el = create();
        document.head.appendChild(el);
      }
      return el;
    };
    const meta = (attr: 'name' | 'property', key: string, content: string) => {
      const el = ensure(`meta[${attr}="${key}"]`, () => {
        const m = document.createElement('meta');
        m.setAttribute(attr, key);
        return m;
      });
      el.setAttribute('content', content);
    };

    meta('name', 'description', description);
    meta('property', 'og:title', document.title);
    meta('property', 'og:description', description);
    meta('property', 'og:type', path.startsWith('/product/') ? 'product' : 'website');
    meta('property', 'og:url', `${SITE_URL}${path}`);
    meta('property', 'og:site_name', SITE_NAME);
    if (image) meta('property', 'og:image', image.startsWith('http') ? image : `${SITE_URL}${image}`);
    meta('name', 'twitter:card', image ? 'summary_large_image' : 'summary');
    meta('name', 'twitter:title', document.title);
    meta('name', 'twitter:description', description);

    const canonical = ensure('link[rel="canonical"]', () => {
      const l = document.createElement('link');
      l.setAttribute('rel', 'canonical');
      return l;
    });
    canonical.setAttribute('href', `${SITE_URL}${path}`);

    // JSON-LD: replace any page-level structured data blocks
    document.head.querySelectorAll('script[data-seo-jsonld]').forEach((s) => s.remove());
    if (jsonLd) {
      const blocks = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
      blocks.forEach((block) => {
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.setAttribute('data-seo-jsonld', 'true');
        script.textContent = JSON.stringify(block);
        document.head.appendChild(script);
      });
    }
  }, [title, description, path, image, jsonLd]);

  return null;
}

export { SITE_NAME, SITE_URL };

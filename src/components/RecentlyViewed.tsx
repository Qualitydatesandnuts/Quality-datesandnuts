import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { History } from 'lucide-react';
import { api, inr, type Product } from '../lib/api';
import { recentlyViewed } from '../lib/prefs';

/** Horizontal strip of products the shopper looked at recently. */
export default function RecentlyViewed({ excludeSlug }: { excludeSlug?: string }) {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const slugs = recentlyViewed().filter((s) => s !== excludeSlug);
    if (slugs.length === 0) return;
    api.products().then((all) => {
      const bySlug = Object.fromEntries(all.map((p) => [p.slug, p]));
      setProducts(slugs.map((s) => bySlug[s]).filter(Boolean).slice(0, 6));
    }).catch(() => {});
  }, [excludeSlug]);

  if (products.length === 0) return null;

  return (
    <section className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" aria-labelledby="recent-heading">
      <h2 id="recent-heading" className="flex items-center gap-2 text-sm font-bold tracking-widest uppercase text-cocoa-light mb-5">
        <History className="w-4 h-4 text-gold" aria-hidden="true" /> Recently viewed
      </h2>
      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
        {products.map((p) => (
          <Link key={p.id} to={`/product/${p.slug}`} className="group flex-shrink-0 w-36">
            <div className="w-36 h-44 rounded-2xl overflow-hidden bg-cream-dark mb-2">
              <img src={p.image} alt={p.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
            <p className="text-xs font-semibold text-espresso leading-snug line-clamp-2">{p.name}</p>
            <p className="text-xs text-cocoa-light mt-0.5">{inr(p.price)}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

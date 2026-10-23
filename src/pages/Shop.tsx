import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, SearchX } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import Seo from '../components/Seo';
import { api, type Product } from '../lib/api';

const sorts = [
  { value: 'popular', label: 'Most Popular' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
];

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ category: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const category = params.get('category') || 'All';
  const search = params.get('search') || '';
  const sort = params.get('sort') || 'popular';

  useEffect(() => {
    api.categories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    api.products({ category, search, sort })
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [category, search, sort]);

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value && value !== 'All' && value !== 'popular') next.set(key, value);
    else next.delete(key);
    setParams(next, { preventScrollReset: true });
  };

  return (
    <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-screen">
      <Seo
        title={search ? `Search: ${search}` : category !== 'All' ? `${category} — Shop Online` : 'Shop All Products'}
        description={`Buy premium ${category !== 'All' ? category.toLowerCase() : 'dates, nuts and dry fruits'} online at Quality Dates and Nuts. 100% natural, free shipping above ₹999, easy UPI payment.`}
        path="/shop"
      />

      <header className="mb-10">
        <h1 className="font-serif text-4xl md:text-5xl font-semibold text-espresso">
          {search ? <>Results for “{search}”</> : category !== 'All' ? category : 'The Collection'}
        </h1>
        <p className="text-cocoa-light mt-3">
          {search ? `${products.length} products found` : 'Pure, unadulterated nature — delivered to your door.'}
        </p>
      </header>

      {/* category chips + sort */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-4 justify-between mb-10 sticky top-[70px] z-30 bg-cream/90 backdrop-blur-xl py-3 -mx-4 px-4 sm:-mx-6 sm:px-6">
        <div className="flex gap-2 overflow-x-auto no-scrollbar" role="tablist" aria-label="Filter by category">
          {['All', ...categories.map((c) => c.category)].map((c) => (
            <button
              key={c}
              role="tab"
              aria-selected={category === c}
              onClick={() => setParam('category', c)}
              className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                category === c
                  ? 'bg-espresso text-cream shadow-lg shadow-espresso/20'
                  : 'bg-white text-cocoa border border-espresso/10 hover:border-gold/50'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-cocoa flex-shrink-0">
          <SlidersHorizontal className="w-4 h-4 text-gold" aria-hidden="true" />
          <select
            value={sort}
            onChange={(e) => setParam('sort', e.target.value)}
            className="bg-white border border-espresso/10 rounded-full px-4 py-2.5 text-sm font-semibold text-espresso outline-none focus:border-gold cursor-pointer"
            aria-label="Sort products"
          >
            {sorts.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </label>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-12 sm:gap-x-8" aria-busy="true" aria-label="Loading products">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i}>
              <div className="skeleton w-full aspect-[4/5] rounded-3xl mb-4" />
              <div className="skeleton h-4 w-3/4 rounded-full mb-2" />
              <div className="skeleton h-4 w-1/3 rounded-full" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="py-24 flex flex-col items-center text-center gap-4">
          <SearchX className="w-12 h-12 text-cocoa-light/40" aria-hidden="true" />
          <p className="text-cocoa-light">No products matched. Try a different search or category.</p>
          <button onClick={() => setParams({})} className="bg-espresso text-cream px-6 py-3 rounded-full text-sm font-bold hover:bg-cocoa transition-colors">
            Show everything
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-12 sm:gap-x-8">
          {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
      )}
    </div>
  );
}

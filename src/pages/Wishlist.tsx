import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import Seo from '../components/Seo';
import ProductCard from '../components/ProductCard';
import { api, type Product } from '../lib/api';
import { useWishlist } from '../context/WishlistContext';

export default function Wishlist() {
  const { ids } = useWishlist();
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    api.products().then((all) => setProducts(all.filter((p) => ids.includes(p.id)))).catch(() => {});
  }, [ids]);

  return (
    <div className="pt-36 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-screen">
      <Seo title="My Wishlist" description="Products you saved at Quality Dates and Nuts." path="/wishlist" />
      <h1 className="font-serif text-4xl font-semibold text-espresso mb-10 flex items-center gap-3">
        <Heart className="w-8 h-8 text-red-400 fill-red-400" aria-hidden="true" /> Wishlist
      </h1>
      {products.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-cocoa-light mb-6">Nothing saved yet. Tap the heart on any product to keep it here.</p>
          <Link to="/shop" className="bg-espresso text-cream px-8 py-4 rounded-full text-sm font-bold hover:bg-cocoa transition-colors">
            Explore the collection
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-12 sm:gap-x-8">
          {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
      )}
    </div>
  );
}

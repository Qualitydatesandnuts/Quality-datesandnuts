import { motion } from 'framer-motion';
import { ShoppingBag, Heart, Star, Zap } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { inr, type Product } from '../lib/api';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';

export default function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const { addToCart } = useCart();
  const { toggle, has } = useWishlist();
  const { toast } = useToast();
  const navigate = useNavigate();
  const wished = has(product.id);
  const off = product.mrp > product.price ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;

  const quickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    addToCart(product, 1);
    toast(`${product.name} added to cart`);
  };

  const buyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    addToCart(product, 1);
    navigate('/checkout');
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ type: 'spring', stiffness: 90, damping: 18, delay: (index % 4) * 0.06 }}
      className="group relative flex flex-col"
    >
      <Link to={`/product/${product.slug}`} aria-label={`View ${product.name}`} className="flex flex-col h-full">
        <div className="relative w-full aspect-[4/5] rounded-3xl overflow-hidden bg-cream-dark mb-4">
          <motion.img
            src={product.image}
            alt={`${product.name} ${product.weight}`}
            loading="lazy"
            className="w-full h-full object-cover"
            whileHover={{ scale: 1.07 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          />

          {/* badges */}
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            {product.badge && (
              <span className="bg-espresso/90 backdrop-blur text-goldlight text-[11px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-full">
                {product.badge}
              </span>
            )}
            {off > 0 && (
              <span className="bg-gold text-espresso text-[11px] font-bold px-3 py-1.5 rounded-full">
                {off}% OFF
              </span>
            )}
          </div>

          {/* wishlist */}
          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={(e) => { e.preventDefault(); toggle(product.id); toast(wished ? 'Removed from wishlist' : 'Saved to wishlist'); }}
            aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
            className="absolute top-4 right-4 p-2.5 rounded-full bg-white/85 backdrop-blur shadow-sm hover:shadow-md transition-shadow"
          >
            <Heart className={`w-4 h-4 transition-colors ${wished ? 'fill-red-500 text-red-500' : 'text-espresso'}`} aria-hidden="true" />
          </motion.button>

          {/* hover actions — low-click buying */}
          <div className="absolute inset-x-3 bottom-3 flex gap-2 translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={quickAdd}
              className="flex-1 flex items-center justify-center gap-1.5 bg-white/95 backdrop-blur text-espresso py-3 rounded-full text-xs font-bold tracking-wide shadow-lg hover:bg-white"
            >
              <ShoppingBag className="w-3.5 h-3.5" aria-hidden="true" /> ADD
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={buyNow}
              className="flex-1 flex items-center justify-center gap-1.5 bg-espresso text-cream py-3 rounded-full text-xs font-bold tracking-wide shadow-lg hover:bg-cocoa"
            >
              <Zap className="w-3.5 h-3.5 text-goldlight" aria-hidden="true" /> BUY NOW
            </motion.button>
          </div>
        </div>

        <div className="flex flex-col flex-grow px-1">
          <div className="flex items-center gap-1.5 text-xs text-cocoa-light mb-1">
            <span className="uppercase tracking-widest font-semibold">{product.category}</span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-0.5">
              <Star className="w-3 h-3 fill-gold text-gold" aria-hidden="true" /> {product.rating} ({product.reviewCount})
            </span>
          </div>
          <h3 className="font-serif text-lg font-semibold text-espresso leading-snug group-hover:text-cocoa transition-colors">
            {product.name} <span className="text-cocoa-light font-sans text-sm font-normal">· {product.weight}</span>
          </h3>
          <p className="mt-1.5 flex items-baseline gap-2">
            <span className="text-espresso font-bold">
              {product.variants.length > 0 && <span className="text-cocoa-light font-normal text-sm">From </span>}
              {inr(product.variants.length > 0 ? Math.min(...product.variants.map((v) => v.price)) : product.price)}
            </span>
            {off > 0 && product.variants.length === 0 && <span className="text-cocoa-light line-through text-sm">{inr(product.mrp)}</span>}
          </p>
        </div>
      </Link>

      {/* mobile quick-add (hover actions don't exist on touch) */}
      <button
        onClick={quickAdd}
        aria-label={`Add ${product.name} to cart`}
        className="sm:hidden absolute bottom-[4.5rem] right-3 p-3 rounded-full bg-espresso text-cream shadow-lg active:scale-90 transition-transform"
      >
        <ShoppingBag className="w-4 h-4" aria-hidden="true" />
      </button>
    </motion.article>
  );
}

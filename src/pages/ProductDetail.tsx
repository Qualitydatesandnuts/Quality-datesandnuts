import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, Zap, Heart, Star, Truck, ShieldCheck, Leaf, Minus, Plus, ChevronRight } from 'lucide-react';
import Seo, { SITE_URL } from '../components/Seo';
import ProductCard from '../components/ProductCard';
import Reveal from '../components/Reveal';
import { api, inr, type Product, type Review, type Variant } from '../lib/api';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import { rememberViewed } from '../lib/prefs';
import { BadgeCheck, ImagePlus } from 'lucide-react';

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart, setIsCartOpen } = useCart();
  const { toggle, has } = useWishlist();
  const { toast } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [boughtTogether, setBoughtTogether] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeImage, setActiveImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [variant, setVariant] = useState<Variant | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [reviewForm, setReviewForm] = useState({ name: '', rating: 5, comment: '', orderNumber: '', imageDataUrl: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setProduct(null);
    setNotFound(false);
    setActiveImage(0);
    setQty(1);
    setVariant(null);
    api.product(slug)
      .then(({ product, related, boughtTogether, reviews }) => {
        setProduct(product);
        setRelated(related);
        setBoughtTogether(boughtTogether || []);
        setReviews(reviews);
        if (product.variants.length > 0) {
          setVariant(product.variants.find((v) => v.label === product.weight) || product.variants[0]);
        }
        rememberViewed(product.slug);
      })
      .catch(() => setNotFound(true));
  }, [slug]);

  const jsonLd = useMemo(() => {
    if (!product) return undefined;
    return [
      {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: `${product.name} ${product.weight}`,
        image: product.images.map((i) => `${SITE_URL}${i}`),
        description: product.description,
        sku: product.slug,
        brand: { '@type': 'Brand', name: 'Quality Dates and Nuts' },
        aggregateRating: product.reviewCount > 0
          ? { '@type': 'AggregateRating', ratingValue: product.rating, reviewCount: product.reviewCount }
          : undefined,
        offers: {
          '@type': 'Offer',
          url: `${SITE_URL}/product/${product.slug}`,
          priceCurrency: 'INR',
          price: product.price,
          availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          shippingDetails: { '@type': 'OfferShippingDetails', shippingRate: { '@type': 'MonetaryAmount', value: product.price >= 999 ? 0 : 49, currency: 'INR' } },
        },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: product.category, item: `${SITE_URL}/shop?category=${encodeURIComponent(product.category)}` },
          { '@type': 'ListItem', position: 3, name: product.name, item: `${SITE_URL}/product/${product.slug}` },
        ],
      },
    ];
  }, [product]);

  if (notFound) {
    return (
      <div className="pt-40 pb-24 text-center px-4">
        <h1 className="font-serif text-3xl font-semibold text-espresso mb-4">Product not found</h1>
        <Link to="/shop" className="text-gold font-bold underline">Back to the shop</Link>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto grid lg:grid-cols-2 gap-12" aria-busy="true">
        <div className="skeleton w-full aspect-[4/5] rounded-[2rem]" />
        <div className="space-y-4 pt-8">
          <div className="skeleton h-10 w-3/4 rounded-full" />
          <div className="skeleton h-6 w-1/3 rounded-full" />
          <div className="skeleton h-32 w-full rounded-3xl" />
        </div>
      </div>
    );
  }

  const activePrice = variant?.price ?? product.price;
  const activeMrp = variant?.mrp ?? product.mrp;
  const off = activeMrp > activePrice ? Math.round(((activeMrp - activePrice) / activeMrp) * 100) : 0;
  const wished = has(product.id);

  const add = () => {
    addToCart(product, qty, variant);
    toast(`${product.name} added to cart`);
    setIsCartOpen(true);
  };

  const buyNow = () => {
    addToCart(product, qty, variant);
    navigate('/checkout');
  };

  const attachReviewImage = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setReviewForm((f) => ({ ...f, imageDataUrl: String(reader.result) }));
    reader.readAsDataURL(file);
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.addReview({
        productId: product.id,
        name: reviewForm.name,
        rating: reviewForm.rating,
        comment: reviewForm.comment,
        orderNumber: reviewForm.orderNumber || undefined,
        imageDataUrl: reviewForm.imageDataUrl || undefined,
      });
      toast('Thanks for your review!');
      const fresh = await api.product(product.slug);
      setReviews(fresh.reviews);
      setProduct(fresh.product);
      setReviewForm({ name: '', rating: 5, comment: '', orderNumber: '', imageDataUrl: '' });
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not submit review', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <Seo
        title={`${product.name} ${product.weight} — Buy Online`}
        description={`${product.description} ✓ ${inr(product.price)} ✓ Free shipping above ₹999 ✓ Easy UPI payment.`}
        path={`/product/${product.slug}`}
        image={product.image}
        jsonLd={jsonLd}
      />

      {/* breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-cocoa-light mb-8">
        <Link to="/" className="hover:text-espresso">Home</Link>
        <ChevronRight className="w-3 h-3" aria-hidden="true" />
        <Link to={`/shop?category=${encodeURIComponent(product.category)}`} className="hover:text-espresso">{product.category}</Link>
        <ChevronRight className="w-3 h-3" aria-hidden="true" />
        <span className="text-espresso font-medium">{product.name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
        {/* gallery */}
        <div>
          <motion.div
            key={activeImage}
            initial={{ opacity: 0.4, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35 }}
            className="w-full aspect-[4/5] rounded-[2rem] overflow-hidden bg-cream-dark shadow-xl shadow-espresso/10 relative"
          >
            <img src={product.images[activeImage] || product.image} alt={`${product.name} ${product.weight}`} className="w-full h-full object-cover" />
            {product.badge && (
              <span className="absolute top-5 left-5 bg-espresso/90 backdrop-blur text-goldlight text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-full">
                {product.badge}
              </span>
            )}
          </motion.div>
          {product.images.length > 1 && (
            <div className="flex gap-3 mt-4">
              {product.images.map((img, i) => (
                <button
                  key={img}
                  onClick={() => setActiveImage(i)}
                  aria-label={`View image ${i + 1}`}
                  className={`w-20 h-24 rounded-2xl overflow-hidden border-2 transition-all ${activeImage === i ? 'border-gold shadow-lg' : 'border-transparent opacity-70 hover:opacity-100'}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* details */}
        <div className="flex flex-col">
          <p className="text-xs font-bold tracking-[0.25em] uppercase text-gold mb-3">{product.category}</p>
          <h1 className="font-serif text-4xl md:text-5xl font-semibold text-espresso leading-[1.1]">
            {product.name} <span className="text-cocoa-light text-2xl font-sans font-light">· {product.weight}</span>
          </h1>

          <div className="flex items-center gap-2 mt-4 text-sm">
            <span className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-full border border-espresso/10">
              <Star className="w-4 h-4 fill-gold text-gold" aria-hidden="true" />
              <strong>{product.rating}</strong>
              <span className="text-cocoa-light">({product.reviewCount} reviews)</span>
            </span>
            {product.stock <= 10 && product.stock > 0 && (
              <span className="text-red-600 font-semibold text-xs bg-red-50 px-3 py-1.5 rounded-full">Only {product.stock} left</span>
            )}
          </div>

          <div className="flex items-baseline gap-3 mt-6">
            <span className="text-4xl font-bold text-espresso">{inr(activePrice)}</span>
            {off > 0 && (
              <>
                <span className="text-xl text-cocoa-light line-through">{inr(activeMrp)}</span>
                <span className="bg-gold text-espresso text-sm font-bold px-3 py-1 rounded-full">{off}% OFF</span>
              </>
            )}
          </div>
          <p className="text-xs text-cocoa-light mt-1">Inclusive of all taxes</p>

          {/* pack-size variants */}
          {product.variants.length > 0 && (
            <div className="mt-6">
              <p className="text-xs font-bold tracking-widest uppercase text-cocoa-light mb-2.5">Pack size</p>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Pack size">
                {product.variants.map((v) => (
                  <button
                    key={v.label}
                    role="radio"
                    aria-checked={variant?.label === v.label}
                    onClick={() => setVariant(v)}
                    className={`px-5 py-3 rounded-2xl border-2 text-sm font-bold transition-all ${
                      variant?.label === v.label
                        ? 'border-gold bg-goldlight/15 text-espresso shadow-md'
                        : 'border-espresso/10 bg-white text-cocoa hover:border-gold/40'
                    }`}
                  >
                    {v.label}
                    <span className="block text-xs font-semibold text-cocoa-light mt-0.5">{inr(v.price)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className="mt-7 text-cocoa leading-relaxed">{product.description}</p>

          {product.benefits.length > 0 && (
            <ul className="mt-6 grid sm:grid-cols-2 gap-2.5">
              {product.benefits.map((b) => (
                <li key={b} className="flex items-center gap-2.5 text-sm text-cocoa bg-white rounded-2xl px-4 py-3 border border-espresso/5">
                  <Leaf className="w-4 h-4 text-gold flex-shrink-0" aria-hidden="true" /> {b}
                </li>
              ))}
            </ul>
          )}

          {/* qty + actions */}
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-4 border border-espresso/15 rounded-full p-1.5 bg-white">
              <button onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Decrease quantity" className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-cream-dark transition-colors">
                <Minus className="w-4 h-4" aria-hidden="true" />
              </button>
              <span className="font-bold text-lg w-8 text-center" aria-live="polite">{qty}</span>
              <button onClick={() => setQty(qty + 1)} aria-label="Increase quantity" className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-cream-dark transition-colors">
                <Plus className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
            <button
              onClick={() => { toggle(product.id); toast(wished ? 'Removed from wishlist' : 'Saved to wishlist'); }}
              aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
              className="p-4 rounded-full bg-white border border-espresso/15 hover:border-gold transition-colors"
            >
              <Heart className={`w-5 h-5 ${wished ? 'fill-red-500 text-red-500' : 'text-espresso'}`} aria-hidden="true" />
            </button>
          </div>

          <div className="mt-4 grid sm:grid-cols-2 gap-3">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={add}
              className="flex items-center justify-center gap-2.5 bg-white border-2 border-espresso text-espresso py-4 rounded-full text-sm font-bold tracking-widest uppercase hover:bg-cream-dark transition-colors"
            >
              <ShoppingBag className="w-5 h-5" aria-hidden="true" /> Add to Cart
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={buyNow}
              className="flex items-center justify-center gap-2.5 bg-espresso text-cream py-4 rounded-full text-sm font-bold tracking-widest uppercase hover:bg-cocoa transition-colors shadow-xl shadow-espresso/25"
            >
              <Zap className="w-5 h-5 text-goldlight" aria-hidden="true" /> Buy Now · {inr(activePrice * qty)}
            </motion.button>
          </div>

          <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-sm text-cocoa border-t border-espresso/10 pt-6">
            <span className="flex items-center gap-2"><Truck className="w-4 h-4 text-gold" aria-hidden="true" /> Free shipping above ₹999</span>
            <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-gold" aria-hidden="true" /> UPI · GPay · PhonePe · Cards</span>
            <span className="flex items-center gap-2"><Leaf className="w-4 h-4 text-gold" aria-hidden="true" /> 100% natural</span>
          </div>
        </div>
      </div>

      {/* reviews */}
      <section className="mt-24 max-w-3xl" aria-labelledby="reviews-heading">
        <Reveal>
          <h2 id="reviews-heading" className="font-serif text-3xl font-semibold text-espresso mb-8">Customer Reviews</h2>
        </Reveal>
        {reviews.length === 0 && <p className="text-cocoa-light mb-8">No reviews yet — be the first!</p>}
        <div className="space-y-4 mb-12">
          {reviews.map((r) => (
            <Reveal key={r.id}>
              <article className="bg-white rounded-3xl p-6 border border-espresso/5">
                <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                  <span className="flex items-center gap-2">
                    <strong className="text-espresso">{r.name}</strong>
                    {!!r.verified && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-green-700 bg-green-50 px-2.5 py-1 rounded-full">
                        <BadgeCheck className="w-3 h-3" aria-hidden="true" /> Verified purchase
                      </span>
                    )}
                  </span>
                  <span className="flex" aria-label={`${r.rating} out of 5 stars`}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < r.rating ? 'fill-gold text-gold' : 'text-espresso/15'}`} aria-hidden="true" />
                    ))}
                  </span>
                </div>
                <p className="text-cocoa text-sm leading-relaxed">{r.comment}</p>
                {r.image && (
                  <img src={r.image} alt={`Photo from ${r.name}'s review`} loading="lazy" className="mt-3 w-24 h-24 rounded-xl object-cover border border-espresso/10" />
                )}
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <form onSubmit={submitReview} className="bg-white rounded-3xl p-7 border border-espresso/5 space-y-4">
            <h3 className="font-serif font-semibold text-espresso text-lg">Write a review</h3>
            <div className="flex gap-1" role="radiogroup" aria-label="Rating">
              {Array.from({ length: 5 }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  role="radio"
                  aria-checked={reviewForm.rating === i + 1}
                  aria-label={`${i + 1} stars`}
                  onClick={() => setReviewForm((f) => ({ ...f, rating: i + 1 }))}
                >
                  <Star className={`w-6 h-6 transition-colors ${i < reviewForm.rating ? 'fill-gold text-gold' : 'text-espresso/20 hover:text-gold'}`} aria-hidden="true" />
                </button>
              ))}
            </div>
            <input
              required
              value={reviewForm.name}
              onChange={(e) => setReviewForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Your name"
              aria-label="Your name"
              className="w-full bg-cream rounded-2xl px-5 py-3.5 text-sm outline-none border border-espresso/10 focus:border-gold transition-colors"
            />
            <textarea
              value={reviewForm.comment}
              onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))}
              placeholder="What did you think?"
              aria-label="Your review"
              rows={3}
              className="w-full bg-cream rounded-2xl px-5 py-3.5 text-sm outline-none border border-espresso/10 focus:border-gold transition-colors resize-none"
            />
            <input
              value={reviewForm.orderNumber}
              onChange={(e) => setReviewForm((f) => ({ ...f, orderNumber: e.target.value.toUpperCase() }))}
              placeholder="Order number (optional — earns a Verified badge)"
              aria-label="Order number"
              className="w-full bg-cream rounded-2xl px-5 py-3.5 text-sm outline-none border border-espresso/10 focus:border-gold transition-colors"
            />
            <div className="flex items-center gap-3 flex-wrap">
              <label className="inline-flex items-center gap-2 text-sm font-semibold text-cocoa bg-cream px-4 py-2.5 rounded-full cursor-pointer hover:bg-goldlight/30 transition-colors">
                <ImagePlus className="w-4 h-4" aria-hidden="true" /> {reviewForm.imageDataUrl ? 'Change photo' : 'Add a photo'}
                <input type="file" accept="image/*" hidden onChange={(e) => attachReviewImage(e.target.files)} />
              </label>
              {reviewForm.imageDataUrl && <img src={reviewForm.imageDataUrl} alt="Review preview" className="w-12 h-12 rounded-lg object-cover" />}
              <button type="submit" disabled={submitting} className="ml-auto bg-espresso text-cream px-8 py-3.5 rounded-full text-sm font-bold hover:bg-cocoa transition-colors disabled:opacity-50">
                {submitting ? 'Submitting…' : 'Submit review'}
              </button>
            </div>
          </form>
        </Reveal>
      </section>

      {/* frequently bought together */}
      {boughtTogether.length > 0 && (
        <section className="mt-24" aria-labelledby="fbt-heading">
          <Reveal>
            <h2 id="fbt-heading" className="font-serif text-3xl font-semibold text-espresso mb-10">Frequently bought together</h2>
          </Reveal>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-12 sm:gap-x-8">
            {boughtTogether.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        </section>
      )}

      {/* related */}
      {related.length > 0 && (
        <section className="mt-24" aria-labelledby="related-heading">
          <Reveal>
            <h2 id="related-heading" className="font-serif text-3xl font-semibold text-espresso mb-10">You may also love</h2>
          </Reveal>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-12 sm:gap-x-8">
            {related.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        </section>
      )}
    </div>
  );
}

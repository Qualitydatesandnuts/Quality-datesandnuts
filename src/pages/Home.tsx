import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Leaf, ShieldCheck, Truck, BadgePercent, Quote, ChevronDown } from 'lucide-react';
import Hero from '../components/Hero';
import ProductCard from '../components/ProductCard';
import Reveal from '../components/Reveal';
import RecentlyViewed from '../components/RecentlyViewed';
import Seo, { SITE_URL } from '../components/Seo';
import { api, type Product } from '../lib/api';
import { faqs } from '../lib/faqs';

const categories = [
  { name: 'Dates', emoji: '🌴', blurb: 'Safawi · Medjoul · Ajwa' },
  { name: 'Stuffed Dates', emoji: '😋', blurb: 'Our signature delicacy' },
  { name: 'Nuts', emoji: '🌰', blurb: 'Almonds · Cashews · Pista' },
  { name: 'Dry Fruits', emoji: '🍇', blurb: 'Figs · Raisins · Apricots' },
  { name: 'Seeds', emoji: '🌱', blurb: 'Pumpkin · Chia' },
  { name: 'Gifting', emoji: '🎁', blurb: 'Hampers & gift boxes' },
];

const testimonials = [
  { name: 'Ayesha K.', city: 'Chennai', text: 'The almond stuffed dates are unreal — fresh, soft and clearly premium. My monthly order is now a ritual.' },
  { name: 'Rahul M.', city: 'Bengaluru', text: 'Ordered gift boxes for Diwali. Packaging was gorgeous and delivery was faster than promised.' },
  { name: 'Fatima S.', city: 'Hyderabad', text: 'Finally a store where the nuts actually taste fresh. The salted almonds disappear in a day.' },
];

const trust = [
  { icon: Leaf, title: '100% Natural', text: 'No added sugar or preservatives' },
  { icon: Truck, title: 'Fast Delivery', text: 'Same-day dispatch before 2pm' },
  { icon: ShieldCheck, title: 'Quality Promise', text: '48-hour replacement guarantee' },
  { icon: BadgePercent, title: 'Fair Prices', text: 'Farm-direct sourcing, no middlemen' },
];

const homeJsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Quality Dates and Nuts',
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    contactPoint: { '@type': 'ContactPoint', telephone: '+91-99999-99999', contactType: 'customer service', areaServed: 'IN' },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Quality Dates and Nuts',
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/shop?search={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.slice(0, 4).map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  },
];

export default function Home() {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [openFaq, setOpenFaq] = useState(0);

  useEffect(() => {
    api.products({ featured: 'true' }).then(setFeatured).catch(() => {});
  }, []);

  return (
    <>
      <Seo
        title="Quality Dates and Nuts — Premium Dates, Nuts & Dry Fruits Online"
        description="Buy premium Safawi, Medjoul & Ajwa dates, almond stuffed dates, nuts and dry fruits online. 100% natural, no added sugar. Free shipping above ₹999, easy UPI payment, pan-India delivery."
        path="/"
        image="/product/almonddates400g.png"
        jsonLd={homeJsonLd}
      />

      <Hero />

      {/* categories */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" aria-labelledby="categories-heading">
        <Reveal>
          <h2 id="categories-heading" className="font-serif text-3xl md:text-4xl font-semibold text-espresso text-center">Shop by Category</h2>
          <p className="text-cocoa-light text-center mt-3">From everyday snacking to royal gifting</p>
        </Reveal>
        <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((c, i) => (
            <Reveal key={c.name} delay={i * 0.05}>
              <Link
                to={`/shop?category=${encodeURIComponent(c.name)}`}
                className="group flex flex-col items-center text-center bg-white rounded-3xl p-6 border border-espresso/5 hover:border-gold/40 hover:shadow-xl hover:shadow-gold/10 transition-all hover:-translate-y-1"
              >
                <span className="text-4xl mb-3 group-hover:scale-110 transition-transform" aria-hidden="true">{c.emoji}</span>
                <span className="font-serif font-semibold text-espresso">{c.name}</span>
                <span className="text-[11px] text-cocoa-light mt-1">{c.blurb}</span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* featured products */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" aria-labelledby="featured-heading">
        <Reveal className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div>
            <h2 id="featured-heading" className="font-serif text-3xl md:text-4xl font-semibold text-espresso">The Collection</h2>
            <p className="text-cocoa-light mt-3">Bestsellers, hand-picked for the discerning palate</p>
          </div>
          <Link to="/shop" className="group inline-flex items-center gap-2 text-sm font-bold tracking-widest uppercase text-espresso border-b-2 border-gold pb-1 w-fit hover:text-cocoa transition-colors">
            View all <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
          </Link>
        </Reveal>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-12 sm:gap-x-8">
          {featured.slice(0, 8).map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
      </section>

      {/* video promo band */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <Reveal>
          <div className="relative rounded-[2.5rem] overflow-hidden bg-espresso grid lg:grid-cols-2">
            <div className="p-10 md:p-16 flex flex-col justify-center">
              <p className="text-goldlight text-xs font-bold tracking-[0.25em] uppercase mb-4">Our Signature</p>
              <h2 className="font-serif text-3xl md:text-5xl font-semibold text-cream leading-tight">
                Dates, stuffed with pure indulgence.
              </h2>
              <p className="mt-6 text-cream/70 leading-relaxed max-w-md">
                Premium Safawi dates, hand-stuffed with whole Californian almonds. No added sugar — nature already perfected the recipe.
              </p>
              <div className="mt-9 flex flex-wrap gap-4">
                <Link to="/product/almond-dates-400g" className="bg-gold text-espresso px-8 py-4 rounded-full text-sm font-bold hover:bg-goldlight transition-colors">
                  Shop Almond Dates
                </Link>
                <Link to="/shop?category=Stuffed%20Dates" className="text-cream border border-cream/30 px-8 py-4 rounded-full text-sm font-semibold hover:bg-cream/10 transition-colors">
                  All stuffed dates
                </Link>
              </div>
            </div>
            <div className="relative min-h-[320px] lg:min-h-[520px]">
              <video
                src="/product/ad-vedio.mp4"
                autoPlay
                muted
                loop
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
                aria-label="Almond stuffed dates promotional video"
              />
            </div>
          </div>
        </Reveal>
      </section>

      {/* festival gifting strip */}
      <section className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" aria-label="Shop by occasion">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { slug: 'diwali', emoji: '🪔', name: 'Diwali' },
            { slug: 'ramadan', emoji: '🌙', name: 'Ramadan & Eid' },
            { slug: 'rakhi', emoji: '🪢', name: 'Rakhi' },
            { slug: 'wedding', emoji: '💍', name: 'Weddings & Corporate' },
          ].map((o, i) => (
            <Reveal key={o.slug} delay={i * 0.05}>
              <Link
                to={`/occasions/${o.slug}`}
                className="group flex items-center gap-3 bg-espresso text-cream rounded-3xl px-6 py-5 hover:bg-cocoa transition-colors"
              >
                <span className="text-3xl group-hover:scale-110 transition-transform" aria-hidden="true">{o.emoji}</span>
                <span>
                  <span className="block font-serif font-semibold">{o.name}</span>
                  <span className="block text-xs text-goldlight">Gifting collection →</span>
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <RecentlyViewed />

      {/* trust badges */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" aria-label="Why shop with us">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {trust.map((t, i) => (
            <Reveal key={t.title} delay={i * 0.07}>
              <div className="bg-white rounded-3xl p-7 border border-espresso/5 h-full">
                <t.icon className="w-7 h-7 text-gold mb-4" aria-hidden="true" />
                <h3 className="font-serif font-semibold text-espresso">{t.title}</h3>
                <p className="text-sm text-cocoa-light mt-1.5">{t.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* testimonials */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" aria-labelledby="testimonials-heading">
        <Reveal>
          <h2 id="testimonials-heading" className="font-serif text-3xl md:text-4xl font-semibold text-espresso text-center">Loved across India</h2>
        </Reveal>
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <Reveal key={t.name} delay={i * 0.08}>
              <motion.figure
                whileHover={{ y: -6 }}
                className="bg-white rounded-3xl p-8 border border-espresso/5 h-full flex flex-col"
              >
                <Quote className="w-8 h-8 text-gold/40 mb-4" aria-hidden="true" />
                <blockquote className="text-cocoa leading-relaxed flex-1">“{t.text}”</blockquote>
                <figcaption className="mt-6 text-sm">
                  <span className="font-bold text-espresso">{t.name}</span>
                  <span className="text-cocoa-light"> · {t.city}</span>
                </figcaption>
              </motion.figure>
            </Reveal>
          ))}
        </div>
      </section>

      {/* FAQ preview */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto" aria-labelledby="faq-heading">
        <Reveal>
          <h2 id="faq-heading" className="font-serif text-3xl md:text-4xl font-semibold text-espresso text-center mb-10">Questions, answered</h2>
        </Reveal>
        <div className="space-y-3">
          {faqs.slice(0, 4).map((f, i) => (
            <Reveal key={f.q} delay={i * 0.05}>
              <div className="bg-white rounded-2xl border border-espresso/5 overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
                  aria-expanded={openFaq === i}
                  className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left font-semibold text-espresso"
                >
                  {f.q}
                  <ChevronDown className={`w-5 h-5 text-gold flex-shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} aria-hidden="true" />
                </button>
                <motion.div
                  initial={false}
                  animate={{ height: openFaq === i ? 'auto' : 0 }}
                  className="overflow-hidden"
                >
                  <p className="px-6 pb-5 text-cocoa-light leading-relaxed text-sm">{f.a}</p>
                </motion.div>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal className="text-center mt-8">
          <Link to="/faq" className="text-sm font-bold tracking-widest uppercase text-espresso border-b-2 border-gold pb-1 hover:text-cocoa transition-colors">
            All FAQs
          </Link>
        </Reveal>
      </section>
    </>
  );
}

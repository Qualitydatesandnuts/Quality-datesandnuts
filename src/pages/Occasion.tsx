import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Gift, MessageCircle } from 'lucide-react';
import Seo from '../components/Seo';
import Reveal from '../components/Reveal';
import ProductCard from '../components/ProductCard';
import { api, WHATSAPP_NUMBER, type Product } from '../lib/api';

const occasions: Record<string, { emoji: string; title: string; tagline: string; blurb: string; categories: string[] }> = {
  diwali: {
    emoji: '🪔',
    title: 'Diwali Gifting',
    tagline: 'Light up the festival with wholesome sweetness',
    blurb: 'Skip the refined-sugar mithai this year. Our date and dry fruit hampers are the gift that feels indulgent and treats people well — beautifully boxed, pan-India delivery, bulk corporate orders welcome.',
    categories: ['Gifting', 'Stuffed Dates', 'Dry Fruits'],
  },
  ramadan: {
    emoji: '🌙',
    title: 'Ramadan & Eid Collection',
    tagline: 'Break your fast the traditional way',
    blurb: 'Dates have opened iftar tables for centuries. From holy Ajwa to honey-sweet Medjoul, our Ramadan collection brings the finest of Madinah to your table — and our gift boxes make Eid unforgettable.',
    categories: ['Dates', 'Stuffed Dates', 'Gifting'],
  },
  rakhi: {
    emoji: '🪢',
    title: 'Rakhi Gifting',
    tagline: 'A healthier way to say you care',
    blurb: 'Trade the usual box of sweets for something your sibling will actually finish — premium nuts, chocolate-coated dates and elegant hampers, delivered anywhere in India.',
    categories: ['Gifting', 'Snacks', 'Nuts'],
  },
  wedding: {
    emoji: '💍',
    title: 'Wedding & Corporate Hampers',
    tagline: 'Gifts that honour your guests',
    blurb: 'Custom hampers for weddings, festivals and corporate milestones. Personalised notes, bulk pricing and doorstep delivery — tell us the occasion and we will build the box.',
    categories: ['Gifting', 'Dates', 'Dry Fruits'],
  },
};

export default function Occasion() {
  const { slug = '' } = useParams();
  const config = occasions[slug];
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (!config) return;
    api.products().then((all) => {
      const ranked = all
        .filter((p) => config.categories.includes(p.category))
        .sort((a, b) => config.categories.indexOf(a.category) - config.categories.indexOf(b.category) || b.reviewCount - a.reviewCount);
      setProducts(ranked.slice(0, 8));
    }).catch(() => {});
  }, [slug]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!config) {
    return (
      <div className="pt-40 pb-24 text-center px-4 min-h-screen">
        <h1 className="font-serif text-3xl font-semibold text-espresso mb-4">Occasion not found</h1>
        <Link to="/shop?category=Gifting" className="text-gold font-bold underline">Browse gifting</Link>
      </div>
    );
  }

  return (
    <div className="pt-36 pb-24 min-h-screen">
      <Seo
        title={`${config.title} — Premium Dates & Nuts Hampers`}
        description={`${config.blurb} Order online from Quality Dates and Nuts — free shipping above ₹999.`}
        path={`/occasions/${slug}`}
      />

      <header className="text-center px-4 max-w-3xl mx-auto mb-16">
        <Reveal>
          <span className="text-6xl" aria-hidden="true">{config.emoji}</span>
          <h1 className="font-serif text-4xl md:text-6xl font-semibold text-espresso mt-6 leading-tight">{config.title}</h1>
          <p className="text-gold font-bold tracking-widest uppercase text-sm mt-4">{config.tagline}</p>
          <p className="text-cocoa-light mt-6 leading-relaxed">{config.blurb}</p>
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hi! I'm interested in ${config.title} — bulk/custom hampers.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-8 bg-espresso text-cream px-8 py-4 rounded-full text-sm font-bold hover:bg-cocoa transition-colors"
          >
            <MessageCircle className="w-4 h-4 text-[#25D366]" aria-hidden="true" /> Discuss bulk & custom orders
          </a>
        </Reveal>
      </header>

      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" aria-label="Curated products">
        <Reveal>
          <h2 className="flex items-center gap-2 font-serif text-2xl font-semibold text-espresso mb-10">
            <Gift className="w-6 h-6 text-gold" aria-hidden="true" /> Curated for the occasion
          </h2>
        </Reveal>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-12 sm:gap-x-8">
          {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
      </section>
    </div>
  );
}

export const OCCASION_SLUGS = Object.keys(occasions);

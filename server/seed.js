import { db } from './db.js';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const GEN_DIR = path.join(PUBLIC_DIR, 'product', 'gen');
const SITE_URL = process.env.SITE_URL || 'https://qualitydatesandnuts.com';

if (!fs.existsSync(GEN_DIR)) fs.mkdirSync(GEN_DIR, { recursive: true });

// Safety guard: seeding ERASES the whole catalog. Once the store has data,
// require an explicit --force so it can't be wiped by accident.
const force = process.argv.includes('--force');
const existingProducts = db.prepare('SELECT COUNT(*) AS n FROM products').get().n;
if (existingProducts > 0 && !force) {
  console.log(`Catalog already has ${existingProducts} products — nothing was changed.`);
  console.log('Re-seeding would ERASE all products, coupons, reviews, announcements and blog posts');
  console.log('(including anything you added in the admin portal) and restore the demo catalog.');
  console.log('Orders and customer accounts are always kept.');
  console.log('');
  console.log('If you really want to reset the catalog, run:  npm run seed -- --force');
  process.exit(0);
}

// ---------- SVG placeholder generator (until real photography is added) ----------
const palettes = [
  ['#8B5A2B', '#5C3A1E'], // date brown
  ['#B8860B', '#7A5A0B'], // gold
  ['#6B8E23', '#3F5514'], // pistachio
  ['#A0522D', '#6E3A1F'], // sienna
  ['#7B3F00', '#4A2600'], // chocolate
  ['#996515', '#5E3D0D'], // amber
];

function svgFor(name, emoji, weight, idx) {
  const [c1, c2] = palettes[idx % palettes.length];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.42" r="0.55">
      <stop offset="0" stop-color="#FFF8E7" stop-opacity="0.35"/><stop offset="1" stop-color="#FFF8E7" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="800" height="1000" fill="url(#bg)"/>
  <rect width="800" height="1000" fill="url(#glow)"/>
  <circle cx="400" cy="420" r="230" fill="#FFF8E7" fill-opacity="0.10"/>
  <circle cx="400" cy="420" r="180" fill="#FFF8E7" fill-opacity="0.10"/>
  <text x="400" y="480" font-size="190" text-anchor="middle">${emoji}</text>
  <text x="400" y="750" font-family="Georgia, serif" font-size="44" font-weight="bold" fill="#FFF8E7" text-anchor="middle">${name.replace(/&/g, '&amp;')}</text>
  <text x="400" y="805" font-family="Georgia, serif" font-size="30" fill="#FFF8E7" fill-opacity="0.75" text-anchor="middle">${weight}</text>
  <text x="400" y="930" font-family="Georgia, serif" font-size="24" letter-spacing="6" fill="#E8C87A" text-anchor="middle">QUALITY DATES &amp; NUTS</text>
</svg>`;
}

// ---------- Catalog ----------
const catalog = [
  // Signature products with real photography
  { slug: 'almond-dates-400g', name: 'Almond Stuffed Dates', category: 'Stuffed Dates', price: 499, mrp: 599, weight: '400g', badge: 'Bestseller', rating: 4.9, reviewCount: 132, featured: 1, image: '/product/almonddates400g.png', images: ['/product/almonddates400g.png', '/product/almonddates200F&B.jpg', '/product/almonddates200gbackside.png'], description: 'Our flagship delicacy — premium Safawi dates hand-stuffed with whole Californian almonds. A perfect marriage of natural caramel sweetness and rich crunch, with no added sugar or preservatives.', benefits: ['No added sugar', 'Rich in fibre & Vitamin E', 'Natural energy booster', 'Hand-stuffed in small batches'] },
  { slug: 'almond-dates-200g', name: 'Almond Stuffed Dates', category: 'Stuffed Dates', price: 269, mrp: 319, weight: '200g', badge: '', rating: 4.9, reviewCount: 87, featured: 1, image: '/product/almonddates200F&B.jpg', images: ['/product/almonddates200F&B.jpg', '/product/almonddates200gbackside.png'], description: 'The travel-friendly pack of our signature almond-stuffed Safawi dates. Perfect for gifting, office snacking, or a guilt-free dessert.', benefits: ['No added sugar', 'Perfect gifting size', 'Rich in iron & magnesium'] },
  { slug: 'roasted-salted-almonds-400g', name: 'Roasted & Salted Almonds', category: 'Nuts', price: 549, mrp: 649, weight: '400g', badge: 'Popular', rating: 4.7, reviewCount: 94, featured: 1, image: '/product/saltedalmond400g.png', images: ['/product/saltedalmond400g.png'], description: 'Premium Californian almonds slow-roasted and finished with a whisper of Himalayan pink salt. Impossibly crunchy, dangerously snackable.', benefits: ['Slow-roasted, never fried', 'Himalayan pink salt', 'High protein snack'] },

  // Dates
  { slug: 'premium-safawi-dates-500g', name: 'Premium Safawi Dates', category: 'Dates', price: 449, mrp: 529, weight: '500g', badge: '', rating: 4.8, reviewCount: 76, featured: 1, emoji: '🌴', description: 'Soft, dark and luxuriously sweet Safawi dates from Madinah farms. Melt-in-mouth texture with notes of caramel and toffee.', benefits: ['Single-origin Madinah', 'Naturally sweet', 'Rich in potassium'] },
  { slug: 'medjoul-jumbo-dates-500g', name: 'Medjoul Jumbo Dates', category: 'Dates', price: 749, mrp: 899, weight: '500g', badge: 'Premium', rating: 4.9, reviewCount: 84, featured: 1, emoji: '🌴', description: 'The king of dates. Jordan-grown jumbo Medjoul with thick honeyed flesh and a small pit — every piece a dessert in itself.', benefits: ['Jumbo grade', 'Honey-caramel flavour', 'No preservatives'] },
  { slug: 'ajwa-dates-400g', name: 'Holy Ajwa Dates', category: 'Dates', price: 899, mrp: 999, weight: '400g', badge: '', rating: 4.8, reviewCount: 61, emoji: '🌴', description: 'The revered Ajwa of Madinah — soft, fruity, prune-like dates prized for centuries for their taste and traditional significance.', benefits: ['Authentic Madinah Ajwa', 'Soft & fruity', 'Antioxidant rich'] },
  { slug: 'kalmi-dates-500g', name: 'Kalmi (Safawi Round) Dates', category: 'Dates', price: 399, mrp: 459, weight: '500g', badge: '', rating: 4.6, reviewCount: 43, emoji: '🌴', description: 'Plump, chewy Kalmi dates with deep molasses sweetness — a classic everyday indulgence.', benefits: ['Everyday indulgence', 'Iron rich', 'Kids favourite'] },

  // Nuts
  { slug: 'california-almonds-500g', name: 'California Almonds', category: 'Nuts', price: 599, mrp: 699, weight: '500g', badge: '', rating: 4.7, reviewCount: 118, featured: 1, emoji: '🌰', description: '100% natural premium Californian almonds. Crunchy, fresh, and packed with Vitamin E — the everyday super-snack.', benefits: ['Vitamin E rich', 'Heart healthy', 'Lab-tested purity'] },
  { slug: 'cashew-w180-500g', name: 'Jumbo Cashews W180', category: 'Nuts', price: 799, mrp: 949, weight: '500g', badge: 'Premium', rating: 4.8, reviewCount: 66, emoji: '🥜', description: 'W180 “King of Cashews” grade — the largest, creamiest whole cashews. Raw, unsalted, and irresistibly buttery.', benefits: ['W180 jumbo grade', 'Creamy & whole', 'Great for cooking & snacking'] },
  { slug: 'pistachios-roasted-250g', name: 'Roasted Pistachios', category: 'Nuts', price: 449, mrp: 529, weight: '250g', badge: '', rating: 4.7, reviewCount: 52, emoji: '🥜', description: 'Iranian pistachios roasted in shell with a light salting. Crack, snack, repeat.', benefits: ['Iranian origin', 'Lightly salted', 'Protein packed'] },
  { slug: 'walnut-kernels-250g', name: 'Chile Walnut Kernels', category: 'Nuts', price: 499, mrp: 599, weight: '250g', badge: '', rating: 4.6, reviewCount: 38, emoji: '🌰', description: 'Light-coloured halves of Chilean walnuts — fresh, mildly sweet, zero bitterness. Brain food at its finest.', benefits: ['Omega-3 rich', 'Fresh light halves', 'No bitterness'] },
  { slug: 'mamra-almonds-250g', name: 'Mamra Almonds', category: 'Nuts', price: 899, mrp: 1049, weight: '250g', badge: 'Rare', rating: 4.9, reviewCount: 29, emoji: '🌰', description: 'Rare Afghani Mamra almonds — naturally grown, oil-rich, with a distinctive concave shape and unmatched nutrition.', benefits: ['Authentic Mamra', 'High natural oils', 'Naturally grown'] },

  // Dry Fruits
  { slug: 'anjeer-figs-250g', name: 'Premium Anjeer (Dried Figs)', category: 'Dry Fruits', price: 449, mrp: 549, weight: '250g', badge: '', rating: 4.7, reviewCount: 47, emoji: '🍇', description: 'Sun-dried Turkish figs — soft, honey-sweet discs loaded with fibre and calcium.', benefits: ['Turkish origin', 'Fibre & calcium rich', 'Soft texture'] },
  { slug: 'black-raisins-250g', name: 'Black Raisins (Kishmish)', category: 'Dry Fruits', price: 199, mrp: 249, weight: '250g', badge: '', rating: 4.5, reviewCount: 58, emoji: '🍇', description: 'Juicy seedless black raisins with deep grape sweetness — great for snacking, baking and desserts.', benefits: ['Seedless & juicy', 'Iron rich', 'Natural sweetener'] },
  { slug: 'dried-apricots-250g', name: 'Turkish Dried Apricots', category: 'Dry Fruits', price: 349, mrp: 419, weight: '250g', badge: '', rating: 4.6, reviewCount: 31, emoji: '🍑', description: 'Golden Turkish apricots, sun-dried to chewy perfection with a bright tangy-sweet flavour.', benefits: ['Vitamin A rich', 'No added sugar', 'Chewy & bright'] },
  { slug: 'dried-blueberries-150g', name: 'Dried Blueberries', category: 'Dry Fruits', price: 399, mrp: 469, weight: '150g', badge: 'New', rating: 4.7, reviewCount: 22, emoji: '🫐', description: 'Plump dried blueberries bursting with antioxidants — the perfect topping for oats, yogurt and smoothies.', benefits: ['Antioxidant powerhouse', 'Breakfast upgrade', 'No artificial colour'] },

  // Seeds
  { slug: 'pumpkin-seeds-250g', name: 'Roasted Pumpkin Seeds', category: 'Seeds', price: 299, mrp: 349, weight: '250g', badge: '', rating: 4.6, reviewCount: 34, emoji: '🎃', description: 'Lightly roasted green pumpkin seeds — a zinc and magnesium powerhouse for daily snacking.', benefits: ['Zinc & magnesium', 'Lightly roasted', 'Vegan protein'] },
  { slug: 'chia-seeds-250g', name: 'Chia Seeds', category: 'Seeds', price: 249, mrp: 299, weight: '250g', badge: '', rating: 4.6, reviewCount: 27, emoji: '🌱', description: 'Premium raw chia seeds — omega-3, fibre and protein in every spoonful.', benefits: ['Omega-3 rich', 'High fibre', 'Smoothie essential'] },

  // Snacks & Combos
  { slug: 'premium-healthy-mix-400g', name: 'Premium Healthy Trail Mix', category: 'Snacks', price: 649, mrp: 749, weight: '400g', badge: 'Bestseller', rating: 4.8, reviewCount: 71, featured: 1, emoji: '🥣', description: 'A power-packed blend of almonds, cashews, raisins, cranberries and pumpkin seeds. Your desk-drawer hero.', benefits: ['5 superfoods in one', 'No added sugar', 'Resealable pack'] },
  { slug: 'chocolate-dates-200g', name: 'Chocolate Coated Dates', category: 'Snacks', price: 349, mrp: 399, weight: '200g', badge: 'New', rating: 4.8, reviewCount: 44, emoji: '🍫', description: 'Safawi dates dipped in rich dark chocolate — the guilt-free truffle you have been waiting for.', benefits: ['Dark chocolate 55%', 'No refined sugar base', 'Dessert-grade indulgence'] },
  { slug: 'gift-combo-3x500g', name: 'Royal Gift Combo (3 × 500g)', category: 'Gifting', price: 1499, mrp: 1799, weight: '1.5kg', badge: 'Gift', rating: 4.9, reviewCount: 36, featured: 1, emoji: '🎁', description: 'A premium gift hamper: Safawi dates, Californian almonds and jumbo cashews in an elegant keepsake box. Festivals, weddings, corporate gifting — sorted.', benefits: ['Elegant gift box', '3 premium 500g packs', 'Personalised note available'] },
  { slug: 'dates-gift-box-750g', name: 'Assorted Dates Gift Box', category: 'Gifting', price: 999, mrp: 1199, weight: '750g', badge: 'Gift', rating: 4.8, reviewCount: 25, emoji: '🎁', description: 'Six varieties of premium dates arranged in a luxurious presentation box — Medjoul, Ajwa, Safawi, Kalmi, Sukkari and Khudri.', benefits: ['6 date varieties', 'Luxury presentation', 'Festival favourite'] },
];

// ---------- Seed ----------
db.exec('DELETE FROM reviews; DELETE FROM products; DELETE FROM coupons;');

const insert = db.prepare(`INSERT INTO products
  (slug, name, category, price, mrp, weight, badge, rating, review_count, stock, featured, description, benefits, image, images, variants)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

// Pack-size variants: hand-tuned for flagship products, auto-generated
// (per-gram pricing, small-pack premium / bulk discount) for the rest.
// Adjust or remove per product any time in Admin → Products.
const variantMap = {
  'premium-safawi-dates-500g': [
    { label: '250g', price: 249, mrp: 289 },
    { label: '500g', price: 449, mrp: 529 },
    { label: '1kg', price: 849, mrp: 999 },
  ],
  'california-almonds-500g': [
    { label: '250g', price: 329, mrp: 379 },
    { label: '500g', price: 599, mrp: 699 },
    { label: '1kg', price: 1099, mrp: 1299 },
  ],
};

const nicePrice = (x) => Math.max(49, Math.round(x / 10) * 10 - 1);

function autoVariants(p) {
  const match = /^(\d+)g$/i.exec(p.weight || '');
  if (!match || p.category === 'Gifting') return [];
  const baseGrams = Number(match[1]);
  const perGram = p.price / baseGrams;
  const mrpRatio = p.mrp / p.price;
  const sizes = [...new Set([250, 500, 1000, baseGrams])].sort((a, b) => a - b);
  return sizes.map((g) => {
    const label = g >= 1000 ? `${g / 1000}kg` : `${g}g`;
    if (g === baseGrams) return { label, price: p.price, mrp: p.mrp };
    const factor = g <= 250 ? 1.08 : g <= 500 ? 1 : 0.93; // small-pack premium, bulk discount
    const price = nicePrice(perGram * g * factor);
    return { label, price, mrp: nicePrice(price * mrpRatio) };
  });
}

catalog.forEach((p, i) => {
  let image = p.image;
  let images = p.images;
  if (!image) {
    const file = `${p.slug}.svg`;
    fs.writeFileSync(path.join(GEN_DIR, file), svgFor(p.name, p.emoji || '🌰', p.weight, i));
    image = `/product/gen/${file}`;
    images = [image];
  }
  insert.run(p.slug, p.name, p.category, p.price, p.mrp, p.weight, p.badge, p.rating, p.reviewCount, 100, p.featured || 0, p.description, JSON.stringify(p.benefits || []), image, JSON.stringify(images || [image]), JSON.stringify(variantMap[p.slug] || autoVariants(p)));
});

const insertCoupon = db.prepare('INSERT INTO coupons (code, percent, min_order, active) VALUES (?, ?, ?, 1)');
insertCoupon.run('WELCOME10', 10, 0);
insertCoupon.run('QDN15', 15, 999);

// Announcements shown in the site-wide marquee (editable from the admin portal)
db.exec('DELETE FROM announcements;');
const insertAnnouncement = db.prepare('INSERT INTO announcements (text, active) VALUES (?, 1)');
[
  '🌴 Free shipping on orders above ₹999',
  '🎁 Use code WELCOME10 for 10% off your first order',
  '🚚 Same-day dispatch for orders before 2pm',
  '💚 100% natural — no added sugar or preservatives',
  '💳 Easy payment — UPI · GPay · PhonePe · Cards',
].forEach((t) => insertAnnouncement.run(t));

// Sample blog post (manage from the admin portal)
db.exec('DELETE FROM blog_posts;');
db.prepare('INSERT INTO blog_posts (slug, title, excerpt, content, image, published) VALUES (?, ?, ?, ?, ?, 1)').run(
  '5-reasons-dates-are-natures-perfect-snack',
  '5 Reasons Dates Are Nature’s Perfect Snack',
  'From steady natural energy to gut-friendly fibre — here is why dates deserve a place in your daily routine.',
  `Dates have been treasured for thousands of years — and modern nutrition science keeps proving the ancients right. Here are five reasons to make them a daily habit.

1. Steady natural energy
Dates are rich in natural fruit sugars balanced by fibre, so they release energy gradually instead of spiking your blood sugar like refined sweets.

2. Gut-friendly fibre
Just three dates deliver a meaningful share of your daily fibre needs, feeding good gut bacteria and keeping digestion smooth.

3. Micronutrient dense
Potassium, magnesium, iron, vitamin B6 — dates are one of the most mineral-rich fruits you can eat.

4. The perfect natural sweetener
Blend dates into smoothies, desserts and energy balls instead of refined sugar. Our chocolate-coated dates exist because dates and cacao are a match made in heaven.

5. They pair beautifully with nuts
A date stuffed with an almond gives you sweetness, crunch, protein and healthy fats in one bite — which is exactly why our Almond Stuffed Dates are the store bestseller.

Try them fresh: order before 2pm and we dispatch the same day.`,
  '/product/almonddates400g.png'
);

// Seed a few reviews on the flagship
const flagship = db.prepare('SELECT id FROM products WHERE slug = ?').get('almond-dates-400g');
if (flagship) {
  const r = db.prepare('INSERT INTO reviews (product_id, name, rating, comment) VALUES (?, ?, ?, ?)');
  r.run(flagship.id, 'Ayesha K.', 5, 'The dates are incredibly fresh and the almond inside makes it a complete snack. Ordered thrice already!');
  r.run(flagship.id, 'Rahul M.', 5, 'Bought for Diwali gifting — packaging and quality were both outstanding.');
  r.run(flagship.id, 'Fatima S.', 4, 'Delicious and clearly premium quality. Wish there was a 1kg pack.');
}

// ---------- SEO artifacts: sitemap.xml + robots.txt + llms.txt ----------
const today = new Date().toISOString().slice(0, 10);
const staticPages = ['', '/shop', '/about', '/faq', '/track-order', '/blog', '/subscribe', '/occasions/diwali', '/occasions/ramadan', '/occasions/rakhi', '/occasions/wedding'];
const urls = [
  ...staticPages.map((p) => `  <url><loc>${SITE_URL}${p}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>${p === '' ? '1.0' : '0.8'}</priority></url>`),
  ...catalog.map((p) => `  <url><loc>${SITE_URL}/product/${p.slug}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.9</priority></url>`),
];
fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap.xml'),
`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`);

fs.writeFileSync(path.join(PUBLIC_DIR, 'robots.txt'),
`User-agent: *
Allow: /
Disallow: /checkout
Disallow: /account
Disallow: /admin

Sitemap: ${SITE_URL}/sitemap.xml
`);

// llms.txt — AEO/GEO: a machine-readable brief for AI answer engines
fs.writeFileSync(path.join(PUBLIC_DIR, 'llms.txt'),
`# Quality Dates and Nuts

> Quality Dates and Nuts is an Indian online store selling premium dates (Safawi, Medjoul, Ajwa, Kalmi), stuffed dates, nuts (almonds, cashews, pistachios, walnuts), dry fruits, seeds and gift hampers. Pan-India delivery, secure online payment via UPI (Google Pay, PhonePe, Paytm), cards and net banking. WhatsApp ordering available.

## Key facts
- Flagship product: Almond Stuffed Dates (Safawi dates hand-stuffed with Californian almonds), ₹499 for 400g
- Categories: Dates, Stuffed Dates, Nuts, Dry Fruits, Seeds, Snacks, Gifting
- No added sugar or preservatives across the dates range
- Free shipping on orders above ₹999
- Same-day dispatch for orders placed before 2pm IST

## Pages
- [Shop all products](${SITE_URL}/shop)
- [Track your order](${SITE_URL}/track-order)
- [FAQ](${SITE_URL}/faq)

## Products
${catalog.map((p) => `- [${p.name} ${p.weight}](${SITE_URL}/product/${p.slug}): ₹${p.price} — ${p.description}`).join('\n')}
`);

console.log(`Seeded ${catalog.length} products, 2 coupons, 3 reviews.`);
console.log('Generated public/sitemap.xml, robots.txt, llms.txt and SVG product art.');

import express from 'express';
import cors from 'cors';
import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { db, rowToProduct, getSetting, setSetting } from './db.js';
import { notifyOrderStatus, notifyAdminNewOrder, lowStockAlert } from './notifications.js';
import { razorpayEnabled, createRazorpayOrder, verifyRazorpaySignature, razorpayKeyId } from './razorpay.js';

const PUBLIC_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');

const app = express();
const PORT = process.env.API_PORT || 4000;
const SECRET = process.env.JWT_SECRET || 'qdn-dev-secret-change-in-production';
const FREE_SHIPPING_ABOVE = 999;
const SHIPPING_FEE = 49;

app.use(cors());
app.use(express.json({ limit: '15mb' })); // product images arrive as base64 data URLs

// ---------- auth helpers (scrypt + HMAC token, no extra deps) ----------
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}
function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  const check = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(check, 'hex'));
}
function signToken(userId) {
  const payload = `${userId}.${Date.now() + 1000 * 60 * 60 * 24 * 30}`; // 30 days
  const sig = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
  return `${payload}.${sig}`;
}
function verifyToken(token) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [userId, expiry, sig] = parts;
  const expected = crypto.createHmac('sha256', SECRET).update(`${userId}.${expiry}`).digest('hex');
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  if (Date.now() > Number(expiry)) return null;
  return Number(userId);
}
function authUser(req) {
  const header = req.headers.authorization || '';
  const userId = verifyToken(header.replace('Bearer ', ''));
  if (!userId) return null;
  return db.prepare('SELECT id, name, email, phone, role FROM users WHERE id = ?').get(userId) || null;
}

function requireAdmin(req, res, next) {
  const user = authUser(req);
  if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  req.admin = user;
  next();
}

// Staff can handle day-to-day fulfilment (orders, reviews); everything else stays admin-only
function requireStaff(req, res, next) {
  const user = authUser(req);
  if (!user || !['admin', 'staff'].includes(user.role)) return res.status(403).json({ error: 'Staff access required' });
  req.admin = user;
  next();
}

function ensureReferralCode(userId) {
  const user = db.prepare('SELECT referral_code FROM users WHERE id = ?').get(userId);
  if (user?.referral_code) return user.referral_code;
  const code = `QDNREF${userId}${crypto.randomInt(100, 999)}`;
  db.prepare('UPDATE users SET referral_code = ? WHERE id = ?').run(code, userId);
  return code;
}

// Bootstrap a default admin account on first run (change the password immediately)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@qualitydatesandnuts.com';
if (!db.prepare("SELECT id FROM users WHERE role = 'admin'").get()) {
  const pw = process.env.ADMIN_PASSWORD || 'admin123';
  db.prepare('INSERT OR IGNORE INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)')
    .run('Store Admin', ADMIN_EMAIL, '', hashPassword(pw), 'admin');
  console.log(`Bootstrapped admin account: ${ADMIN_EMAIL} / ${pw}`);
}

// ---------- products ----------
app.get('/api/products', (req, res) => {
  const { category, search, sort, featured } = req.query;
  let sql = 'SELECT * FROM products WHERE 1=1';
  const params = [];
  if (category && category !== 'All') { sql += ' AND category = ?'; params.push(category); }
  if (featured === 'true') { sql += ' AND featured = 1'; }
  if (search) { sql += ' AND (name LIKE ? OR category LIKE ? OR description LIKE ?)'; const q = `%${search}%`; params.push(q, q, q); }
  if (sort === 'price-asc') sql += ' ORDER BY price ASC';
  else if (sort === 'price-desc') sql += ' ORDER BY price DESC';
  else if (sort === 'rating') sql += ' ORDER BY rating DESC';
  else sql += ' ORDER BY featured DESC, review_count DESC';
  res.json(db.prepare(sql).all(...params).map(rowToProduct));
});

app.get('/api/categories', (_req, res) => {
  const rows = db.prepare('SELECT category, COUNT(*) as count FROM products GROUP BY category ORDER BY count DESC').all();
  res.json(rows);
});

// "Frequently bought together": products that co-occur with this one in real orders
function frequentlyBoughtWith(productId, limit = 4) {
  const counts = {};
  for (const row of db.prepare("SELECT items FROM orders WHERE status != 'cancelled'").all()) {
    const items = JSON.parse(row.items);
    if (!items.some((i) => i.id === productId)) continue;
    for (const i of items) {
      if (i.id !== productId) counts[i.id] = (counts[i.id] || 0) + 1;
    }
  }
  const ids = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, limit).map(([id]) => Number(id));
  return ids
    .map((id) => db.prepare('SELECT * FROM products WHERE id = ?').get(id))
    .filter(Boolean)
    .map(rowToProduct);
}

app.get('/api/products/:slug', (req, res) => {
  const row = db.prepare('SELECT * FROM products WHERE slug = ?').get(req.params.slug);
  if (!row) return res.status(404).json({ error: 'Product not found' });
  const product = rowToProduct(row);
  const boughtTogether = frequentlyBoughtWith(row.id);
  const related = db.prepare('SELECT * FROM products WHERE category = ? AND id != ? LIMIT 4').all(row.category, row.id).map(rowToProduct);
  const reviews = db.prepare('SELECT id, name, rating, comment, image, verified, created_at FROM reviews WHERE product_id = ? ORDER BY verified DESC, id DESC LIMIT 20').all(row.id);
  res.json({ product, related, boughtTogether, reviews });
});

app.post('/api/reviews', (req, res) => {
  const { productId, name, rating, comment, imageDataUrl, orderNumber } = req.body || {};
  if (!productId || !name || !rating) return res.status(400).json({ error: 'productId, name and rating are required' });

  // Optional photo, saved alongside product uploads
  let image = '';
  if (imageDataUrl) {
    const match = /^data:image\/(png|jpe?g|webp);base64,(.+)$/.exec(imageDataUrl);
    if (match) {
      const buffer = Buffer.from(match[2], 'base64');
      if (buffer.length <= 4 * 1024 * 1024) {
        const dir = path.join(PUBLIC_DIR, 'product', 'reviews');
        fs.mkdirSync(dir, { recursive: true });
        const file = `review-${Date.now()}.${match[1] === 'jpeg' ? 'jpg' : match[1]}`;
        fs.writeFileSync(path.join(dir, file), buffer);
        image = `/product/reviews/${file}`;
      }
    }
  }

  // Verified purchase: the given order number contains this product
  let verified = 0;
  if (orderNumber) {
    const order = db.prepare('SELECT items FROM orders WHERE order_number = ?').get(String(orderNumber).toUpperCase().trim());
    if (order && JSON.parse(order.items).some((i) => i.id === Number(productId))) verified = 1;
  }

  db.prepare('INSERT INTO reviews (product_id, name, rating, comment, image, verified) VALUES (?, ?, ?, ?, ?, ?)')
    .run(productId, String(name).slice(0, 60), Math.min(5, Math.max(1, Number(rating))), String(comment || '').slice(0, 1000), image, verified);
  const agg = db.prepare('SELECT AVG(rating) as avg, COUNT(*) as count FROM reviews WHERE product_id = ?').get(productId);
  db.prepare('UPDATE products SET rating = ?, review_count = ? WHERE id = ?').run(Math.round(agg.avg * 10) / 10, agg.count, productId);
  res.json({ ok: true });
});

// ---------- auth ----------
app.post('/api/auth/register', (req, res) => {
  const { name, email, phone, password } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password are required' });
  if (String(password).length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(String(email).toLowerCase());
  if (existing) return res.status(409).json({ error: 'An account with this email already exists' });
  const info = db.prepare('INSERT INTO users (name, email, phone, password_hash) VALUES (?, ?, ?, ?)').run(name, String(email).toLowerCase(), phone || '', hashPassword(password));
  res.json({ token: signToken(info.lastInsertRowid), user: { id: info.lastInsertRowid, name, email: String(email).toLowerCase(), phone: phone || '' } });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(String(email || '').toLowerCase());
  if (!user || !verifyPassword(password || '', user.password_hash)) return res.status(401).json({ error: 'Invalid email or password' });
  res.json({ token: signToken(user.id), user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role } });
});

app.get('/api/auth/me', (req, res) => {
  const user = authUser(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });
  const extra = db.prepare('SELECT points FROM users WHERE id = ?').get(user.id);
  res.json({ user: { ...user, points: extra?.points || 0, referralCode: ensureReferralCode(user.id) } });
});

// ---------- coupons ----------
app.post('/api/coupons/validate', (req, res) => {
  const { code, subtotal } = req.body || {};
  const coupon = db.prepare('SELECT * FROM coupons WHERE code = ? AND active = 1').get(String(code || '').toUpperCase());
  if (!coupon) return res.status(404).json({ error: 'Invalid coupon code' });
  if ((subtotal || 0) < coupon.min_order) return res.status(400).json({ error: `This coupon needs a minimum order of ₹${coupon.min_order}` });
  res.json({ code: coupon.code, percent: coupon.percent });
});

// ---------- orders ----------
const POINTS_EARN_PER_RUPEES = 10; // 1 point per ₹10 spent
const MAX_POINTS_SHARE = 0.2; // points can cover at most 20% of the subtotal
const REFERRAL_DISCOUNT_PERCENT = 5;
const REFERRER_BONUS_POINTS = 50;

app.post('/api/orders', async (req, res) => {
  const { customer, items, couponCode, paymentMethod, redeemPoints, referralCode } = req.body || {};
  if (!customer?.name || !customer?.phone || !customer?.address || !customer?.city || !customer?.pincode) {
    return res.status(400).json({ error: 'Missing delivery details' });
  }
  if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'Cart is empty' });

  // Re-price everything server-side — never trust client totals
  const priced = [];
  for (const item of items) {
    const row = db.prepare('SELECT * FROM products WHERE id = ?').get(item.id);
    if (!row) return res.status(400).json({ error: `Product ${item.id} no longer exists` });
    const qty = Math.max(1, Math.min(50, Number(item.quantity) || 1));
    if (row.stock < qty) return res.status(400).json({ error: `${row.name} has only ${row.stock} left in stock` });

    // Variant pricing: a variant label must match one defined on the product
    let price = row.price;
    let weight = row.weight;
    if (item.variant) {
      const variants = JSON.parse(row.variants || '[]');
      const v = variants.find((x) => x.label === item.variant);
      if (!v) return res.status(400).json({ error: `${row.name} has no "${item.variant}" option` });
      price = v.price;
      weight = v.label;
    }
    priced.push({ id: row.id, slug: row.slug, name: row.name, weight, variant: item.variant || '', image: row.image, price, quantity: qty });
  }
  const subtotal = priced.reduce((s, i) => s + i.price * i.quantity, 0);

  let discount = 0; let appliedCoupon = '';
  if (couponCode) {
    const coupon = db.prepare('SELECT * FROM coupons WHERE code = ? AND active = 1').get(String(couponCode).toUpperCase());
    if (coupon && subtotal >= coupon.min_order) {
      discount = Math.round(subtotal * coupon.percent / 100);
      appliedCoupon = coupon.code;
    }
  }

  // Referral: valid code from another user, only when no coupon is applied
  let usedReferral = '';
  if (!appliedCoupon && referralCode) {
    const referrer = db.prepare('SELECT id FROM users WHERE referral_code = ?').get(String(referralCode).toUpperCase().trim());
    const user = authUser(req);
    if (referrer && referrer.id !== user?.id) {
      discount += Math.round(subtotal * REFERRAL_DISCOUNT_PERCENT / 100);
      usedReferral = String(referralCode).toUpperCase().trim();
    }
  }

  // Loyalty: signed-in customers can redeem points (1 point = ₹1, capped)
  const user = authUser(req);
  let pointsRedeemed = 0;
  if (user && redeemPoints) {
    const balance = db.prepare('SELECT points FROM users WHERE id = ?').get(user.id)?.points || 0;
    pointsRedeemed = Math.min(balance, Math.floor(subtotal * MAX_POINTS_SHARE), Math.max(0, Math.floor(Number(redeemPoints))));
    discount += pointsRedeemed;
  }

  const shipping = subtotal - discount >= FREE_SHIPPING_ABOVE ? 0 : SHIPPING_FEE;
  const total = Math.max(1, subtotal - discount + shipping);
  const pointsEarned = user ? Math.floor(total / POINTS_EARN_PER_RUPEES) : 0;

  const orderNumber = 'QDN' + Date.now().toString(36).toUpperCase() + crypto.randomInt(100, 999);
  // Two ways to pay, both before dispatch: Razorpay gateway, or direct UPI/bank
  // transfer to the store's own account (0% fees, verified manually by staff).
  const method = paymentMethod === 'upi-direct' ? 'upi-direct' : 'online';
  const paymentStatus = 'awaiting_payment';

  db.prepare(`INSERT INTO orders
    (order_number, user_id, customer_name, customer_email, customer_phone, address, landmark, city, state, pincode, items, subtotal, discount, coupon_code, shipping, total, payment_method, payment_status, points_earned, points_redeemed, referral_code)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(orderNumber, user?.id ?? null, customer.name, customer.email || '', customer.phone, customer.address, customer.landmark || '', customer.city, customer.state || '', customer.pincode, JSON.stringify(priced), subtotal, discount, appliedCoupon, shipping, total, method, paymentStatus, pointsEarned, pointsRedeemed, usedReferral);

  const decrement = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?');
  priced.forEach((i) => decrement.run(i.quantity, i.id));

  // Loyalty ledger + referral bonus
  if (user) {
    db.prepare('UPDATE users SET points = points - ? + ? WHERE id = ?').run(pointsRedeemed, pointsEarned, user.id);
  }
  if (usedReferral) {
    db.prepare('UPDATE users SET points = points + ? WHERE referral_code = ?').run(REFERRER_BONUS_POINTS, usedReferral);
  }

  // This cart made it through — clear any abandoned-cart record
  db.prepare('UPDATE abandoned_carts SET recovered = 1 WHERE phone = ?').run(customer.phone);

  // For online payment, hand back a Razorpay order for the frontend widget
  let payment = null;
  if (method === 'online' && razorpayEnabled()) {
    try {
      const rzp = await createRazorpayOrder(total * 100, orderNumber);
      db.prepare('UPDATE orders SET payment_id = ? WHERE order_number = ?').run(rzp.id, orderNumber);
      payment = { razorpayOrderId: rzp.id, amount: total * 100, keyId: razorpayKeyId() };
    } catch (err) {
      console.error('[razorpay]', err.message);
    }
  }

  const threshold = Number(getSetting('low_stock_threshold', '10'));
  const low = db.prepare('SELECT name, weight, stock FROM products WHERE stock <= ?').all(threshold)
    .filter((p) => priced.some((i) => i.name === p.name));
  lowStockAlert(low).catch(() => {});

  res.json({ orderNumber, subtotal, discount, shipping, total, items: priced, pointsEarned, pointsRedeemed, payment, estimatedDelivery: new Date(Date.now() + 4 * 86400000).toDateString() });
});

// ---------- payments (Razorpay) ----------
app.get('/api/payments/config', (_req, res) => {
  const manualNote = getSetting('manual_payment_note');
  const upiId = getSetting('upi_id');
  res.json({
    enabled: razorpayEnabled(),
    keyId: razorpayEnabled() ? razorpayKeyId() : '',
    directUpi: !!(manualNote || upiId),
    upiId,
    manualNote,
  });
});

// Customer submits their UPI/bank transaction reference for manual verification
app.post('/api/payments/upi-claim', (req, res) => {
  const { orderNumber, phone, utr } = req.body || {};
  const ref = String(utr || '').trim().slice(0, 40);
  if (ref.length < 6) return res.status(400).json({ error: 'Please enter the transaction ID (UTR) from your UPI app' });
  const order = db.prepare('SELECT * FROM orders WHERE order_number = ? AND customer_phone = ?')
    .get(String(orderNumber || '').toUpperCase(), String(phone || ''));
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.payment_status === 'paid') return res.json({ ok: true, status: 'paid' });
  db.prepare("UPDATE orders SET payment_status = 'claimed', payment_id = ? WHERE order_number = ?").run(ref, order.order_number);
  res.json({ ok: true, status: 'claimed' });
});

app.post('/api/payments/verify', (req, res) => {
  const { orderNumber, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body || {};
  const order = db.prepare('SELECT * FROM orders WHERE order_number = ?').get(orderNumber);
  if (!order || order.payment_id !== razorpayOrderId) return res.status(400).json({ error: 'Order mismatch' });
  if (!verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)) {
    return res.status(400).json({ error: 'Payment signature verification failed' });
  }
  db.prepare("UPDATE orders SET payment_status = 'paid', payment_id = ? WHERE order_number = ?").run(razorpayPaymentId, orderNumber);
  const paidOrder = { ...order, payment_status: 'paid' };
  notifyOrderStatus(paidOrder, 'confirmed').catch(() => {});
  notifyAdminNewOrder(paidOrder).catch(() => {}); // alert the store owner
  res.json({ ok: true });
});

// Re-open payment for an order whose checkout window was closed before paying
app.post('/api/payments/retry', async (req, res) => {
  const { orderNumber, phone } = req.body || {};
  const order = db.prepare('SELECT * FROM orders WHERE order_number = ? AND customer_phone = ?')
    .get(String(orderNumber || '').toUpperCase(), String(phone || ''));
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.payment_status === 'paid') return res.json({ paid: true, payment: null });
  if (!razorpayEnabled()) return res.status(400).json({ error: 'Online payments are not available right now' });
  try {
    const rzp = await createRazorpayOrder(order.total * 100, order.order_number);
    db.prepare('UPDATE orders SET payment_id = ? WHERE order_number = ?').run(rzp.id, order.order_number);
    res.json({ paid: false, payment: { razorpayOrderId: rzp.id, amount: order.total * 100, keyId: razorpayKeyId() } });
  } catch (err) {
    console.error('[razorpay retry]', err.message);
    res.status(502).json({ error: 'Could not start the payment — please try again' });
  }
});

// ---------- abandoned cart capture ----------
app.post('/api/cart/track', (req, res) => {
  const { phone, name, items, subtotal } = req.body || {};
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length < 10 || !Array.isArray(items) || items.length === 0) return res.json({ ok: false });
  db.prepare(`INSERT INTO abandoned_carts (phone, name, items, subtotal, recovered, updated_at)
    VALUES (?, ?, ?, ?, 0, datetime('now'))
    ON CONFLICT(phone) DO UPDATE SET name = excluded.name, items = excluded.items, subtotal = excluded.subtotal, recovered = 0, updated_at = datetime('now')`)
    .run(digits, String(name || '').slice(0, 60), JSON.stringify(items).slice(0, 4000), Number(subtotal) || 0);
  res.json({ ok: true });
});

// ---------- subscriptions (Subscribe & Save) ----------
app.post('/api/subscriptions', (req, res) => {
  const { name, phone, email, plan } = req.body || {};
  if (!name || !phone || !plan) return res.status(400).json({ error: 'name, phone and plan are required' });
  db.prepare('INSERT INTO subscriptions (name, phone, email, plan) VALUES (?, ?, ?, ?)').run(name, phone, email || '', plan);
  res.json({ ok: true });
});

function serializeOrder(o) {
  return { ...o, items: JSON.parse(o.items) };
}

app.get('/api/orders/track', (req, res) => {
  const { orderNumber, phone } = req.query;
  const order = db.prepare('SELECT * FROM orders WHERE order_number = ? AND customer_phone = ?').get(String(orderNumber || '').toUpperCase(), String(phone || ''));
  if (!order) return res.status(404).json({ error: 'No order found for that order number and phone' });
  res.json(serializeOrder(order));
});

app.get('/api/orders/mine', (req, res) => {
  const user = authUser(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });
  res.json(db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC').all(user.id).map(serializeOrder));
});

// ---------- newsletter ----------
app.post('/api/newsletter', (req, res) => {
  const email = String(req.body?.email || '').toLowerCase().trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ error: 'Please enter a valid email' });
  db.prepare('INSERT OR IGNORE INTO newsletter (email) VALUES (?)').run(email);
  res.json({ ok: true });
});

// ---------- public: blog + announcements ----------
app.get('/api/blog', (_req, res) => {
  res.json(db.prepare('SELECT id, slug, title, excerpt, image, created_at FROM blog_posts WHERE published = 1 ORDER BY id DESC').all());
});

app.get('/api/blog/:slug', (req, res) => {
  const post = db.prepare('SELECT * FROM blog_posts WHERE slug = ? AND published = 1').get(req.params.slug);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  res.json(post);
});

app.get('/api/announcements', (_req, res) => {
  res.json(db.prepare('SELECT id, text FROM announcements WHERE active = 1 ORDER BY id').all());
});

// ================== ADMIN ==================
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);

function uniqueSlug(table, base, excludeId = null) {
  let slug = base || 'item';
  let n = 1;
  while (true) {
    const row = excludeId
      ? db.prepare(`SELECT id FROM ${table} WHERE slug = ? AND id != ?`).get(slug, excludeId)
      : db.prepare(`SELECT id FROM ${table} WHERE slug = ?`).get(slug);
    if (!row) return slug;
    slug = `${base}-${++n}`;
  }
}

// ---------- admin: dashboard stats ----------
app.get('/api/admin/stats', requireAdmin, (_req, res) => {
  const totals = db.prepare(`SELECT COUNT(*) AS orders, COALESCE(SUM(total), 0) AS revenue,
    COUNT(DISTINCT customer_phone) AS customers FROM orders WHERE status != 'cancelled'`).get();
  const products = db.prepare('SELECT COUNT(*) AS n FROM products').get().n;
  const lowStock = db.prepare('SELECT COUNT(*) AS n FROM products WHERE stock <= 10').get().n;
  const pending = db.prepare("SELECT COUNT(*) AS n FROM orders WHERE status IN ('confirmed','packed')").get().n;

  const daily = db.prepare(`SELECT date(created_at) AS day, COUNT(*) AS orders, SUM(total) AS revenue
    FROM orders WHERE created_at >= datetime('now', '-30 days') AND status != 'cancelled'
    GROUP BY date(created_at) ORDER BY day`).all();

  // Top products by units sold (items are stored as JSON snapshots on each order)
  const sold = {};
  for (const row of db.prepare("SELECT items FROM orders WHERE status != 'cancelled'").all()) {
    for (const item of JSON.parse(row.items)) {
      sold[item.name] = (sold[item.name] || 0) + item.quantity;
    }
  }
  const topProducts = Object.entries(sold).map(([name, units]) => ({ name, units }))
    .sort((a, b) => b.units - a.units).slice(0, 5);

  const recentOrders = db.prepare('SELECT * FROM orders ORDER BY id DESC LIMIT 5').all().map(serializeOrder);

  res.json({ totals: { ...totals, products, lowStock, pending }, daily, topProducts, recentOrders });
});

// ---------- admin: products CRUD ----------
app.post('/api/admin/upload', requireAdmin, (req, res) => {
  const { name, dataUrl } = req.body || {};
  const match = /^data:image\/(png|jpe?g|webp|svg\+xml|gif);base64,(.+)$/.exec(dataUrl || '');
  if (!match) return res.status(400).json({ error: 'Send an image as a base64 data URL' });
  const ext = match[1] === 'svg+xml' ? 'svg' : match[1] === 'jpeg' ? 'jpg' : match[1];
  const buffer = Buffer.from(match[2], 'base64');
  if (buffer.length > 8 * 1024 * 1024) return res.status(400).json({ error: 'Image too large (max 8MB)' });
  const dir = path.join(PUBLIC_DIR, 'product', 'uploads');
  fs.mkdirSync(dir, { recursive: true });
  const file = `${slugify(path.parse(name || 'image').name) || 'image'}-${Date.now()}.${ext}`;
  fs.writeFileSync(path.join(dir, file), buffer);
  res.json({ path: `/product/uploads/${file}` });
});

function productBody(req, res) {
  const { name, category, price, mrp, weight, badge, stock, featured, description, benefits, image, images, variants } = req.body || {};
  if (!name || !category || !price || !image) {
    res.status(400).json({ error: 'name, category, price and image are required' });
    return null;
  }
  const cleanVariants = (Array.isArray(variants) ? variants : [])
    .filter((v) => v?.label && Number(v.price) > 0)
    .map((v) => ({ label: String(v.label).slice(0, 30), price: Math.round(Number(v.price)), mrp: Math.round(Number(v.mrp) || Number(v.price)) }));
  return {
    variants: JSON.stringify(cleanVariants),
    name, category,
    price: Math.max(1, Math.round(Number(price))),
    mrp: Math.max(1, Math.round(Number(mrp) || Number(price))),
    weight: weight || '', badge: badge || '',
    stock: Math.max(0, Math.round(Number(stock) || 0)),
    featured: featured ? 1 : 0,
    description: description || '',
    benefits: JSON.stringify(Array.isArray(benefits) ? benefits : String(benefits || '').split('\n').map((b) => b.trim()).filter(Boolean)),
    image,
    images: JSON.stringify(Array.isArray(images) && images.length ? images : [image]),
  };
}

app.post('/api/admin/products', requireAdmin, (req, res) => {
  const p = productBody(req, res);
  if (!p) return;
  const slug = uniqueSlug('products', slugify(`${p.name} ${p.weight}`));
  const info = db.prepare(`INSERT INTO products (slug, name, category, price, mrp, weight, badge, stock, featured, description, benefits, image, images, variants)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(slug, p.name, p.category, p.price, p.mrp, p.weight, p.badge, p.stock, p.featured, p.description, p.benefits, p.image, p.images, p.variants);
  res.json(rowToProduct(db.prepare('SELECT * FROM products WHERE id = ?').get(info.lastInsertRowid)));
});

app.put('/api/admin/products/:id', requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Product not found' });
  const p = productBody(req, res);
  if (!p) return;
  db.prepare(`UPDATE products SET name = ?, category = ?, price = ?, mrp = ?, weight = ?, badge = ?, stock = ?, featured = ?, description = ?, benefits = ?, image = ?, images = ?, variants = ? WHERE id = ?`)
    .run(p.name, p.category, p.price, p.mrp, p.weight, p.badge, p.stock, p.featured, p.description, p.benefits, p.image, p.images, p.variants, req.params.id);
  res.json(rowToProduct(db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id)));
});

app.delete('/api/admin/products/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM reviews WHERE product_id = ?').run(req.params.id);
  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ---------- admin: reviews moderation ----------
app.get('/api/admin/reviews', requireStaff, (_req, res) => {
  res.json(db.prepare(`SELECT r.*, p.name AS product_name, p.slug AS product_slug
    FROM reviews r JOIN products p ON p.id = r.product_id ORDER BY r.id DESC`).all());
});

app.delete('/api/admin/reviews/:id', requireStaff, (req, res) => {
  const review = db.prepare('SELECT * FROM reviews WHERE id = ?').get(req.params.id);
  if (!review) return res.status(404).json({ error: 'Review not found' });
  db.prepare('DELETE FROM reviews WHERE id = ?').run(req.params.id);
  const agg = db.prepare('SELECT AVG(rating) AS avg, COUNT(*) AS count FROM reviews WHERE product_id = ?').get(review.product_id);
  db.prepare('UPDATE products SET rating = ?, review_count = ? WHERE id = ?')
    .run(agg.count ? Math.round(agg.avg * 10) / 10 : 4.5, agg.count, review.product_id);
  res.json({ ok: true });
});

// ---------- admin: coupons / offers ----------
app.get('/api/admin/coupons', requireAdmin, (_req, res) => {
  res.json(db.prepare('SELECT * FROM coupons ORDER BY code').all());
});

app.post('/api/admin/coupons', requireAdmin, (req, res) => {
  const { code, percent, minOrder } = req.body || {};
  if (!code || !percent) return res.status(400).json({ error: 'code and percent are required' });
  try {
    db.prepare('INSERT INTO coupons (code, percent, min_order, active) VALUES (?, ?, ?, 1)')
      .run(String(code).toUpperCase().trim(), Math.min(90, Math.max(1, Number(percent))), Math.max(0, Number(minOrder) || 0));
  } catch {
    return res.status(409).json({ error: 'Coupon code already exists' });
  }
  res.json({ ok: true });
});

app.patch('/api/admin/coupons/:code', requireAdmin, (req, res) => {
  db.prepare('UPDATE coupons SET active = ? WHERE code = ?').run(req.body?.active ? 1 : 0, req.params.code);
  res.json({ ok: true });
});

app.delete('/api/admin/coupons/:code', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM coupons WHERE code = ?').run(req.params.code);
  res.json({ ok: true });
});

// ---------- admin: announcements (site-wide marquee) ----------
app.get('/api/admin/announcements', requireAdmin, (_req, res) => {
  res.json(db.prepare('SELECT * FROM announcements ORDER BY id').all());
});

app.post('/api/admin/announcements', requireAdmin, (req, res) => {
  if (!req.body?.text) return res.status(400).json({ error: 'text is required' });
  db.prepare('INSERT INTO announcements (text, active) VALUES (?, 1)').run(String(req.body.text).slice(0, 160));
  res.json({ ok: true });
});

app.patch('/api/admin/announcements/:id', requireAdmin, (req, res) => {
  db.prepare('UPDATE announcements SET active = ? WHERE id = ?').run(req.body?.active ? 1 : 0, req.params.id);
  res.json({ ok: true });
});

app.delete('/api/admin/announcements/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM announcements WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ---------- admin: blog CRUD ----------
app.get('/api/admin/blog', requireAdmin, (_req, res) => {
  res.json(db.prepare('SELECT * FROM blog_posts ORDER BY id DESC').all());
});

app.post('/api/admin/blog', requireAdmin, (req, res) => {
  const { title, excerpt, content, image, published } = req.body || {};
  if (!title || !content) return res.status(400).json({ error: 'title and content are required' });
  const slug = uniqueSlug('blog_posts', slugify(title));
  db.prepare('INSERT INTO blog_posts (slug, title, excerpt, content, image, published) VALUES (?, ?, ?, ?, ?, ?)')
    .run(slug, title, excerpt || '', content, image || '', published === false ? 0 : 1);
  res.json({ ok: true, slug });
});

app.put('/api/admin/blog/:id', requireAdmin, (req, res) => {
  const post = db.prepare('SELECT * FROM blog_posts WHERE id = ?').get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  const { title, excerpt, content, image, published } = req.body || {};
  db.prepare('UPDATE blog_posts SET title = ?, excerpt = ?, content = ?, image = ?, published = ? WHERE id = ?')
    .run(title ?? post.title, excerpt ?? post.excerpt, content ?? post.content, image ?? post.image, published === false ? 0 : 1, req.params.id);
  res.json({ ok: true });
});

app.delete('/api/admin/blog/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM blog_posts WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ---------- admin: orders + customers ----------
app.get('/api/admin/orders', requireStaff, (req, res) => {
  const { status } = req.query;
  const rows = status
    ? db.prepare('SELECT * FROM orders WHERE status = ? ORDER BY id DESC').all(status)
    : db.prepare('SELECT * FROM orders ORDER BY id DESC').all();
  res.json(rows.map(serializeOrder));
});

const ORDER_STATUSES = ['confirmed', 'packed', 'shipped', 'delivered', 'cancelled'];
app.patch('/api/admin/orders/:id', requireStaff, (req, res) => {
  const { status, trackingNumber, courier } = req.body || {};
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  if (trackingNumber !== undefined || courier !== undefined) {
    db.prepare('UPDATE orders SET tracking_number = ?, courier = ? WHERE id = ?')
      .run(String(trackingNumber ?? order.tracking_number).slice(0, 60), String(courier ?? order.courier).slice(0, 40), req.params.id);
  }
  if (req.body?.paymentStatus === 'paid' && order.payment_status !== 'paid') {
    // Staff verified a direct UPI / bank transfer against the bank statement
    db.prepare("UPDATE orders SET payment_status = 'paid' WHERE id = ?").run(req.params.id);
    const fresh = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    notifyOrderStatus(fresh, 'confirmed').catch(() => {});
  }
  if (status) {
    if (!ORDER_STATUSES.includes(status)) return res.status(400).json({ error: `status must be one of ${ORDER_STATUSES.join(', ')}` });
    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
    // Automatic WhatsApp/email to the customer on every status change
    const fresh = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    notifyOrderStatus(fresh, status).catch(() => {});
  }
  res.json({ ok: true });
});

app.get('/api/admin/customers', requireAdmin, (_req, res) => {
  const rows = db.prepare(`SELECT customer_name AS name, customer_phone AS phone, MAX(customer_email) AS email,
    COUNT(*) AS orders, SUM(total) AS spent, MAX(created_at) AS last_order
    FROM orders WHERE status != 'cancelled' GROUP BY customer_phone ORDER BY spent DESC`).all();
  res.json(rows);
});

// ---------- WhatsApp leads (visitors who opt in on the site) ----------
app.post('/api/leads', (req, res) => {
  const digits = String(req.body?.phone || '').replace(/\D/g, '');
  if (digits.length < 10) return res.status(400).json({ error: 'Please enter a valid phone number' });
  db.prepare(`INSERT INTO leads (phone, name, source) VALUES (?, ?, 'website')
    ON CONFLICT(phone) DO UPDATE SET name = CASE WHEN excluded.name != '' THEN excluded.name ELSE leads.name END`)
    .run(digits, String(req.body?.name || '').slice(0, 60));
  res.json({ ok: true });
});

app.get('/api/admin/leads', requireStaff, (_req, res) => {
  res.json(db.prepare('SELECT * FROM leads ORDER BY id DESC').all());
});

app.delete('/api/admin/leads/:id', requireStaff, (req, res) => {
  db.prepare('DELETE FROM leads WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ---------- admin: WhatsApp broadcast ----------
function broadcastAudience(audience) {
  const dedupe = new Map();
  const add = (name, phone) => {
    const digits = String(phone || '').replace(/\D/g, '');
    if (digits.length >= 10 && !dedupe.has(digits)) dedupe.set(digits, { name: name || 'there', phone });
  };
  if (audience === 'customers' || audience === 'all') {
    for (const c of db.prepare(`SELECT customer_name AS name, customer_phone AS phone FROM orders WHERE status != 'cancelled' GROUP BY customer_phone`).all()) add(c.name, c.phone);
  }
  if (audience === 'leads' || audience === 'all') {
    for (const l of db.prepare('SELECT name, phone FROM leads').all()) add(l.name, l.phone);
  }
  if (audience === 'abandoned' || audience === 'all') {
    for (const a of db.prepare('SELECT name, phone FROM abandoned_carts WHERE recovered = 0').all()) add(a.name, a.phone);
  }
  return [...dedupe.values()];
}

app.get('/api/admin/broadcast/audiences', requireAdmin, (_req, res) => {
  res.json({
    customers: broadcastAudience('customers').length,
    leads: broadcastAudience('leads').length,
    abandoned: broadcastAudience('abandoned').length,
    all: broadcastAudience('all').length,
  });
});
// Personalizes a message per customer. If WhatsApp Business Cloud API credentials
// are configured (WHATSAPP_TOKEN + WHATSAPP_PHONE_ID), messages are sent
// automatically; otherwise click-to-send wa.me links are returned.
app.post('/api/admin/broadcast', requireAdmin, async (req, res) => {
  const { message, audience } = req.body || {};
  if (!message) return res.status(400).json({ error: 'message is required' });

  const customers = broadcastAudience(['customers', 'leads', 'abandoned', 'all'].includes(audience) ? audience : 'customers');

  const recipients = customers.map((c) => {
    const personalized = message.replaceAll('{name}', c.name.split(' ')[0]);
    let digits = c.phone.replace(/\D/g, '');
    if (digits.length === 10) digits = `91${digits}`; // assume Indian numbers without country code
    return { name: c.name, phone: c.phone, message: personalized, waLink: `https://wa.me/${digits}?text=${encodeURIComponent(personalized)}` };
  });

  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  if (token && phoneId) {
    const results = [];
    for (const r of recipients) {
      try {
        const resp = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ messaging_product: 'whatsapp', to: r.phone.replace(/[^0-9]/g, ''), type: 'text', text: { body: r.message } }),
        });
        results.push({ ...r, sent: resp.ok });
      } catch {
        results.push({ ...r, sent: false });
      }
    }
    return res.json({ mode: 'api', recipients: results });
  }

  res.json({ mode: 'links', recipients });
});

// ---------- public config: analytics + currencies ----------
app.get('/api/config', (_req, res) => {
  res.json({
    ga4Id: getSetting('ga4_id'),
    metaPixelId: getSetting('meta_pixel_id'),
    razorpayEnabled: razorpayEnabled(),
  });
});

// ---------- Google Merchant Center feed (RSS 2.0 product feed) ----------
app.get('/api/feeds/google-merchant.xml', (_req, res) => {
  const SITE_URL = process.env.SITE_URL || 'https://qualitydatesandnuts.com';
  const products = db.prepare('SELECT * FROM products').all().map(rowToProduct);
  const items = products.map((p) => `    <item>
      <g:id>${p.slug}</g:id>
      <g:title>${p.name} ${p.weight}</g:title>
      <g:description>${p.description.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</g:description>
      <g:link>${SITE_URL}/product/${p.slug}</g:link>
      <g:image_link>${SITE_URL}${p.image}</g:image_link>
      <g:availability>${p.stock > 0 ? 'in_stock' : 'out_of_stock'}</g:availability>
      <g:price>${p.price}.00 INR</g:price>
      <g:brand>Quality Dates and Nuts</g:brand>
      <g:condition>new</g:condition>
      <g:product_type>${p.category}</g:product_type>
    </item>`).join('\n');
  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Quality Dates and Nuts</title>
    <link>${SITE_URL}</link>
    <description>Premium dates, nuts and dry fruits</description>
${items}
  </channel>
</rss>`);
});

// ---------- admin: abandoned carts ----------
app.get('/api/admin/abandoned-carts', requireStaff, (_req, res) => {
  const carts = db.prepare(`SELECT * FROM abandoned_carts WHERE recovered = 0
    AND updated_at <= datetime('now', '-1 hours') ORDER BY updated_at DESC LIMIT 100`).all();
  res.json(carts.map((c) => {
    const items = JSON.parse(c.items);
    const first = (c.name || 'there').split(' ')[0];
    const msg = `Hi ${first}! You left ${items.length === 1 ? items[0].name : `${items.length} items`} in your cart at Quality Dates and Nuts 🌴 Complete your order today — use code WELCOME10 for 10% off!`;
    let digits = c.phone.replace(/\D/g, '');
    if (digits.length === 10) digits = `91${digits}`;
    return { ...c, items, waLink: `https://wa.me/${digits}?text=${encodeURIComponent(msg)}` };
  }));
});

app.delete('/api/admin/abandoned-carts/:id', requireStaff, (req, res) => {
  db.prepare('DELETE FROM abandoned_carts WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ---------- admin: subscriptions ----------
app.get('/api/admin/subscriptions', requireAdmin, (_req, res) => {
  res.json(db.prepare('SELECT * FROM subscriptions ORDER BY id DESC').all());
});

app.patch('/api/admin/subscriptions/:id', requireAdmin, (req, res) => {
  db.prepare('UPDATE subscriptions SET status = ? WHERE id = ?')
    .run(req.body?.status === 'cancelled' ? 'cancelled' : 'active', req.params.id);
  res.json({ ok: true });
});

// ---------- admin: settings ----------
const SETTING_KEYS = ['ga4_id', 'meta_pixel_id', 'low_stock_threshold', 'alert_email', 'upi_id', 'manual_payment_note', 'admin_phone'];
app.get('/api/admin/settings', requireAdmin, (_req, res) => {
  const values = Object.fromEntries(SETTING_KEYS.map((k) => [k, getSetting(k)]));
  res.json({
    values,
    integrations: {
      razorpay: razorpayEnabled(),
      whatsapp: !!(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_ID),
      smtp: !!process.env.SMTP_HOST,
      shiprocket: !!(process.env.SHIPROCKET_EMAIL && process.env.SHIPROCKET_PASSWORD),
    },
  });
});

app.put('/api/admin/settings', requireAdmin, (req, res) => {
  for (const key of SETTING_KEYS) {
    if (key in (req.body || {})) setSetting(key, req.body[key]);
  }
  res.json({ ok: true });
});

// ---------- admin: users & roles ----------
app.get('/api/admin/users', requireAdmin, (_req, res) => {
  res.json(db.prepare('SELECT id, name, email, phone, role, points, created_at FROM users ORDER BY id').all());
});

app.patch('/api/admin/users/:id', requireAdmin, (req, res) => {
  const { role } = req.body || {};
  if (!['admin', 'staff', 'customer'].includes(role)) return res.status(400).json({ error: 'role must be admin, staff or customer' });
  if (Number(req.params.id) === req.admin.id) return res.status(400).json({ error: 'You cannot change your own role' });
  db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, req.params.id);
  res.json({ ok: true });
});

// ---------- admin: CSV exports ----------
function toCsv(rows, columns) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return [columns.map(esc).join(','), ...rows.map((r) => columns.map((c) => esc(r[c])).join(','))].join('\r\n');
}

app.get('/api/admin/export/orders.csv', requireStaff, (_req, res) => {
  const rows = db.prepare('SELECT * FROM orders ORDER BY id DESC').all()
    .map((o) => ({ ...o, items: JSON.parse(o.items).map((i) => `${i.name} x${i.quantity}`).join('; ') }));
  res.type('text/csv').attachment('orders.csv').send(toCsv(rows,
    ['order_number', 'created_at', 'status', 'customer_name', 'customer_phone', 'customer_email', 'address', 'city', 'state', 'pincode', 'items', 'subtotal', 'discount', 'coupon_code', 'shipping', 'total', 'payment_method', 'payment_status', 'tracking_number', 'courier']));
});

app.get('/api/admin/export/customers.csv', requireStaff, (_req, res) => {
  const rows = db.prepare(`SELECT customer_name AS name, customer_phone AS phone, MAX(customer_email) AS email,
    COUNT(*) AS orders, SUM(total) AS spent, MAX(created_at) AS last_order
    FROM orders WHERE status != 'cancelled' GROUP BY customer_phone ORDER BY spent DESC`).all();
  res.type('text/csv').attachment('customers.csv').send(toCsv(rows, ['name', 'phone', 'email', 'orders', 'spent', 'last_order']));
});

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => console.log(`Quality Dates & Nuts API running on http://localhost:${PORT}`));

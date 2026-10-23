import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

export const db = new DatabaseSync(path.join(DATA_DIR, 'store.db'));

db.exec(`
  PRAGMA journal_mode = WAL;

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price INTEGER NOT NULL,
    mrp INTEGER NOT NULL,
    weight TEXT DEFAULT '',
    badge TEXT DEFAULT '',
    rating REAL DEFAULT 4.5,
    review_count INTEGER DEFAULT 0,
    stock INTEGER DEFAULT 50,
    featured INTEGER DEFAULT 0,
    description TEXT DEFAULT '',
    benefits TEXT DEFAULT '',
    image TEXT NOT NULL,
    images TEXT DEFAULT '[]',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT DEFAULT '',
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_number TEXT UNIQUE NOT NULL,
    user_id INTEGER,
    customer_name TEXT NOT NULL,
    customer_email TEXT DEFAULT '',
    customer_phone TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT DEFAULT '',
    pincode TEXT NOT NULL,
    items TEXT NOT NULL,
    subtotal INTEGER NOT NULL,
    discount INTEGER DEFAULT 0,
    coupon_code TEXT DEFAULT '',
    shipping INTEGER DEFAULT 0,
    total INTEGER NOT NULL,
    payment_method TEXT DEFAULT 'cod',
    status TEXT DEFAULT 'confirmed',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS coupons (
    code TEXT PRIMARY KEY,
    percent INTEGER NOT NULL,
    min_order INTEGER DEFAULT 0,
    active INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    rating INTEGER NOT NULL,
    comment TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (product_id) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS newsletter (
    email TEXT PRIMARY KEY,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS blog_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    excerpt TEXT DEFAULT '',
    content TEXT NOT NULL,
    image TEXT DEFAULT '',
    published INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL,
    active INTEGER DEFAULT 1
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS abandoned_carts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT UNIQUE NOT NULL,
    name TEXT DEFAULT '',
    items TEXT NOT NULL,
    subtotal INTEGER DEFAULT 0,
    recovered INTEGER DEFAULT 0,
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT UNIQUE NOT NULL,
    name TEXT DEFAULT '',
    source TEXT DEFAULT 'website',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT DEFAULT '',
    plan TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

// Idempotent column migrations
const migrations = [
  ["users", "role TEXT DEFAULT 'customer'"],
  ['users', 'points INTEGER DEFAULT 0'],
  ['users', "referral_code TEXT DEFAULT ''"],
  ['products', "variants TEXT DEFAULT '[]'"],
  ['orders', "landmark TEXT DEFAULT ''"],
  ['orders', "payment_status TEXT DEFAULT 'pending'"],
  ['orders', "payment_id TEXT DEFAULT ''"],
  ['orders', "tracking_number TEXT DEFAULT ''"],
  ['orders', "courier TEXT DEFAULT ''"],
  ['orders', 'points_earned INTEGER DEFAULT 0'],
  ['orders', 'points_redeemed INTEGER DEFAULT 0'],
  ['orders', "referral_code TEXT DEFAULT ''"],
  ['reviews', "image TEXT DEFAULT ''"],
  ['reviews', 'verified INTEGER DEFAULT 0'],
];
for (const [table, column] of migrations) {
  try {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column}`);
  } catch {
    // column already exists
  }
}

export function getSetting(key, fallback = '') {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return row ? row.value : fallback;
}

export function setSetting(key, value) {
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(key, String(value ?? ''));
}

export function rowToProduct(row) {
  if (!row) return null;
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category,
    price: row.price,
    mrp: row.mrp,
    weight: row.weight,
    badge: row.badge,
    rating: row.rating,
    reviewCount: row.review_count,
    stock: row.stock,
    featured: !!row.featured,
    description: row.description,
    benefits: row.benefits ? JSON.parse(row.benefits) : [],
    image: row.image,
    images: row.images ? JSON.parse(row.images) : [],
    variants: row.variants ? JSON.parse(row.variants) : [],
  };
}

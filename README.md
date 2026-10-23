# Quality Dates and Nuts — Full E-commerce Store

Premium dates & nuts storefront modeled on ajfan.store functionality, with a modern animated UI, a real API + database, and full SEO/AEO/GEO.

## Run it

```bash
npm install
npm run seed   # (re)create the SQLite DB + products + sitemap/robots/llms.txt
npm run dev    # starts API (http://localhost:4000) + web (http://localhost:5173) together
```

`npm run build` produces the production frontend in `dist/`. Deploy the frontend as static files and run `node server/index.js` behind the same domain (proxy `/api` to it).

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 19 + Vite + Tailwind v4 + Framer Motion + React Router |
| API | Express (`server/index.js`) |
| Database | SQLite via built-in `node:sqlite` (`server/data/store.db`) |
| Auth | scrypt password hashing + HMAC tokens (no external deps) |

## Features

- **Catalog**: 22 seeded products across Dates / Stuffed Dates / Nuts / Dry Fruits / Seeds / Snacks / Gifting, with category filter, search, and sorting
- **Low-click buying**: 1-click ADD and BUY NOW on every product card; express single-page checkout; delivery details remembered locally so repeat orders are Buy Now → Place Order
- **Cart**: persistent drawer with free-shipping progress bar; wishlist; toasts
- **Orders**: server-side re-pricing (client totals never trusted), stock decrement, coupons (`WELCOME10`, `QDN15`), COD/UPI, order tracking by number + phone
- **Accounts**: register/login, order history for signed-in users
- **Reviews**: per-product reviews that update the aggregate rating
- **WhatsApp ordering**: floating button + post-order chat link
- **SEO**: per-page titles/meta/canonical/Open Graph, JSON-LD (OnlineStore, WebSite+SearchAction, Product, FAQPage, BreadcrumbList), `sitemap.xml`, `robots.txt`
- **AEO/GEO**: `llms.txt` brief for AI answer engines + FAQPage structured data

## Admin portal

Open **`/admin`** — default login `admin@qualitydatesandnuts.com` / `admin123`
(override with `ADMIN_EMAIL` / `ADMIN_PASSWORD` env vars before first run; change in production!).

- **Dashboard**: revenue/orders stat tiles, 30-day sales graph, top products, recent orders
- **Products**: add / edit / delete with name, description, pricing, stock, badges, and multi-image upload
- **Orders & Customers**: full customer details per order, status updates (feeds customer tracking), customer list with lifetime spend
- **Reviews**: moderate and delete (product rating auto-recalculates)
- **Offers & Announcements**: coupon codes + the site-wide scrolling announcement bar
- **Blog**: write, publish/unpublish, delete posts (served with Article JSON-LD for SEO)
- **WhatsApp Broadcast**: personalised `{name}` messages for every customer — one-click wa.me send links, or fully automatic via Meta WhatsApp Business Cloud API (`WHATSAPP_TOKEN` + `WHATSAPP_PHONE_ID` env vars)

## Feature reference (Phase 3)

- **Payments**: Razorpay (UPI/cards/netbanking) — set `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET`; "Pay Online" appears at checkout automatically, with server-side signature verification. COD/UPI-on-delivery remain the fallback.
- **Abandoned carts**: captured once a shopper enters their phone at checkout; listed in Admin → Recovery after 1 hour with one-click personalised WhatsApp nudge links. Marked recovered automatically when they order.
- **Order notifications**: WhatsApp + email to the customer on order placement and every status change (incl. tracking number). Configure `WHATSAPP_TOKEN`/`WHATSAPP_PHONE_ID` and `SMTP_*` env vars; without them messages are logged, never lost silently.
- **Variants**: per-product pack sizes (200g/400g/1kg…) with individual price/MRP — editable in the admin product form; server re-prices variants on every order.
- **Loyalty**: signed-in customers earn 1 point per ₹10 (1 point = ₹1, redeemable up to 20% of subtotal). **Referrals**: every account gets a code (Account page); friends get 5% off, referrer gets 50 points.
- **Subscribe & Save**: 3 monthly plans at `/subscribe`; members managed in Admin → Recovery.
- **Marketing**: GA4 + Meta Pixel IDs set in Admin → Settings (injected only in production); Google Merchant feed at `/api/feeds/google-merchant.xml`.
- **Reviews**: photo upload + Verified Purchase badge (validated against a real order number).
- **Festival pages**: `/occasions/diwali`, `/occasions/ramadan`, `/occasions/rakhi`, `/occasions/wedding`.
- **Shipping**: AWB + courier per order (Admin → Orders) shown on customer tracking; Shiprocket env hooks ready.
- **Ops**: low-stock email alerts (threshold in Settings), CSV export of orders/customers, printable invoices (`/invoice/:orderNumber?phone=`), staff role (orders/reviews/recovery only) via Admin → Team & Users.
- **Experience**: installable PWA with offline cache, dark mode toggle, frequently-bought-together (from real order co-occurrence), recently-viewed strip, English/Tamil/Hindi chrome, INR/USD/AED/GBP display currency (billing stays INR).

## Before going live

- Replace `WHATSAPP_NUMBER` in `src/lib/api.ts` and the phone/address in `src/components/Footer.tsx`
- Set your real domain: `SITE_URL` env var when running `npm run seed`, and in `src/components/Seo.tsx` + `index.html`
- Set a strong `JWT_SECRET` env var for the API
- Replace the generated SVG product art in `public/product/gen/` with real photography (DB `image` paths are in `server/seed.js`)

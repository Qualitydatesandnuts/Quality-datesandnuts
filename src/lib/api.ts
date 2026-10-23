export interface Variant {
  label: string;
  price: number;
  mrp: number;
}

export interface Product {
  id: number;
  slug: string;
  name: string;
  category: string;
  price: number;
  mrp: number;
  weight: string;
  badge: string;
  rating: number;
  reviewCount: number;
  stock: number;
  featured: boolean;
  description: string;
  benefits: string[];
  image: string;
  images: string[];
  variants: Variant[];
}

export interface Review {
  id: number;
  name: string;
  rating: number;
  comment: string;
  image?: string;
  verified?: number;
  created_at: string;
}

export interface OrderItem {
  id: number;
  slug: string;
  name: string;
  weight: string;
  variant?: string;
  image: string;
  price: number;
  quantity: number;
}

export interface Order {
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  address: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  coupon_code: string;
  shipping: number;
  total: number;
  payment_method: string;
  payment_status: string;
  status: string;
  tracking_number: string;
  courier: string;
  points_earned: number;
  points_redeemed: number;
  created_at: string;
}

const TOKEN_KEY = 'qdn_token';
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t: string | null) =>
  t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY);

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || 'Something went wrong');
  return data as T;
}

export const api = {
  products: (params: Record<string, string> = {}) =>
    request<Product[]>(`/api/products?${new URLSearchParams(params)}`),
  product: (slug: string) =>
    request<{ product: Product; related: Product[]; boughtTogether: Product[]; reviews: Review[] }>(`/api/products/${slug}`),
  categories: () => request<{ category: string; count: number }[]>('/api/categories'),
  register: (body: { name: string; email: string; phone: string; password: string }) =>
    request<{ token: string; user: User }>('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: { email: string; password: string }) =>
    request<{ token: string; user: User }>('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  me: () => request<{ user: User }>('/api/auth/me'),
  validateCoupon: (code: string, subtotal: number) =>
    request<{ code: string; percent: number }>('/api/coupons/validate', { method: 'POST', body: JSON.stringify({ code, subtotal }) }),
  placeOrder: (body: unknown) =>
    request<{
      orderNumber: string; subtotal: number; discount: number; shipping: number; total: number;
      items: OrderItem[]; pointsEarned: number; pointsRedeemed: number;
      payment: { razorpayOrderId: string; amount: number; keyId: string } | null;
      estimatedDelivery: string;
    }>('/api/orders', { method: 'POST', body: JSON.stringify(body) }),
  verifyPayment: (body: { orderNumber: string; razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }) =>
    request<{ ok: true }>('/api/payments/verify', { method: 'POST', body: JSON.stringify(body) }),
  paymentsConfig: () =>
    request<{ enabled: boolean; keyId: string; directUpi: boolean; upiId: string; manualNote: string }>('/api/payments/config'),
  upiClaim: (orderNumber: string, phone: string, utr: string) =>
    request<{ ok: true; status: string }>('/api/payments/upi-claim', { method: 'POST', body: JSON.stringify({ orderNumber, phone, utr }) }),
  retryPayment: (orderNumber: string, phone: string) =>
    request<{ paid: boolean; payment: { razorpayOrderId: string; amount: number; keyId: string } | null }>(
      '/api/payments/retry', { method: 'POST', body: JSON.stringify({ orderNumber, phone }) }),
  trackCart: (body: { phone: string; name: string; items: unknown[]; subtotal: number }) =>
    request<{ ok: boolean }>('/api/cart/track', { method: 'POST', body: JSON.stringify(body) }),
  subscribe: (body: { name: string; phone: string; email: string; plan: string }) =>
    request<{ ok: true }>('/api/subscriptions', { method: 'POST', body: JSON.stringify(body) }),
  siteConfig: () => request<{ ga4Id: string; metaPixelId: string; razorpayEnabled: boolean }>('/api/config'),
  trackOrder: (orderNumber: string, phone: string) =>
    request<Order>(`/api/orders/track?${new URLSearchParams({ orderNumber, phone })}`),
  myOrders: () => request<Order[]>('/api/orders/mine'),
  addReview: (body: { productId: number; name: string; rating: number; comment: string; imageDataUrl?: string; orderNumber?: string }) =>
    request<{ ok: true }>('/api/reviews', { method: 'POST', body: JSON.stringify(body) }),
  newsletter: (email: string) =>
    request<{ ok: true }>('/api/newsletter', { method: 'POST', body: JSON.stringify({ email }) }),
  addLead: (phone: string, name?: string) =>
    request<{ ok: true }>('/api/leads', { method: 'POST', body: JSON.stringify({ phone, name }) }),
};

export type BroadcastAudience = 'customers' | 'leads' | 'abandoned' | 'all';

export interface Lead {
  id: number;
  phone: string;
  name: string;
  source: string;
  created_at: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role?: 'admin' | 'staff' | 'customer';
  points?: number;
  referralCode?: string;
}

export interface AbandonedCart {
  id: number;
  phone: string;
  name: string;
  items: OrderItem[];
  subtotal: number;
  updated_at: string;
  waLink: string;
}

export interface Subscription {
  id: number;
  name: string;
  phone: string;
  email: string;
  plan: string;
  status: string;
  created_at: string;
}

export interface AdminSettings {
  values: { ga4_id: string; meta_pixel_id: string; low_stock_threshold: string; alert_email: string; upi_id: string; manual_payment_note: string; admin_phone: string };
  integrations: { razorpay: boolean; whatsapp: boolean; smtp: boolean; shiprocket: boolean };
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  points: number;
  created_at: string;
}

export interface BlogPost {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  image: string;
  published: number;
  created_at: string;
}

export interface Coupon {
  code: string;
  percent: number;
  min_order: number;
  active: number;
}

export interface Announcement {
  id: number;
  text: string;
  active: number;
}

export interface AdminReview extends Review {
  product_id: number;
  product_name: string;
  product_slug: string;
}

export interface AdminStats {
  totals: { orders: number; revenue: number; customers: number; products: number; lowStock: number; pending: number };
  daily: { day: string; orders: number; revenue: number }[];
  topProducts: { name: string; units: number }[];
  recentOrders: (Order & { id: number })[];
}

export interface Customer {
  name: string;
  phone: string;
  email: string;
  orders: number;
  spent: number;
  last_order: string;
}

export interface BroadcastRecipient {
  name: string;
  phone: string;
  message: string;
  waLink: string;
  sent?: boolean;
}

export const adminApi = {
  stats: () => request<AdminStats>('/api/admin/stats'),
  upload: (name: string, dataUrl: string) =>
    request<{ path: string }>('/api/admin/upload', { method: 'POST', body: JSON.stringify({ name, dataUrl }) }),
  createProduct: (body: unknown) => request<Product>('/api/admin/products', { method: 'POST', body: JSON.stringify(body) }),
  updateProduct: (id: number, body: unknown) => request<Product>(`/api/admin/products/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteProduct: (id: number) => request<{ ok: true }>(`/api/admin/products/${id}`, { method: 'DELETE' }),
  reviews: () => request<AdminReview[]>('/api/admin/reviews'),
  deleteReview: (id: number) => request<{ ok: true }>(`/api/admin/reviews/${id}`, { method: 'DELETE' }),
  coupons: () => request<Coupon[]>('/api/admin/coupons'),
  createCoupon: (body: { code: string; percent: number; minOrder: number }) =>
    request<{ ok: true }>('/api/admin/coupons', { method: 'POST', body: JSON.stringify(body) }),
  toggleCoupon: (code: string, active: boolean) =>
    request<{ ok: true }>(`/api/admin/coupons/${code}`, { method: 'PATCH', body: JSON.stringify({ active }) }),
  deleteCoupon: (code: string) => request<{ ok: true }>(`/api/admin/coupons/${code}`, { method: 'DELETE' }),
  announcements: () => request<Announcement[]>('/api/admin/announcements'),
  createAnnouncement: (text: string) => request<{ ok: true }>('/api/admin/announcements', { method: 'POST', body: JSON.stringify({ text }) }),
  toggleAnnouncement: (id: number, active: boolean) =>
    request<{ ok: true }>(`/api/admin/announcements/${id}`, { method: 'PATCH', body: JSON.stringify({ active }) }),
  deleteAnnouncement: (id: number) => request<{ ok: true }>(`/api/admin/announcements/${id}`, { method: 'DELETE' }),
  blogPosts: () => request<BlogPost[]>('/api/admin/blog'),
  createBlogPost: (body: unknown) => request<{ ok: true; slug: string }>('/api/admin/blog', { method: 'POST', body: JSON.stringify(body) }),
  updateBlogPost: (id: number, body: unknown) => request<{ ok: true }>(`/api/admin/blog/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteBlogPost: (id: number) => request<{ ok: true }>(`/api/admin/blog/${id}`, { method: 'DELETE' }),
  orders: (status?: string) => request<(Order & { id: number })[]>(`/api/admin/orders${status ? `?status=${status}` : ''}`),
  updateOrderStatus: (id: number, status: string) =>
    request<{ ok: true }>(`/api/admin/orders/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  updateOrderTracking: (id: number, trackingNumber: string, courier: string) =>
    request<{ ok: true }>(`/api/admin/orders/${id}`, { method: 'PATCH', body: JSON.stringify({ trackingNumber, courier }) }),
  markOrderPaid: (id: number) =>
    request<{ ok: true }>(`/api/admin/orders/${id}`, { method: 'PATCH', body: JSON.stringify({ paymentStatus: 'paid' }) }),
  customers: () => request<Customer[]>('/api/admin/customers'),
  abandonedCarts: () => request<AbandonedCart[]>('/api/admin/abandoned-carts'),
  deleteAbandonedCart: (id: number) => request<{ ok: true }>(`/api/admin/abandoned-carts/${id}`, { method: 'DELETE' }),
  subscriptions: () => request<Subscription[]>('/api/admin/subscriptions'),
  updateSubscription: (id: number, status: string) =>
    request<{ ok: true }>(`/api/admin/subscriptions/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  settings: () => request<AdminSettings>('/api/admin/settings'),
  saveSettings: (values: Partial<AdminSettings['values']>) =>
    request<{ ok: true }>('/api/admin/settings', { method: 'PUT', body: JSON.stringify(values) }),
  users: () => request<AdminUser[]>('/api/admin/users'),
  setUserRole: (id: number, role: string) =>
    request<{ ok: true }>(`/api/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify({ role }) }),
  exportCsv: async (kind: 'orders' | 'customers') => {
    const res = await fetch(`/api/admin/export/${kind}.csv`, { headers: { Authorization: `Bearer ${getToken()}` } });
    if (!res.ok) throw new Error('Export failed');
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${kind}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  },
  broadcast: (message: string, audience: BroadcastAudience = 'customers') =>
    request<{ mode: 'api' | 'links'; recipients: BroadcastRecipient[] }>('/api/admin/broadcast', { method: 'POST', body: JSON.stringify({ message, audience }) }),
  broadcastAudiences: () =>
    request<Record<BroadcastAudience, number>>('/api/admin/broadcast/audiences'),
  leads: () => request<Lead[]>('/api/admin/leads'),
  deleteLead: (id: number) => request<{ ok: true }>(`/api/admin/leads/${id}`, { method: 'DELETE' }),
};

export const publicApi = {
  blog: () => request<Omit<BlogPost, 'content' | 'published'>[]>('/api/blog'),
  blogPost: (slug: string) => request<BlogPost>(`/api/blog/${slug}`),
  announcements: () => request<{ id: number; text: string }[]>('/api/announcements'),
};

// ---------- display currency (checkout always charges INR) ----------
export const CURRENCIES: Record<string, { rate: number; locale: string; symbol: string }> = {
  INR: { rate: 1, locale: 'en-IN', symbol: '₹' },
  USD: { rate: 0.0117, locale: 'en-US', symbol: '$' },
  AED: { rate: 0.043, locale: 'en-AE', symbol: 'د.إ' },
  GBP: { rate: 0.0092, locale: 'en-GB', symbol: '£' },
};

export const getCurrency = (): string => localStorage.getItem('qdn_currency') || 'INR';
export const setCurrency = (code: string) => {
  localStorage.setItem('qdn_currency', CURRENCIES[code] ? code : 'INR');
  window.location.reload(); // prices are formatted at render time all over the app — a reload keeps it simple and correct
};

const activeCurrency = CURRENCIES[getCurrency()] || CURRENCIES.INR;

/** Format a rupee amount in the shopper's chosen display currency. */
export const inr = (n: number) => {
  const converted = n * activeCurrency.rate;
  return converted.toLocaleString(activeCurrency.locale, {
    style: 'currency',
    currency: getCurrency(),
    maximumFractionDigits: activeCurrency.rate === 1 ? 0 : 2,
  });
};

export const FREE_SHIPPING_ABOVE = 999;
export const WHATSAPP_NUMBER = '916282885541'; // TODO: replace with the real store number

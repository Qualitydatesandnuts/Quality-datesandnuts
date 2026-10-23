import { BrowserRouter, Routes, Route, useLocation, Link } from 'react-router-dom';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from './components/Navbar';
import AnnouncementBar from './components/AnnouncementBar';
import CartDrawer from './components/CartDrawer';
import Footer from './components/Footer';
import WhatsAppButton from './components/WhatsAppButton';
import WhatsAppOptIn from './components/WhatsAppOptIn';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import TrackOrder from './pages/TrackOrder';
import Account from './pages/Account';
import Wishlist from './pages/Wishlist';
import Faq from './pages/Faq';
import About from './pages/About';
import Blog from './pages/Blog';
import BlogPostPage from './pages/BlogPostPage';
import Occasion from './pages/Occasion';
import Subscribe from './pages/Subscribe';
import Invoice from './pages/Invoice';
import AdminLayout from './pages/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminReviews from './pages/admin/AdminReviews';
import AdminOffers from './pages/admin/AdminOffers';
import AdminBlog from './pages/admin/AdminBlog';
import AdminBroadcast from './pages/admin/AdminBroadcast';
import AdminSettings from './pages/admin/AdminSettings';
import AdminRecovery from './pages/admin/AdminRecovery';
import AdminUsers from './pages/admin/AdminUsers';
import { I18nProvider } from './lib/i18n';
import { api } from './lib/api';
import { applyTheme, getTheme, loadAnalytics } from './lib/prefs';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { ToastProvider } from './context/ToastContext';
import Seo from './components/Seo';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function NotFound() {
  return (
    <div className="pt-40 pb-24 text-center px-4 min-h-screen">
      <Seo title="Page not found" description="This page does not exist." path="/404" />
      <p className="font-serif text-7xl font-bold text-gold mb-4">404</p>
      <h1 className="font-serif text-3xl font-semibold text-espresso mb-6">This aisle is empty</h1>
      <Link to="/" className="bg-espresso text-cream px-8 py-4 rounded-full text-sm font-bold hover:bg-cocoa transition-colors">
        Back home
      </Link>
    </div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  // Enter-only transition: never block navigation on an exit animation —
  // checkout must be reachable instantly even if rAF is throttled.
  return (
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
      >
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/product/:slug" element={<ProductDetail />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-success/:orderNumber" element={<OrderSuccess />} />
          <Route path="/track-order" element={<TrackOrder />} />
          <Route path="/account" element={<Account />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/faq" element={<Faq />} />
          <Route path="/about" element={<About />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
          <Route path="/occasions/:slug" element={<Occasion />} />
          <Route path="/subscribe" element={<Subscribe />} />
          <Route path="/invoice/:orderNumber" element={<Invoice />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </motion.div>
  );
}

function StoreLayout() {
  return (
    <div className="min-h-screen bg-cream font-sans">
      <Navbar />
      <AnnouncementBar />
      <main>
        <AnimatedRoutes />
      </main>
      <Footer />
      <CartDrawer />
      <WhatsAppButton />
      <WhatsAppOptIn />
    </div>
  );
}

export default function App() {
  // Theme + analytics bootstrap
  useEffect(() => {
    applyTheme(getTheme());
    api.siteConfig()
      .then((c) => loadAnalytics(c.ga4Id, c.metaPixelId))
      .catch(() => {});
  }, []);

  return (
    <BrowserRouter>
      <ToastProvider>
        <I18nProvider>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <ScrollToTop />
              <Routes>
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="products" element={<AdminProducts />} />
                  <Route path="orders" element={<AdminOrders />} />
                  <Route path="reviews" element={<AdminReviews />} />
                  <Route path="recovery" element={<AdminRecovery />} />
                  <Route path="offers" element={<AdminOffers />} />
                  <Route path="blog" element={<AdminBlog />} />
                  <Route path="whatsapp" element={<AdminBroadcast />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="settings" element={<AdminSettings />} />
                </Route>
                <Route path="*" element={<StoreLayout />} />
              </Routes>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
        </I18nProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

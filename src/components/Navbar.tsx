import { Search, ShoppingBag, Menu, X, Heart, User, PackageSearch, Moon, Sun, Globe } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useI18n, LANGS, type Lang } from '../lib/i18n';
import { CURRENCIES, getCurrency, setCurrency } from '../lib/api';
import { applyTheme, getTheme } from '../lib/prefs';

export default function Navbar() {
  const { totalItems, setIsCartOpen } = useCart();
  const { ids: wishlistIds } = useWishlist();
  const { t, lang, setLang } = useI18n();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [theme, setTheme] = useState(getTheme());
  const [query, setQuery] = useState('');

  const links = [
    { to: '/', label: t('home') },
    { to: '/shop', label: t('shop') },
    { to: '/shop?category=Dates', label: t('dates') },
    { to: '/shop?category=Nuts', label: t('nuts') },
    { to: '/shop?category=Gifting', label: t('gifting') },
    { to: '/subscribe', label: 'Subscribe' },
    { to: '/blog', label: t('blog') },
  ];

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    applyTheme(next);
  };
  const navigate = useNavigate();
  const location = useLocation();
  const searchRef = useRef<HTMLInputElement>(null);
  const onHome = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
    setPrefsOpen(false);
  }, [location]);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/shop?search=${encodeURIComponent(query.trim())}`);
      setQuery('');
    }
  };

  const solid = scrolled || !onHome || menuOpen || searchOpen;

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          solid ? 'backdrop-blur-xl bg-cream/85 border-b border-espresso/10 shadow-sm' : 'bg-transparent'
        }`}
      >
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
          <div className="flex justify-between items-center h-[70px]">
            <Link to="/" className="flex-shrink-0 flex items-center gap-2.5" aria-label="Quality Dates and Nuts home">
              <img src="/logo.png" alt="" className="w-11 h-auto" />
              <span className={`font-serif font-bold leading-tight text-sm hidden sm:block ${solid ? 'text-espresso' : 'text-[#FAF6EF] drop-shadow'}`}>
                Quality<br />Dates &amp; Nuts
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              {links.map((item) => (
                <NavLink
                  key={item.label}
                  to={item.to}
                  className={`text-sm font-medium transition-colors ${
                    solid ? 'text-cocoa hover:text-espresso' : 'text-[#FAF6EF]/90 hover:text-white drop-shadow'
                  }`}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>

            <div className={`flex items-center gap-1 sm:gap-2 ${solid ? 'text-cocoa' : 'text-[#FAF6EF] drop-shadow'}`}>
              <button onClick={toggleTheme} aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} className="p-2.5 hover:text-gold transition-colors hidden sm:block">
                {theme === 'dark' ? <Sun className="w-5 h-5 stroke-[1.5]" aria-hidden="true" /> : <Moon className="w-5 h-5 stroke-[1.5]" aria-hidden="true" />}
              </button>
              <div className="relative hidden sm:block">
                <button onClick={() => setPrefsOpen((p) => !p)} aria-label="Language and currency" aria-expanded={prefsOpen} className="p-2.5 hover:text-gold transition-colors">
                  <Globe className="w-5 h-5 stroke-[1.5]" aria-hidden="true" />
                </button>
                <AnimatePresence>
                  {prefsOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className="absolute right-0 top-12 bg-white text-espresso rounded-2xl shadow-xl border border-espresso/10 p-4 w-52 space-y-3"
                    >
                      <label className="block">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-cocoa-light">Language</span>
                        <select value={lang} onChange={(e) => setLang(e.target.value as Lang)} className="mt-1 w-full bg-cream rounded-xl px-3 py-2 text-sm outline-none border border-espresso/10" aria-label="Language">
                          {LANGS.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
                        </select>
                      </label>
                      <label className="block">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-cocoa-light">Currency</span>
                        <select value={getCurrency()} onChange={(e) => setCurrency(e.target.value)} className="mt-1 w-full bg-cream rounded-xl px-3 py-2 text-sm outline-none border border-espresso/10" aria-label="Display currency">
                          {Object.keys(CURRENCIES).map((c) => <option key={c} value={c}>{c} ({CURRENCIES[c].symbol})</option>)}
                        </select>
                      </label>
                      <p className="text-[10px] text-cocoa-light">Orders are billed in INR.</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <button onClick={() => setSearchOpen((s) => !s)} aria-label="Search products" className="p-2.5 hover:text-gold transition-colors">
                <Search className="w-5 h-5 stroke-[1.5]" aria-hidden="true" />
              </button>
              <Link to="/wishlist" aria-label={`Wishlist, ${wishlistIds.length} items`} className="p-2.5 hover:text-gold transition-colors relative hidden sm:block">
                <Heart className="w-5 h-5 stroke-[1.5]" aria-hidden="true" />
                {wishlistIds.length > 0 && (
                  <span className="absolute top-0.5 right-0.5 bg-gold text-espresso text-[10px] w-[17px] h-[17px] rounded-full flex items-center justify-center font-bold">
                    {wishlistIds.length}
                  </span>
                )}
              </Link>
              <Link to="/account" aria-label="My account" className="p-2.5 hover:text-gold transition-colors hidden sm:block">
                <User className="w-5 h-5 stroke-[1.5]" aria-hidden="true" />
              </Link>
              <button onClick={() => setIsCartOpen(true)} aria-label={`Cart, ${totalItems} items`} className="p-2.5 hover:text-gold transition-colors relative">
                <ShoppingBag className="w-5 h-5 stroke-[1.5]" aria-hidden="true" />
                <AnimatePresence>
                  {totalItems > 0 && (
                    <motion.span
                      key={totalItems}
                      initial={{ scale: 0.4 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                      className="absolute top-0.5 right-0.5 bg-espresso text-goldlight text-[10px] w-[17px] h-[17px] rounded-full flex items-center justify-center font-bold"
                    >
                      {totalItems}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
              <button onClick={() => setMenuOpen((m) => !m)} aria-label="Menu" className="md:hidden p-2.5">
                {menuOpen ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
              </button>
            </div>
          </div>
        </nav>

        {/* search bar */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-espresso/10 bg-cream/95 backdrop-blur-xl"
            >
              <form onSubmit={submitSearch} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex gap-3">
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search dates, almonds, gift boxes…"
                  aria-label="Search products"
                  className="flex-1 bg-white rounded-full px-5 py-3 text-sm outline-none border border-espresso/10 focus:border-gold transition-colors"
                />
                <button type="submit" className="bg-espresso text-cream px-6 rounded-full text-sm font-bold hover:bg-cocoa transition-colors">
                  Search
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* mobile menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden overflow-hidden border-t border-espresso/10 bg-cream/95 backdrop-blur-xl"
            >
              <div className="px-6 py-4 flex flex-col gap-1">
                {[...links, { to: '/wishlist', label: t('wishlist') }, { to: '/track-order', label: t('trackOrder') }, { to: '/account', label: t('account') }].map((item) => (
                  <Link key={item.label} to={item.to} className="py-3 text-cocoa font-medium border-b border-espresso/5 last:border-0">
                    {item.label}
                  </Link>
                ))}
                <div className="flex items-center gap-3 py-4">
                  <button onClick={toggleTheme} aria-label="Toggle dark mode" className="p-2.5 bg-cream-dark rounded-full text-cocoa">
                    {theme === 'dark' ? <Sun className="w-4 h-4" aria-hidden="true" /> : <Moon className="w-4 h-4" aria-hidden="true" />}
                  </button>
                  <select value={lang} onChange={(e) => setLang(e.target.value as Lang)} className="bg-cream-dark rounded-full px-3 py-2 text-sm text-cocoa outline-none" aria-label="Language">
                    {LANGS.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
                  </select>
                  <select value={getCurrency()} onChange={(e) => setCurrency(e.target.value)} className="bg-cream-dark rounded-full px-3 py-2 text-sm text-cocoa outline-none" aria-label="Display currency">
                    {Object.keys(CURRENCIES).map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Track order shortcut under nav on desktop */}
      <Link
        to="/track-order"
        className="hidden lg:flex items-center gap-1.5 fixed top-[86px] right-6 z-40 text-xs font-semibold text-cocoa bg-white/80 backdrop-blur px-3.5 py-2 rounded-full shadow-sm hover:shadow transition-shadow"
      >
        <PackageSearch className="w-3.5 h-3.5" aria-hidden="true" /> Track Order
      </Link>
    </>
  );
}


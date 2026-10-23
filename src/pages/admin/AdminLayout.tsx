import { useState } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, Star, BadgePercent, BookOpen, MessageCircle, LogOut, Store, ShieldAlert, RotateCcw, Users, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { inputCls, btnPrimary } from './ui';
import Seo from '../../components/Seo';

const nav = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true, adminOnly: true },
  { to: '/admin/products', label: 'Products', icon: Package, adminOnly: true },
  { to: '/admin/orders', label: 'Orders & Customers', icon: ShoppingCart, adminOnly: false },
  { to: '/admin/reviews', label: 'Reviews', icon: Star, adminOnly: false },
  { to: '/admin/recovery', label: 'Recovery & Subscriptions', icon: RotateCcw, adminOnly: false },
  { to: '/admin/offers', label: 'Offers & Announcements', icon: BadgePercent, adminOnly: true },
  { to: '/admin/blog', label: 'Blog', icon: BookOpen, adminOnly: true },
  { to: '/admin/whatsapp', label: 'WhatsApp Broadcast', icon: MessageCircle, adminOnly: true },
  { to: '/admin/users', label: 'Team & Users', icon: Users, adminOnly: true },
  { to: '/admin/settings', label: 'Settings', icon: Settings, adminOnly: true },
];

function AdminLogin() {
  const { login, logout, user } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await login(email, password);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Login failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <Seo title="Admin Login" description="Store administration." path="/admin" />
      <div className="w-full max-w-sm bg-white rounded-[2rem] border border-espresso/5 p-8 shadow-xl shadow-espresso/5">
        <img src="/logo.png" alt="" className="w-12 mx-auto mb-4" />
        <h1 className="font-serif text-2xl font-semibold text-espresso text-center mb-1">Admin Portal</h1>
        <p className="text-xs text-cocoa-light text-center mb-6">Quality Dates and Nuts</p>

        {user && !['admin', 'staff'].includes(user.role || '') ? (
          <div className="text-center space-y-4">
            <ShieldAlert className="w-8 h-8 text-red-500 mx-auto" aria-hidden="true" />
            <p className="text-sm text-cocoa">Signed in as <strong>{user.email}</strong>, which is not an admin account.</p>
            <button onClick={logout} className={btnPrimary}>Sign out and try again</button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Admin email" aria-label="Admin email" className={inputCls} autoComplete="email" />
            <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" aria-label="Password" className={inputCls} autoComplete="current-password" />
            <button type="submit" disabled={busy} className={`${btnPrimary} w-full py-3.5`}>
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        )}
        <Link to="/" className="block text-center text-xs text-cocoa-light mt-6 hover:text-espresso">← Back to store</Link>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-cream flex items-center justify-center text-cocoa-light">Loading…</div>;
  }
  if (!user || !['admin', 'staff'].includes(user.role || '')) return <AdminLogin />;
  const visibleNav = nav.filter((item) => user.role === 'admin' || !item.adminOnly);

  return (
    <div className="min-h-screen bg-cream flex">
      <Seo title="Admin Portal" description="Store administration." path="/admin" />

      {/* sidebar */}
      <aside className="w-60 flex-shrink-0 bg-espresso text-cream/80 flex flex-col fixed inset-y-0 left-0 z-40 overflow-y-auto">
        <div className="p-5 flex items-center gap-3 border-b border-cream/10">
          <img src="/logo.png" alt="" className="w-9" />
          <div>
            <p className="font-serif font-bold text-cream text-sm leading-tight">Quality D&amp;N</p>
            <p className="text-[10px] uppercase tracking-widest text-goldlight">Admin</p>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1" aria-label="Admin navigation">
          {visibleNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-colors ${
                  isActive ? 'bg-gold text-espresso' : 'hover:bg-cream/10 text-cream/80'
                }`
              }
            >
              <item.icon className="w-5 h-5" aria-hidden="true" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-cream/10 space-y-1">
          <Link to="/" className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium hover:bg-cream/10">
            <Store className="w-5 h-5" aria-hidden="true" /> View store
          </Link>
          <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium hover:bg-cream/10 text-left">
            <LogOut className="w-5 h-5" aria-hidden="true" /> Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-60 p-8 max-w-[1200px]">
        <Outlet />
      </main>
    </div>
  );
}

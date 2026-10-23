import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User as UserIcon, LogOut, Package, Coins, Gift, Copy, ShieldCheck, ArrowRight } from 'lucide-react';
import Seo from '../components/Seo';
import { api, inr, type Order } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Account() {
  const { user, login, register, logout } = useAuth();
  const { toast } = useToast();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (user) api.myOrders().then(setOrders).catch(() => {});
    else setOrders([]);
  }, [user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
        toast('Welcome back!');
      } else {
        await register(form.name, form.email, form.phone, form.password);
        toast('Account created — welcome to the family!');
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Something went wrong', 'error');
    } finally {
      setBusy(false);
    }
  };

  const inputCls = 'w-full bg-white rounded-2xl px-5 py-3.5 text-sm outline-none border border-espresso/10 focus:border-gold transition-colors';

  if (!user) {
    return (
      <div className="pt-36 pb-24 px-4 max-w-md mx-auto min-h-screen">
        <Seo title="My Account" description="Sign in to Quality Dates and Nuts to view your orders and check out faster." path="/account" />
        <div className="text-center mb-8">
          <UserIcon className="w-10 h-10 text-gold mx-auto mb-4" aria-hidden="true" />
          <h1 className="font-serif text-4xl font-semibold text-espresso">{mode === 'login' ? 'Welcome back' : 'Create account'}</h1>
          <p className="text-cocoa-light mt-2 text-sm">Track orders, faster checkout, exclusive offers.</p>
        </div>

        <div className="flex bg-cream-dark rounded-full p-1 mb-6" role="tablist">
          {(['login', 'register'] as const).map((m) => (
            <button
              key={m}
              role="tab"
              aria-selected={mode === m}
              onClick={() => setMode(m)}
              className={`flex-1 py-2.5 rounded-full text-sm font-bold capitalize transition-all ${mode === m ? 'bg-espresso text-cream shadow' : 'text-cocoa'}`}
            >
              {m === 'login' ? 'Sign in' : 'Register'}
            </button>
          ))}
        </div>

        <motion.form key={mode} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onSubmit={submit} className="space-y-3">
          {mode === 'register' && (
            <>
              <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Full name" aria-label="Full name" className={inputCls} autoComplete="name" />
              <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="Phone" aria-label="Phone" type="tel" className={inputCls} autoComplete="tel" />
            </>
          )}
          <input required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="Email" aria-label="Email" type="email" className={inputCls} autoComplete="email" />
          <input required value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} placeholder="Password (min 6 characters)" aria-label="Password" type="password" minLength={6} className={inputCls} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
          <button type="submit" disabled={busy} className="w-full bg-espresso text-cream py-4 rounded-full text-sm font-bold tracking-widest uppercase hover:bg-cocoa transition-colors disabled:opacity-50">
            {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </motion.form>

        <Link
          to="/admin"
          className="mt-8 flex items-center justify-center gap-2 text-sm font-semibold text-cocoa bg-white border border-espresso/10 rounded-full py-3.5 hover:border-gold transition-colors"
        >
          <ShieldCheck className="w-4 h-4 text-gold" aria-hidden="true" /> Staff / Admin login
        </Link>
      </div>
    );
  }

  // Signed-in admins and staff get a direct door to the portal
  const isTeam = ['admin', 'staff'].includes(user.role || '');

  return (
    <div className="pt-36 pb-24 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto min-h-screen">
      <Seo title="My Account" description="Your Quality Dates and Nuts account and order history." path="/account" />
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="font-serif text-4xl font-semibold text-espresso">Hi, {user.name.split(' ')[0]} 👋</h1>
          <p className="text-cocoa-light mt-1 text-sm">{user.email}</p>
        </div>
        <button onClick={logout} className="inline-flex items-center gap-2 text-sm font-bold text-cocoa bg-white border border-espresso/10 px-5 py-3 rounded-full hover:border-gold transition-colors">
          <LogOut className="w-4 h-4" aria-hidden="true" /> Sign out
        </button>
      </div>

      {/* team members get a direct link into the portal */}
      {isTeam && (
        <Link
          to="/admin"
          className="group flex items-center justify-between gap-4 bg-espresso text-cream rounded-3xl px-7 py-5 mb-6 hover:bg-cocoa transition-colors"
        >
          <span className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-goldlight" aria-hidden="true" />
            <span>
              <span className="block font-serif font-semibold">Open Admin Portal</span>
              <span className="block text-xs text-cream/70 capitalize">Signed in as {user.role}</span>
            </span>
          </span>
          <ArrowRight className="w-5 h-5 text-goldlight group-hover:translate-x-1 transition-transform" aria-hidden="true" />
        </Link>
      )}

      {/* loyalty + referral */}
      <div className="grid sm:grid-cols-2 gap-4 mb-10">
        <div className="bg-white rounded-3xl border border-espresso/5 p-6 flex items-center gap-4">
          <span className="p-3 rounded-2xl bg-goldlight/25"><Coins className="w-6 h-6 text-gold" aria-hidden="true" /></span>
          <span>
            <span className="block text-2xl font-bold text-espresso">{user.points || 0} points</span>
            <span className="block text-xs text-cocoa-light mt-0.5">1 point = ₹1 at checkout · earn 1 point per ₹10 spent</span>
          </span>
        </div>
        <div className="bg-white rounded-3xl border border-espresso/5 p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-cocoa-light flex items-center gap-1.5 mb-2">
            <Gift className="w-3.5 h-3.5 text-gold" aria-hidden="true" /> Your referral code
          </p>
          <div className="flex items-center gap-2">
            <code className="font-mono font-bold text-espresso bg-cream px-4 py-2 rounded-xl text-sm">{user.referralCode || '—'}</code>
            <button
              onClick={() => { navigator.clipboard?.writeText(user.referralCode || ''); }}
              aria-label="Copy referral code"
              className="p-2.5 bg-cream rounded-xl text-cocoa hover:text-espresso transition-colors"
            >
              <Copy className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
          <p className="text-xs text-cocoa-light mt-2">Friends get 5% off their order — you get 50 points every time.</p>
        </div>
      </div>

      <h2 className="font-serif text-2xl font-semibold text-espresso mb-6 flex items-center gap-2">
        <Package className="w-5 h-5 text-gold" aria-hidden="true" /> Your orders
      </h2>
      {orders.length === 0 ? (
        <p className="text-cocoa-light">No orders yet. Orders placed while signed in appear here.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <div key={o.order_number} className="bg-white rounded-3xl border border-espresso/5 p-6">
              <div className="flex flex-wrap justify-between gap-2 mb-3">
                <span className="font-mono font-bold text-espresso text-sm">{o.order_number}</span>
                <span className="text-xs font-bold uppercase tracking-widest text-gold bg-goldlight/20 px-3 py-1 rounded-full">{o.status}</span>
              </div>
              <p className="text-sm text-cocoa">
                {o.items.map((i) => `${i.name} × ${i.quantity}`).join(' · ')}
              </p>
              <p className="text-sm font-bold text-espresso mt-2">{inr(o.total)} · {o.payment_method.toUpperCase()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

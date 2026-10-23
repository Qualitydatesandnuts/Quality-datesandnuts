import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Send } from 'lucide-react';

const socials = [
  {
    name: 'Instagram', href: 'https://instagram.com',
    path: 'M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.8.2 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c.1-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2M12 7.1a4.9 4.9 0 1 0 0 9.8 4.9 4.9 0 0 0 0-9.8m0 8.1a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4m6.2-8.3a1.1 1.1 0 1 1-2.3 0 1.1 1.1 0 0 1 2.3 0',
  },
  {
    name: 'Facebook', href: 'https://facebook.com',
    path: 'M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.09 10.13 24v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.8-4.7 4.54-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.5c-1.5 0-1.96.93-1.96 1.89v2.26h3.32l-.53 3.49h-2.8V24C19.62 23.09 24 18.1 24 12.07',
  },
  {
    name: 'YouTube', href: 'https://youtube.com',
    path: 'M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 0 0 .5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3.02 3.02 0 0 0 2.12 2.14c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.81zM9.55 15.57V8.43L15.82 12l-6.27 3.57z',
  },
];
import { api } from '../lib/api';
import { useToast } from '../context/ToastContext';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.newsletter(email);
      toast('Subscribed! Welcome to the family 🌴');
      setEmail('');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not subscribe', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <footer className="bg-espresso text-cream/80 mt-24">
      {/* newsletter band */}
      <div className="border-b border-cream/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col md:flex-row md:items-center gap-6 md:gap-12">
          <div className="flex-1">
            <h2 className="font-serif text-2xl font-bold text-cream">Get 10% off your first order</h2>
            <p className="text-sm text-cream/60 mt-1">Join our newsletter for offers, recipes and new arrivals. Use code <strong className="text-goldlight">WELCOME10</strong> at checkout.</p>
          </div>
          <form onSubmit={subscribe} className="flex w-full md:w-auto gap-2">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              aria-label="Email address for newsletter"
              className="flex-1 md:w-80 bg-cream/10 border border-cream/20 rounded-full px-5 py-3.5 text-sm text-cream placeholder:text-cream/40 outline-none focus:border-gold transition-colors"
            />
            <button type="submit" disabled={busy} aria-label="Subscribe" className="bg-gold text-espresso p-3.5 rounded-full hover:bg-goldlight transition-colors disabled:opacity-50">
              <Send className="w-5 h-5" aria-hidden="true" />
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid grid-cols-2 md:grid-cols-4 gap-10">
        <div className="col-span-2 md:col-span-1">
          <img src="/logo.png" alt="Quality Dates and Nuts logo" className="w-14 mb-4" />
          <p className="text-sm leading-relaxed text-cream/60">
            Premium dates, nuts and dry fruits — sourced from the finest origins, packed fresh, delivered across India.
          </p>
          <div className="flex gap-3 mt-5">
            {socials.map((s) => (
              <a key={s.name} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.name} className="p-2.5 bg-cream/10 rounded-full hover:bg-gold hover:text-espresso transition-colors">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true"><path d={s.path} /></svg>
              </a>
            ))}
          </div>
        </div>

        <nav aria-label="Shop links">
          <h3 className="text-cream font-bold text-sm tracking-widest uppercase mb-4">Shop</h3>
          <ul className="space-y-2.5 text-sm">
            {['Dates', 'Stuffed Dates', 'Nuts', 'Dry Fruits', 'Seeds', 'Snacks', 'Gifting'].map((c) => (
              <li key={c}><Link to={`/shop?category=${encodeURIComponent(c)}`} className="hover:text-goldlight transition-colors">{c}</Link></li>
            ))}
            <li><Link to="/subscribe" className="hover:text-goldlight transition-colors">Subscribe &amp; Save</Link></li>
            <li><Link to="/occasions/diwali" className="hover:text-goldlight transition-colors">Festival Gifting</Link></li>
          </ul>
        </nav>

        <nav aria-label="Help links">
          <h3 className="text-cream font-bold text-sm tracking-widest uppercase mb-4">Help</h3>
          <ul className="space-y-2.5 text-sm">
            <li><Link to="/track-order" className="hover:text-goldlight transition-colors">Track Order</Link></li>
            <li><Link to="/faq" className="hover:text-goldlight transition-colors">FAQ</Link></li>
            <li><Link to="/account" className="hover:text-goldlight transition-colors">My Account</Link></li>
            <li><Link to="/wishlist" className="hover:text-goldlight transition-colors">Wishlist</Link></li>
            <li><Link to="/blog" className="hover:text-goldlight transition-colors">Blog</Link></li>
            <li><Link to="/about" className="hover:text-goldlight transition-colors">About Us</Link></li>
          </ul>
        </nav>

        <div>
          <h3 className="text-cream font-bold text-sm tracking-widest uppercase mb-4">Contact</h3>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-2.5"><MapPin className="w-4 h-4 mt-0.5 text-gold flex-shrink-0" aria-hidden="true" />Pattambi-Ponnani road
Ongallur South, Ongallur, Palakkad, Kerala</li>
            <li className="flex items-center gap-2.5"><Phone className="w-4 h-4 text-gold flex-shrink-0" aria-hidden="true" /> +91 6282885541</li>
            <li className="flex items-center gap-2.5"><Mail className="w-4 h-4 text-gold flex-shrink-0" aria-hidden="true" /> qualitydatesandnuts@gmail.com</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-cream/10 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-cream/50">
          <p>© {new Date().getFullYear()} Quality Dates and Nuts. All rights reserved.</p>
          <p>Quality Dates and Nuts Powered by <a href="https://www.qualitydatesandnuts.com" target="_blank" rel="noopener noreferrer" className="hover:text-goldlight transition-colors">Nexiora Tech Solutions</a></p>
        </div>
      </div>
    </footer>
  );
}

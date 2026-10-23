import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, MessageCircle } from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from '../context/ToastContext';

const STORAGE_KEY = 'qdn_whatsapp_optin'; // 'joined' | dismissal timestamp

/**
 * Visitor lead capture: a small card inviting shoppers to get offers on
 * WhatsApp. Numbers land in Admin → WhatsApp Broadcast as "subscribers".
 * Shows once per week after ~12s on site unless the visitor joined.
 */
export default function WhatsAppOptIn() {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'joined') return;
    if (saved && Date.now() - Number(saved) < 7 * 86400000) return; // dismissed < 1 week ago
    const timer = setTimeout(() => setOpen(true), 12000);
    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
    setOpen(false);
  };

  const join = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.addLead(phone);
      localStorage.setItem(STORAGE_KEY, 'joined');
      setOpen(false);
      toast('You are on the list — offers coming your way on WhatsApp! 🌴');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Please check the number', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          className="fixed bottom-16 left-4 sm:left-6 z-[85] w-[calc(100vw-2rem)] max-w-sm bg-white rounded-3xl shadow-2xl shadow-black/25 border border-espresso/10 p-6"
          role="dialog"
          aria-label="Get offers on WhatsApp"
        >
          <button onClick={dismiss} aria-label="Close" className="absolute top-3 right-3 p-2 rounded-full hover:bg-cream text-cocoa">
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
          <p className="flex items-center gap-2 font-serif font-bold text-espresso">
            <MessageCircle className="w-5 h-5 text-[#25D366]" aria-hidden="true" /> Offers on WhatsApp 🎁
          </p>
          <p className="text-sm text-cocoa-light mt-1.5">
            New arrivals, festival deals and secret coupons — straight to your WhatsApp. No spam, unsubscribe anytime.
          </p>
          <form onSubmit={join} className="mt-4 flex gap-2">
            <input
              required
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="WhatsApp number"
              aria-label="WhatsApp number"
              pattern="[0-9+ -]{10,}"
              className="flex-1 bg-cream rounded-full px-5 py-3 text-sm outline-none border border-espresso/10 focus:border-gold transition-colors"
            />
            <button type="submit" disabled={busy} className="bg-[#25D366] text-white px-5 rounded-full text-sm font-bold hover:brightness-95 transition-all disabled:opacity-50">
              {busy ? '…' : 'Join'}
            </button>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

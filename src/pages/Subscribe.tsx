import { useState } from 'react';
import { motion } from 'framer-motion';
import { Repeat, Check } from 'lucide-react';
import Seo from '../components/Seo';
import Reveal from '../components/Reveal';
import { api, inr } from '../lib/api';
import { useToast } from '../context/ToastContext';

const plans = [
  { id: 'starter', name: 'Starter Box', price: 799, blurb: 'A monthly taste of our bestsellers', includes: ['Almond stuffed dates 200g', 'California almonds 250g', 'Seasonal surprise'] },
  { id: 'family', name: 'Family Box', price: 1499, blurb: 'The monthly pantry refill', includes: ['Stuffed dates 400g', 'Two 500g nut packs', 'Dry fruit of the month', 'Free shipping always'] },
  { id: 'royal', name: 'Royal Box', price: 2499, blurb: 'Our finest, every month', includes: ['Medjoul jumbo dates', 'Mamra almonds', 'Premium gift-grade packing', 'Priority support', 'Free shipping always'] },
];

export default function Subscribe() {
  const [selected, setSelected] = useState('family');
  const [form, setForm] = useState({ name: '', phone: '', email: '' });
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.subscribe({ ...form, plan: selected });
      setDone(true);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not subscribe', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="pt-36 pb-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto min-h-screen">
      <Seo
        title="Subscribe & Save — Monthly Dates & Nuts Box"
        description="Get a curated box of premium dates, nuts and dry fruits delivered every month. Save 10% on every box, pause or cancel anytime."
        path="/subscribe"
      />
      <div className="text-center mb-14">
        <Repeat className="w-9 h-9 text-gold mx-auto mb-4" aria-hidden="true" />
        <h1 className="font-serif text-4xl md:text-5xl font-semibold text-espresso">Subscribe &amp; Save</h1>
        <p className="text-cocoa-light mt-3 max-w-xl mx-auto">A curated box at your door every month — <strong>save 10%</strong> on every box, pause or cancel anytime with one WhatsApp message.</p>
      </div>

      {done ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md mx-auto bg-white rounded-[2rem] border border-espresso/5 p-10 text-center shadow-xl shadow-espresso/5">
          <span className="text-5xl" aria-hidden="true">🎉</span>
          <h2 className="font-serif text-2xl font-semibold text-espresso mt-4">You're on the list!</h2>
          <p className="text-cocoa-light mt-3 text-sm leading-relaxed">
            We'll WhatsApp you within 24 hours to confirm your <strong>{plans.find((p) => p.id === selected)?.name}</strong> and set up delivery. Your first box ships this week.
          </p>
        </motion.div>
      ) : (
        <>
          <div className="grid md:grid-cols-3 gap-5 mb-12">
            {plans.map((plan, i) => (
              <Reveal key={plan.id} delay={i * 0.07}>
                <button
                  onClick={() => setSelected(plan.id)}
                  aria-pressed={selected === plan.id}
                  className={`w-full text-left bg-white rounded-3xl p-7 border-2 transition-all h-full ${
                    selected === plan.id ? 'border-gold shadow-xl shadow-gold/10 -translate-y-1' : 'border-espresso/5 hover:border-gold/40'
                  }`}
                >
                  {plan.id === 'family' && <span className="text-[10px] font-bold uppercase tracking-widest bg-gold text-espresso px-3 py-1 rounded-full">Most popular</span>}
                  <h2 className="font-serif text-xl font-semibold text-espresso mt-3">{plan.name}</h2>
                  <p className="text-sm text-cocoa-light mt-1">{plan.blurb}</p>
                  <p className="mt-4"><span className="text-3xl font-bold text-espresso">{inr(plan.price)}</span><span className="text-cocoa-light text-sm">/month</span></p>
                  <ul className="mt-5 space-y-2">
                    {plan.includes.map((inc) => (
                      <li key={inc} className="flex items-start gap-2 text-sm text-cocoa">
                        <Check className="w-4 h-4 text-gold mt-0.5 flex-shrink-0" aria-hidden="true" /> {inc}
                      </li>
                    ))}
                  </ul>
                </button>
              </Reveal>
            ))}
          </div>

          <form onSubmit={submit} className="max-w-xl mx-auto bg-white rounded-[2rem] border border-espresso/5 p-8 shadow-xl shadow-espresso/5">
            <h2 className="font-serif text-xl font-semibold text-espresso mb-5">Start your subscription</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Full name *" aria-label="Full name" className="w-full bg-cream rounded-2xl px-5 py-3.5 text-sm outline-none border border-espresso/10 focus:border-gold transition-colors" />
              <input required type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="WhatsApp number *" aria-label="WhatsApp number" className="w-full bg-cream rounded-2xl px-5 py-3.5 text-sm outline-none border border-espresso/10 focus:border-gold transition-colors" />
              <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="Email" aria-label="Email" className="w-full bg-cream rounded-2xl px-5 py-3.5 text-sm outline-none border border-espresso/10 focus:border-gold transition-colors sm:col-span-2" />
            </div>
            <button type="submit" disabled={busy} className="w-full mt-5 bg-espresso text-cream py-4 rounded-full text-sm font-bold tracking-widest uppercase hover:bg-cocoa transition-colors disabled:opacity-50">
              {busy ? 'Subscribing…' : `Subscribe · ${inr(plans.find((p) => p.id === selected)?.price || 0)}/month`}
            </button>
            <p className="text-[11px] text-cocoa-light text-center mt-3">No payment now — we confirm on WhatsApp before every box. Cancel anytime.</p>
          </form>
        </>
      )}
    </div>
  );
}

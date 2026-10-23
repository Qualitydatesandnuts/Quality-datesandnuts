import { useEffect, useState } from 'react';
import { ShoppingCart, ExternalLink, Trash2, Repeat } from 'lucide-react';
import { adminApi, inr, type AbandonedCart, type Subscription } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { Card, PageTitle, fmtDate, btnGhost } from './ui';

export default function AdminRecovery() {
  const [carts, setCarts] = useState<AbandonedCart[]>([]);
  const [subs, setSubs] = useState<Subscription[]>([]);
  const { toast } = useToast();

  const load = () => {
    adminApi.abandonedCarts().then(setCarts).catch(() => {});
    adminApi.subscriptions().then(setSubs).catch(() => {});
  };
  useEffect(load, []);

  return (
    <>
      <PageTitle title="Recovery & Subscriptions" subtitle="Nudge abandoned carts back to checkout; manage Subscribe & Save members" />

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <Card>
          <h2 className="font-serif text-lg font-semibold text-espresso mb-1 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-gold" aria-hidden="true" /> Abandoned carts
          </h2>
          <p className="text-xs text-cocoa-light mb-5">Shoppers who entered their phone at checkout but didn't order (shown after 1 hour of inactivity).</p>
          {carts.length === 0 ? (
            <p className="text-sm text-cocoa-light">Nothing to recover right now 🎉</p>
          ) : (
            <ul className="divide-y divide-espresso/5">
              {carts.map((c) => (
                <li key={c.id} className="py-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-espresso text-sm">{c.name || 'Unknown'} · {c.phone}</p>
                    <p className="text-xs text-cocoa-light mt-1">
                      {c.items.map((i) => `${i.name} × ${i.quantity}`).join(', ')} — <strong>{inr(c.subtotal)}</strong>
                    </p>
                    <p className="text-[11px] text-cocoa-light mt-0.5">Last active {fmtDate(c.updated_at)}</p>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <a href={c.waLink} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs font-bold bg-[#25D366]/10 text-[#128C4A] px-3.5 py-2 rounded-full hover:bg-[#25D366]/20 transition-colors">
                      Nudge <ExternalLink className="w-3 h-3" aria-hidden="true" />
                    </a>
                    <button
                      onClick={() => adminApi.deleteAbandonedCart(c.id).then(() => { toast('Removed'); load(); })}
                      aria-label="Dismiss cart"
                      className="p-2 text-cocoa hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="font-serif text-lg font-semibold text-espresso mb-1 flex items-center gap-2">
            <Repeat className="w-5 h-5 text-gold" aria-hidden="true" /> Subscribe &amp; Save members
          </h2>
          <p className="text-xs text-cocoa-light mb-5">Confirm each month's box on WhatsApp, then place it as a normal order.</p>
          {subs.length === 0 ? (
            <p className="text-sm text-cocoa-light">No subscribers yet — the plans live at <code className="font-mono bg-cream px-1 rounded">/subscribe</code>.</p>
          ) : (
            <ul className="divide-y divide-espresso/5">
              {subs.map((s) => (
                <li key={s.id} className="py-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-espresso text-sm">{s.name} · {s.phone}</p>
                    <p className="text-xs text-cocoa-light mt-0.5 capitalize">{s.plan} box · since {fmtDate(s.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full ${s.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>{s.status}</span>
                    <button
                      onClick={() => adminApi.updateSubscription(s.id, s.status === 'active' ? 'cancelled' : 'active').then(load)}
                      className={btnGhost}
                    >
                      {s.status === 'active' ? 'Cancel' : 'Reactivate'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}

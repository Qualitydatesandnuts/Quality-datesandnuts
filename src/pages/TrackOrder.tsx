import { useState } from 'react';
import { motion } from 'framer-motion';
import { PackageSearch, CheckCircle2, Circle } from 'lucide-react';
import Seo from '../components/Seo';
import { api, inr, type Order } from '../lib/api';
import { useToast } from '../context/ToastContext';

const STAGES = ['confirmed', 'packed', 'shipped', 'delivered'];

export default function TrackOrder() {
  const [orderNumber, setOrderNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  const track = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      setOrder(await api.trackOrder(orderNumber.trim(), phone.trim()));
    } catch (err) {
      setOrder(null);
      toast(err instanceof Error ? err.message : 'Order not found', 'error');
    } finally {
      setBusy(false);
    }
  };

  const stageIndex = order ? Math.max(0, STAGES.indexOf(order.status)) : 0;

  return (
    <div className="pt-36 pb-24 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto min-h-screen">
      <Seo title="Track Your Order" description="Track your Quality Dates and Nuts order with your order number and phone number." path="/track-order" />

      <div className="text-center mb-10">
        <PackageSearch className="w-10 h-10 text-gold mx-auto mb-4" aria-hidden="true" />
        <h1 className="font-serif text-4xl font-semibold text-espresso">Track your order</h1>
        <p className="text-cocoa-light mt-3">Enter the order number from your confirmation and the phone used at checkout.</p>
      </div>

      <form onSubmit={track} className="flex flex-col sm:flex-row gap-3 mb-10">
        <input
          required
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
          placeholder="Order number (e.g. QDN…)"
          aria-label="Order number"
          className="flex-1 bg-white rounded-full px-6 py-4 text-sm outline-none border border-espresso/10 focus:border-gold transition-colors"
        />
        <input
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone number"
          aria-label="Phone number"
          type="tel"
          className="flex-1 bg-white rounded-full px-6 py-4 text-sm outline-none border border-espresso/10 focus:border-gold transition-colors"
        />
        <button type="submit" disabled={busy} className="bg-espresso text-cream px-8 py-4 rounded-full text-sm font-bold hover:bg-cocoa transition-colors disabled:opacity-50">
          {busy ? 'Searching…' : 'Track'}
        </button>
      </form>

      {order && (
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[2rem] border border-espresso/5 p-8 shadow-xl shadow-espresso/5">
          <div className="flex flex-wrap justify-between gap-2 mb-8">
            <div>
              <p className="text-xs text-cocoa-light uppercase tracking-widest">Order</p>
              <p className="font-mono font-bold text-espresso">{order.order_number}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-cocoa-light uppercase tracking-widest">Total</p>
              <p className="font-bold text-espresso">{inr(order.total)} · {order.payment_method.toUpperCase()}</p>
            </div>
          </div>

          {/* status timeline */}
          <ol className="relative flex justify-between mb-10" aria-label="Order progress">
            <div className="absolute top-3 left-4 right-4 h-0.5 bg-espresso/10" aria-hidden="true" />
            <motion.div
              className="absolute top-3 left-4 h-0.5 bg-gold origin-left"
              initial={{ width: 0 }}
              animate={{ width: `${(stageIndex / (STAGES.length - 1)) * 92}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              aria-hidden="true"
            />
            {STAGES.map((s, i) => (
              <li key={s} className="relative flex flex-col items-center gap-2 z-10">
                {i <= stageIndex
                  ? <CheckCircle2 className="w-6 h-6 text-gold bg-white rounded-full" aria-hidden="true" />
                  : <Circle className="w-6 h-6 text-espresso/20 bg-white rounded-full" aria-hidden="true" />}
                <span className={`text-xs font-semibold capitalize ${i <= stageIndex ? 'text-espresso' : 'text-cocoa-light'}`}>{s}</span>
              </li>
            ))}
          </ol>

          {order.tracking_number && (
            <p className="text-sm text-cocoa bg-cream rounded-2xl px-5 py-3.5 mb-6">
              🚚 Shipped via <strong>{order.courier || 'courier'}</strong> — AWB <strong className="font-mono select-all">{order.tracking_number}</strong>
            </p>
          )}

          <ul className="space-y-3 border-t border-espresso/10 pt-5">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between text-sm">
                <span className="text-cocoa">{item.name} × {item.quantity}</span>
                <span className="font-semibold text-espresso">{inr(item.price * item.quantity)}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-cocoa-light mt-5">
            Delivering to: {order.address}, {order.landmark && `${order.landmark}, `}{order.city}{order.state && `, ${order.state}`} — {order.pincode}
          </p>
          <a
            href={`/invoice/${order.order_number}?phone=${encodeURIComponent(order.customer_phone)}`}
            className="inline-block mt-4 text-sm font-bold text-gold underline underline-offset-4"
          >
            View / print invoice →
          </a>
        </motion.div>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { Printer } from 'lucide-react';
import Seo from '../components/Seo';
import { api, inr, type Order } from '../lib/api';

/** Printable tax invoice — use the browser's Print → Save as PDF. */
export default function Invoice() {
  const { orderNumber = '' } = useParams();
  const [params] = useSearchParams();
  const phone = params.get('phone') || '';
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.trackOrder(orderNumber, phone).then(setOrder).catch((e) => setError(e.message));
  }, [orderNumber, phone]);

  if (error) {
    return (
      <div className="pt-40 pb-24 text-center px-4 min-h-screen">
        <h1 className="font-serif text-2xl font-semibold text-espresso mb-3">Invoice unavailable</h1>
        <p className="text-cocoa-light text-sm mb-6">{error}</p>
        <Link to="/track-order" className="text-gold font-bold underline">Track your order</Link>
      </div>
    );
  }
  if (!order) return <div className="pt-40 pb-24 text-center text-cocoa-light min-h-screen">Loading invoice…</div>;

  return (
    <div className="pt-32 pb-20 px-4 min-h-screen print:pt-0">
      <Seo title={`Invoice ${order.order_number}`} description="Order invoice." path="/invoice" />
      <style>{`@media print { nav, footer, .no-print, [role="marquee"] { display: none !important; } body { background: white !important; } }`}</style>

      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => window.print()}
          className="no-print mb-6 inline-flex items-center gap-2 bg-espresso text-cream px-6 py-3 rounded-full text-sm font-bold hover:bg-cocoa transition-colors"
        >
          <Printer className="w-4 h-4" aria-hidden="true" /> Print / Save as PDF
        </button>

        <div className="bg-white border border-espresso/10 rounded-3xl print:border-0 print:rounded-none p-10">
          <div className="flex justify-between items-start pb-6 border-b border-espresso/10">
            <div>
              <img src="/logo.png" alt="" className="w-12 mb-2" />
              <h1 className="font-serif text-xl font-bold text-espresso">Quality Dates and Nuts</h1>
              <p className="text-xs text-cocoa-light">Chennai, Tamil Nadu, India<br />qualitydatesandnuts@gmail.com · +91 6282885541</p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-widest text-cocoa-light">Tax Invoice</p>
              <p className="font-mono font-bold text-espresso">{order.order_number}</p>
              <p className="text-xs text-cocoa-light mt-1">{new Date(order.created_at + 'Z').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
          </div>

          <div className="py-6 grid grid-cols-2 gap-6 text-sm border-b border-espresso/10">
            <div>
              <p className="text-xs uppercase tracking-widest text-cocoa-light mb-1.5">Billed & shipped to</p>
              <p className="font-semibold text-espresso">{order.customer_name}</p>
              <p className="text-cocoa">{order.address}{order.landmark && `, ${order.landmark}`}, {order.city}{order.state && `, ${order.state}`} — {order.pincode}</p>
              <p className="text-cocoa">{order.customer_phone}</p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-widest text-cocoa-light mb-1.5">Payment</p>
              <p className="font-semibold text-espresso uppercase">{order.payment_method}</p>
              <p className="text-cocoa capitalize">{order.payment_status === 'paid' ? 'Paid online' : 'Payment pending'}</p>
              {order.tracking_number && <p className="text-cocoa mt-1">AWB: {order.tracking_number} {order.courier && `(${order.courier})`}</p>}
            </div>
          </div>

          <table className="w-full text-sm mt-6">
            <thead>
              <tr className="text-left text-xs uppercase tracking-widest text-cocoa-light border-b border-espresso/10">
                <th className="py-2">Item</th>
                <th className="py-2 text-center">Qty</th>
                <th className="py-2 text-right">Price</th>
                <th className="py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-espresso/5">
              {order.items.map((i) => (
                <tr key={`${i.id}-${i.variant}`}>
                  <td className="py-3 text-espresso font-medium">{i.name} · {i.weight}</td>
                  <td className="py-3 text-center text-cocoa">{i.quantity}</td>
                  <td className="py-3 text-right text-cocoa">{inr(i.price)}</td>
                  <td className="py-3 text-right font-semibold text-espresso">{inr(i.price * i.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <dl className="mt-6 ml-auto w-56 space-y-1.5 text-sm">
            <div className="flex justify-between"><dt className="text-cocoa">Subtotal</dt><dd>{inr(order.subtotal)}</dd></div>
            {order.discount > 0 && <div className="flex justify-between text-green-700"><dt>Discount{order.coupon_code && ` (${order.coupon_code})`}</dt><dd>−{inr(order.discount)}</dd></div>}
            <div className="flex justify-between"><dt className="text-cocoa">Shipping</dt><dd>{order.shipping === 0 ? 'FREE' : inr(order.shipping)}</dd></div>
            <div className="flex justify-between font-bold text-base border-t border-espresso/10 pt-2 mt-2"><dt>Total</dt><dd>{inr(order.total)}</dd></div>
          </dl>

          <p className="mt-10 text-[11px] text-cocoa-light text-center">Prices are inclusive of all taxes. Thank you for shopping with Quality Dates and Nuts! 🌴</p>
        </div>
      </div>
    </div>
  );
}

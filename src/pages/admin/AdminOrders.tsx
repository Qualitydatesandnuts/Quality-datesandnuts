import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Phone, Mail, MapPin, Download, FileText, Truck } from 'lucide-react';
import { adminApi, inr, type Order, type Customer } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { Card, PageTitle, fmtDate, inputCls, btnGhost } from './ui';

const STATUSES = ['confirmed', 'packed', 'shipped', 'delivered', 'cancelled'];
const statusColor: Record<string, string> = {
  confirmed: 'bg-blue-50 text-blue-700',
  packed: 'bg-amber-50 text-amber-700',
  shipped: 'bg-violet-50 text-violet-700',
  delivered: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-600',
};

function PaymentChip({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    paid: { label: '₹ Paid', cls: 'bg-green-100 text-green-800' },
    claimed: { label: '₹ Verify UTR', cls: 'bg-amber-100 text-amber-800' },
    awaiting_payment: { label: '₹ Unpaid', cls: 'bg-red-50 text-red-600' },
  };
  const chip = map[status] || { label: `₹ ${status}`, cls: 'bg-cream text-cocoa' };
  return <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full ${chip.cls}`}>{chip.label}</span>;
}

export default function AdminOrders() {
  const [tab, setTab] = useState<'orders' | 'customers'>('orders');
  const [orders, setOrders] = useState<(Order & { id: number })[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filter, setFilter] = useState('');
  const [expanded, setExpanded] = useState<number | null>(null);
  const { toast } = useToast();

  const load = () => {
    adminApi.orders(filter || undefined).then(setOrders).catch(() => {});
    adminApi.customers().then(setCustomers).catch(() => {});
  };
  useEffect(load, [filter]);

  const setStatus = async (id: number, status: string) => {
    try {
      await adminApi.updateOrderStatus(id, status);
      toast(`Order marked ${status}`);
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Update failed', 'error');
    }
  };

  return (
    <>
      <PageTitle
        title="Orders & Customers"
        subtitle={`${orders.length} orders · ${customers.length} customers`}
        action={
          <div className="flex items-center gap-3 flex-wrap">
            <button onClick={() => adminApi.exportCsv(tab === 'orders' ? 'orders' : 'customers').catch(() => toast('Export failed', 'error'))} className={`${btnGhost} flex items-center gap-1.5`}>
              <Download className="w-3.5 h-3.5" aria-hidden="true" /> Export CSV
            </button>
          <div className="flex bg-white border border-espresso/10 rounded-full p-1" role="tablist">
            {(['orders', 'customers'] as const).map((t) => (
              <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
                className={`px-5 py-2 rounded-full text-sm font-bold capitalize transition-all ${tab === t ? 'bg-espresso text-cream' : 'text-cocoa'}`}>
                {t}
              </button>
            ))}
          </div>
          </div>
        }
      />

      {tab === 'orders' ? (
        <>
          <div className="flex gap-2 mb-5 overflow-x-auto no-scrollbar">
            {['', ...STATUSES].map((s) => (
              <button key={s || 'all'} onClick={() => setFilter(s)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold capitalize transition-all ${filter === s ? 'bg-espresso text-cream' : 'bg-white text-cocoa border border-espresso/10'}`}>
                {s || 'All'}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {orders.length === 0 && <Card><p className="text-sm text-cocoa-light">No orders here yet.</p></Card>}
            {orders.map((o) => (
              <Card key={o.id} className="p-0 overflow-hidden">
                <button
                  onClick={() => setExpanded(expanded === o.id ? null : o.id)}
                  aria-expanded={expanded === o.id}
                  className="w-full flex flex-wrap items-center justify-between gap-3 px-5 py-4 text-left hover:bg-cream/40"
                >
                  <span>
                    <span className="font-mono font-bold text-espresso text-sm">{o.order_number}</span>
                    <span className="block text-xs text-cocoa-light mt-0.5">{o.customer_name} · {fmtDate(o.created_at)} · {o.items.length} item{o.items.length === 1 ? '' : 's'}</span>
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="font-bold text-espresso">{inr(o.total)}</span>
                    <PaymentChip status={o.payment_status} />
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full ${statusColor[o.status] || 'bg-cream text-cocoa'}`}>{o.status}</span>
                    <ChevronDown className={`w-4 h-4 text-cocoa transition-transform ${expanded === o.id ? 'rotate-180' : ''}`} aria-hidden="true" />
                  </span>
                </button>

                {expanded === o.id && (
                  <div className="px-5 pb-5 border-t border-espresso/5 pt-4 grid md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-cocoa-light mb-3">Customer</p>
                      <p className="font-semibold text-espresso">{o.customer_name}</p>
                      <p className="text-sm text-cocoa flex items-center gap-2 mt-1.5"><Phone className="w-3.5 h-3.5 text-gold" aria-hidden="true" /> {o.customer_phone}</p>
                      {o.customer_email && <p className="text-sm text-cocoa flex items-center gap-2 mt-1"><Mail className="w-3.5 h-3.5 text-gold" aria-hidden="true" /> {o.customer_email}</p>}
                      <p className="text-sm text-cocoa flex items-start gap-2 mt-1"><MapPin className="w-3.5 h-3.5 text-gold mt-0.5 flex-shrink-0" aria-hidden="true" /> {o.address}{o.landmark && `, ${o.landmark}`}, {o.city}{o.state && `, ${o.state}`} — {o.pincode}</p>
                      <p className="text-sm text-cocoa mt-3">
                        Payment: <strong className="uppercase">{o.payment_method === 'upi-direct' ? 'Direct UPI / Bank' : o.payment_method}</strong>
                        {o.coupon_code && <> · Coupon <strong>{o.coupon_code}</strong></>}
                      </p>
                      {o.payment_status !== 'paid' && (
                        <div className="mt-2 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
                          {o.payment_status === 'claimed' && (
                            <p className="text-xs text-amber-800 mb-2">
                              Customer submitted transaction ID: <strong className="font-mono select-all">{(o as unknown as { payment_id?: string }).payment_id || '—'}</strong><br />
                              Check your bank/GPay for this amount, then confirm.
                            </p>
                          )}
                          {o.payment_status === 'awaiting_payment' && (
                            <p className="text-xs text-amber-800 mb-2">No payment received yet — do not dispatch.</p>
                          )}
                          <button
                            onClick={() => window.confirm(`Confirm you received ${inr(o.total)} for ${o.order_number}?`) &&
                              adminApi.markOrderPaid(o.id).then(() => { toast('Marked as paid — customer notified'); load(); })}
                            className="text-xs font-bold bg-green-700 text-white px-4 py-2 rounded-full hover:bg-green-800 transition-colors"
                          >
                            ✓ Mark payment received
                          </button>
                        </div>
                      )}

                      <div className="mt-4 flex flex-wrap items-end gap-3">
                        <div>
                          <label className="text-xs font-bold uppercase tracking-widest text-cocoa-light block mb-1.5">Update status</label>
                          <select
                            value={o.status}
                            onChange={(e) => setStatus(o.id, e.target.value)}
                            className="bg-cream border border-espresso/10 rounded-full px-4 py-2 text-sm font-semibold text-espresso capitalize"
                            aria-label={`Status for order ${o.order_number}`}
                          >
                            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                        <Link to={`/invoice/${o.order_number}?phone=${encodeURIComponent(o.customer_phone)}`} target="_blank" className={`${btnGhost} flex items-center gap-1.5`}>
                          <FileText className="w-3.5 h-3.5" aria-hidden="true" /> Invoice
                        </Link>
                      </div>

                      {/* shipping / tracking */}
                      <form
                        className="mt-4 flex flex-wrap items-end gap-2"
                        onSubmit={(e) => {
                          e.preventDefault();
                          const data = new FormData(e.currentTarget);
                          adminApi.updateOrderTracking(o.id, String(data.get('awb') || ''), String(data.get('courier') || ''))
                            .then(() => { toast('Tracking saved — customer sees it on Track Order'); load(); })
                            .catch((err) => toast(err.message, 'error'));
                        }}
                      >
                        <div className="flex-1 min-w-[140px]">
                          <label className="text-xs font-bold uppercase tracking-widest text-cocoa-light block mb-1.5 flex items-center gap-1"><Truck className="w-3 h-3" aria-hidden="true" /> AWB / Tracking no.</label>
                          <input name="awb" defaultValue={o.tracking_number} placeholder="e.g. SR123456789" className={inputCls} />
                        </div>
                        <div className="w-32">
                          <label className="text-xs font-bold uppercase tracking-widest text-cocoa-light block mb-1.5">Courier</label>
                          <input name="courier" defaultValue={o.courier} placeholder="Delhivery" className={inputCls} />
                        </div>
                        <button type="submit" className={btnGhost}>Save</button>
                      </form>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-cocoa-light mb-3">Items</p>
                      <ul className="space-y-2.5">
                        {o.items.map((i) => (
                          <li key={i.id} className="flex items-center gap-3 text-sm">
                            <img src={i.image} alt="" className="w-10 h-11 rounded-lg object-cover bg-cream-dark" />
                            <span className="flex-1 text-cocoa">{i.name} × {i.quantity}</span>
                            <span className="font-semibold text-espresso">{inr(i.price * i.quantity)}</span>
                          </li>
                        ))}
                      </ul>
                      <dl className="text-sm mt-4 space-y-1 border-t border-espresso/5 pt-3">
                        <div className="flex justify-between"><dt className="text-cocoa-light">Subtotal</dt><dd>{inr(o.subtotal)}</dd></div>
                        {o.discount > 0 && <div className="flex justify-between text-green-700"><dt>Discount</dt><dd>−{inr(o.discount)}</dd></div>}
                        <div className="flex justify-between"><dt className="text-cocoa-light">Shipping</dt><dd>{o.shipping === 0 ? 'FREE' : inr(o.shipping)}</dd></div>
                        <div className="flex justify-between font-bold"><dt>Total</dt><dd>{inr(o.total)}</dd></div>
                      </dl>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </>
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-widest text-cocoa-light border-b border-espresso/10">
                <th className="px-5 py-4">Customer</th>
                <th className="px-5 py-4">Contact</th>
                <th className="px-5 py-4">Orders</th>
                <th className="px-5 py-4">Total spent</th>
                <th className="px-5 py-4">Last order</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-espresso/5">
              {customers.map((c) => (
                <tr key={c.phone} className="hover:bg-cream/50">
                  <td className="px-5 py-3.5 font-semibold text-espresso">{c.name}</td>
                  <td className="px-5 py-3.5 text-cocoa">{c.phone}{c.email && <span className="block text-xs text-cocoa-light">{c.email}</span>}</td>
                  <td className="px-5 py-3.5 text-cocoa">{c.orders}</td>
                  <td className="px-5 py-3.5 font-bold text-espresso">{inr(c.spent)}</td>
                  <td className="px-5 py-3.5 text-cocoa-light">{fmtDate(c.last_order)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </>
  );
}

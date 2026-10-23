import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, PackageSearch, MessageCircle, Coins, FileText, CreditCard, Smartphone, Copy } from 'lucide-react';
import Seo from '../components/Seo';
import { api, inr, WHATSAPP_NUMBER, type OrderItem } from '../lib/api';
import { openRazorpay } from '../lib/razorpay';
import { useToast } from '../context/ToastContext';

interface OrderState {
  order?: {
    orderNumber: string; subtotal: number; discount: number; shipping: number; total: number;
    items: OrderItem[]; estimatedDelivery: string; pointsEarned?: number;
  };
  phone?: string;
  paid?: boolean;
  method?: 'online' | 'upi-direct';
}

const CONFETTI_COLORS = ['#C89B3C', '#E8C87A', '#603D26', '#8B5E3C', '#FAF6EF'];

export default function OrderSuccess() {
  const { orderNumber } = useParams();
  const { state } = useLocation() as { state: OrderState | null };
  const order = state?.order;
  const { toast } = useToast();
  const [paid, setPaid] = useState(state?.paid ?? true);
  const [paying, setPaying] = useState(false);
  const [manualNote, setManualNote] = useState('');
  const [upiId, setUpiId] = useState('');
  const [utr, setUtr] = useState('');
  const [claimed, setClaimed] = useState(false);
  const isDirectUpi = state?.method === 'upi-direct';

  useEffect(() => {
    if (isDirectUpi && !paid) {
      api.paymentsConfig().then((c) => {
        setManualNote(c.manualNote);
        setUpiId(c.upiId);
      }).catch(() => {});
    }
  }, [isDirectUpi, paid]);

  const submitUtr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber || !state?.phone) return;
    try {
      await api.upiClaim(orderNumber, state.phone, utr);
      setClaimed(true);
      toast('Transaction ID received — we will verify and confirm shortly!');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not submit', 'error');
    }
  };

  const completePayment = async () => {
    if (!orderNumber || !state?.phone) return;
    setPaying(true);
    try {
      const res = await api.retryPayment(orderNumber, state.phone);
      if (res.paid || !res.payment) {
        setPaid(true);
        toast('This order is already paid — you are all set!');
        return;
      }
      await openRazorpay({
        payment: res.payment,
        orderNumber,
        customer: { name: '', phone: state.phone },
        onSuccess: async (resp) => {
          try {
            await api.verifyPayment({
              orderNumber,
              razorpayOrderId: resp.razorpay_order_id,
              razorpayPaymentId: resp.razorpay_payment_id,
              razorpaySignature: resp.razorpay_signature,
            });
            setPaid(true);
            toast('Payment received — thank you! 🎉');
          } catch {
            toast('Payment verification failed — contact us on WhatsApp', 'error');
          } finally {
            setPaying(false);
          }
        },
        onDismiss: () => setPaying(false),
      });
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not start payment', 'error');
      setPaying(false);
    }
  };

  const confetti = useMemo(
    () => Array.from({ length: 36 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.6,
      duration: 2.2 + Math.random() * 1.6,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      size: 6 + Math.random() * 8,
      rotate: Math.random() * 360,
    })),
    []
  );

  return (
    <div className="pt-36 pb-24 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto min-h-screen relative overflow-hidden">
      <Seo title="Order Confirmed" description="Your Quality Dates and Nuts order has been placed successfully." path="/order-success" />

      {/* confetti */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {confetti.map((c) => (
          <motion.span
            key={c.id}
            initial={{ y: -40, x: `${c.x}vw`, opacity: 1, rotate: 0 }}
            animate={{ y: '110vh', opacity: [1, 1, 0.6, 0], rotate: c.rotate + 360 }}
            transition={{ duration: c.duration, delay: c.delay, ease: 'easeIn' }}
            className="absolute top-0 rounded-sm"
            style={{ width: c.size, height: c.size * 0.6, backgroundColor: c.color }}
          />
        ))}
      </div>

      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.1 }}
        className="w-20 h-20 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-6"
      >
        <CheckCircle2 className="w-11 h-11 text-green-600" aria-hidden="true" />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="text-center">
        <h1 className="font-serif text-4xl font-semibold text-espresso">Order confirmed!</h1>
        <p className="text-cocoa-light mt-3">
          Thank you for choosing us. Your order number is
        </p>
        <p className="font-mono text-xl font-bold text-espresso bg-white border border-espresso/10 rounded-2xl px-6 py-3 inline-block mt-3 select-all">
          {orderNumber}
        </p>
        {order && (
          <p className="text-sm text-cocoa mt-4">
            Estimated delivery: <strong>{order.estimatedDelivery}</strong>
            {paid && <span className="block mt-1 text-green-700 font-semibold">✓ Paid online</span>}
          </p>
        )}

        {/* direct UPI — payment instructions + transaction ID */}
        {!paid && isDirectUpi && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-5 bg-white border border-gold/40 rounded-3xl px-7 py-6 text-left max-w-md mx-auto shadow-lg shadow-espresso/5"
          >
            {claimed ? (
              <>
                <p className="text-sm font-bold text-green-700 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" aria-hidden="true" /> Transaction ID received
                </p>
                <p className="text-sm text-cocoa mt-2">
                  We're verifying your payment — you'll get a confirmation on WhatsApp shortly. Your order ships as soon as it's verified.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-bold text-espresso flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-gold" aria-hidden="true" /> Pay {order ? inr(order.total) : 'the order total'} to:
                </p>
                {manualNote && (
                  <pre className="mt-3 text-sm text-cocoa whitespace-pre-wrap font-sans bg-cream rounded-2xl px-4 py-3.5 select-all">{manualNote}</pre>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  {upiId && order && (
                    <a
                      href={`upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent('Quality Dates and Nuts')}&am=${order.total}&cu=INR&tn=${encodeURIComponent(orderNumber || '')}`}
                      className="inline-flex items-center gap-2 bg-espresso text-cream px-5 py-2.5 rounded-full text-xs font-bold"
                    >
                      <Smartphone className="w-3.5 h-3.5 text-goldlight" aria-hidden="true" /> Open UPI app
                    </a>
                  )}
                  <button
                    onClick={() => { navigator.clipboard?.writeText(manualNote); toast('Payment details copied'); }}
                    className="inline-flex items-center gap-2 bg-cream text-cocoa px-5 py-2.5 rounded-full text-xs font-bold"
                  >
                    <Copy className="w-3.5 h-3.5" aria-hidden="true" /> Copy details
                  </button>
                </div>
                <form onSubmit={submitUtr} className="mt-4 flex gap-2">
                  <input
                    required
                    value={utr}
                    onChange={(e) => setUtr(e.target.value)}
                    placeholder="UPI transaction ID (UTR) *"
                    aria-label="UPI transaction ID"
                    className="flex-1 bg-cream rounded-full px-5 py-3 text-sm outline-none border border-espresso/10 focus:border-gold transition-colors"
                  />
                  <button type="submit" className="bg-espresso text-cream px-6 rounded-full text-sm font-bold hover:bg-cocoa transition-colors">
                    Submit
                  </button>
                </form>
                <p className="text-[11px] text-cocoa-light mt-2">
                  After paying, copy the transaction ID (UTR) from your UPI app's payment receipt and paste it here.
                </p>
              </>
            )}
          </motion.div>
        )}

        {/* gateway payment pending — offer to finish it */}
        {!paid && !isDirectUpi && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-5 bg-amber-50 border border-amber-300 rounded-3xl px-6 py-5 inline-block text-left max-w-md"
          >
            <p className="text-sm font-bold text-amber-800">⚠ Payment pending</p>
            <p className="text-sm text-amber-700 mt-1">
              Your order is saved but not paid yet. It ships as soon as the payment is completed.
            </p>
            <button
              onClick={completePayment}
              disabled={paying}
              className="mt-3 inline-flex items-center gap-2 bg-espresso text-cream px-6 py-3 rounded-full text-sm font-bold hover:bg-cocoa transition-colors disabled:opacity-60"
            >
              <CreditCard className="w-4 h-4 text-goldlight" aria-hidden="true" />
              {paying ? 'Opening payment…' : 'Complete payment now'}
            </button>
          </motion.div>
        )}
        {!!order?.pointsEarned && (
          <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-cocoa bg-goldlight/20 border border-gold/25 rounded-full px-5 py-2.5 mt-4">
            <Coins className="w-4 h-4 text-gold" aria-hidden="true" /> You earned {order.pointsEarned} loyalty points!
          </p>
        )}
      </motion.div>

      {order && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-10 bg-white rounded-[2rem] border border-espresso/5 p-7 shadow-xl shadow-espresso/5"
        >
          <ul className="space-y-4 mb-5">
            {order.items.map((item) => (
              <li key={item.id} className="flex gap-3.5 items-center">
                <div className="w-14 h-16 rounded-xl overflow-hidden bg-cream-dark flex-shrink-0">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-espresso">{item.name} · {item.weight}</p>
                  <p className="text-xs text-cocoa-light">Qty {item.quantity}</p>
                </div>
                <span className="text-sm font-bold text-espresso">{inr(item.price * item.quantity)}</span>
              </li>
            ))}
          </ul>
          <dl className="space-y-2 text-sm border-t border-espresso/10 pt-4">
            <div className="flex justify-between"><dt className="text-cocoa">Subtotal</dt><dd>{inr(order.subtotal)}</dd></div>
            {order.discount > 0 && <div className="flex justify-between text-green-700"><dt>Discount</dt><dd>−{inr(order.discount)}</dd></div>}
            <div className="flex justify-between"><dt className="text-cocoa">Shipping</dt><dd>{order.shipping === 0 ? 'FREE' : inr(order.shipping)}</dd></div>
            <div className="flex justify-between font-bold text-base pt-2 border-t border-espresso/10"><dt>Total</dt><dd>{inr(order.total)}</dd></div>
          </dl>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }} className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
        <Link to="/track-order" className="inline-flex items-center justify-center gap-2 bg-espresso text-cream px-7 py-4 rounded-full text-sm font-bold hover:bg-cocoa transition-colors">
          <PackageSearch className="w-4 h-4" aria-hidden="true" /> Track this order
        </Link>
        {state?.phone && (
          <Link to={`/invoice/${orderNumber}?phone=${encodeURIComponent(state.phone)}`} className="inline-flex items-center justify-center gap-2 bg-white border border-espresso/15 text-espresso px-7 py-4 rounded-full text-sm font-bold hover:border-gold transition-colors">
            <FileText className="w-4 h-4 text-gold" aria-hidden="true" /> Invoice
          </Link>
        )}
        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hi! I just placed order ${orderNumber}.`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 bg-white border border-espresso/15 text-espresso px-7 py-4 rounded-full text-sm font-bold hover:border-gold transition-colors"
        >
          <MessageCircle className="w-4 h-4 text-[#25D366]" aria-hidden="true" /> Chat with us
        </a>
        <Link to="/shop" className="inline-flex items-center justify-center px-7 py-4 rounded-full text-sm font-bold text-cocoa hover:text-espresso transition-colors">
          Keep shopping
        </Link>
      </motion.div>
    </div>
  );
}

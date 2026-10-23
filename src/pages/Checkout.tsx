import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Tag, Truck, Smartphone, ChevronLeft, X, CreditCard, Gift, Coins, ShieldCheck, AlertTriangle } from 'lucide-react';
import Seo from '../components/Seo';
import { api, inr, FREE_SHIPPING_ABOVE } from '../lib/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { INDIAN_STATES } from '../lib/states';
import { openRazorpay } from '../lib/razorpay';

const SHIPPING_FEE = 49;
const SAVED_KEY = 'qdn_checkout';

interface Details {
  name: string; email: string; phone: string;
  address: string; landmark: string; city: string; state: string; pincode: string;
}

const empty: Details = { name: '', email: '', phone: '', address: '', landmark: '', city: '', state: '', pincode: '' };

export default function Checkout() {
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [details, setDetails] = useState<Details>(() => {
    try {
      return { ...empty, ...JSON.parse(localStorage.getItem(SAVED_KEY) || '{}') };
    } catch {
      return empty;
    }
  });
  const [onlineEnabled, setOnlineEnabled] = useState(true);
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState<{ code: string; percent: number } | null>(null);
  const [referralInput, setReferralInput] = useState('');
  const [usePoints, setUsePoints] = useState(false);
  const [placing, setPlacing] = useState(false);
  const cartTrackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Logged-in users get their profile prefilled
  useEffect(() => {
    if (user) {
      setDetails((d) => ({
        ...d,
        name: d.name || user.name,
        email: d.email || user.email,
        phone: d.phone || user.phone,
      }));
    }
  }, [user]);

  // Razorpay is the only payment method — flag if the gateway isn't reachable
  useEffect(() => {
    api.paymentsConfig().then((c) => setOnlineEnabled(c.enabled)).catch(() => {});
  }, []);

  // Abandoned-cart capture: once we know who they are, remember the cart server-side
  useEffect(() => {
    if (details.phone.replace(/\D/g, '').length < 10 || items.length === 0) return;
    if (cartTrackTimer.current) clearTimeout(cartTrackTimer.current);
    cartTrackTimer.current = setTimeout(() => {
      api.trackCart({
        phone: details.phone,
        name: details.name,
        items: items.map((i) => ({ id: i.id, name: i.name, quantity: i.quantity })),
        subtotal,
      }).catch(() => {});
    }, 1500);
    return () => { if (cartTrackTimer.current) clearTimeout(cartTrackTimer.current); };
  }, [details.phone, details.name, items, subtotal]);

  const couponDiscount = coupon ? Math.round((subtotal * coupon.percent) / 100) : 0;
  const maxRedeemable = user ? Math.min(user.points || 0, Math.floor(subtotal * 0.2)) : 0;
  const pointsDiscount = usePoints ? maxRedeemable : 0;
  const discount = couponDiscount + pointsDiscount;
  const shipping = subtotal - discount >= FREE_SHIPPING_ABOVE ? 0 : SHIPPING_FEE;
  const total = Math.max(1, subtotal - discount + shipping);
  const hasSaved = !!details.address && !!details.phone;

  const set = (key: keyof Details) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setDetails((d) => ({ ...d, [key]: e.target.value }));

  const applyCoupon = async () => {
    try {
      const c = await api.validateCoupon(couponInput, subtotal);
      setCoupon(c);
      toast(`Coupon ${c.code} applied — ${c.percent}% off!`);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Invalid coupon', 'error');
    }
  };

  const finish = (order: { orderNumber: string }, paid: boolean) => {
    localStorage.setItem(SAVED_KEY, JSON.stringify(details));
    clearCart();
    navigate(`/order-success/${order.orderNumber}`, { state: { order, phone: details.phone, paid, method: 'online' } });
  };

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setPlacing(true);
    try {
      const order = await api.placeOrder({
        customer: details,
        items: items.map((i) => ({ id: i.id, quantity: i.quantity, variant: i.variant || undefined })),
        couponCode: coupon?.code,
        referralCode: referralInput.trim() || undefined,
        redeemPoints: pointsDiscount || undefined,
        paymentMethod: 'online',
      });

      if (order.payment) {
        const opened = await openRazorpay({
          payment: order.payment,
          orderNumber: order.orderNumber,
          customer: { name: details.name, email: details.email, phone: details.phone },
          onSuccess: async (resp) => {
            try {
              await api.verifyPayment({
                orderNumber: order.orderNumber,
                razorpayOrderId: resp.razorpay_order_id,
                razorpayPaymentId: resp.razorpay_payment_id,
                razorpaySignature: resp.razorpay_signature,
              });
              finish(order, true);
            } catch {
              toast('Payment verification failed — contact us with your order number', 'error');
              finish(order, false);
            }
          },
          onDismiss: () => {
            toast('Payment not completed — you can finish it from the next page.', 'error');
            finish(order, false);
          },
        });
        if (opened) return;
      }

      // Gateway hiccup: the order is saved awaiting payment; the success page offers a retry
      finish(order, false);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not place order', 'error');
      setPlacing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="pt-40 pb-24 text-center px-4">
        <Seo title="Checkout" description="Secure express checkout at Quality Dates and Nuts." path="/checkout" />
        <h1 className="font-serif text-3xl font-semibold text-espresso mb-4">Your cart is empty</h1>
        <Link to="/shop" className="inline-block bg-espresso text-cream px-8 py-4 rounded-full text-sm font-bold hover:bg-cocoa transition-colors">
          Continue shopping
        </Link>
      </div>
    );
  }

  const inputCls = 'w-full bg-white rounded-2xl px-5 py-3.5 text-sm outline-none border border-espresso/10 focus:border-gold transition-colors';

  return (
    <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto min-h-screen">
      <Seo title="Express Checkout" description="Secure express checkout — pay by UPI (GPay/PhonePe/Paytm), cards or net banking. Free shipping above ₹999." path="/checkout" />

      <Link to="/shop" className="inline-flex items-center gap-1.5 text-sm text-cocoa hover:text-espresso transition-colors mb-6">
        <ChevronLeft className="w-4 h-4" aria-hidden="true" /> Continue shopping
      </Link>

      <div className="flex items-center gap-3 mb-10">
        <h1 className="font-serif text-4xl font-semibold text-espresso">Express Checkout</h1>
        <Lock className="w-5 h-5 text-gold" aria-hidden="true" />
      </div>

      <form onSubmit={placeOrder} className="grid lg:grid-cols-[1fr_420px] gap-10 items-start">
        {/* left: details */}
        <div className="space-y-8">
          {hasSaved && (
            <motion.p
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm bg-goldlight/20 border border-gold/30 text-cocoa rounded-2xl px-5 py-3.5"
            >
              ⚡ Details remembered from your last order — just hit <strong>Place Order</strong>.
            </motion.p>
          )}

          <section aria-labelledby="contact-heading">
            <h2 id="contact-heading" className="font-serif text-xl font-semibold text-espresso mb-4">Contact</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <input required value={details.name} onChange={set('name')} placeholder="Full name *" aria-label="Full name" className={inputCls} autoComplete="name" />
              <input required value={details.phone} onChange={set('phone')} placeholder="Phone number *" aria-label="Phone number" type="tel" pattern="[0-9+ -]{10,}" className={inputCls} autoComplete="tel" />
              <input value={details.email} onChange={set('email')} placeholder="Email (for order updates)" aria-label="Email" type="email" className={`${inputCls} sm:col-span-2`} autoComplete="email" />
            </div>
          </section>

          <section aria-labelledby="delivery-heading">
            <h2 id="delivery-heading" className="font-serif text-xl font-semibold text-espresso mb-4">Delivery Address</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <input required value={details.address} onChange={set('address')} placeholder="House / street / area *" aria-label="Address" className={`${inputCls} sm:col-span-2`} autoComplete="street-address" />
              <input value={details.landmark} onChange={set('landmark')} placeholder="Landmark (e.g. near SBI ATM, opposite temple)" aria-label="Landmark" className={`${inputCls} sm:col-span-2`} />
              <input required value={details.city} onChange={set('city')} placeholder="City *" aria-label="City" className={inputCls} autoComplete="address-level2" />
              <select
                required
                value={details.state}
                onChange={(e) => setDetails((d) => ({ ...d, state: e.target.value }))}
                aria-label="State"
                autoComplete="address-level1"
                className={`${inputCls} ${details.state ? 'text-espresso' : 'text-cocoa-light'} cursor-pointer`}
              >
                <option value="" disabled>State *</option>
                {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <input required value={details.pincode} onChange={set('pincode')} placeholder="PIN code *" aria-label="PIN code" pattern="[0-9]{6}" className={`${inputCls} sm:col-span-2`} autoComplete="postal-code" />
            </div>
          </section>

          <section aria-labelledby="payment-heading">
            <h2 id="payment-heading" className="font-serif text-xl font-semibold text-espresso mb-4">Payment</h2>
            {!onlineEnabled ? (
              <div className="rounded-2xl border-2 border-red-200 bg-red-50 px-6 py-5 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-sm text-red-700">
                  Online payments are temporarily unavailable. Please try again in a few minutes, or order on WhatsApp.
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border-2 border-gold bg-goldlight/15 px-6 py-5 shadow-md">
                <p className="flex items-center gap-2.5 font-bold text-espresso text-sm">
                  <ShieldCheck className="w-5 h-5 text-gold" aria-hidden="true" /> Secure online payment
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {['UPI', 'Google Pay', 'PhonePe', 'Paytm', 'Cards', 'NetBanking'].map((m) => (
                    <span key={m} className="inline-flex items-center gap-1.5 text-xs font-semibold text-cocoa bg-white border border-espresso/10 px-3.5 py-2 rounded-full">
                      {['UPI', 'Google Pay', 'PhonePe', 'Paytm'].includes(m)
                        ? <Smartphone className="w-3.5 h-3.5 text-gold" aria-hidden="true" />
                        : <CreditCard className="w-3.5 h-3.5 text-gold" aria-hidden="true" />}
                      {m}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-cocoa-light mt-3">
                  The payment window opens after you place the order. Choose cards, net banking, or UPI — tapping UPI opens your
                  Google Pay / PhonePe / Paytm app directly. Powered by Razorpay, 100% secure.
                </p>
              </div>
            )}
          </section>
        </div>

        {/* right: summary */}
        <aside className="bg-white rounded-[2rem] border border-espresso/5 p-7 lg:sticky lg:top-28 shadow-xl shadow-espresso/5" aria-label="Order summary">
          <h2 className="font-serif text-xl font-semibold text-espresso mb-5">Order Summary</h2>

          <ul className="space-y-4 max-h-64 overflow-y-auto pr-1 mb-5">
            {items.map((item) => (
              <li key={item.key} className="flex gap-3.5 items-center">
                <div className="relative w-14 h-16 rounded-xl overflow-hidden bg-cream-dark flex-shrink-0">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  <span className="absolute -top-0 -right-0 bg-espresso text-goldlight text-[10px] min-w-[18px] h-[18px] px-1 rounded-bl-lg flex items-center justify-center font-bold">
                    {item.quantity}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-espresso truncate">{item.name}</p>
                  <p className="text-xs text-cocoa-light">{item.weight}</p>
                </div>
                <span className="text-sm font-bold text-espresso">{inr(item.price * item.quantity)}</span>
              </li>
            ))}
          </ul>

          {/* coupon */}
          {coupon ? (
            <div className="flex items-center justify-between bg-goldlight/20 border border-gold/30 rounded-2xl px-4 py-3 mb-5 text-sm">
              <span className="flex items-center gap-2 font-bold text-cocoa"><Tag className="w-4 h-4 text-gold" aria-hidden="true" /> {coupon.code} (−{coupon.percent}%)</span>
              <button type="button" onClick={() => setCoupon(null)} aria-label="Remove coupon"><X className="w-4 h-4 text-cocoa" aria-hidden="true" /></button>
            </div>
          ) : (
            <div className="flex gap-2 mb-5">
              <input
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                placeholder="Coupon code (try WELCOME10)"
                aria-label="Coupon code"
                className="flex-1 bg-cream rounded-2xl px-4 py-3 text-sm outline-none border border-espresso/10 focus:border-gold transition-colors"
              />
              <button type="button" onClick={applyCoupon} disabled={!couponInput} className="text-sm font-bold text-espresso bg-cream-dark px-5 rounded-2xl hover:bg-goldlight/40 transition-colors disabled:opacity-40">
                Apply
              </button>
            </div>
          )}

          {/* loyalty points */}
          {user && maxRedeemable > 0 && (
            <label className="flex items-center justify-between gap-3 bg-goldlight/15 border border-gold/25 rounded-2xl px-4 py-3 mb-4 text-sm cursor-pointer">
              <span className="flex items-center gap-2 text-cocoa">
                <Coins className="w-4 h-4 text-gold" aria-hidden="true" />
                Redeem <strong>{maxRedeemable}</strong> points (−{inr(maxRedeemable)})
              </span>
              <input type="checkbox" checked={usePoints} onChange={(e) => setUsePoints(e.target.checked)} className="w-4 h-4 accent-[#A87614]" aria-label="Redeem loyalty points" />
            </label>
          )}

          {/* referral code */}
          {!coupon && (
            <div className="flex items-center gap-2 mb-4">
              <Gift className="w-4 h-4 text-gold flex-shrink-0" aria-hidden="true" />
              <input
                value={referralInput}
                onChange={(e) => setReferralInput(e.target.value.toUpperCase())}
                placeholder="Friend's referral code (5% off)"
                aria-label="Referral code"
                className="flex-1 bg-cream rounded-2xl px-4 py-2.5 text-xs outline-none border border-espresso/10 focus:border-gold transition-colors"
              />
            </div>
          )}

          <dl className="space-y-2.5 text-sm border-t border-espresso/10 pt-5">
            <div className="flex justify-between"><dt className="text-cocoa">Subtotal</dt><dd className="font-semibold text-espresso">{inr(subtotal)}</dd></div>
            {couponDiscount > 0 && <div className="flex justify-between text-green-700"><dt>Coupon discount</dt><dd className="font-semibold">−{inr(couponDiscount)}</dd></div>}
            {pointsDiscount > 0 && <div className="flex justify-between text-green-700"><dt>Points redeemed</dt><dd className="font-semibold">−{inr(pointsDiscount)}</dd></div>}
            <div className="flex justify-between">
              <dt className="text-cocoa flex items-center gap-1.5"><Truck className="w-4 h-4 text-gold" aria-hidden="true" /> Shipping</dt>
              <dd className="font-semibold text-espresso">{shipping === 0 ? <span className="text-green-700">FREE</span> : inr(shipping)}</dd>
            </div>
            <div className="flex justify-between text-lg border-t border-espresso/10 pt-3 mt-3">
              <dt className="font-bold text-espresso">Total</dt>
              <dd className="font-bold text-espresso">{inr(total)}</dd>
            </div>
          </dl>

          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={placing || !onlineEnabled}
            className="w-full mt-6 bg-espresso text-cream py-4 rounded-full text-sm font-bold tracking-widest uppercase hover:bg-cocoa transition-colors shadow-xl shadow-espresso/25 disabled:opacity-60"
          >
            {placing ? 'Placing order…' : `Place Order & Pay · ${inr(total)}`}
          </motion.button>
          <p className="text-[11px] text-cocoa-light text-center mt-3 flex items-center justify-center gap-1">
            <Lock className="w-3 h-3" aria-hidden="true" /> Your details are stored only on your device for faster reorders
          </p>
        </aside>
      </form>
    </div>
  );
}

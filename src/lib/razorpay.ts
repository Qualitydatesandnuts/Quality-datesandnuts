// Shared Razorpay checkout widget loader/opener (used by Checkout and OrderSuccess).

declare global {
  interface Window { Razorpay?: new (options: unknown) => { open: () => void } }
}

export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export interface RazorpayPayment {
  razorpayOrderId: string;
  amount: number;
  keyId: string;
}

export interface RazorpayResult {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export async function openRazorpay(options: {
  payment: RazorpayPayment;
  orderNumber: string;
  customer: { name: string; email?: string; phone: string };
  onSuccess: (result: RazorpayResult) => void;
  onDismiss: () => void;
}): Promise<boolean> {
  const ok = await loadRazorpayScript();
  if (!ok || !window.Razorpay) return false;
  const rzp = new window.Razorpay({
    key: options.payment.keyId,
    amount: options.payment.amount,
    currency: 'INR',
    name: 'Quality Dates and Nuts',
    description: `Order ${options.orderNumber}`,
    order_id: options.payment.razorpayOrderId,
    prefill: { name: options.customer.name, email: options.customer.email || '', contact: options.customer.phone },
    theme: { color: '#2C1A0E' },
    // UPI uses the "intent" flow: on a phone it opens the installed app
    // (Google Pay / PhonePe / Paytm) to pay directly — no QR code, no collect
    // request. Cards, net banking and wallets still show as default blocks.
    // (On desktop there is no app to open, so UPI-intent is unavailable there;
    //  desktop shoppers use cards / net banking instead.)
    config: {
      display: {
        blocks: {
          upi: {
            name: 'Pay by UPI (Google Pay / PhonePe / Paytm)',
            instruments: [{ method: 'upi', flows: ['intent'] }],
          },
        },
        sequence: ['block.upi'],
        preferences: { show_default_blocks: true },
      },
    },
    handler: options.onSuccess,
    modal: { ondismiss: options.onDismiss },
  });
  rzp.open();
  return true;
}

import crypto from 'node:crypto';

// Razorpay via plain REST — no SDK needed.
// Configure RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET to enable online payments.

const keyId = () => process.env.RAZORPAY_KEY_ID || '';
const keySecret = () => process.env.RAZORPAY_KEY_SECRET || '';

export const razorpayEnabled = () => !!(keyId() && keySecret());

export async function createRazorpayOrder(amountPaise, receipt) {
  const auth = Buffer.from(`${keyId()}:${keySecret()}`).toString('base64');
  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: amountPaise, currency: 'INR', receipt }),
  });
  if (!res.ok) throw new Error(`Razorpay order failed: ${await res.text()}`);
  return res.json(); // { id, amount, currency, ... }
}

export function verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, signature) {
  const expected = crypto
    .createHmac('sha256', keySecret())
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');
  return expected.length === signature?.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export const razorpayKeyId = keyId;

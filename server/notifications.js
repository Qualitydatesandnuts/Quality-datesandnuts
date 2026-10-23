import nodemailer from 'nodemailer';
import { getSetting } from './db.js';

// All channels degrade gracefully: if credentials are missing the message is
// logged and skipped, so the store never breaks because a provider is not set up.

const SITE = 'Quality Dates and Nuts';

let transporter = null;
function mailer() {
  const host = process.env.SMTP_HOST;
  if (!host) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });
  }
  return transporter;
}

export async function sendEmail(to, subject, html) {
  const t = mailer();
  if (!t || !to) {
    console.log(`[email skipped${t ? '' : ' — SMTP not configured'}] to=${to || '(none)'} subject="${subject}"`);
    return false;
  }
  try {
    await t.sendMail({ from: process.env.SMTP_FROM || `"${SITE}" <${process.env.SMTP_USER}>`, to, subject, html });
    return true;
  } catch (err) {
    console.error('[email failed]', err.message);
    return false;
  }
}

export async function sendWhatsApp(phone, text) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  if (!token || !phoneId || !phone) {
    console.log(`[whatsapp skipped — API not configured] to=${phone} text="${text.slice(0, 60)}…"`);
    return false;
  }
  try {
    let digits = phone.replace(/\D/g, '');
    if (digits.length === 10) digits = `91${digits}`;
    const res = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', to: digits, type: 'text', text: { body: text } }),
    });
    return res.ok;
  } catch (err) {
    console.error('[whatsapp failed]', err.message);
    return false;
  }
}

const STATUS_LINES = {
  confirmed: 'Your order {order} is confirmed! 🎉 We are getting it ready.',
  packed: 'Good news {name} — order {order} is packed and ready for pickup. 📦',
  shipped: 'Your order {order} is on its way! 🚚{tracking}',
  delivered: 'Order {order} has been delivered. Enjoy! 🌴 We would love a review.',
  cancelled: 'Your order {order} has been cancelled. If this is unexpected, please contact us.',
};

export async function notifyOrderStatus(order, status = order.status) {
  const tracking = order.tracking_number
    ? ` Track it: ${order.courier ? order.courier + ' ' : ''}AWB ${order.tracking_number}.`
    : '';
  const line = (STATUS_LINES[status] || STATUS_LINES.confirmed)
    .replaceAll('{order}', order.order_number)
    .replaceAll('{name}', (order.customer_name || '').split(' ')[0])
    .replaceAll('{tracking}', tracking);
  const text = `Hi ${(order.customer_name || '').split(' ')[0]}! ${line}\n— ${SITE}`;

  await sendWhatsApp(order.customer_phone, text);
  if (order.customer_email) {
    await sendEmail(
      order.customer_email,
      `${SITE} — order ${order.order_number} ${status}`,
      `<p>${text.replace(/\n/g, '<br>')}</p>`
    );
  }
}

// Send a WhatsApp to the STORE OWNER. Two ways, easiest first:
//  1. CallMeBot (free, 2-min setup) — set CALLMEBOT_APIKEY.
//  2. Meta WhatsApp Business Cloud API — set WHATSAPP_TOKEN + WHATSAPP_PHONE_ID.
// If neither is set, the alert is logged so nothing breaks.
async function sendOwnerWhatsApp(phone, text) {
  const apikey = process.env.CALLMEBOT_APIKEY;
  if (apikey && phone) {
    try {
      let digits = phone.replace(/\D/g, '');
      if (digits.length === 10) digits = `91${digits}`;
      const url = `https://api.callmebot.com/whatsapp.php?phone=${digits}&text=${encodeURIComponent(text)}&apikey=${encodeURIComponent(apikey)}`;
      const res = await fetch(url);
      return res.ok;
    } catch (err) {
      console.error('[callmebot failed]', err.message);
      return false;
    }
  }
  return sendWhatsApp(phone, text);
}

// Alert the owner the moment an order is placed & paid.
export async function notifyAdminNewOrder(order) {
  const adminPhone = getSetting('admin_phone', process.env.ADMIN_WHATSAPP || '');
  const adminEmail = getSetting('alert_email', process.env.ADMIN_EMAIL || '');
  const items = (typeof order.items === 'string' ? JSON.parse(order.items) : order.items || [])
    .map((i) => `• ${i.name}${i.weight ? ' ' + i.weight : ''} × ${i.quantity}`).join('\n');
  const paidLabel = order.payment_status === 'paid' ? 'PAID online ✅' : (order.payment_method || '').toUpperCase();

  const text = `🛒 NEW ORDER — ${order.order_number}\n\n${items}\n\n💰 Total: ₹${order.total} (${paidLabel})\n\n👤 ${order.customer_name}\n📞 ${order.customer_phone}\n📍 ${order.address}${order.landmark ? ', ' + order.landmark : ''}, ${order.city}${order.state ? ', ' + order.state : ''} - ${order.pincode}\n\nManage: open your admin panel → Orders.\n— ${SITE}`;

  await sendOwnerWhatsApp(adminPhone, text);
  if (adminEmail) {
    await sendEmail(adminEmail, `🛒 New order ${order.order_number} — ₹${order.total}`,
      `<pre style="font-family:system-ui,sans-serif;font-size:14px">${text}</pre>`);
  }
}

export async function lowStockAlert(products) {
  if (!products.length) return;
  const adminEmail = getSetting('alert_email', process.env.ADMIN_EMAIL || '');
  const rows = products.map((p) => `<li>${p.name} ${p.weight} — <strong>${p.stock}</strong> left</li>`).join('');
  await sendEmail(adminEmail, `${SITE} — low stock alert`, `<p>These products are running low:</p><ul>${rows}</ul>`);
}

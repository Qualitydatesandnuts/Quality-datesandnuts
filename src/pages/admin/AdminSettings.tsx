import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, BarChart3, Bell, Smartphone } from 'lucide-react';
import { adminApi, type AdminSettings as Settings } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { Card, PageTitle, inputCls, btnPrimary } from './ui';

const integrationHelp: Record<string, { label: string; env: string; where: string }> = {
  razorpay: { label: 'Razorpay (online payments)', env: 'RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET', where: 'dashboard.razorpay.com → Settings → API Keys' },
  whatsapp: { label: 'WhatsApp Business Cloud API', env: 'WHATSAPP_TOKEN + WHATSAPP_PHONE_ID', where: 'developers.facebook.com → WhatsApp → Getting started' },
  smtp: { label: 'Email (SMTP)', env: 'SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM', where: 'any provider — e.g. Zoho Mail, Brevo, SES' },
  shiprocket: { label: 'Shiprocket (shipping labels)', env: 'SHIPROCKET_EMAIL + SHIPROCKET_PASSWORD', where: 'app.shiprocket.in → Settings → API' },
};

export default function AdminSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    adminApi.settings().then(setSettings).catch(() => {});
  }, []);

  if (!settings) return <div className="skeleton h-64 rounded-3xl" />;

  const setValue = (key: keyof Settings['values']) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setSettings((s) => s && ({ ...s, values: { ...s.values, [key]: e.target.value } }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await adminApi.saveSettings(settings.values);
      toast('Settings saved');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Save failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageTitle title="Settings" subtitle="Analytics, alerts and integration status" />

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <form onSubmit={save} className="space-y-6">
          <Card>
            <h2 className="font-serif text-lg font-semibold text-espresso mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-gold" aria-hidden="true" /> Analytics</h2>
            <label className="block text-xs font-bold uppercase tracking-widest text-cocoa-light mb-1.5">Google Analytics 4 — Measurement ID</label>
            <input value={settings.values.ga4_id} onChange={setValue('ga4_id')} placeholder="G-XXXXXXXXXX" className={inputCls} />
            <label className="block text-xs font-bold uppercase tracking-widest text-cocoa-light mb-1.5 mt-4">Meta Pixel ID</label>
            <input value={settings.values.meta_pixel_id} onChange={setValue('meta_pixel_id')} placeholder="1234567890" className={inputCls} />
            <p className="text-[11px] text-cocoa-light mt-3">Both load automatically on the store as soon as an ID is saved. The Google Merchant Center product feed is always live at <code className="font-mono bg-cream px-1 rounded">/api/feeds/google-merchant.xml</code>.</p>
          </Card>

          <Card>
            <h2 className="font-serif text-lg font-semibold text-espresso mb-4 flex items-center gap-2"><Smartphone className="w-5 h-5 text-gold" aria-hidden="true" /> Direct UPI / Bank payment (0% fees)</h2>
            <label className="block text-xs font-bold uppercase tracking-widest text-cocoa-light mb-1.5">Payment details shown to customers</label>
            <textarea
              value={settings.values.manual_payment_note}
              onChange={(e) => setSettings((s) => s && ({ ...s, values: { ...s.values, manual_payment_note: e.target.value } }))}
              rows={6}
              placeholder={'GPay / UPI number: …\nBank: … A/C … IFSC …'}
              className={`${inputCls} resize-y font-mono text-xs`}
            />
            <label className="block text-xs font-bold uppercase tracking-widest text-cocoa-light mb-1.5 mt-4">UPI ID (VPA) — optional, enables the “Open UPI app” button</label>
            <input value={settings.values.upi_id} onChange={setValue('upi_id')} placeholder="e.g. 6282885541@okbizaxis — copy it exactly from your GPay app" className={inputCls} />
            <p className="text-[11px] text-cocoa-light mt-3">
              Clearing the payment details hides the Direct UPI option at checkout. Orders paid this way appear as “Verify UTR” in Orders — confirm against your bank app, then hit “Mark payment received”.
            </p>
          </Card>

          <Card>
            <h2 className="font-serif text-lg font-semibold text-espresso mb-4 flex items-center gap-2"><Bell className="w-5 h-5 text-gold" aria-hidden="true" /> Owner alerts</h2>
            <label className="block text-xs font-bold uppercase tracking-widest text-cocoa-light mb-1.5">Owner WhatsApp / phone (new-order alerts)</label>
            <input type="tel" value={settings.values.admin_phone} onChange={setValue('admin_phone')} placeholder="6282885541" className={inputCls} />
            <p className="text-[11px] text-cocoa-light mt-1.5">You get a WhatsApp the moment an order is paid (needs CallMeBot or the WhatsApp API — see below).</p>
            <label className="block text-xs font-bold uppercase tracking-widest text-cocoa-light mb-1.5 mt-4">Alert email</label>
            <input type="email" value={settings.values.alert_email} onChange={setValue('alert_email')} placeholder="you@store.com" className={inputCls} />
            <p className="text-[11px] text-cocoa-light mt-1.5">Emailed on every new order and when stock runs low (needs SMTP).</p>
            <label className="block text-xs font-bold uppercase tracking-widest text-cocoa-light mb-1.5 mt-4">Low-stock threshold</label>
            <input type="number" min="1" value={settings.values.low_stock_threshold} onChange={setValue('low_stock_threshold')} placeholder="10" className={inputCls} />
          </Card>

          <button type="submit" disabled={busy} className={btnPrimary}>{busy ? 'Saving…' : 'Save settings'}</button>
        </form>

        <Card>
          <h2 className="font-serif text-lg font-semibold text-espresso mb-4">Integration status</h2>
          <ul className="space-y-4">
            {Object.entries(integrationHelp).map(([key, info]) => {
              const on = settings.integrations[key as keyof Settings['integrations']];
              return (
                <li key={key} className="flex items-start gap-3">
                  {on
                    ? <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                    : <XCircle className="w-5 h-5 text-cocoa-light/50 flex-shrink-0 mt-0.5" aria-hidden="true" />}
                  <div>
                    <p className="font-semibold text-espresso text-sm">{info.label} — {on ? <span className="text-green-700">connected</span> : <span className="text-cocoa-light">not configured</span>}</p>
                    {!on && (
                      <p className="text-xs text-cocoa-light mt-1">
                        Set env vars <code className="font-mono bg-cream px-1 rounded">{info.env}</code><br />Get keys: {info.where}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="text-[11px] text-cocoa-light mt-5 border-t border-espresso/5 pt-4">
            Environment variables are set where the API runs (e.g. a <code className="font-mono">.env</code> loaded by your host, or the server dashboard). Restart the API after changing them.
          </p>
        </Card>
      </div>
    </>
  );
}

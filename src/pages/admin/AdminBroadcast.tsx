import { useEffect, useState } from 'react';
import { MessageCircle, Send, ExternalLink, CheckCircle2, Info } from 'lucide-react';
import { adminApi, type BroadcastRecipient, type BroadcastAudience } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { Card, PageTitle, btnPrimary } from './ui';

const AUDIENCES: { value: BroadcastAudience; label: string; hint: string }[] = [
  { value: 'customers', label: 'Customers', hint: 'everyone who has ordered' },
  { value: 'leads', label: 'WhatsApp subscribers', hint: 'visitors who joined via the site popup' },
  { value: 'abandoned', label: 'Abandoned carts', hint: 'entered phone at checkout, never ordered' },
  { value: 'all', label: 'Everyone', hint: 'all of the above, de-duplicated' },
];

const TEMPLATES = [
  { label: 'New offer', text: 'Hi {name}! 🌴 Big news from Quality Dates and Nuts — our new offer is live. Use code WELCOME10 for 10% off. Order before 2pm for same-day dispatch!' },
  { label: 'New arrival', text: 'Hi {name}! We just launched something delicious at Quality Dates and Nuts 😋 Come take a look before it sells out!' },
  { label: 'Festival greeting', text: 'Hi {name}! 🎉 Wishing you and your family a joyful festive season from all of us at Quality Dates and Nuts. Our gift hampers are ready for gifting!' },
];

export default function AdminBroadcast() {
  const [message, setMessage] = useState(TEMPLATES[0].text);
  const [recipients, setRecipients] = useState<BroadcastRecipient[] | null>(null);
  const [mode, setMode] = useState<'api' | 'links' | null>(null);
  const [audience, setAudience] = useState<BroadcastAudience>('customers');
  const [counts, setCounts] = useState<Record<BroadcastAudience, number> | null>(null);
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();
  const customerCount = counts?.[audience] ?? 0;

  useEffect(() => {
    adminApi.broadcastAudiences().then(setCounts).catch(() => {});
  }, []);

  const send = async () => {
    setBusy(true);
    try {
      const res = await adminApi.broadcast(message, audience);
      setRecipients(res.recipients);
      setMode(res.mode);
      toast(res.mode === 'api' ? 'Broadcast sent via WhatsApp Business API' : `Personalised links ready for ${res.recipients.length} customers`);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Broadcast failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageTitle title="WhatsApp Broadcast" subtitle="Send a personalised message to customers, site subscribers or abandoned carts" />

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <Card>
          <h2 className="font-serif text-lg font-semibold text-espresso mb-4 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-[#25D366]" aria-hidden="true" /> Compose
          </h2>

          {/* audience */}
          <p className="text-xs font-bold uppercase tracking-widest text-cocoa-light mb-2">Send to</p>
          <div className="grid sm:grid-cols-2 gap-2 mb-5" role="radiogroup" aria-label="Audience">
            {AUDIENCES.map((a) => (
              <button
                key={a.value}
                role="radio"
                aria-checked={audience === a.value}
                onClick={() => setAudience(a.value)}
                className={`text-left rounded-2xl border-2 px-4 py-3 transition-all ${
                  audience === a.value ? 'border-gold bg-goldlight/15' : 'border-espresso/10 bg-cream hover:border-gold/40'
                }`}
              >
                <span className="block text-sm font-bold text-espresso">
                  {a.label} <span className="text-gold">({counts ? counts[a.value] : '…'})</span>
                </span>
                <span className="block text-[11px] text-cocoa-light mt-0.5">{a.hint}</span>
              </button>
            ))}
          </div>

          <p className="text-xs font-bold uppercase tracking-widest text-cocoa-light mb-2">Message</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {TEMPLATES.map((t) => (
              <button key={t.label} onClick={() => setMessage(t.text)} className="text-xs font-bold bg-cream px-3.5 py-2 rounded-full text-cocoa hover:bg-goldlight/40 transition-colors">
                {t.label}
              </button>
            ))}
          </div>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={6}
            aria-label="Broadcast message"
            className="w-full bg-cream rounded-2xl px-5 py-4 text-sm outline-none border border-espresso/10 focus:border-gold transition-colors resize-none"
          />
          <p className="text-xs text-cocoa-light mt-2">Use <code className="bg-cream px-1.5 py-0.5 rounded font-mono">{'{name}'}</code> — it becomes each customer's first name.</p>

          <button onClick={send} disabled={busy || !message.trim() || customerCount === 0} className={`${btnPrimary} mt-5 flex items-center gap-2 py-3.5 px-7`}>
            <Send className="w-4 h-4" aria-hidden="true" /> {busy ? 'Preparing…' : 'Prepare broadcast'}
          </button>

          <div className="mt-5 flex items-start gap-2.5 text-xs text-cocoa-light bg-cream rounded-2xl p-4">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-gold" aria-hidden="true" />
            <p>
              For fully automatic sending, set <code className="font-mono">WHATSAPP_TOKEN</code> and <code className="font-mono">WHATSAPP_PHONE_ID</code> from your
              Meta WhatsApp Business Cloud API account as environment variables on the server. Without them, you get one-click personalised
              send links per customer below (opens WhatsApp with the message pre-filled).
            </p>
          </div>
        </Card>

        <Card>
          <h2 className="font-serif text-lg font-semibold text-espresso mb-4">
            {mode === 'api' ? 'Delivery report' : 'Recipients'}
          </h2>
          {!recipients ? (
            <p className="text-sm text-cocoa-light">Pick an audience, compose a message and hit “Prepare broadcast” to see the personalised message for each recipient.</p>
          ) : recipients.length === 0 ? (
            <p className="text-sm text-cocoa-light">This audience is empty right now.</p>
          ) : (
            <ul className="divide-y divide-espresso/5 max-h-[520px] overflow-y-auto">
              {recipients.map((r) => (
                <li key={r.phone} className="py-3.5 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-espresso text-sm">{r.name} <span className="text-cocoa-light font-normal">· {r.phone}</span></p>
                    <p className="text-xs text-cocoa-light mt-1 line-clamp-2">{r.message}</p>
                  </div>
                  {mode === 'api' ? (
                    <span className={`flex items-center gap-1 text-xs font-bold flex-shrink-0 ${r.sent ? 'text-green-700' : 'text-red-600'}`}>
                      <CheckCircle2 className="w-4 h-4" aria-hidden="true" /> {r.sent ? 'Sent' : 'Failed'}
                    </span>
                  ) : (
                    <a
                      href={r.waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs font-bold bg-[#25D366]/10 text-[#128C4A] px-3.5 py-2 rounded-full hover:bg-[#25D366]/20 transition-colors flex-shrink-0"
                    >
                      Send <ExternalLink className="w-3 h-3" aria-hidden="true" />
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}

import { useEffect, useState } from 'react';
import { publicApi } from '../lib/api';

const fallback = [
  '🌴 Free shipping on orders above ₹999',
  '🎁 Use code WELCOME10 for 10% off your first order',
];

export default function AnnouncementBar() {
  const [messages, setMessages] = useState<string[]>(fallback);

  useEffect(() => {
    publicApi.announcements()
      .then((rows) => rows.length && setMessages(rows.map((r) => r.text)))
      .catch(() => {});
  }, []);

  // repeat to a comfortable width, then duplicate exactly once so the -50% loop is seamless
  const repeats = Math.max(1, Math.ceil(6 / messages.length));
  const strip = Array.from({ length: repeats }, () => messages).flat();
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-espresso text-goldlight text-xs font-medium tracking-wide overflow-hidden py-2 select-none shadow-[0_-4px_16px_rgba(0,0,0,0.15)]" role="marquee" aria-label="Store announcements">
      <div className="animate-marquee whitespace-nowrap flex w-max">
        {[...strip, ...strip].map((m, i) => (
          <span key={i} className="mx-8">{m}</span>
        ))}
      </div>
    </div>
  );
}

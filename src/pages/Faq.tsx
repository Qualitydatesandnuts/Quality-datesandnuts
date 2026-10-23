import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, MessageCircle } from 'lucide-react';
import Seo from '../components/Seo';
import Reveal from '../components/Reveal';
import { faqs } from '../lib/faqs';
import { WHATSAPP_NUMBER } from '../lib/api';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
};

export default function Faq() {
  const [open, setOpen] = useState(0);

  return (
    <div className="pt-36 pb-24 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto min-h-screen">
      <Seo
        title="Frequently Asked Questions"
        description="Answers about delivery times, free shipping, UPI payments, storage tips, bulk gifting and returns at Quality Dates and Nuts."
        path="/faq"
        jsonLd={jsonLd}
      />
      <h1 className="font-serif text-4xl md:text-5xl font-semibold text-espresso text-center mb-4">Frequently Asked Questions</h1>
      <p className="text-cocoa-light text-center mb-12">Everything you need to know before (and after) you order.</p>

      <div className="space-y-3">
        {faqs.map((f, i) => (
          <Reveal key={f.q} delay={i * 0.04}>
            <div className="bg-white rounded-2xl border border-espresso/5 overflow-hidden">
              <button
                onClick={() => setOpen(open === i ? -1 : i)}
                aria-expanded={open === i}
                className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left font-semibold text-espresso"
              >
                {f.q}
                <ChevronDown className={`w-5 h-5 text-gold flex-shrink-0 transition-transform ${open === i ? 'rotate-180' : ''}`} aria-hidden="true" />
              </button>
              <motion.div initial={false} animate={{ height: open === i ? 'auto' : 0 }} className="overflow-hidden">
                <p className="px-6 pb-5 text-cocoa-light leading-relaxed text-sm">{f.a}</p>
              </motion.div>
            </div>
          </Reveal>
        ))}
      </div>

      <div className="text-center mt-12">
        <p className="text-cocoa-light text-sm mb-4">Still curious?</p>
        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-espresso text-cream px-8 py-4 rounded-full text-sm font-bold hover:bg-cocoa transition-colors"
        >
          <MessageCircle className="w-4 h-4 text-[#25D366]" aria-hidden="true" /> Ask us on WhatsApp
        </a>
      </div>
    </div>
  );
}

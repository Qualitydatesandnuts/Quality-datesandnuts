import { motion } from 'framer-motion';
import { WHATSAPP_NUMBER } from '../lib/api';

/** Floating WhatsApp ordering button — mirrors ajfan.store's WhatsApp flow. */
export default function WhatsAppButton() {
  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hi! I would like to place an order with Quality Dates and Nuts.')}`;
  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Order on WhatsApp"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1.2, type: 'spring', stiffness: 260, damping: 18 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.92 }}
      className="fixed bottom-14 right-6 z-[80] w-14 h-14 rounded-full bg-[#25D366] shadow-xl shadow-black/25 flex items-center justify-center"
    >
      <svg viewBox="0 0 32 32" className="w-7 h-7 fill-white" aria-hidden="true">
        <path d="M16 2.7C8.7 2.7 2.7 8.6 2.7 16c0 2.4.6 4.6 1.8 6.6L2.6 29.4l7-1.8c1.9 1 4.1 1.6 6.4 1.6 7.3 0 13.3-5.9 13.3-13.3S23.3 2.7 16 2.7zm0 24.2c-2.1 0-4-.5-5.7-1.5l-.4-.2-4.2 1.1 1.1-4-.3-.4c-1.1-1.8-1.7-3.8-1.7-5.9 0-6.1 5-11.1 11.2-11.1S27.1 9.9 27.1 16 22.2 26.9 16 26.9zm6.1-8.3c-.3-.2-2-1-2.3-1.1-.3-.1-.5-.2-.7.2s-.9 1.1-1 1.3c-.2.2-.4.3-.7.1-.3-.2-1.4-.5-2.7-1.7-1-.9-1.7-2-1.9-2.3-.2-.3 0-.5.1-.7l.5-.6c.2-.2.2-.4.3-.6.1-.2.1-.4 0-.6-.1-.2-.7-1.8-1-2.4-.3-.6-.5-.5-.7-.6h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.1-1.2 2.8s1.2 3.2 1.4 3.5c.2.2 2.4 3.7 5.9 5.2.8.4 1.5.6 2 .7.8.3 1.6.2 2.2.1.7-.1 2-.8 2.3-1.6.3-.8.3-1.5.2-1.6-.1-.2-.3-.3-.6-.4z" />
      </svg>
      <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-20" aria-hidden="true" />
    </motion.a>
  );
}

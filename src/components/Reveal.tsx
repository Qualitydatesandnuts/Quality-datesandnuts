import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

/** Scroll-into-view reveal wrapper used across sections. */
export default function Reveal({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ type: 'spring', stiffness: 90, damping: 18, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

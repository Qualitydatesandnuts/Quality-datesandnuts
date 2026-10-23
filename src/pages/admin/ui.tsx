import type { ReactNode } from 'react';

export const inputCls =
  'w-full bg-cream rounded-xl px-4 py-2.5 text-sm outline-none border border-espresso/10 focus:border-gold transition-colors';

export const btnPrimary =
  'bg-espresso text-cream px-5 py-2.5 rounded-full text-sm font-bold hover:bg-cocoa transition-colors disabled:opacity-50';

export const btnGhost =
  'text-sm font-semibold text-cocoa bg-white border border-espresso/10 px-4 py-2 rounded-full hover:border-gold transition-colors';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`bg-white rounded-3xl border border-espresso/5 p-6 ${className}`}>{children}</div>;
}

export function PageTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-espresso">{title}</h1>
        {subtitle && <p className="text-sm text-cocoa-light mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export const fmtDate = (s: string) =>
  new Date(s.includes('T') ? s : s + 'Z').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

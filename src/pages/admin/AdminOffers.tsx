import { useEffect, useState } from 'react';
import { Plus, Trash2, Tag, Megaphone } from 'lucide-react';
import { adminApi, inr, type Coupon, type Announcement } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { Card, PageTitle, inputCls, btnPrimary } from './ui';

export default function AdminOffers() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [couponForm, setCouponForm] = useState({ code: '', percent: '', minOrder: '' });
  const [announcementText, setAnnouncementText] = useState('');
  const { toast } = useToast();

  const load = () => {
    adminApi.coupons().then(setCoupons).catch(() => {});
    adminApi.announcements().then(setAnnouncements).catch(() => {});
  };
  useEffect(load, []);

  const addCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminApi.createCoupon({ code: couponForm.code, percent: Number(couponForm.percent), minOrder: Number(couponForm.minOrder) || 0 });
      toast(`Coupon ${couponForm.code.toUpperCase()} created`);
      setCouponForm({ code: '', percent: '', minOrder: '' });
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not create coupon', 'error');
    }
  };

  const addAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminApi.createAnnouncement(announcementText);
      toast('Announcement added to the site marquee');
      setAnnouncementText('');
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not add announcement', 'error');
    }
  };

  return (
    <>
      <PageTitle title="Offers & Announcements" subtitle="Coupon codes for checkout, and the scrolling announcement bar shown on every page" />

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        {/* coupons */}
        <Card>
          <h2 className="font-serif text-lg font-semibold text-espresso mb-4 flex items-center gap-2"><Tag className="w-5 h-5 text-gold" aria-hidden="true" /> Coupon codes</h2>
          <form onSubmit={addCoupon} className="grid grid-cols-[1fr_90px_110px_auto] gap-2 mb-5">
            <input required value={couponForm.code} onChange={(e) => setCouponForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="CODE" aria-label="Coupon code" className={inputCls} />
            <input required type="number" min="1" max="90" value={couponForm.percent} onChange={(e) => setCouponForm((f) => ({ ...f, percent: e.target.value }))} placeholder="% off" aria-label="Percent off" className={inputCls} />
            <input type="number" min="0" value={couponForm.minOrder} onChange={(e) => setCouponForm((f) => ({ ...f, minOrder: e.target.value }))} placeholder="Min ₹" aria-label="Minimum order" className={inputCls} />
            <button type="submit" aria-label="Add coupon" className={`${btnPrimary} px-4`}><Plus className="w-4 h-4" aria-hidden="true" /></button>
          </form>
          <ul className="divide-y divide-espresso/5">
            {coupons.map((c) => (
              <li key={c.code} className="py-3 flex items-center justify-between gap-3">
                <span>
                  <span className={`font-mono font-bold ${c.active ? 'text-espresso' : 'text-cocoa-light line-through'}`}>{c.code}</span>
                  <span className="block text-xs text-cocoa-light mt-0.5">{c.percent}% off{c.min_order > 0 && ` · min order ${inr(c.min_order)}`}</span>
                </span>
                <span className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 text-xs text-cocoa cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!c.active}
                      onChange={(e) => adminApi.toggleCoupon(c.code, e.target.checked).then(load)}
                      className="w-4 h-4 accent-[#A87614]"
                    />
                    Active
                  </label>
                  <button
                    onClick={() => window.confirm(`Delete coupon ${c.code}?`) && adminApi.deleteCoupon(c.code).then(() => { toast('Coupon deleted'); load(); })}
                    aria-label={`Delete coupon ${c.code}`}
                    className="p-2 text-cocoa hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </Card>

        {/* announcements */}
        <Card>
          <h2 className="font-serif text-lg font-semibold text-espresso mb-4 flex items-center gap-2"><Megaphone className="w-5 h-5 text-gold" aria-hidden="true" /> Announcement bar</h2>
          <form onSubmit={addAnnouncement} className="flex gap-2 mb-5">
            <input required value={announcementText} onChange={(e) => setAnnouncementText(e.target.value)} maxLength={160} placeholder="🎉 New offer message…" aria-label="Announcement text" className={inputCls} />
            <button type="submit" aria-label="Add announcement" className={`${btnPrimary} px-4`}><Plus className="w-4 h-4" aria-hidden="true" /></button>
          </form>
          <ul className="divide-y divide-espresso/5">
            {announcements.map((a) => (
              <li key={a.id} className="py-3 flex items-center justify-between gap-3">
                <span className={`text-sm ${a.active ? 'text-cocoa' : 'text-cocoa-light line-through'}`}>{a.text}</span>
                <span className="flex items-center gap-2 flex-shrink-0">
                  <label className="flex items-center gap-1.5 text-xs text-cocoa cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!a.active}
                      onChange={(e) => adminApi.toggleAnnouncement(a.id, e.target.checked).then(load)}
                      className="w-4 h-4 accent-[#A87614]"
                    />
                    Live
                  </label>
                  <button
                    onClick={() => adminApi.deleteAnnouncement(a.id).then(() => { toast('Announcement removed'); load(); })}
                    aria-label="Delete announcement"
                    className="p-2 text-cocoa hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}

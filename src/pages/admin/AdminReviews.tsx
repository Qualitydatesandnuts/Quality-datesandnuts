import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Trash2 } from 'lucide-react';
import { adminApi, type AdminReview } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { Card, PageTitle, fmtDate } from './ui';

export default function AdminReviews() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const { toast } = useToast();

  const load = () => adminApi.reviews().then(setReviews).catch(() => {});
  useEffect(() => { load(); }, []);

  const remove = async (r: AdminReview) => {
    if (!window.confirm(`Delete this review by ${r.name}? The product's rating is recalculated.`)) return;
    try {
      await adminApi.deleteReview(r.id);
      toast('Review deleted');
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Delete failed', 'error');
    }
  };

  return (
    <>
      <PageTitle title="Reviews" subtitle={`${reviews.length} customer reviews — deleting one recalculates the product rating`} />
      <div className="space-y-3">
        {reviews.length === 0 && <Card><p className="text-sm text-cocoa-light">No reviews yet.</p></Card>}
        {reviews.map((r) => (
          <Card key={r.id} className="flex flex-wrap gap-4 items-start justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-1.5">
                <strong className="text-espresso">{r.name}</strong>
                <span className="flex" aria-label={`${r.rating} out of 5 stars`}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-3.5 h-3.5 ${i < r.rating ? 'fill-gold text-gold' : 'text-espresso/15'}`} aria-hidden="true" />
                  ))}
                </span>
                <span className="text-xs text-cocoa-light">{fmtDate(r.created_at)}</span>
              </div>
              <p className="text-sm text-cocoa">{r.comment || <em className="text-cocoa-light">No comment</em>}</p>
              <Link to={`/product/${r.product_slug}`} className="text-xs font-bold text-gold mt-2 inline-block">on {r.product_name} →</Link>
            </div>
            <button onClick={() => remove(r)} aria-label={`Delete review by ${r.name}`} className="p-2.5 text-cocoa hover:text-red-600 bg-cream rounded-full">
              <Trash2 className="w-4 h-4" aria-hidden="true" />
            </button>
          </Card>
        ))}
      </div>
    </>
  );
}

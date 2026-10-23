import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { IndianRupee, ShoppingCart, Users, Package, AlertTriangle, Clock } from 'lucide-react';
import { adminApi, inr, type AdminStats } from '../../lib/api';
import { Card, PageTitle, fmtDate } from './ui';

const MARK = '#A87614'; // validated: ≥3:1 on light surface, in-band lightness/chroma

interface Point { day: string; label: string; revenue: number; orders: number }

/** Fill the last 30 days so gaps render as zero instead of skipping. */
function fillDays(daily: AdminStats['daily']): Point[] {
  const byDay = Object.fromEntries(daily.map((d) => [d.day, d]));
  const points: Point[] = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date(Date.now() - i * 86400000);
    const key = date.toISOString().slice(0, 10);
    points.push({
      day: key,
      label: date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      revenue: byDay[key]?.revenue || 0,
      orders: byDay[key]?.orders || 0,
    });
  }
  return points;
}

function SalesChart({ daily }: { daily: AdminStats['daily'] }) {
  const [metric, setMetric] = useState<'revenue' | 'orders'>('revenue');
  const [hover, setHover] = useState<number | null>(null);
  const points = useMemo(() => fillDays(daily), [daily]);

  const W = 720, H = 220, PAD = { top: 16, right: 16, bottom: 28, left: 52 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const max = Math.max(1, ...points.map((p) => p[metric]));
  const niceMax = max <= 5 ? 5 : Math.ceil(max / Math.pow(10, String(Math.floor(max)).length - 1)) * Math.pow(10, String(Math.floor(max)).length - 1);
  const x = (i: number) => PAD.left + (i / (points.length - 1)) * innerW;
  const y = (v: number) => PAD.top + innerH - (v / niceMax) * innerH;

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p[metric]).toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L${x(points.length - 1).toFixed(1)},${(PAD.top + innerH).toFixed(1)} L${PAD.left},${(PAD.top + innerH).toFixed(1)} Z`;
  const gridLines = [0.25, 0.5, 0.75, 1].map((f) => ({ v: niceMax * f, y: y(niceMax * f) }));
  const fmt = (v: number) => (metric === 'revenue' ? (v >= 1000 ? `₹${(v / 1000).toFixed(v % 1000 ? 1 : 0)}k` : `₹${v}`) : String(Math.round(v)));

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const i = Math.round(((px - PAD.left) / innerW) * (points.length - 1));
    setHover(i >= 0 && i < points.length ? i : null);
  };

  const h = hover !== null ? points[hover] : null;

  return (
    <Card className="col-span-full">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="font-serif text-lg font-semibold text-espresso">Sales — last 30 days</h2>
        <div className="flex bg-cream rounded-full p-1" role="tablist" aria-label="Chart metric">
          {(['revenue', 'orders'] as const).map((m) => (
            <button
              key={m}
              role="tab"
              aria-selected={metric === m}
              onClick={() => setMetric(m)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize transition-all ${metric === m ? 'bg-espresso text-cream' : 'text-cocoa'}`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full min-w-[560px]"
          role="img"
          aria-label={`Line chart of daily ${metric} for the last 30 days`}
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
        >
          {gridLines.map((g) => (
            <g key={g.v}>
              <line x1={PAD.left} x2={W - PAD.right} y1={g.y} y2={g.y} stroke="#2C1A0E" strokeOpacity="0.07" />
              <text x={PAD.left - 8} y={g.y + 4} textAnchor="end" fontSize="10" fill="#8B5E3C">{fmt(g.v)}</text>
            </g>
          ))}
          <line x1={PAD.left} x2={W - PAD.right} y1={PAD.top + innerH} y2={PAD.top + innerH} stroke="#2C1A0E" strokeOpacity="0.15" />
          {points.map((p, i) => (i % 5 === 0 || i === points.length - 1) && (
            <text key={p.day} x={x(i)} y={H - 8} textAnchor="middle" fontSize="10" fill="#8B5E3C">{p.label}</text>
          ))}

          <path d={areaPath} fill={MARK} fillOpacity="0.12" />
          <path d={linePath} fill="none" stroke={MARK} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

          {/* last-point direct label */}
          <circle cx={x(points.length - 1)} cy={y(points[points.length - 1][metric])} r="4" fill={MARK} stroke="#fff" strokeWidth="2" />

          {/* hover crosshair + tooltip */}
          {h && hover !== null && (
            <g pointerEvents="none">
              <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={PAD.top + innerH} stroke="#2C1A0E" strokeOpacity="0.25" strokeDasharray="3 3" />
              <circle cx={x(hover)} cy={y(h[metric])} r="4.5" fill={MARK} stroke="#fff" strokeWidth="2" />
              {(() => {
                const tw = 118, th = 44;
                const tx = Math.min(Math.max(x(hover) - tw / 2, PAD.left), W - PAD.right - tw);
                const ty = Math.max(y(h[metric]) - th - 12, 2);
                return (
                  <g>
                    <rect x={tx} y={ty} width={tw} height={th} rx="8" fill="#2C1A0E" />
                    <text x={tx + 10} y={ty + 17} fontSize="10" fill="#E8C87A">{fmtDate(h.day)}</text>
                    <text x={tx + 10} y={ty + 33} fontSize="12" fontWeight="bold" fill="#FAF6EF">
                      {metric === 'revenue' ? inr(h.revenue) : `${h.orders} order${h.orders === 1 ? '' : 's'}`}
                    </text>
                  </g>
                );
              })()}
            </g>
          )}
        </svg>
      </div>
    </Card>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi.stats().then(setStats).catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!stats) return <div className="grid grid-cols-3 gap-4">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-28 rounded-3xl" />)}</div>;

  const tiles = [
    { icon: IndianRupee, label: 'Total revenue', value: inr(stats.totals.revenue) },
    { icon: ShoppingCart, label: 'Orders', value: String(stats.totals.orders) },
    { icon: Users, label: 'Customers', value: String(stats.totals.customers) },
    { icon: Package, label: 'Products live', value: String(stats.totals.products) },
    { icon: Clock, label: 'Awaiting dispatch', value: String(stats.totals.pending) },
    { icon: AlertTriangle, label: 'Low stock (≤10)', value: String(stats.totals.lowStock) },
  ];

  return (
    <>
      <PageTitle title="Dashboard" subtitle="Store performance at a glance" />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {tiles.map((t) => (
          <Card key={t.label} className="flex items-center gap-4">
            <span className="p-3 rounded-2xl bg-goldlight/25"><t.icon className="w-5 h-5 text-gold" aria-hidden="true" /></span>
            <span>
              <span className="block text-2xl font-bold text-espresso leading-tight">{t.value}</span>
              <span className="block text-xs text-cocoa-light mt-0.5">{t.label}</span>
            </span>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 mb-6">
        <SalesChart daily={stats.daily} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="font-serif text-lg font-semibold text-espresso mb-4">Top products by units sold</h2>
          {stats.topProducts.length === 0 ? (
            <p className="text-sm text-cocoa-light">No sales yet.</p>
          ) : (
            <ul className="space-y-3">
              {stats.topProducts.map((p) => {
                const maxUnits = stats.topProducts[0].units;
                return (
                  <li key={p.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-espresso font-medium">{p.name}</span>
                      <span className="text-cocoa font-bold">{p.units}</span>
                    </div>
                    <div className="h-2 bg-cream rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(p.units / maxUnits) * 100}%`, backgroundColor: MARK }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-serif text-lg font-semibold text-espresso">Recent orders</h2>
            <Link to="/admin/orders" className="text-xs font-bold text-gold uppercase tracking-widest">All orders →</Link>
          </div>
          <ul className="divide-y divide-espresso/5">
            {stats.recentOrders.map((o) => (
              <li key={o.order_number} className="py-3 flex justify-between items-center gap-3 text-sm">
                <span>
                  <span className="block font-mono font-bold text-espresso text-xs">{o.order_number}</span>
                  <span className="block text-cocoa-light text-xs mt-0.5">{o.customer_name} · {fmtDate(o.created_at)}</span>
                </span>
                <span className="text-right">
                  <span className="block font-bold text-espresso">{inr(o.total)}</span>
                  <span className="block text-[10px] uppercase tracking-widest text-gold">{o.status}</span>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}

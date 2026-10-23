import { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Leaf, Truck } from 'lucide-react';

/* ---------- near-realistic SVG ingredients (radial light, texture, sheen) ---------- */

function DateFruit({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 140" className={className} aria-hidden="true">
      <defs>
        <radialGradient id="dateR" cx="0.36" cy="0.28" r="0.95">
          <stop offset="0" stopColor="#96602C" />
          <stop offset="0.35" stopColor="#6B3A16" />
          <stop offset="0.75" stopColor="#41200B" />
          <stop offset="1" stopColor="#241002" />
        </radialGradient>
      </defs>
      {/* body */}
      <path d="M50 10 C73 10 86 40 84 76 C82 110 68 132 50 132 C32 132 18 110 16 76 C14 40 27 10 50 10 Z" fill="url(#dateR)" />
      {/* skin wrinkles */}
      <path d="M36 26 C30 55 30 90 37 118 M50 20 C46 55 46 95 50 126 M64 26 C70 55 70 90 63 118" stroke="#1D0C02" strokeWidth="1.6" fill="none" opacity="0.35" strokeLinecap="round" />
      <path d="M28 44 C34 48 44 50 56 48 M26 76 C36 81 50 82 62 79 M30 104 C38 108 50 109 60 106" stroke="#120700" strokeWidth="1.2" fill="none" opacity="0.25" strokeLinecap="round" />
      {/* glossy sheen */}
      <ellipse cx="36" cy="44" rx="8" ry="22" fill="#FFE9C4" opacity="0.28" transform="rotate(-9 36 44)" />
      <ellipse cx="34" cy="40" rx="3.5" ry="10" fill="#FFF6E3" opacity="0.45" transform="rotate(-9 34 40)" />
      {/* right-side depth */}
      <path d="M62 14 C78 30 86 55 84 80 C82 108 70 128 54 132 C64 118 72 92 72 68 C72 46 68 26 62 14 Z" fill="#000" opacity="0.18" />
      {/* stem cap */}
      <ellipse cx="50" cy="11" rx="8.5" ry="4.5" fill="#A9793F" />
      <ellipse cx="50" cy="10" rx="5" ry="2.6" fill="#C79B5F" />
    </svg>
  );
}

function Almond({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 130" className={className} aria-hidden="true">
      <defs>
        <radialGradient id="almondR" cx="0.38" cy="0.3" r="1">
          <stop offset="0" stopColor="#E7B577" />
          <stop offset="0.45" stopColor="#C08A46" />
          <stop offset="0.85" stopColor="#8F5D26" />
          <stop offset="1" stopColor="#6F4419" />
        </radialGradient>
      </defs>
      <path d="M50 6 C77 32 88 70 79 100 C71 123 29 123 21 100 C12 70 23 32 50 6 Z" fill="url(#almondR)" />
      {/* pitted skin texture */}
      <g stroke="#6E441A" strokeWidth="1.4" opacity="0.55" strokeLinecap="round" fill="none">
        <path d="M44 28 C38 50 36 76 40 98" />
        <path d="M55 22 C51 50 50 82 53 106" />
        <path d="M64 40 C63 62 62 84 60 100" />
        <path d="M33 48 C31 66 31 84 34 98" />
      </g>
      <g fill="#5E3812" opacity="0.4">
        <ellipse cx="46" cy="40" rx="1.4" ry="2.6" /><ellipse cx="58" cy="56" rx="1.2" ry="2.2" />
        <ellipse cx="38" cy="70" rx="1.3" ry="2.4" /><ellipse cx="52" cy="86" rx="1.4" ry="2.4" />
        <ellipse cx="62" cy="76" rx="1.1" ry="2" /><ellipse cx="44" cy="58" rx="1.1" ry="2" />
      </g>
      {/* sheen + shadow edge */}
      <ellipse cx="38" cy="40" rx="6" ry="15" fill="#FFEFD2" opacity="0.4" transform="rotate(-15 38 40)" />
      <path d="M50 6 C64 22 74 44 76 68 C78 88 72 106 60 115 C74 104 80 84 77 64 C74 42 64 22 50 6 Z" fill="#000" opacity="0.15" />
    </svg>
  );
}

function Cashew({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      <defs>
        <radialGradient id="cashewR" cx="0.4" cy="0.3" r="1">
          <stop offset="0" stopColor="#F7EAC4" />
          <stop offset="0.55" stopColor="#E4C68C" />
          <stop offset="1" stopColor="#BC9558" />
        </radialGradient>
      </defs>
      <path d="M34 18 C74 2 106 28 102 64 C99 90 80 104 66 99 C56 96 58 84 68 75 C80 64 78 46 60 39 C46 34 34 36 27 31 C20 26 24 22 34 18 Z" fill="url(#cashewR)" />
      {/* inner-curve shading */}
      <path d="M68 75 C80 64 78 46 60 39 C70 40 82 48 84 60 C86 72 78 82 70 86 C66 82 64 79 68 75 Z" fill="#9A7238" opacity="0.35" />
      {/* top sheen */}
      <path d="M36 20 C64 10 90 24 98 46 C88 32 66 22 44 26 C38 27 33 25 32 23 C32 21 34 20 36 20 Z" fill="#FFF9E6" opacity="0.55" />
      {/* skin flecks */}
      <g fill="#A87F42" opacity="0.4">
        <circle cx="52" cy="34" r="1.1" /><circle cx="72" cy="46" r="1" /><circle cx="84" cy="62" r="1.1" /><circle cx="44" cy="28" r="0.9" />
      </g>
    </svg>
  );
}

function Walnut({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      <defs>
        <radialGradient id="walnutR" cx="0.38" cy="0.3" r="1">
          <stop offset="0" stopColor="#D2A468" />
          <stop offset="0.5" stopColor="#AC7B3F" />
          <stop offset="1" stopColor="#7B5122" />
        </radialGradient>
      </defs>
      <circle cx="60" cy="60" r="50" fill="url(#walnutR)" />
      {/* central seam */}
      <path d="M60 12 C54 30 54 90 60 108 M60 12 C66 30 66 90 60 108" stroke="#5E3B14" strokeWidth="2.4" fill="none" opacity="0.6" strokeLinecap="round" />
      {/* brain-like lobes */}
      <g stroke="#6B4520" strokeWidth="2.2" fill="none" opacity="0.55" strokeLinecap="round">
        <path d="M42 22 C30 34 26 50 30 64 C33 74 42 80 46 76 C50 72 44 66 40 58 C36 48 38 34 42 22" />
        <path d="M78 22 C90 34 94 50 90 64 C87 74 78 80 74 76 C70 72 76 66 80 58 C84 48 82 34 78 22" />
        <path d="M46 88 C52 94 68 94 74 88" />
        <path d="M36 80 C33 86 34 92 38 98 M84 80 C87 86 86 92 82 98" />
      </g>
      {/* sheen */}
      <ellipse cx="42" cy="36" rx="10" ry="14" fill="#FFEECB" opacity="0.3" transform="rotate(-20 42 36)" />
      <path d="M60 10 A50 50 0 0 1 110 60 A50 50 0 0 1 96 95 C104 78 102 52 88 36 C80 26 70 18 60 15 Z" fill="#000" opacity="0.16" />
    </svg>
  );
}

function Pistachio({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 110 120" className={className} aria-hidden="true">
      <defs>
        <radialGradient id="pistaShell" cx="0.4" cy="0.3" r="1">
          <stop offset="0" stopColor="#EBD6A8" />
          <stop offset="0.6" stopColor="#CBAC70" />
          <stop offset="1" stopColor="#A28147" />
        </radialGradient>
        <radialGradient id="pistaKernel" cx="0.4" cy="0.35" r="1">
          <stop offset="0" stopColor="#AABE62" />
          <stop offset="0.7" stopColor="#7D9440" />
          <stop offset="1" stopColor="#586F28" />
        </radialGradient>
      </defs>
      {/* kernel peeking through */}
      <ellipse cx="55" cy="62" rx="24" ry="34" fill="url(#pistaKernel)" />
      <path d="M55 30 C60 45 60 80 55 94" stroke="#465A1E" strokeWidth="1.8" opacity="0.5" fill="none" />
      {/* lower shell */}
      <path d="M55 118 C30 118 14 98 16 72 C17 56 26 42 38 36 C34 56 36 80 48 94 C54 101 64 104 72 100 C82 95 88 84 88 70 C94 82 94 98 84 108 C77 115 66 118 55 118 Z" fill="url(#pistaShell)" />
      {/* upper shell */}
      <path d="M42 34 C48 18 70 12 84 22 C96 31 100 48 92 62 C88 70 80 74 74 72 C68 70 68 62 72 54 C76 44 72 34 60 32 C53 31 46 33 42 34 Z" fill="url(#pistaShell)" />
      <path d="M42 34 C48 18 70 12 84 22 C90 26 94 33 95 40 C88 30 72 24 58 28 C50 30 44 32 42 34 Z" fill="#FFF6DC" opacity="0.5" />
      {/* shell rims */}
      <path d="M38 36 C34 56 36 80 48 94" stroke="#8A6A34" strokeWidth="1.6" opacity="0.6" fill="none" />
    </svg>
  );
}

function PumpkinSeed({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 90 130" className={className} aria-hidden="true">
      <defs>
        <radialGradient id="pumpkinR" cx="0.4" cy="0.32" r="1">
          <stop offset="0" stopColor="#F2ECCB" />
          <stop offset="0.6" stopColor="#DCD3A2" />
          <stop offset="1" stopColor="#B5AA72" />
        </radialGradient>
      </defs>
      <path d="M45 6 C68 28 78 62 72 92 C68 114 56 124 45 124 C34 124 22 114 18 92 C12 62 22 28 45 6 Z" fill="url(#pumpkinR)" />
      {/* raised rim */}
      <path d="M45 14 C64 34 72 62 67 90 C64 108 55 117 45 117 C35 117 26 108 23 90 C18 62 26 34 45 14 Z" fill="none" stroke="#A79C66" strokeWidth="2" opacity="0.7" />
      {/* center highlight */}
      <ellipse cx="38" cy="46" rx="7" ry="20" fill="#FFFDF0" opacity="0.5" transform="rotate(-8 38 46)" />
      <path d="M45 6 C58 20 68 42 70 66 C72 88 66 108 54 118 C64 106 68 84 65 62 C61 40 54 20 45 6 Z" fill="#000" opacity="0.08" />
    </svg>
  );
}

function LeafSprig({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <defs>
        <radialGradient id="leafR" cx="0.35" cy="0.3" r="1">
          <stop offset="0" stopColor="#8FB56A" />
          <stop offset="0.6" stopColor="#5F8438" />
          <stop offset="1" stopColor="#3D5B20" />
        </radialGradient>
      </defs>
      <path d="M50 92 C18 66 20 28 50 8 C80 28 82 66 50 92 Z" fill="url(#leafR)" />
      {/* half-leaf light */}
      <path d="M50 8 C80 28 82 66 50 92 C52 64 52 34 50 8 Z" fill="#000" opacity="0.14" />
      {/* veins */}
      <g stroke="#2E4716" strokeWidth="2" fill="none" opacity="0.6" strokeLinecap="round">
        <path d="M50 12 L50 88" />
        <path d="M50 28 C41 32 34 39 30 47 M50 28 C59 32 66 39 70 47" />
        <path d="M50 46 C42 50 37 55 33 62 M50 46 C58 50 63 55 67 62" />
        <path d="M50 63 C44 66 40 70 38 75 M50 63 C56 66 60 70 62 75" />
      </g>
      <ellipse cx="40" cy="30" rx="5" ry="12" fill="#E4F2CE" opacity="0.35" transform="rotate(-24 40 30)" />
    </svg>
  );
}

/* ---------- floating scene config ---------- */

interface FloatItem {
  Shape: (props: { className?: string }) => React.JSX.Element;
  left: string; top: string; size: number;
  depth: number; // 0 far … 1 near — drives parallax, blur and opacity
  duration: number; delay: number; rotate: number;
}

const floats: FloatItem[] = [
  { Shape: DateFruit, left: '6%', top: '16%', size: 52, depth: 0.3, duration: 9, delay: 0.2, rotate: -14 },
  { Shape: Walnut, left: '16%', top: '68%', size: 48, depth: 0.25, duration: 11, delay: 1.1, rotate: 22 },
  { Shape: Cashew, left: '30%', top: '10%', size: 40, depth: 0.2, duration: 10, delay: 0.6, rotate: -30 },
  { Shape: LeafSprig, left: '42%', top: '80%', size: 38, depth: 0.35, duration: 12, delay: 1.8, rotate: 40 },
  { Shape: Pistachio, left: '55%', top: '14%', size: 54, depth: 0.5, duration: 8.5, delay: 0.4, rotate: 16 },
  { Shape: DateFruit, left: '63%', top: '72%', size: 66, depth: 0.6, duration: 9.5, delay: 1.4, rotate: 10 },
  { Shape: Cashew, left: '76%', top: '20%', size: 62, depth: 0.7, duration: 8, delay: 0.9, rotate: 28 },
  { Shape: PumpkinSeed, left: '86%', top: '58%', size: 42, depth: 0.45, duration: 10.5, delay: 2.2, rotate: -24 },
  { Shape: Almond, left: '90%', top: '30%', size: 40, depth: 0.3, duration: 11.5, delay: 1.6, rotate: -12 },
  { Shape: Walnut, left: '38%', top: '42%', size: 34, depth: 0.15, duration: 13, delay: 0.8, rotate: 30 },
  { Shape: PumpkinSeed, left: '10%', top: '42%', size: 30, depth: 0.2, duration: 12.5, delay: 2.6, rotate: 34 },
  { Shape: Almond, left: '48%', top: '58%', size: 30, depth: 0.18, duration: 12, delay: 3, rotate: -20 },
];

const sparkles = Array.from({ length: 16 }).map((_, i) => ({
  left: `${(i * 61) % 97 + 2}%`,
  top: `${(i * 37) % 88 + 5}%`,
  size: 2 + (i % 3) * 1.5,
  duration: 3 + (i % 5),
  delay: (i % 7) * 0.6,
}));

const trustBadges = [
  { Icon: Leaf, label: '100% Natural' },
  { Icon: Truck, label: 'Pan-India Delivery' },
  { Icon: Star, label: '4.8★ from 1,200+ orders' },
];

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();

  // Mouse parallax — springy, depth-scaled
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const smx = useSpring(mx, { stiffness: 50, damping: 20 });
  const smy = useSpring(my, { stiffness: 50, damping: 20 });
  const clusterX = useTransform(smx, (v) => v * 24);
  const clusterY = useTransform(smy, (v) => v * 18);

  const onMouseMove = (e: React.MouseEvent) => {
    if (reduceMotion || !sectionRef.current) return;
    const rect = sectionRef.current.getBoundingClientRect();
    mx.set(((e.clientX - rect.left) / rect.width - 0.5) * 2);
    my.set(((e.clientY - rect.top) / rect.height - 0.5) * 2);
  };

  return (
    <section
      ref={sectionRef}
      onMouseMove={onMouseMove}
      className="relative min-h-screen w-full overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #241206 0%, #3A1F0C 45%, #4E2B12 75%, #3A1F0C 100%)' }}
    >
      {/* warm glow washes */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <motion.div
          className="absolute -top-1/4 right-[-10%] w-[70vw] h-[70vw] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(200,155,60,0.28) 0%, rgba(200,155,60,0) 60%)' }}
          animate={reduceMotion ? undefined : { scale: [1, 1.12, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-[-20%] left-[-15%] w-[55vw] h-[55vw] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(232,200,122,0.14) 0%, rgba(232,200,122,0) 60%)' }}
          animate={reduceMotion ? undefined : { scale: [1.1, 1, 1.1] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* gold dust */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {sparkles.map((s, i) => (
          <motion.span
            key={i}
            className="absolute rounded-full bg-goldlight"
            style={{ left: s.left, top: s.top, width: s.size, height: s.size }}
            animate={reduceMotion ? { opacity: 0.4 } : { opacity: [0.1, 0.7, 0.1], scale: [1, 1.6, 1] }}
            transition={{ duration: s.duration, delay: s.delay, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </div>

      {/* floating dates, nuts & seeds */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {floats.map((f, i) => {
          const Shape = f.Shape;
          return (
            <motion.div
              key={i}
              className="absolute"
              style={{
                left: f.left,
                top: f.top,
                width: f.size,
                opacity: 0.25 + f.depth * 0.65,
                filter: f.depth < 0.35 ? 'blur(2px)' : f.depth < 0.55 ? 'blur(0.5px)' : 'none',
                rotate: f.rotate,
              }}
              animate={reduceMotion ? undefined : {
                y: [0, -14 - f.depth * 14, 0],
                rotate: [f.rotate - 5, f.rotate + 5, f.rotate - 5],
              }}
              transition={{ duration: f.duration, delay: f.delay, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Shape className="w-full h-auto drop-shadow-[0_10px_16px_rgba(0,0,0,0.35)]" />
            </motion.div>
          );
        })}
      </div>

      {/* hero product cluster — right side, parallaxes with the mouse */}
      <motion.div
        className="absolute right-[4%] lg:right-[10%] top-1/2 -translate-y-1/2 hidden md:block pointer-events-none"
        style={{ x: clusterX, y: clusterY }}
        aria-hidden="true"
      >
        <div className="relative w-[320px] lg:w-[400px] h-[380px] lg:h-[460px]">
          <div className="absolute inset-0 rounded-full" style={{ background: 'radial-gradient(circle, rgba(232,200,122,0.22) 0%, rgba(232,200,122,0) 65%)' }} />
          <motion.div
            className="absolute left-[8%] top-[6%] w-[44%]"
            animate={reduceMotion ? undefined : { y: [0, -16, 0], rotate: [-8, -4, -8] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          >
            <DateFruit className="w-full h-auto drop-shadow-[0_24px_32px_rgba(0,0,0,0.45)]" />
          </motion.div>
          <motion.div
            className="absolute right-[2%] top-[18%] w-[42%]"
            animate={reduceMotion ? undefined : { y: [0, -12, 0], rotate: [14, 20, 14] }}
            transition={{ duration: 8.5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
          >
            <Pistachio className="w-full h-auto drop-shadow-[0_24px_32px_rgba(0,0,0,0.45)]" />
          </motion.div>
          <motion.div
            className="absolute left-[16%] bottom-[6%] w-[42%]"
            animate={reduceMotion ? undefined : { y: [0, -10, 0], rotate: [-14, -8, -14] }}
            transition={{ duration: 9.5, repeat: Infinity, ease: 'easeInOut', delay: 1.6 }}
          >
            <Walnut className="w-full h-auto drop-shadow-[0_24px_32px_rgba(0,0,0,0.45)]" />
          </motion.div>
          <motion.div
            className="absolute right-[16%] bottom-[8%] w-[30%]"
            animate={reduceMotion ? undefined : { y: [0, -12, 0], rotate: [18, 24, 18] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 2.1 }}
          >
            <Almond className="w-full h-auto drop-shadow-[0_24px_32px_rgba(0,0,0,0.45)]" />
          </motion.div>
          <motion.div
            className="absolute right-[34%] top-[42%] w-[18%]"
            animate={reduceMotion ? undefined : { y: [0, -8, 0], rotate: [32, 40, 32] }}
            transition={{ duration: 6.5, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
          >
            <LeafSprig className="w-full h-auto drop-shadow-[0_16px_24px_rgba(0,0,0,0.4)]" />
          </motion.div>
        </div>
      </motion.div>

      {/* bottom fade into the page */}
      <div className="absolute bottom-0 w-full h-40 bg-gradient-to-t from-cream to-transparent pointer-events-none" aria-hidden="true" />

      {/* copy — pt keeps the badge clear of the fixed 70px navbar on short screens */}
      <div className="relative flex flex-col justify-center min-h-screen pt-28 pb-16 px-6 sm:px-12 lg:px-24 max-w-7xl mx-auto">
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 90, damping: 20, delay: 0.15 }}
          className="max-w-2xl"
        >
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="inline-flex items-center gap-2 text-goldlight text-xs font-bold tracking-[0.25em] uppercase mb-6 bg-black/30 backdrop-blur px-4 py-2 rounded-full"
          >
            <Star className="w-3.5 h-3.5 fill-goldlight" aria-hidden="true" /> Premium · Farm Fresh · Since Day One
          </motion.p>

          <h1 className="font-serif text-5xl md:text-7xl font-semibold tracking-tight text-[#FAF6EF] leading-[1.05]">
            Wholesome<br />Goodness In<br />Every Bite
          </h1>

          <p className="mt-7 text-lg md:text-xl text-[#FAF6EF]/85 leading-relaxed font-light max-w-lg">
            Hand-picked dates, crunchy nuts and sun-kissed dry fruits — no added sugar, no shortcuts. Just nature at its finest.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              to="/shop"
              className="group inline-flex items-center gap-2.5 bg-gold text-espresso px-9 py-4 rounded-full text-sm font-bold tracking-wider hover:bg-goldlight transition-all hover:scale-[1.03] shadow-2xl shadow-black/30"
            >
              SHOP THE COLLECTION
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
            </Link>
            <Link
              to="/product/almond-dates-400g"
              className="inline-flex items-center gap-2 text-[#FAF6EF] border border-[#FAF6EF]/40 backdrop-blur px-8 py-4 rounded-full text-sm font-semibold hover:bg-[#FAF6EF]/10 transition-colors"
            >
              Try our bestseller
            </Link>
          </div>

          {/* trust badges — gold pills so they stay readable over the bottom fade */}
          <div className="mt-12 flex flex-wrap gap-3">
            {trustBadges.map((b) => (
              <span
                key={b.label}
                className="inline-flex items-center gap-2 text-sm font-semibold text-goldlight bg-[#1D0E04]/80 backdrop-blur border border-gold/40 px-5 py-2.5 rounded-full shadow-lg shadow-black/20"
              >
                <b.Icon className="w-4 h-4 text-gold" aria-hidden="true" /> {b.label}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// Small client-side preferences: theme, recently-viewed, analytics bootstrap.

// ---------- dark mode ----------
export const getTheme = (): 'light' | 'dark' =>
  (localStorage.getItem('qdn_theme') as 'light' | 'dark') || 'light';

export function applyTheme(theme: 'light' | 'dark') {
  localStorage.setItem('qdn_theme', theme);
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

// ---------- recently viewed ----------
const RECENT_KEY = 'qdn_recent';

export function rememberViewed(slug: string) {
  try {
    const list: string[] = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    const next = [slug, ...list.filter((s) => s !== slug)].slice(0, 8);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch { /* ignore */ }
}

export function recentlyViewed(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
  } catch {
    return [];
  }
}

// ---------- analytics (GA4 + Meta Pixel), injected only when configured ----------
let analyticsLoaded = false;

export function loadAnalytics(ga4Id: string, metaPixelId: string) {
  if (analyticsLoaded || import.meta.env.DEV) return;
  analyticsLoaded = true;

  if (ga4Id) {
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga4Id)}`;
    document.head.appendChild(s);
    const inline = document.createElement('script');
    inline.textContent = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)};gtag('js',new Date());gtag('config','${ga4Id}');`;
    document.head.appendChild(inline);
  }

  if (metaPixelId) {
    const inline = document.createElement('script');
    inline.textContent = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${metaPixelId}');fbq('track','PageView');`;
    document.head.appendChild(inline);
  }
}

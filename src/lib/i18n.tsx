import { createContext, useContext, useState, type ReactNode } from 'react';

// Chrome-level translations (nav, cart, checkout, common actions).
// Product content stays in English — it lives in the database.
const dict = {
  en: {
    home: 'Home', shop: 'Shop', dates: 'Dates', nuts: 'Nuts', gifting: 'Gifting', blog: 'Blog', faq: 'FAQ',
    wishlist: 'Wishlist', account: 'My Account', trackOrder: 'Track Order', search: 'Search',
    cart: 'Your Cart', checkout: 'Checkout', addToCart: 'Add to Cart', buyNow: 'Buy Now',
    placeOrder: 'Place Order', total: 'Total', subtotal: 'Subtotal', shipping: 'Shipping', discount: 'Discount',
    emptyCart: 'Your cart is empty', browse: 'Browse products', quantity: 'Quantity',
    contact: 'Contact', deliveryAddress: 'Delivery Address', payment: 'Payment',
    freeShippingHint: 'more for FREE shipping', freeShippingUnlocked: "You've unlocked FREE shipping",
  },
  ta: {
    home: 'முகப்பு', shop: 'கடை', dates: 'பேரீச்சம்பழம்', nuts: 'நட்ஸ்', gifting: 'பரிசுகள்', blog: 'வலைப்பதிவு', faq: 'கேள்விகள்',
    wishlist: 'விருப்பப்பட்டியல்', account: 'என் கணக்கு', trackOrder: 'ஆர்டர் நிலை', search: 'தேடு',
    cart: 'உங்கள் கூடை', checkout: 'செக்அவுட்', addToCart: 'கூடையில் சேர்', buyNow: 'இப்போது வாங்கு',
    placeOrder: 'ஆர்டர் செய்', total: 'மொத்தம்', subtotal: 'கூட்டுத்தொகை', shipping: 'டெலிவரி', discount: 'தள்ளுபடி',
    emptyCart: 'உங்கள் கூடை காலியாக உள்ளது', browse: 'பொருட்களைப் பார்க்க', quantity: 'எண்ணிக்கை',
    contact: 'தொடர்பு', deliveryAddress: 'டெலிவரி முகவரி', payment: 'கட்டணம்',
    freeShippingHint: 'மேலும் சேர்த்தால் இலவச டெலிவரி', freeShippingUnlocked: 'இலவச டெலிவரி கிடைத்தது',
  },
  hi: {
    home: 'होम', shop: 'दुकान', dates: 'खजूर', nuts: 'नट्स', gifting: 'उपहार', blog: 'ब्लॉग', faq: 'सवाल-जवाब',
    wishlist: 'विशलिस्ट', account: 'मेरा खाता', trackOrder: 'ऑर्डर ट्रैक करें', search: 'खोजें',
    cart: 'आपकी टोकरी', checkout: 'चेकआउट', addToCart: 'टोकरी में डालें', buyNow: 'अभी खरीदें',
    placeOrder: 'ऑर्डर करें', total: 'कुल', subtotal: 'उप-योग', shipping: 'डिलीवरी', discount: 'छूट',
    emptyCart: 'आपकी टोकरी खाली है', browse: 'उत्पाद देखें', quantity: 'मात्रा',
    contact: 'संपर्क', deliveryAddress: 'डिलीवरी पता', payment: 'भुगतान',
    freeShippingHint: 'और जोड़ें, मुफ़्त डिलीवरी पाएं', freeShippingUnlocked: 'मुफ़्त डिलीवरी मिल गई',
  },
} as const;

export type Lang = keyof typeof dict;
type Key = keyof typeof dict.en;

export const LANGS: { code: Lang; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'hi', label: 'हिन्दी' },
];

interface I18nContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: Key) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem('qdn_lang');
    return saved && saved in dict ? (saved as Lang) : 'en';
  });
  const setLang = (l: Lang) => {
    localStorage.setItem('qdn_lang', l);
    setLangState(l);
  };
  const t = (key: Key) => dict[lang][key] || dict.en[key];
  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}

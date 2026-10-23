import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Product, Variant } from '../lib/api';

export interface CartItem {
  key: string; // `${id}:${variant}` — one line per product+variant combination
  id: number;
  slug: string;
  name: string;
  weight: string;
  variant: string;
  price: number;
  mrp: number;
  image: string;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number, variant?: Variant | null) => void;
  removeFromCart: (key: string) => void;
  updateQuantity: (key: string, quantity: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  subtotal: number;
  totalItems: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);
const STORAGE_KEY = 'qdn_cart_v2';

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addToCart = (product: Product, quantity = 1, variant: Variant | null = null) => {
    const key = `${product.id}:${variant?.label || ''}`;
    setItems((prev) => {
      const existing = prev.find((i) => i.key === key);
      if (existing) {
        return prev.map((i) => (i.key === key ? { ...i, quantity: i.quantity + quantity } : i));
      }
      return [...prev, {
        key,
        id: product.id,
        slug: product.slug,
        name: product.name,
        weight: variant?.label || product.weight,
        variant: variant?.label || '',
        price: variant?.price ?? product.price,
        mrp: variant?.mrp ?? product.mrp,
        image: product.image,
        quantity,
      }];
    });
  };

  const removeFromCart = (key: string) => setItems((prev) => prev.filter((i) => i.key !== key));
  const updateQuantity = (key: string, quantity: number) =>
    setItems((prev) => quantity < 1
      ? prev.filter((i) => i.key !== key)
      : prev.map((i) => (i.key === key ? { ...i, quantity } : i)));
  const clearCart = () => setItems([]);

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const totalItems = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, isCartOpen, setIsCartOpen, subtotal, totalItems }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};

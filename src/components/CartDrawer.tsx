import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, Trash2, ShoppingBag, Truck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { inr, FREE_SHIPPING_ABOVE } from '../lib/api';

export default function CartDrawer() {
  const { items, isCartOpen, setIsCartOpen, updateQuantity, removeFromCart, subtotal } = useCart();
  const navigate = useNavigate();
  const remaining = Math.max(0, FREE_SHIPPING_ABOVE - subtotal);
  const progress = Math.min(100, (subtotal / FREE_SHIPPING_ABOVE) * 100);

  const checkout = () => {
    setIsCartOpen(false);
    navigate('/checkout');
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-espresso/40 backdrop-blur-sm z-[90]"
            aria-hidden="true"
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full sm:w-[440px] bg-cream z-[95] shadow-2xl flex flex-col"
            aria-label="Shopping cart"
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-espresso/10">
              <h2 className="font-serif text-xl font-bold text-espresso">Your Cart</h2>
              <button onClick={() => setIsCartOpen(false)} aria-label="Close cart" className="p-2 rounded-full hover:bg-cream-dark transition-colors">
                <X className="w-5 h-5 text-cocoa" aria-hidden="true" />
              </button>
            </div>

            {/* free shipping progress */}
            <div className="px-6 py-4 bg-cream-dark/60">
              <p className="text-xs font-medium text-cocoa flex items-center gap-1.5 mb-2">
                <Truck className="w-4 h-4 text-gold" aria-hidden="true" />
                {remaining > 0
                  ? <>Add <strong>{inr(remaining)}</strong> more for FREE shipping</>
                  : <>You've unlocked <strong>FREE shipping</strong> 🎉</>}
              </p>
              <div className="h-1.5 bg-espresso/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-gold to-goldlight rounded-full"
                  initial={false}
                  animate={{ width: `${progress}%` }}
                  transition={{ type: 'spring', stiffness: 80, damping: 20 }}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center gap-4">
                  <ShoppingBag className="w-12 h-12 text-cocoa-light/40" aria-hidden="true" />
                  <p className="text-cocoa-light">Your cart is empty</p>
                  <button
                    onClick={() => { setIsCartOpen(false); navigate('/shop'); }}
                    className="bg-espresso text-cream px-6 py-3 rounded-full text-sm font-bold hover:bg-cocoa transition-colors"
                  >
                    Browse products
                  </button>
                </div>
              ) : (
                <ul className="space-y-5">
                  <AnimatePresence initial={false}>
                    {items.map((item) => (
                      <motion.li
                        key={item.key}
                        layout
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 40 }}
                        className="flex gap-4"
                      >
                        <div className="w-20 h-24 rounded-2xl overflow-hidden bg-cream-dark flex-shrink-0">
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between gap-2">
                            <h3 className="font-semibold text-espresso text-sm leading-snug">{item.name} <span className="text-cocoa-light font-normal">· {item.weight}</span></h3>
                            <button onClick={() => removeFromCart(item.key)} aria-label={`Remove ${item.name}`} className="text-cocoa-light hover:text-red-500 transition-colors self-start">
                              <Trash2 className="w-4 h-4" aria-hidden="true" />
                            </button>
                          </div>
                          <p className="text-sm font-bold text-espresso mt-1">{inr(item.price)}</p>
                          <div className="flex items-center gap-3 mt-2 bg-white rounded-full w-fit border border-espresso/10 px-1 py-0.5">
                            <button onClick={() => updateQuantity(item.key, item.quantity - 1)} aria-label="Decrease quantity" className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-cream-dark transition-colors">
                              <Minus className="w-3.5 h-3.5" aria-hidden="true" />
                            </button>
                            <span className="text-sm font-semibold w-5 text-center">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.key, item.quantity + 1)} aria-label="Increase quantity" className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-cream-dark transition-colors">
                              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </div>

            {items.length > 0 && (
              <div className="px-6 py-5 border-t border-espresso/10 bg-white/60 backdrop-blur">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-cocoa">Subtotal</span>
                  <span className="font-bold text-espresso">{inr(subtotal)}</span>
                </div>
                <p className="text-xs text-cocoa-light mb-4">Shipping &amp; coupons calculated at checkout</p>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={checkout}
                  className="w-full bg-espresso text-cream py-4 rounded-full text-sm font-bold tracking-widest uppercase hover:bg-cocoa transition-colors shadow-xl shadow-espresso/20"
                >
                  Checkout · {inr(subtotal)}
                </motion.button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

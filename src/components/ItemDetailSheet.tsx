import { useState, useEffect } from 'react';
import type { MenuItem } from '../schemas/restaurant.schema';
import { X, Leaf, Info } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface Props {
  currencySymbol: string;
}

export default function ItemDetailSheet({ currencySymbol }: Props) {
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  useEffect(() => {
    // Listen for custom events triggered by Astro components
    const handleOpen = (e: CustomEvent<MenuItem>) => {
      setSelectedItem(e.detail);
      document.body.style.overflow = 'hidden';
    };

    window.addEventListener('open-item-detail' as any, handleOpen);

    return () => {
      window.removeEventListener('open-item-detail' as any, handleOpen);
      document.body.style.overflow = '';
    };
  }, []);

  const close = () => {
    setSelectedItem(null);
    document.body.style.overflow = '';
  };

  // Resolve image URL — local paths are already resolved at build time
  const resolveImage = (path?: string) => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return path; // Already resolved by the build-time asset resolver
  };

  return (
    <AnimatePresence>
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
            onClick={close}
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full max-w-2xl bg-[var(--color-secondary)] rounded-t-3xl sm:rounded-3xl overflow-hidden pointer-events-auto flex flex-col max-h-[90vh] shadow-2xl"
          >
            <button
              onClick={close}
              className="absolute top-4 right-4 z-10 bg-black/40 text-white rounded-full p-2 backdrop-blur-md hover:bg-black/60 transition"
              aria-label="Close"
            >
              <X size={20} />
            </button>

            <div className="overflow-y-auto">
              {selectedItem.image && (
                <div className="w-full h-64 sm:h-80 bg-black/5">
                  <img
                    src={resolveImage(selectedItem.image)}
                    alt={selectedItem.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="p-6 sm:p-8">
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-2xl sm:text-3xl font-heading font-bold text-[var(--color-primary)] pr-4">
                    {selectedItem.name}
                  </h2>
                  <span className="text-xl font-body font-medium text-[var(--color-primary)] shrink-0">
                    {currencySymbol}
                    {selectedItem.price.toFixed(2)}
                  </span>
                </div>

                {selectedItem.description && (
                  <p className="font-body text-[var(--color-primary)]/80 text-lg leading-relaxed mb-6">
                    {selectedItem.description}
                  </p>
                )}

                {selectedItem.pairsWith && (
                  <div className="bg-[var(--color-primary)]/5 p-4 rounded-xl mb-6 flex gap-3 items-start border border-[var(--color-primary)]/10">
                    <Info
                      size={20}
                      className="text-[var(--color-accent)] shrink-0 mt-0.5"
                    />
                    <div>
                      <p className="font-heading font-semibold text-[var(--color-primary)] text-sm mb-1 uppercase tracking-wide">
                        Pairs well with
                      </p>
                      <p className="font-body text-[var(--color-primary)]/90">
                        {selectedItem.pairsWith}
                      </p>
                    </div>
                  </div>
                )}

                {selectedItem.gallery && selectedItem.gallery.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-heading font-semibold mb-3">Gallery</h3>
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                      {selectedItem.gallery.map((img, i) => (
                        <img
                          key={i}
                          src={resolveImage(img)}
                          alt=""
                          className="h-24 w-24 object-cover rounded-lg shrink-0"
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-[var(--color-primary)]/10">
                  {selectedItem.tags.includes('vegetarian') && (
                    <span className="flex items-center gap-1.5 text-sm font-medium text-green-700 bg-green-50 px-3 py-1.5 rounded-full">
                      <Leaf size={16} /> Vegetarian
                    </span>
                  )}
                  {selectedItem.tags.includes('vegan') && (
                    <span className="flex items-center gap-1.5 text-sm font-medium text-green-700 bg-green-50 px-3 py-1.5 rounded-full">
                      <Leaf size={16} /> Vegan
                    </span>
                  )}
                  {selectedItem.tags.includes('gluten-free') && (
                    <span className="flex items-center gap-1.5 text-sm font-medium text-amber-700 bg-amber-50 px-3 py-1.5 rounded-full">
                      Gluten-Free
                    </span>
                  )}
                  {selectedItem.spicyLevel > 0 && (
                    <span className="flex items-center gap-1.5 text-sm font-medium text-red-700 bg-red-50 px-3 py-1.5 rounded-full tracking-widest">
                      {'🌶️'.repeat(selectedItem.spicyLevel)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
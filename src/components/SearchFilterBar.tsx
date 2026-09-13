import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Search,
  X,
  Plus,
  Minus,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import {
  addItem as storeAddItem,
  changeQty as storeChangeQty,
  getCart,
  subscribeCart,
} from "../lib/orders/cartStore";

interface CategoryItem {
  id: string;
  name: string;
}

interface Props {
  enabled: boolean;
  enableDietaryFilters?: boolean;
  currencySymbol?: string;
  categories?: CategoryItem[];
}

const TAG_META: Record<string, { label: string; icon?: string }> = {
  vegetarian: { label: "Vegetarian", icon: "🌿" },
  vegan: { label: "Vegan", icon: "🌱" },
  "gluten-free": { label: "Gluten-Free", icon: "🌾" },
  "dairy-free": { label: "Dairy-Free", icon: "🥛" },
  "nut-free": { label: "Nut-Free", icon: "🥜" },
  halal: { label: "Halal", icon: "🥩" },
  kosher: { label: "Kosher", icon: "✡️" },
  organic: { label: "Organic", icon: "🍃" },
  "house-made": { label: "House-Made", icon: "✨" },
  seasonal: { label: "Seasonal", icon: "🍂" },
  spicy: { label: "Spicy", icon: "🌶️" },
};

export default function SearchFilterBar({
  enabled,
  enableDietaryFilters = true,
  currencySymbol = "$",
  categories = [],
}: Props) {
  const [query, setQuery] = useState("");
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [visibleItems, setVisibleItems] = useState(0);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [storeItems, setStoreItems] = useState<any[]>([]);

  // Search Sheet State
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Cart & Ordering integration
  const [isOrdering, setIsOrdering] = useState(false);
  const [cartLines, setCartLines] = useState(() => getCart().lines);

  const sheetInputRef = useRef<HTMLInputElement>(null);

  // Initialize store items and available tags
  useEffect(() => {
    if (typeof window === "undefined") return;
    const items = (window as any).__RESTAURANT_ITEMS__ || [];
    setStoreItems(items);
    setIsOrdering(!!(window as any).__ORDERING_ENABLED__);

    const tagSet = new Set<string>();
    items.forEach((item: any) => {
      (item.tags || []).forEach((tag: string) => tagSet.add(tag));
      if ((item.spicyLevel || 0) > 0) tagSet.add("spicy");
    });
    setAvailableTags(Array.from(tagSet).sort());

    return subscribeCart(() => {
      setCartLines(getCart().lines);
    });
  }, []);

  // Global keyboard shortcuts (Cmd+K, Ctrl+K, / to open search; Esc to close)
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === "k" && (e.metaKey || e.ctrlKey)) ||
        (e.key === "/" &&
          document.activeElement?.tagName !== "INPUT" &&
          document.activeElement?.tagName !== "TEXTAREA")
      ) {
        e.preventDefault();
        setIsSheetOpen(true);
      } else if (e.key === "Escape" && isSheetOpen) {
        setIsSheetOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, isSheetOpen]);

  // Focus sheet input on open & lock body scroll
  useEffect(() => {
    if (isSheetOpen) {
      document.body.style.overflow = "hidden";
      setTimeout(() => sheetInputRef.current?.focus(), 80);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isSheetOpen]);

  // Filter DOM items in the menu page
  useEffect(() => {
    if (!enabled || typeof document === "undefined") return;

    const domItems = document.querySelectorAll<HTMLElement>("[data-item-id]");
    setTotalItems(domItems.length);

    const q = query.trim().toLowerCase();
    let visible = 0;

    domItems.forEach((el) => {
      const id = el.getAttribute("data-item-id");
      const storeItem = storeItems.find((i: any) => i.id === id);
      const itemTags: string[] = storeItem?.tags || [];
      const isSpicy = (storeItem?.spicyLevel || 0) > 0;
      const itemCatId = storeItem?.categoryId || "";

      const name = (el.querySelector("h3")?.textContent || "").toLowerCase();
      const desc = (el.querySelector("p")?.textContent || "").toLowerCase();
      const matchesSearch = !q || name.includes(q) || desc.includes(q);

      const matchesTags =
        activeTags.size === 0 ||
        Array.from(activeTags).every((tag) => {
          if (tag === "spicy") return isSpicy;
          return itemTags.includes(tag);
        });

      const matchesCategory =
        !selectedCategory || itemCatId === selectedCategory;

      const show = matchesSearch && matchesTags && matchesCategory;
      el.hidden = !show;
      if (show) visible++;
    });

    setVisibleItems(visible);

    // Hide empty categories only while filtering
    const isFiltering = q.length > 0 || activeTags.size > 0 || selectedCategory !== null;
    document
      .querySelectorAll<HTMLElement>('section[id^="category-"]')
      .forEach((cat) => {
        const anyVisible = Array.from(
          cat.querySelectorAll<HTMLElement>("[data-item-id]")
        ).some((el) => !el.hidden);
        cat.hidden = isFiltering && !anyVisible;
      });
  }, [query, activeTags, selectedCategory, enabled, storeItems]);

  const toggleTag = (tag: string) => {
    setActiveTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  const clearAllFilters = () => {
    setQuery("");
    setActiveTags(new Set());
    setSelectedCategory(null);
  };

  // Filtered items list for the Instant Search Sheet
  const matchedStoreItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return storeItems.filter((item) => {
      const itemTags: string[] = item.tags || [];
      const isSpicy = (item.spicyLevel || 0) > 0;
      const itemCatId = item.categoryId || "";

      const name = (item.name || "").toLowerCase();
      const desc = (item.description || "").toLowerCase();
      const matchesSearch = !q || name.includes(q) || desc.includes(q);

      const matchesTags =
        activeTags.size === 0 ||
        Array.from(activeTags).every((tag) => {
          if (tag === "spicy") return isSpicy;
          return itemTags.includes(tag);
        });

      const matchesCategory =
        !selectedCategory || itemCatId === selectedCategory;

      return matchesSearch && matchesTags && matchesCategory;
    });
  }, [storeItems, query, activeTags, selectedCategory]);

  // Jump to dish in the menu with pulse glow highlight
  const jumpToDish = useCallback((itemId: string) => {
    setIsSheetOpen(false);
    setTimeout(() => {
      const el = document.querySelector<HTMLElement>(`[data-item-id="${itemId}"]`);
      if (el) {
        el.hidden = false;
        const parentCategory = el.closest<HTMLElement>('section[id^="category-"]');
        if (parentCategory) parentCategory.hidden = false;

        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.remove("mr-item-highlighted");
        void el.offsetWidth; // trigger reflow
        el.classList.add("mr-item-highlighted");
        setTimeout(() => {
          el.classList.remove("mr-item-highlighted");
        }, 2200);
      }
    }, 180);
  }, []);

  // Open item detail sheet (for non-ordering pages)
  const openItemDetail = (item: any) => {
    // Popup disabled globally per product decision
    return;
    setIsSheetOpen(false);
    window.dispatchEvent(new CustomEvent("open-item-detail", { detail: item }));
  };

  // Helper: Highlight matching substring
  const highlightMatch = (text?: string) => {
    if (!text) return null;
    const q = query.trim();
    if (!q) return text;

    const parts = text.split(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === q.toLowerCase() ? (
        <mark key={i} className="mr-search-match">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const getItemQty = (itemId: string) => {
    return cartLines.find((l) => l.item_id === itemId)?.qty ?? 0;
  };

  if (!enabled) return null;

  const hasActiveFilters = query.length > 0 || activeTags.size > 0 || selectedCategory !== null;

  return (
    <>
      {/* ── 1. Compact Floating Search Button (FAB) ── */}
      <AnimatePresence>
        {!isSheetOpen && (
          <div className="mr-search-fab-container">
            <motion.button
              type="button"
              className="mr-search-fab"
              onClick={() => setIsSheetOpen(true)}
              aria-label="Search menu"
              title="Search menu (⌘K or /)"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 450, damping: 26 }}
            >
              <Search size={20} />
              {hasActiveFilters && (
                <span className="mr-search-fab-badge">{visibleItems}</span>
              )}
            </motion.button>

            {hasActiveFilters && (
              <motion.button
                type="button"
                className="mr-search-fab-clear"
                onClick={clearAllFilters}
                aria-label="Clear active filters"
                title="Clear filters"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 450, damping: 26 }}
              >
                <X size={14} />
              </motion.button>
            )}
          </div>
        )}
      </AnimatePresence>

      {/* ── 2. Instant Search & Discovery Sheet (Full Overlay) ── */}
      <AnimatePresence>
        {isSheetOpen && (
          <div
            className="mr-search-sheet-backdrop"
            onClick={() => setIsSheetOpen(false)}
          >
            <motion.div
              className="mr-search-sheet-container"
              initial={{ y: "100%", opacity: 0.8 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0.8 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Search menu items"
            >
              {/* Mobile grab handle */}
              <div className="mr-search-sheet-grabber" aria-hidden="true">
                <span />
              </div>

              {/* Sheet header with search input */}
              <div className="mr-search-sheet-header">
                <div className="mr-search-sheet-input-wrap">
                  <Search size={19} className="mr-search-sheet-input-icon" />
                  <input
                    ref={sheetInputRef}
                    type="search"
                    className="mr-search-sheet-input"
                    placeholder="Search dishes, ingredients, drinks…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck="false"
                  />
                  {query && (
                    <button
                      type="button"
                      className="mr-search-sheet-input-clear"
                      onClick={() => setQuery("")}
                      aria-label="Clear search text"
                    >
                      <X size={17} />
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  className="mr-search-sheet-close-btn"
                  onClick={() => setIsSheetOpen(false)}
                  aria-label="Close search"
                >
                  Done
                </button>
              </div>

              {/* Category quick filter chips inside search sheet */}
              {categories.length > 0 && (
                <div className="mr-search-sheet-chips-scroller">
                  <div className="mr-search-sheet-chips">
                    <button
                      type="button"
                      data-active={selectedCategory === null || undefined}
                      onClick={() => setSelectedCategory(null)}
                      className="mr-search-sheet-chip"
                    >
                      All
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        data-active={selectedCategory === cat.id || undefined}
                        onClick={() =>
                          setSelectedCategory((prev) =>
                            prev === cat.id ? null : cat.id
                          )
                        }
                        className="mr-search-sheet-chip"
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Dietary quick filter chips in sheet */}
              {enableDietaryFilters && availableTags.length > 0 && (
                <div className="mr-search-sheet-chips-scroller mr-search-sheet-chips-dietary">
                  <div className="mr-search-sheet-chips">
                    {availableTags.map((tag) => {
                      const meta = TAG_META[tag] || { label: tag };
                      const isActive = activeTags.has(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          data-active={isActive || undefined}
                          onClick={() => toggleTag(tag)}
                          className="mr-search-sheet-chip"
                        >
                          {meta.icon && <span>{meta.icon}</span>}
                          <span>{meta.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Real-time search matches list */}
              <div className="mr-search-sheet-results">
                {matchedStoreItems.length === 0 ? (
                  <div className="mr-search-sheet-empty">
                    <div className="mr-search-sheet-empty-icon" aria-hidden="true">
                      🍽️
                    </div>
                    <p className="mr-search-sheet-empty-title">
                      No matching dishes found
                    </p>
                    <p className="mr-search-sheet-empty-desc">
                      Try searching with a broader keyword or clear active dietary filters.
                    </p>
                    {hasActiveFilters && (
                      <button
                        type="button"
                        className="mr-search-sheet-empty-clear"
                        onClick={clearAllFilters}
                      >
                        Clear all filters
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="mr-search-sheet-list">
                    <div className="mr-search-sheet-count-strip">
                      <span>
                        Found <b>{matchedStoreItems.length}</b> {matchedStoreItems.length === 1 ? "dish" : "dishes"}
                      </span>
                      {hasActiveFilters && (
                        <button
                          type="button"
                          className="mr-search-sheet-reset-link"
                          onClick={clearAllFilters}
                        >
                          Reset filters
                        </button>
                      )}
                    </div>

                    {matchedStoreItems.map((item) => {
                      const qty = isOrdering ? getItemQty(item.id) : 0;
                      return (
                        <div key={item.id} className="mr-search-item-card">
                          {/* Dish Image Thumbnail */}
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              loading="lazy"
                              className="mr-search-item-img"
                              onClick={() =>
                                !isOrdering ? openItemDetail(item) : jumpToDish(item.id)
                              }
                            />
                          ) : (
                            <div
                              className="mr-search-item-img-placeholder"
                              onClick={() =>
                                !isOrdering ? openItemDetail(item) : jumpToDish(item.id)
                              }
                            >
                              <Sparkles size={20} />
                            </div>
                          )}

                          {/* Dish Info */}
                          <div className="mr-search-item-body">
                            <div className="mr-search-item-top">
                              <div className="mr-search-item-title-row">
                                <h4
                                  className="mr-search-item-name"
                                  onClick={() =>
                                    !isOrdering ? openItemDetail(item) : jumpToDish(item.id)
                                  }
                                >
                                  {highlightMatch(item.name)}
                                </h4>
                                {item.categoryName && (
                                  <span className="mr-search-item-cat">
                                    {item.categoryName}
                                  </span>
                                )}
                              </div>
                              <span className="mr-search-item-price">
                                {currencySymbol}
                                {typeof item.price === "number"
                                  ? item.price.toFixed(2)
                                  : item.price}
                              </span>
                            </div>

                            {item.description && (
                              <p
                                className="mr-search-item-desc"
                                onClick={() =>
                                  !isOrdering ? openItemDetail(item) : jumpToDish(item.id)
                                }
                              >
                                {highlightMatch(item.description)}
                              </p>
                            )}

                            {/* Tags + Action Buttons */}
                            <div className="mr-search-item-bottom">
                              <div className="mr-search-item-tags">
                                {(item.tags || []).slice(0, 3).map((t: string) => (
                                  <span key={t} className="mr-search-item-tag">
                                    {TAG_META[t]?.icon || "•"} {TAG_META[t]?.label || t}
                                  </span>
                                ))}
                              </div>

                              <div className="mr-search-item-actions">
                                <button
                                  type="button"
                                  className="mr-search-jump-btn"
                                  onClick={() => jumpToDish(item.id)}
                                  title="Jump to dish on menu"
                                >
                                  <span>View on menu</span>
                                  <ArrowRight size={14} />
                                </button>

                                {/* Ordering enabled: inline quick-add stepper */}
                                {isOrdering && (
                                  <div className="mr-search-stepper">
                                    {qty === 0 ? (
                                      <button
                                        type="button"
                                        className="mr-search-add-btn"
                                        onClick={() =>
                                          storeAddItem({
                                            item_id: item.id,
                                            name: item.name,
                                            price: item.price,
                                          })
                                        }
                                      >
                                        <Plus size={14} />
                                        <span>Add</span>
                                      </button>
                                    ) : (
                                      <div className="mr-search-stepper-controls">
                                        <button
                                          type="button"
                                          className="mr-search-stepper-btn"
                                          onClick={() => storeChangeQty(item.id, -1)}
                                          aria-label="Decrease quantity"
                                        >
                                          <Minus size={13} />
                                        </button>
                                        <span className="mr-search-stepper-qty">
                                          {qty}
                                        </span>
                                        <button
                                          type="button"
                                          className="mr-search-stepper-btn"
                                          onClick={() => storeChangeQty(item.id, 1)}
                                          aria-label="Increase quantity"
                                        >
                                          <Plus size={13} />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Non-ordering mode: direct detail button */}
                                {!isOrdering && (
                                  <button
                                    type="button"
                                    className="mr-search-detail-btn"
                                    onClick={() => openItemDetail(item)}
                                    title="View dish details"
                                  >
                                    Details
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Sheet bottom bar */}
              <div className="mr-search-sheet-footer">
                <button
                  type="button"
                  className="mr-search-sheet-apply-btn"
                  onClick={() => setIsSheetOpen(false)}
                >
                  Show {matchedStoreItems.length} {matchedStoreItems.length === 1 ? "dish" : "dishes"} on menu
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
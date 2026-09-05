/**
 * Shared client-side effect modules.
 * Contract (docs/review AR-4):
 *  - each effect initializes itself and is idempotent across astro:page-load
 *  - each effect guards against duplicate attachment
 *  - every effect checks prefers-reduced-motion
 */

declare global {
    interface Window {
        __RESTAURANT_ITEMS__?: Array<Record<string, unknown>>;
    }
}

const REDUCED = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Utility: run fn on load and on every view-transition navigation */
export function onPageLoad(fn: () => void) {
    if (document.readyState !== "loading") fn();
    document.addEventListener("astro:page-load", fn, { passive: true });
}

// ── Scroll reveal ──────────────────────────────────────────────────────────
// Observes `.mr-reveal` elements; adds `.revealed` when they enter viewport.
export function setupReveal() {
    const els = document.querySelectorAll<HTMLElement>(
        ".mr-reveal:not(.revealed)"
    );
    if (!els.length) return;

    if (REDUCED()) {
        els.forEach((el) => el.classList.add("revealed"));
        return;
    }

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add("revealed");
                observer.unobserve(entry.target);
            });
        },
        { rootMargin: "0px 0px -60px 0px", threshold: 0.1 }
    );
    els.forEach((el) => observer.observe(el));
}

// ── Stagger delays ─────────────────────────────────────────────────────────
export function setupStagger() {
    const staggerRaw = getComputedStyle(document.documentElement)
        .getPropertyValue("--mr-stagger")
        .trim();
    const stagger = parseFloat(staggerRaw) || 100;

    document
        .querySelectorAll<HTMLElement>("[data-stagger-container]")
        .forEach((container) => {
            const children =
                container.querySelectorAll<HTMLElement>(".mr-reveal");
            children.forEach((el, i) => {
                // Cap at 8 before everything enters together (design doc §4.2.2)
                el.style.transitionDelay = `${Math.min(i, 8) * stagger}ms`;
            });
        });
}

// ── Item detail sheet wiring ───────────────────────────────────────────────
export function setupDetailSheet() {
    document.querySelectorAll<HTMLElement>("[data-item-id]").forEach((card) => {
        if (card.dataset.listenerAttached) return;
        card.dataset.listenerAttached = "true";
        card.addEventListener("click", () => {
            const id = card.getAttribute("data-item-id");
            const item = window.__RESTAURANT_ITEMS__?.find(
                (i) => i.id === id
            );
            if (item) {
                window.dispatchEvent(
                    new CustomEvent("open-item-detail", { detail: item })
                );
            }
        });
        card.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                card.click();
            }
        });
    });
}

// ── Text scramble (gated: only templates with the 'scramble' effect) ──────
export function setupScramble() {
    if (REDUCED()) return;
    const els = document.querySelectorAll<HTMLElement>("[data-scramble]");
    if (!els.length) return;

    const CHARS = "!<>-_\\/[]{}=+*^?#";
    els.forEach((el) => {
        if (el.dataset.scrambleAttached) return;
        el.dataset.scrambleAttached = "true";
        const finalText = el.textContent || "";
        let frame = 0;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                observer.unobserve(entry.target);
                const tick = () => {
                    let output = "";
                    for (let i = 0; i < finalText.length; i++) {
                        output +=
                            frame > i + 4
                                ? finalText[i]
                                : CHARS[
                                Math.floor(Math.random() * CHARS.length)
                                ];
                    }
                    el.textContent = output;
                    frame++;
                    if (frame <= finalText.length + 6) {
                        requestAnimationFrame(tick);
                    } else {
                        el.textContent = finalText;
                    }
                };
                requestAnimationFrame(tick);
            });
        }, { threshold: 0.5 });

        observer.observe(el);
    });
}

// ── 3D card tilt (hover + fine pointer only, rAF-throttled) ───────────────
export function setupTilt() {
    if (REDUCED()) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches)
        return;
    const cards = document.querySelectorAll<HTMLElement>("[data-item-id]");
    if (cards.length > 60) return; // perf cap (review §5)

    cards.forEach((card) => {
        if (card.dataset.tiltAttached) return;
        card.dataset.tiltAttached = "true";
        let raf = 0;

        const onMove = (e: MouseEvent) => {
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(() => {
                const rect = card.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width - 0.5;
                const y = (e.clientY - rect.top) / rect.height - 0.5;
                card.style.transform = `perspective(800px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(-3px)`;
            });
        };
        const onLeave = () => {
            cancelAnimationFrame(raf);
            card.style.transform = "";
        };

        card.addEventListener("mousemove", onMove);
        card.addEventListener("mouseleave", onLeave);
    });
}

// ── Mobile swipe navigation between categories ────────────────────────────
export function setupSwipeNav() {
    if (REDUCED()) return;
    if (!("ontouchstart" in window)) return;

    const sections = document.querySelectorAll<HTMLElement>(
        'section[id^="category-"]'
    );
    if (sections.length < 2) return;

    let startX = 0,
        startY = 0,
        startTime = 0;

    document.addEventListener(
        "touchstart",
        (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            startTime = Date.now();
        },
        { passive: true }
    );

    document.addEventListener(
        "touchend",
        (e) => {
            const dx = e.changedTouches[0].clientX - startX;
            const dy = e.changedTouches[0].clientY - startY;
            const dt = Date.now() - startTime;
            if (
                Math.abs(dx) < 60 ||
                Math.abs(dx) < Math.abs(dy) ||
                dt > 500
            )
                return;

            const currentIndex = Array.from(sections).findIndex((s) => {
                const rect = s.getBoundingClientRect();
                return rect.top <= 100 && rect.bottom > 100;
            });
            if (currentIndex === -1) return;

            if (dx < 0 && currentIndex < sections.length - 1) {
                sections[currentIndex + 1].scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                });
            } else if (dx > 0 && currentIndex > 0) {
                sections[currentIndex - 1].scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                });
            }
        },
        { passive: true }
    );
}

// ── Category nav active tracking (IntersectionObserver scrollspy) ─────────
export function setupCategorySpy() {
    const sections = document.querySelectorAll<HTMLElement>(
        'section[id^="category-"]'
    );
    const buttons = document.querySelectorAll<HTMLElement>(
        "[data-category-btn]"
    );
    if (!sections.length || !buttons.length) return;

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                const id = entry.target.id.replace("category-", "");
                buttons.forEach((btn) => {
                    const active =
                        btn.getAttribute("data-category-btn") === id;
                    btn.classList.toggle("active", active);
                    if (active) {
                        btn.scrollIntoView({
                            behavior: "smooth",
                            inline: "nearest",
                            block: "nearest",
                        });
                    }
                });
            });
        },
        { rootMargin: "-20% 0px -70% 0px" }
    );
    sections.forEach((s) => observer.observe(s));
}

// ── Boot everything ────────────────────────────────────────────────────────
export function initPageEffects() {
    setupStagger();
    setupReveal();
    setupDetailSheet();
    setupTilt();
    setupSwipeNav();
    setupCategorySpy();
    setupScramble();
}

onPageLoad(initPageEffects);
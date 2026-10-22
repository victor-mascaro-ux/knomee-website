/* ============================================================
   KNOMEE · HOMEPAGE V3 — "Proof first"
   Page-only behaviour: the hero highlighter. Everything else is
   CSS keyed to the shared reveal (.is-in). Leans on window.Knomee
   from shared/site.js.
   ============================================================ */
(function () {
  'use strict';
  const K = window.Knomee;
  if (!K) return;
  const { $, reduced } = K;

  /* Run once an element has been revealed by shared/site.js, whether
     that already happened or is still to come. */
  function whenRevealed(el, fn) {
    if (!el) return;
    if (el.classList.contains('is-in')) { fn(); return; }
    el.addEventListener('reveal', fn, { once: true });
  }

  /* ---------- Hero highlighter ----------
     One stroke per line box of "Grow Organically", drawn left to
     right after the headline lands. Redrawn (not re-animated) on
     resize so it always sits under the words. */
  function marker() {
    const mark = $('.hero-title .marker');
    if (!mark) return;
    const h1 = mark.closest('h1');
    const layer = document.createElement('span');
    layer.className = 'marker-layer';
    layer.setAttribute('aria-hidden', 'true');
    h1.prepend(layer);

    const draw = (animate) => {
      h1.classList.add('has-marker');
      layer.textContent = '';
      const base = h1.getBoundingClientRect();
      const fs = parseFloat(getComputedStyle(mark).fontSize);
      Array.from(mark.getClientRects()).forEach((r, i) => {
        const s = document.createElement('span');
        s.className = 'marker-stroke';
        const baseline = r.top - base.top + r.height * 0.75;
        s.style.left = (r.left - base.left - fs * 0.06) + 'px';
        s.style.width = (r.width + fs * 0.12) + 'px';
        s.style.top = (baseline - fs * 0.4) + 'px';
        s.style.height = (fs * 0.5) + 'px';
        if (animate && !reduced.matches) s.style.animationDelay = (i * 0.5) + 's';
        else s.classList.add('is-drawn');
        layer.appendChild(s);
      });
    };

    const fonts = document.fonts ? document.fonts.ready : Promise.resolve();
    fonts.then(() => whenRevealed(h1, () => setTimeout(() => draw(true), reduced.matches ? 0 : 520)));
    let t;
    window.addEventListener('resize', () => {
      clearTimeout(t);
      t = setTimeout(() => { if (h1.classList.contains('has-marker')) draw(false); }, 120);
    });
  }

  marker();
})();

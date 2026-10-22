/* ============================================================
   KNOMEE · MARKETING SITE BEHAVIOUR
   Shared by every homepage version. No dependencies. Each piece
   wires itself to markup by data attribute, so a page only opts in
   to what it uses. Everything respects prefers-reduced-motion.
   ============================================================ */
(function () {
  'use strict';
  document.documentElement.classList.add('js');

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const BRAND = ['#240446', '#7639a1', '#3dbdaa', '#affc41', '#ff9525', '#b98ddc', '#6bd6c4'];

  /* ---------- Header: solid once the page moves, mobile menu ---------- */
  function header() {
    const bar = $('.site-header');
    if (!bar) return;
    const onScroll = () => bar.classList.toggle('is-scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    const toggle = $('.menu-toggle');
    const menu = $('.mobile-menu');
    if (!toggle || !menu) return;
    const set = (open) => {
      document.body.classList.toggle('menu-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    };
    toggle.addEventListener('click', () => set(!document.body.classList.contains('menu-open')));
    menu.addEventListener('click', (e) => { if (e.target.closest('a')) set(false); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && document.body.classList.contains('menu-open')) { set(false); toggle.focus(); }
    });
  }

  /* ---------- Reveal on scroll ----------
     [data-stagger] numbers its revealing children so they arrive
     one after another (--i × --stagger). */
  function reveal(root = document) {
    $$('[data-stagger]', root).forEach((group) => {
      $$('[data-reveal]', group).forEach((el, i) => el.style.setProperty('--i', el.dataset.i || i));
    });
    const items = $$('[data-reveal]:not(.is-in)', root);
    if (reduced.matches || !('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('is-in'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        entry.target.dispatchEvent(new CustomEvent('reveal'));
        io.unobserve(entry.target);
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
    items.forEach((el) => io.observe(el));
  }

  /* ---------- Count-up numbers ----------
     <span data-count="30" data-suffix="%">30%</span> — the markup
     holds the final value, so no-JS and reduced motion read right. */
  function countTo(el, { duration = 1400 } = {}) {
    const end = parseFloat(el.dataset.count);
    const dec = parseInt(el.dataset.decimals || '0', 10);
    const pre = el.dataset.prefix || '';
    const suf = el.dataset.suffix || '';
    const sup = el.querySelector('sup');
    const supHTML = sup ? sup.outerHTML : '';
    const paint = (v) => { el.innerHTML = pre + v.toFixed(dec) + suf + supHTML; };
    if (reduced.matches) { paint(end); return; }
    const t0 = performance.now();
    const ease = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));
    const tick = (now) => {
      const t = Math.min(1, Math.max(0, (now - t0) / duration));
      paint(end * ease(t));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  function counters(root = document) {
    const els = $$('[data-count]', root);
    if (!('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { countTo(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.6 });
    els.forEach((el) => io.observe(el));
  }

  /* ---------- Tabs ----------
     <div data-tabs> with a .tabs [role=tablist] of [role=tab]
     buttons (aria-controls → panel ids). Arrow keys move focus and
     selection; the thumb slides under the selected tab. */
  function tabs(root = document) {
    $$('[data-tabs]', root).forEach((wrap) => {
      const list = $('[role="tablist"]', wrap);
      const tabsEls = $$('[role="tab"]', list);
      let thumb = $('.tab-thumb', list);
      if (!thumb) { thumb = document.createElement('span'); thumb.className = 'tab-thumb'; thumb.setAttribute('aria-hidden', 'true'); list.prepend(thumb); }
      const place = (tab) => {
        thumb.style.width = tab.offsetWidth + 'px';
        thumb.style.transform = `translateX(${tab.offsetLeft}px)`;
      };
      const select = (tab, focus) => {
        tabsEls.forEach((t) => {
          const on = t === tab;
          t.setAttribute('aria-selected', String(on));
          t.tabIndex = on ? 0 : -1;
          const panel = document.getElementById(t.getAttribute('aria-controls'));
          if (panel) panel.hidden = !on;
        });
        place(tab);
        if (focus) tab.focus();
        wrap.dispatchEvent(new CustomEvent('tabchange', { detail: { tab, index: tabsEls.indexOf(tab) } }));
      };
      tabsEls.forEach((t, i) => {
        t.addEventListener('click', () => select(t));
        t.addEventListener('keydown', (e) => {
          const k = e.key;
          let n = null;
          if (k === 'ArrowRight' || k === 'ArrowDown') n = tabsEls[(i + 1) % tabsEls.length];
          if (k === 'ArrowLeft' || k === 'ArrowUp') n = tabsEls[(i - 1 + tabsEls.length) % tabsEls.length];
          if (k === 'Home') n = tabsEls[0];
          if (k === 'End') n = tabsEls[tabsEls.length - 1];
          if (n) { e.preventDefault(); select(n, true); }
        });
      });
      const start = tabsEls.find((t) => t.getAttribute('aria-selected') === 'true') || tabsEls[0];
      select(start);
      window.addEventListener('resize', () => place(tabsEls.find((t) => t.getAttribute('aria-selected') === 'true')));
      if (document.fonts) document.fonts.ready.then(() => place(tabsEls.find((t) => t.getAttribute('aria-selected') === 'true')));
      wrap._select = (i) => select(tabsEls[i]);
    });
  }

  /* ---------- FAQ: details/summary with an animated height ---------- */
  function accordion(root = document) {
    $$('.faq details', root).forEach((d) => {
      const summary = $('summary', d);
      const body = $('.answer', d);
      if (!summary || !body) return;
      summary.addEventListener('click', (e) => {
        if (reduced.matches || !body.animate) return;
        e.preventDefault();
        if (d.open) {
          const h = body.offsetHeight;
          d.classList.add('is-closing');
          const a = body.animate([{ height: h + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 260, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' });
          a.onfinish = () => { d.open = false; d.classList.remove('is-closing'); };
        } else {
          d.open = true;
          const h = body.offsetHeight;
          body.animate([{ height: '0px', opacity: 0 }, { height: h + 'px', opacity: 1 }], { duration: 340, easing: 'cubic-bezier(0.22, 0.81, 0.28, 1.05)' });
        }
      });
    });
  }

  /* ---------- Confetti (the system's success moment) ---------- */
  function confetti(x = window.innerWidth / 2, y = window.innerHeight / 2, count = 90) {
    if (reduced.matches) return;
    const c = document.createElement('canvas');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = window.innerWidth * dpr; c.height = window.innerHeight * dpr;
    Object.assign(c.style, { position: 'fixed', inset: '0', width: '100%', height: '100%', pointerEvents: 'none', zIndex: 95 });
    c.setAttribute('aria-hidden', 'true');
    document.body.appendChild(c);
    const ctx = c.getContext('2d');
    ctx.scale(dpr, dpr);
    const parts = Array.from({ length: count }, () => {
      const a = Math.random() * Math.PI - Math.PI;           // upward half
      const v = 6 + Math.random() * 9;
      return {
        x, y, vx: Math.cos(a) * v * (0.6 + Math.random()), vy: Math.sin(a) * v - 3,
        w: 6 + Math.random() * 6, h: 8 + Math.random() * 8, r: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.3, color: BRAND[(Math.random() * BRAND.length) | 0],
        round: Math.random() < 0.3,
      };
    });
    const t0 = performance.now();
    const frame = (now) => {
      const t = now - t0;
      ctx.clearRect(0, 0, c.width, c.height);
      parts.forEach((p) => {
        p.vy += 0.32; p.vx *= 0.985; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - t / 1900);
        ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.color;
        if (p.round) { ctx.beginPath(); ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2); ctx.fill(); }
        else ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * 0.6);
        ctx.restore();
      });
      if (t < 1900) requestAnimationFrame(frame); else c.remove();
    };
    requestAnimationFrame(frame);
  }

  /* ---------- Toast ---------- */
  let toastEl, toastTimer;
  function toast(msg, ms = 3800) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast';
      toastEl.setAttribute('role', 'status');
      toastEl.setAttribute('aria-live', 'polite');
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    requestAnimationFrame(() => toastEl.classList.add('is-visible'));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-visible'), ms);
  }

  /* ---------- Demo qualifier ----------
     <form data-qualify> with fieldset.qualify-step children. Tile
     steps advance on choice; the last step validates and submits.
     Nothing leaves the page: this is a prototype. */
  function qualify(root = document) {
    $$('form[data-qualify]', root).forEach((form) => {
      const steps = $$('.qualify-step', form);
      const bar = $('.qualify-progress i', form);
      const label = $('[data-step-label]', form);
      const back = $('.qualify-back', form);
      const done = $('.qualify-done', form.parentElement) || $('.qualify-done', form);
      let at = 0;
      const show = (i, dir = 1) => {
        steps.forEach((s, n) => {
          s.hidden = n !== i;
          s.classList.remove('is-entering', 'is-entering-back');
        });
        const s = steps[i];
        void s.offsetWidth;
        s.classList.add(dir > 0 ? 'is-entering' : 'is-entering-back');
        at = i;
        if (bar) bar.style.width = ((i + 1) / steps.length) * 100 + '%';
        if (label) label.textContent = `Step ${i + 1} of ${steps.length}`;
        if (back) back.classList.toggle('is-visible', i > 0);
      };
      // Tiles advance on click, not change, so re-choosing the tile that is
      // already checked (after Back) still moves on. Arrow keys only move the
      // selection; Enter or Space confirms it.
      const advance = (i) => setTimeout(() => {
        if (at !== i) return;
        show(i + 1, 1);
        const f = $('input', steps[i + 1]); if (f) f.focus({ preventScroll: true });
      }, reduced.matches ? 0 : 320);
      steps.slice(0, -1).forEach((s, i) => {
        let viaArrow = false;
        s.addEventListener('keydown', (e) => {
          if (e.key.startsWith('Arrow')) viaArrow = true;
          if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('input[type="radio"]')) {
            e.preventDefault(); e.target.checked = true; advance(i);
          }
        });
        $$('input[type="radio"]', s).forEach((r) => r.addEventListener('click', () => {
          if (viaArrow) { viaArrow = false; return; }
          advance(i);
        }));
      });
      if (back) back.addEventListener('click', () => { if (at > 0) show(at - 1, -1); });

      $$('.field input', form).forEach((inp) => inp.addEventListener('input', () => {
        const f = inp.closest('.field'); f.classList.remove('has-error'); const e = $('.error', f); if (e) e.textContent = '';
      }));
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        // Enter in an earlier step moves on rather than skipping the contact details.
        if (at < steps.length - 1) { if ($('input:checked', steps[at])) advance(at); return; }
        let first = null;
        $$('.field input[required]', steps[at]).forEach((inp) => {
          const f = inp.closest('.field');
          const err = $('.error', f);
          let msg = '';
          if (!inp.value.trim()) msg = `Add your ${(inp.dataset.name || 'answer').toLowerCase()} to continue.`;
          else if (inp.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inp.value.trim())) msg = 'That email doesn’t look right. Check it and try again.';
          f.classList.toggle('has-error', !!msg);
          if (err) err.textContent = msg;
          if (msg && !first) first = inp;
        });
        if (first) { first.focus(); return; }
        const btn = $('button[type="submit"]', form);
        const r = btn ? btn.getBoundingClientRect() : null;
        form.hidden = true;
        if (done) { done.hidden = false; done.setAttribute('tabindex', '-1'); done.focus({ preventScroll: true }); }
        if (r) confetti(r.left + r.width / 2, r.top + r.height / 2);
        toast('You’re on the list. We’ll be in touch within one business day.');
      });
      show(0);
    });
  }

  /* ---------- Mobile sticky CTA ----------
     Appears once the hero is behind you, steps aside when the
     closing form is on screen. */
  function mobileCta() {
    const bar = $('.mobile-cta');
    if (!bar || !('IntersectionObserver' in window)) return;
    const hero = $('[data-hero]');
    const end = $('[data-cta-end]');
    let pastHero = false, atEnd = false;
    const paint = () => bar.classList.toggle('is-visible', pastHero && !atEnd);
    if (hero) new IntersectionObserver(([e]) => { pastHero = !e.isIntersecting; paint(); }).observe(hero);
    if (end) new IntersectionObserver(([e]) => { atEnd = e.isIntersecting; paint(); }, { threshold: 0.15 }).observe(end);
  }

  /* ---------- Marquee: duplicate the track for a seamless loop ---------- */
  function marquee(root = document) {
    $$('.marquee-track', root).forEach((track) => {
      if (track.dataset.cloned) return;
      $$(':scope > *', track).forEach((n) => { const c = n.cloneNode(true); c.setAttribute('aria-hidden', 'true'); track.appendChild(c); });
      track.dataset.cloned = '1';
    });
  }

  /* ---------- Header dropdowns ----------
     Hover opens on pointer devices; click and keyboard work everywhere.
     Escape closes and returns focus to the trigger. */
  function navMenus() {
    const triggers = $$('.nav-trigger');
    const close = (t) => t.setAttribute('aria-expanded', 'false');
    const open = (t) => { triggers.forEach((o) => o !== t && close(o)); t.setAttribute('aria-expanded', 'true'); };
    triggers.forEach((t) => {
      const item = t.closest('.nav-item');
      const menu = document.getElementById(t.getAttribute('aria-controls'));
      let timer;
      t.addEventListener('click', () => (t.getAttribute('aria-expanded') === 'true' ? close(t) : open(t)));
      item.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') { clearTimeout(timer); open(t); } });
      item.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') timer = setTimeout(() => close(t), 140); });
      item.addEventListener('focusout', (e) => { if (!item.contains(e.relatedTarget)) close(t); });
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') { close(t); t.focus(); }
        if (e.key === 'ArrowDown' && menu) { e.preventDefault(); open(t); const links = $$('a', menu); const i = links.indexOf(document.activeElement); (links[i + 1] || links[0]).focus(); }
        if (e.key === 'ArrowUp' && menu) { e.preventDefault(); const links = $$('a', menu); const i = links.indexOf(document.activeElement); (links[i - 1] || links[links.length - 1]).focus(); }
      });
    });
    document.addEventListener('click', (e) => { if (!e.target.closest('.nav-item')) triggers.forEach(close); });
  }

  /* ---------- Video ----------
     <div class="video" data-video><video data-hls="…m3u8"></video>
     <button class="video-play">. The stream (and hls.js, where the
     browser can't play HLS itself) loads only when someone presses play. */
  const HLS_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/hls.js/1.5.15/hls.min.js';
  let hlsLoading;
  const loadHls = () => hlsLoading || (hlsLoading = new Promise((res, rej) => {
    const s = document.createElement('script'); s.src = HLS_SRC; s.onload = () => res(window.Hls); s.onerror = rej; document.head.appendChild(s);
  }));
  function videos() {
    $$('[data-video]').forEach((wrap) => {
      const v = $('video', wrap);
      const btn = $('.video-play', wrap);
      if (!v || !btn) return;
      // Anything laid over the video (a card on its corner) steps aside while it plays.
      const scope = wrap.closest('[data-watch]') || wrap.parentElement;
      v.addEventListener('play', () => scope.classList.add('is-watching'));
      ['pause', 'ended'].forEach((ev) => v.addEventListener(ev, () => scope.classList.remove('is-watching')));
      btn.addEventListener('click', async () => {
        wrap.classList.add('is-playing');
        if (!v.dataset.ready) {
          const src = v.dataset.hls;
          if (v.canPlayType('application/vnd.apple.mpegurl')) v.src = src;
          else {
            try { const Hls = await loadHls(); const h = new Hls(); h.loadSource(src); h.attachMedia(v); }
            catch (err) { wrap.classList.remove('is-playing'); return; }
          }
          v.dataset.ready = '1';
        }
        v.controls = true;
        v.play().catch(() => {});
      });
    });
  }

  /* ---------- Newsletter: the button settles into a check ---------- */
  function newsletter() {
    $$('form[data-newsletter]').forEach((f) => f.addEventListener('submit', (e) => {
      e.preventDefault();
      f.classList.add('is-done');
      setTimeout(() => { f.reset(); f.classList.remove('is-done'); }, 2600);
    }));
  }

  /* ---------- Tiny helpers page scripts lean on ---------- */
  const sleep = (ms) => new Promise((r) => setTimeout(r, reduced.matches ? 0 : ms));
  function typeText(el, text, speed = 22) {
    if (reduced.matches) { el.textContent = text; return Promise.resolve(); }
    el.textContent = '';
    return new Promise((res) => {
      let i = 0;
      const step = () => { el.textContent = text.slice(0, ++i); if (i < text.length) setTimeout(step, speed); else res(); };
      step();
    });
  }

  window.Knomee = { reduced, confetti, toast, countTo, reveal, sleep, typeText, $, $$ };

  const init = () => { header(); navMenus(); marquee(); reveal(); counters(); tabs(); accordion(); qualify(); mobileCta(); videos(); newsletter(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

/* ============================================================
   V2 · "TRY IT FIRST" — page behaviour
   The playable hero and the two pinned stories. Leans
   on window.Knomee (shared/site.js). Text written here is product
   UI only (what the prospect profile shows); no marketing copy.
   ============================================================ */
(function () {
  'use strict';
  const K = window.Knomee;
  if (!K) return;
  const { $, $$, reduced, sleep, typeText, confetti, countTo } = K;

  /* ---------- What the answers read as, in the product ---------- */
  const VALUES = {
    choice:       { label: 'Choice',               ask: '“Which decision do you most want to keep open?”' },
    comfort:      { label: 'Comfort',              ask: '“Which parts of today’s life would you never want to give up?”' },
    independence: { label: 'Independence',         ask: '“What would you do with a year where work was optional?”' },
    moment:       { label: 'Enjoying the moment',  ask: '“What’s the last thing you spent on that felt completely worth it?”' },
    security:     { label: 'Security',             ask: '“What does enough look like for you?”' },
    family:       { label: 'Supporting my family', ask: '“Who are you planning for, and what do you want them to feel?”' },
  };
  const EVENTS = {
    retirement:          { label: 'Retirement' },
    'new-business':      { label: 'New business' },
    'property-purchase': { label: 'Property purchase' },
    education:           { label: 'Graduation' },
    relocation:          { label: 'Relocation' },
    'new-baby':          { label: 'New baby' },
  };
  const STAGES = ['Pre-Contemplation', 'Contemplation', 'Preparation', 'Action', 'Maintenance'];
  const TIERS = { 1: 'Tier 1 · Ready Now', 2: 'Tier 2 · Considering', 3: 'Tier 3 · Nurture' };
  const GAUGE = '<svg class="mini-gauge" viewBox="0 0 200 116" aria-hidden="true"><path class="w1" d="M20 100 A80 80 0 0 1 60 30.7"/><path class="w2" d="M63.4 28.8 A80 80 0 0 1 136.6 28.8"/><path class="w3" d="M140 30.7 A80 80 0 0 1 180 100"/><g class="needle"><g transform="translate(100 100) rotate(-62.7) scale(3.4) translate(-4.605 -6.894)"><path style="fill:#747378;stroke:none;stroke-dasharray:none" d="M16.0757 0.961386C16.226 0.785021 16.2577 0.536341 16.1563 0.327944C16.0432 0.0956357 15.7907 -0.0345688 15.5359 0.00800544L4.04027 1.92858C0.717702 2.48369 -1.0318 6.18253 0.646823 9.10312C2.31222 12.0007 6.34562 12.3735 8.51395 9.83036L16.0757 0.961386Z"/><path style="fill:#fff;stroke:none;stroke-dasharray:none" d="M4.29615 4.46698C2.9558 4.63811 2.00795 5.8634 2.17908 7.20375C2.3502 8.54411 3.5755 9.49196 4.91585 9.32083C6.2562 9.14971 7.20405 7.92441 7.03293 6.58406C6.8618 5.2437 5.63651 4.29586 4.29615 4.46698Z"/></g></g></svg>';
  const turn = (v) => `rotate(${(v - 50) * 1.8}deg)`;
  const confWord = (v) => (v < 34 ? 'Weak' : v < 67 ? 'Moderate' : 'Strong');
  const joinAnd = (a) => (a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]);

  /* ---------- The playable adventure ---------- */
  function adventure() {
    const root = $('[data-adventure]');
    if (!root) return;
    const form = $('.adv-screens', root);
    const screens = $$('.adv-screen', root);
    const order = screens.map((s) => s.dataset.screen);
    const foot = $('.adv-foot', root);
    const dots = $$('.adv-dots i', root);
    const next = $('.adv-next', root);
    const back = $('.adv-back', root);
    const restart = $('.adv-restart', root);
    const brand = $('[data-brand]', root);
    const range = $('.conf-range', root);
    const needle = $('.needle', root);
    const dialLabel = $('[data-dial-label]', root);
    const valueGrid = $('.value-grid', root);
    const joys = $$('.joy-photo', valueGrid);
    let chosen = [];   // in the order they were picked, so the first pick leads
    const advisor = $('.advisor', root);
    const kq = $('[data-kq]', advisor);
    const tierPill = $('[data-tier]', advisor);
    const rows = { values: $('[data-row="values"] dd', advisor), confidence: $('[data-row="confidence"] dd', advisor), events: $('[data-row="events"] dd', advisor) };
    const skeleton = { values: rows.values.innerHTML, confidence: rows.confidence.innerHTML, events: rows.events.innerHTML };
    const QUESTIONS = ['values', 'confidence', 'events'];
    const MAX = 3;
    let at = 0;
    let touched = { confidence: false, events: false };
    let busy = false;

    const picked = (name) => (name === 'value'
      ? chosen.slice()
      : $$(`input[name="${name}"]:checked`, form).map((i) => i.value));
    const bump = (el) => { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); };

    function setBrand(screen) {
      const name = screen.dataset.adventureName;
      const icon = screen.dataset.adventureIcon;
      const label = $('[data-brand-name]', brand);
      if (label.textContent === name) return;
      brand.classList.add('is-swapping');
      setTimeout(() => {
        label.textContent = name;
        $('[data-brand-icon]', brand).src = `../assets/adventures/${icon}.svg`;
        brand.classList.remove('is-swapping');
      }, reduced.matches ? 0 : 180);
    }

    function go(i, { focus = true } = {}) {
      screens.forEach((s, n) => {
        const on = n === i;
        s.classList.toggle('is-active', on);
        s.classList.toggle('is-before', n < i);
        s.inert = !on;
        s.setAttribute('aria-hidden', String(!on));
      });
      at = i;
      const name = order[i];
      setBrand(screens[i]);
      const q = QUESTIONS.indexOf(name);
      const done = name === 'building' || name === 'id';
      dots.forEach((d, n) => {
        d.classList.toggle('now', n === q);
        d.classList.toggle('on', done || (q > -1 && n < q));
      });
      foot.classList.toggle('is-intro', name === 'intro');
      foot.style.visibility = name === 'building' ? 'hidden' : '';
      next.hidden = !(name === 'intro' || q > -1);
      next.classList.toggle('is-final', name === 'events');
      back.classList.toggle('is-hidden', q < 0);
      restart.hidden = name !== 'id';
      if (focus) {
        const t = $('.adv-title', screens[i]);
        if (t) setTimeout(() => t.focus({ preventScroll: true }), reduced.matches ? 0 : 260);
      }
    }

    /* live profile rows */
    function flash(dd) {
      const r = dd.closest('.arow');
      r.classList.remove('flash'); void r.offsetWidth; r.classList.add('flash');
    }
    function paintValues() {
      const v = picked('value');
      const full = v.length >= MAX;
      joys.forEach((b) => b.classList.toggle('is-full', full && b.getAttribute('aria-pressed') !== 'true'));
      rows.values.innerHTML = v.length
        ? `<p class="pp-prompt">I want money to help me with</p><div class="fid-pills">${v.map((k) => `<span class="fid-pill">${VALUES[k].label}</span>`).join('')}</div>`
        : skeleton.values;
      flash(rows.values);
    }
    function paintConfidence() {
      const v = +range.value;
      const w = confWord(v);
      range.setAttribute('aria-valuetext', w);
      needle.style.transform = turn(v);
      dialLabel.textContent = w;
      if (!touched.confidence) return;
      if (!$('.mini-gauge', rows.confidence)) rows.confidence.innerHTML = `<div class="fid-row"><span class="fid-word"></span>${GAUGE}</div>`;
      $('.fid-word', rows.confidence).textContent = w;
      $('.needle', rows.confidence).style.transform = turn(v);
    }
    function paintEvents() {
      const e = picked('event');
      rows.events.innerHTML = e.length
        ? e.map((k) => `<p class="fid-event"><img src="../assets/life-events/${k}.svg" alt="">${EVENTS[k].label}</p>`).join('')
        : '<p class="fid-word no-answer">–</p>';
      flash(rows.events);
    }

    joys.forEach((b) => b.addEventListener('click', () => {
      const on = b.getAttribute('aria-pressed') === 'true';
      if (!on && picked('value').length >= MAX) { bump(b); return; }
      chosen = on ? chosen.filter((k) => k !== b.dataset.value) : [...chosen, b.dataset.value];
      b.setAttribute('aria-pressed', String(!on));
      b.classList.toggle('is-on', !on);
      paintValues();
    }));
    range.addEventListener('input', () => {
      if (!touched.confidence) { touched.confidence = true; flash(rows.confidence); }
      paintConfidence();
    });
    $$('input[name="event"]', form).forEach((inp) => inp.addEventListener('change', () => { touched.events = true; paintEvents(); }));
    paintConfidence();

    function score() {
      const v = picked('value');
      const e = picked('event');
      const c = +range.value;
      const kqv = Math.min(97, 38 + Math.round(c * 0.3) + v.length * 5 + Math.min(e.length, 2) * 9);
      const tier = kqv >= 70 ? 1 : kqv >= 45 ? 2 : 3;
      const stage = tier === 1 ? (e.length ? 3 : 2) : tier === 2 ? 1 : 0;
      // The values and the event are on the card already; the starter is just the ask.
      const starter = VALUES[v[0]].ask;
      return { v, e, c, kqv, tier, stage, starter };
    }

    async function finish() {
      busy = true;
      go(order.indexOf('building'));
      if (!touched.events) paintEvents();
      if (!touched.confidence) { touched.confidence = true; paintConfidence(); flash(rows.confidence); }
      await sleep(1300);
      const r = score();

      $('[data-fid-values]', root).innerHTML = r.v.map((k, n) => `<span class="fid-pill" style="animation-delay:${0.45 + n * 0.08}s">${VALUES[k].label}</span>`).join('');
      $('[data-fid-conf]', root).textContent = confWord(r.c);
      const fidNeedle = $('.fid .needle', root);
      fidNeedle.style.transform = turn(50);
      $('[data-fid-events-sec]', root).hidden = !r.e.length;
      $('[data-fid-events]', root).innerHTML = r.e.map((k) => `<p class="fid-event"><img src="../assets/life-events/${k}.svg" alt="">${EVENTS[k].label}</p>`).join('');
      go(order.indexOf('id'));
      setTimeout(() => { fidNeedle.style.transform = turn(r.c); }, reduced.matches ? 0 : 420);
      const ph = $('.adv-phone', root).getBoundingClientRect();
      confetti(ph.left + ph.width / 2, ph.top + ph.height * 0.35, 70);

      await sleep(350);
      advisor.dataset.state = 'done';
      $('[data-new]', advisor).hidden = false;
      tierPill.textContent = TIERS[r.tier];
      tierPill.className = 'tier-pill ' + (r.tier === 1 ? 'tier-pill--ready' : r.tier === 2 ? 'tier-pill--consider' : 'tier-pill--nurture');
      kq.setAttribute('aria-label', `Knomee Quotient ${r.kqv}`);
      kq.classList.remove('kq-empty', 'tier-2', 'tier-3');
      if (r.tier > 1) kq.classList.add(`tier-${r.tier}`);
      kq.classList.add('is-scored');
      kq.dataset.count = r.kqv;
      countTo(kq, { duration: 1100 });

      const done = $('[data-done]', advisor);
      done.hidden = false;
      $('[data-stage]', advisor).textContent = STAGES[r.stage];
      const ttm = $('[data-ttm]', advisor);
      ttm.classList.add('is-swapping');
      setTimeout(() => { ttm.src = `../assets/ttm/TTM-${r.stage + 1}.svg`; ttm.classList.remove('is-swapping'); }, reduced.matches ? 0 : 160);
      const bars = $$('[data-meter] i', advisor);
      bars.forEach((b) => b.classList.remove('on'));
      for (let n = 0; n <= r.stage; n++) { await sleep(130); bars[n].classList.add('on'); }
      const st = $('[data-starter]', advisor);
      st.classList.add('typing');
      await typeText(st, r.starter, 16);
      st.classList.remove('typing');
      busy = false;
    }

    function reset() {
      form.reset();
      chosen = [];
      joys.forEach((b) => { b.setAttribute('aria-pressed', 'false'); b.classList.remove('is-on', 'is-full'); });
      const sun = range.closest('[data-sun]');
      sun.classList.add('is-untouched'); sun.style.setProperty('--v', range.value);
      touched = { confidence: false, events: false };
      Object.keys(rows).forEach((k) => { rows[k].innerHTML = skeleton[k]; });
      advisor.dataset.state = 'waiting';
      $('[data-new]', advisor).hidden = true;
      $('[data-done]', advisor).hidden = true;
      $('[data-starter]', advisor).textContent = '';
      tierPill.textContent = 'Prospect';
      tierPill.className = 'tier-pill tier-pill--nurture';
      kq.className = 'kq kq-empty';
      kq.removeAttribute('aria-label');
      kq.textContent = '–';
      paintConfidence();
      go(order.indexOf('values'));
    }

    next.addEventListener('click', () => {
      if (busy) return;
      const name = order[at];
      if (name === 'values' && !picked('value').length) { bump(valueGrid); return; }
      if (name === 'confidence' && !touched.confidence) { touched.confidence = true; paintConfidence(); flash(rows.confidence); }
      if (name === 'events') { finish(); return; }
      go(at + 1);
    });
    back.addEventListener('click', () => { if (!busy && QUESTIONS.includes(order[at]) && at > 0) go(at - 1); });
    restart.addEventListener('click', () => { if (!busy) reset(); });
    form.addEventListener('submit', (e) => e.preventDefault());

    go(0, { focus: false });
  }

  /* ---------- Pinned stories ----------
     Used twice: Engage / Prioritize / Convert, and the four feature
     blocks. The section pins (a sticky stage inside a taller track) and
     scroll progress through the track picks the step; text and mock rise
     in, the outgoing pair leaves upward. The page carries on only after
     the last step. Phones get every step stacked, each with its own copy
     of its mock. */
  function pin(track, onSet) {
    if (!track) return null;
    const sticky = $('.pin-sticky', track);
    const panels = $$('.pin-panel', track);
    const screens = $$('.pin-stage .stage-screen', track);
    const n = panels.length;
    panels.forEach((p, i) => {
      const slot = $('.step-media', p);
      if (slot && screens[i]) {
        const c = screens[i].cloneNode(true);
        c.classList.add('is-active');
        slot.appendChild(c);
      }
    });
    const pinned = window.matchMedia('(min-width: 901px)');
    const headerH = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 72;
    const span = () => Math.max(1, track.offsetHeight - sticky.offsetHeight);
    let at = -1;
    const set = (i) => {
      if (i === at) return;
      at = i;
      [panels, screens].forEach((list) => list.forEach((el, k) => {
        el.classList.toggle('is-active', k === i);
        el.classList.toggle('is-before', k < i);
      }));
      if (onSet) onSet(i);
    };
    // One rect read per scroll event: cheap enough to do directly, and it
    // keeps the step right even where frames are throttled.
    const update = () => {
      if (!pinned.matches) { set(0); return; }
      const p = Math.min(0.999, Math.max(0, (headerH() - track.getBoundingClientRect().top) / span()));
      set(Math.floor(p * n));
    };
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
    // Scroll the page to step i's slice of the track, so the stage never leaves.
    const goTo = (i) => {
      const k = Math.max(0, Math.min(n - 1, i));
      const top = window.scrollY + track.getBoundingClientRect().top - headerH() + span() * (k + 0.5) / n;
      window.scrollTo({ top, behavior: reduced.matches ? 'auto' : 'smooth' });
    };
    return { goTo, get at() { return at; }, n, pinned };
  }

  function story() {
    const rail = $('.pin-rail');
    const stops = rail ? $$('i', rail) : [];
    pin($('[data-pin="story"]'), (i) => {
      if (!rail) return;
      rail.style.setProperty('--p', stops.length > 1 ? i / (stops.length - 1) : 1);
      stops.forEach((d, k) => { d.classList.toggle('on', k <= i); d.classList.toggle('now', k === i); });
    });
  }

  function features() {
    const track = $('[data-pin="features"]');
    if (!track) return;
    const dots = $$('.feat-dots a', track);
    const prev = $('[data-prev]', track);
    const next = $('[data-next]', track);
    const ctl = pin(track, (i) => {
      dots.forEach((d, k) => (k === i ? d.setAttribute('aria-current', 'step') : d.removeAttribute('aria-current')));
      prev.classList.toggle('is-end', i === 0);
      next.classList.toggle('is-end', i === dots.length - 1);
    });
    const nudge = (btn) => { btn.classList.remove('shake'); void btn.offsetWidth; btn.classList.add('shake'); };
    prev.addEventListener('click', () => (ctl.at <= 0 ? nudge(prev) : ctl.goTo(ctl.at - 1)));
    next.addEventListener('click', () => (ctl.at >= ctl.n - 1 ? nudge(next) : ctl.goTo(ctl.at + 1)));
    dots.forEach((d, k) => d.addEventListener('click', (e) => {
      if (!ctl.pinned.matches) return;
      e.preventDefault();
      ctl.goTo(k);
    }));
  }

  adventure();
  story();
  features();
})();

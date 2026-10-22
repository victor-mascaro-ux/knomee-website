/* ============================================================
   V2 · "TRY IT FIRST" — page behaviour
   The playable hero, the scroll story and the feature tabs. Leans
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
    choice:       { label: 'Choice',               ask: 'Ask which decision they want to keep open the longest.' },
    comfort:      { label: 'Comfort',              ask: 'Ask which parts of today’s life they never want to give up.' },
    independence: { label: 'Independence',         ask: 'Ask what they’d do with a year where work was optional.' },
    moment:       { label: 'Enjoying the moment',  ask: 'Ask about the last thing they spent on that felt completely worth it.' },
    security:     { label: 'Security',             ask: 'Ask what “enough” looks like before you talk numbers.' },
    family:       { label: 'Supporting my family', ask: 'Ask who they’re planning for, and what they want those people to feel.' },
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
  const GAUGE = '<svg class="mini-gauge" viewBox="0 0 200 116" aria-hidden="true"><path class="w1" d="M20 100 A80 80 0 0 1 60 30.7"/><path class="w2" d="M63.4 28.8 A80 80 0 0 1 136.6 28.8"/><path class="w3" d="M140 30.7 A80 80 0 0 1 180 100"/><g class="needle"><line x1="100" y1="100" x2="100" y2="38"/><circle cx="100" cy="100" r="8"/></g></svg>';
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

  /* ---------- Scroll stories: text steps drive a sticky stage ----------
     Used twice: Engage / Prioritize / Convert, and the four feature
     blocks. No scroll-jacking: the step crossing the middle of the
     viewport picks the screen. On phones each step gets its own copy
     of its screen instead of the sticky stage. */
  function scrollStory({ steps, screens, onSet }) {
    if (!steps.length) return;
    steps.forEach((s, i) => {
      const slot = $('.step-media', s);
      if (slot && screens[i]) {
        const c = screens[i].cloneNode(true);
        c.classList.add('is-active');
        slot.appendChild(c);
      }
    });
    const set = (i) => {
      steps.forEach((s, n) => s.classList.toggle('is-active', n === i));
      screens.forEach((s, n) => s.classList.toggle('is-active', n === i));
      if (onSet) onSet(i);
    };
    if (!('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) set(steps.indexOf(e.target)); });
    }, { rootMargin: '-45% 0px -45% 0px' });
    steps.forEach((s) => io.observe(s));
  }

  function story() {
    const track = $('.story-progress i');
    const steps = $$('.story-step');
    scrollStory({
      steps,
      screens: $$('.story-stage .stage-screen'),
      onSet: (i) => { if (track) track.style.setProperty('--p', (i + 1) / steps.length); },
    });
  }

  function features() {
    const dots = $$('.feat-dots a');
    scrollStory({
      steps: $$('.feat-step'),
      screens: $$('.feat-stage .stage-screen'),
      onSet: (i) => dots.forEach((d, n) => (n === i ? d.setAttribute('aria-current', 'step') : d.removeAttribute('aria-current'))),
    });
  }

  adventure();
  story();
  features();
})();

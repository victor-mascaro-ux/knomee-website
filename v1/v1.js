/* ============================================================
   V1 · "Both sides"
   1. The hero card: the advisor's view of a prospect fills in on
      the corner of the site's video.
   2. Interactive discovery: three product questions; the advisor
      view beside them updates live.
   3. The feature explorer advances on its own, pausing on hover,
      focus and off screen.
   Text inside these mockups is product UI with invented people.
   ============================================================ */
(function () {
  'use strict';
  const { reduced, confetti, $, $$ } = window.Knomee;

  /* ---------- shared bits ---------- */
  const tierOf = (n) => (n >= 70 ? { cls: '', pill: '', label: 'Ready Now' }
    : n >= 40 ? { cls: 'tier-2', pill: 'tier-pill--consider', label: 'Considering' }
    : { cls: 'tier-3', pill: 'tier-pill--nurture', label: 'Nurture' });

  function paintTier(kqEl, pillEl, n) {
    const t = tierOf(n);
    kqEl.classList.remove('tier-2', 'tier-3');
    if (t.cls) kqEl.classList.add(t.cls);
    if (pillEl) { pillEl.className = 'tier-pill ' + t.pill; pillEl.textContent = t.label; }
  }
  function bump(el) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); setTimeout(() => el.classList.remove('bump'), 380); }
  function tween(from, to, ms, onFrame) {
    if (reduced.matches || from === to) { onFrame(to); return; }
    const t0 = performance.now();
    const ease = (t) => 1 - Math.pow(1 - t, 3);
    const step = (now) => { const t = Math.min(1, Math.max(0, (now - t0) / ms)); onFrame(Math.round(from + (to - from) * ease(t))); if (t < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }
  function setMeter(meter, k) { $$('i', meter).forEach((bar, i) => bar.classList.toggle('on', i < k)); }

  /* =========================================================
     1. HERO CARD — the advisor's view of a prospect fills in once,
        as the hero comes into view: values, readiness, score, starter.
     ========================================================= */
  function heroCard() {
    const card = $('.hero .advisor-card');
    if (!card) return;
    const kq = $('[data-kq]', card);
    const pill = $('[data-tier]', card);
    const meter = $('[data-meter]', card);
    const tags = $('[data-tags]', card);
    const starter = $('[data-starter]', card);
    const STARTER = '“What would retirement need to look like for you to feel secure?”';
    let kqVal = 0;
    const setKQ = (n) => { tween(kqVal, n, 900, (v) => { kq.textContent = v; }); kqVal = n; paintTier(kq, pill, n); bump(kq); };
    const addTag = (t) => { const s = document.createElement('span'); s.textContent = t; tags.appendChild(s); };

    if (reduced.matches) {
      addTag('Security'); addTag('Family'); kq.textContent = '82'; paintTier(kq, pill, 82); setMeter(meter, 4); starter.textContent = STARTER;
      return;
    }
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const play = async () => {
      await sleep(900);
      addTag('Security'); setMeter(meter, 1); setKQ(24); await sleep(900);
      addTag('Family'); setMeter(meter, 2); setKQ(46); await sleep(900);
      setMeter(meter, 3); setKQ(68); await sleep(800);
      setMeter(meter, 4); setKQ(82); await sleep(700);
      starter.classList.add('typing');
      await window.Knomee.typeText(starter, STARTER, 24);
      starter.classList.remove('typing');
    };
    if (!('IntersectionObserver' in window)) { play(); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); play(); } }, { threshold: 0.4 });
    io.observe(card);
  }

  /* =========================================================
     2. INTERACTIVE DISCOVERY — the live mirror
     ========================================================= */
  function mirror() {
    const wrap = $('.mirror');
    if (!wrap) return;
    const steps = $$('.q-step', wrap);
    const dots = $$('.dots li', wrap);
    const back = $('[data-back]', wrap);
    const nextBtn = $('[data-next]', wrap);
    const nav = $('.q-nav', wrap);
    const chipsBox = $('.q-chips', wrap);
    const chips = $$('.q-chip', wrap);
    const range = $('#q-conf', wrap);
    const events = $$('.q-event', wrap);
    const m = {
      kq: $('[data-m-kq]', wrap), tier: $('[data-m-tier]', wrap), meter: $('[data-m-meter]', wrap),
      values: $('[data-m-values]', wrap), conf: $('[data-m-conf]', wrap), event: $('[data-m-event]', wrap),
      starter: $('[data-m-starter]', wrap), mini: $('[data-mini-kq]', wrap),
    };
    const FEEL = { Security: 'secure', Family: 'close to family', Independence: 'independent', Comfort: 'comfortable', Moments: 'present', Choice: 'free to choose' };
    const EVENT_Q = { 'Retirement': 'retirement', 'New Business': 'the new business', 'Property Purchase': 'the new home', 'Education': 'education', 'New Baby': 'life with a new baby', 'Relocation': 'the move' };
    const EMPTY = '<span class="ma-empty">—</span>';
    // Each question belongs to its own Knomee adventure; the header follows along.
    const ADV = [['financial-joy', 'Financial Joy'], ['confidence', 'Confidence'], ['life-events', 'Life Events']];
    const adv = $('[data-adv]', wrap);
    const setAdv = (i) => {
      const [icon, name] = ADV[Math.min(i, ADV.length - 1)];
      const label = $('span', adv);
      if (label.textContent === name) return;
      $('img', adv).src = `../assets/adventures/${icon}.svg`;
      label.textContent = name;
      adv.classList.remove('swap'); void adv.offsetWidth; adv.classList.add('swap');
    };
    // The Confidence gauge: the needle follows the slider, its wedge lights up.
    const needle = $('.dial--try', wrap);
    const gaugeWord = $('[data-gauge-word]', wrap);
    const paintGauge = () => {
      const v = +range.value, word = v < 34 ? 'Weak' : v < 67 ? 'Moderate' : 'Strong';
      needle.style.setProperty('--a', (-88 + v * 1.76).toFixed(1) + 'deg');
      $$('path[data-w]', needle).forEach((p) => p.classList.toggle('on', p.dataset.w === word));
      if (gaugeWord.textContent !== word) { gaugeWord.textContent = word; gaugeWord.classList.remove('swap'); void gaugeWord.offsetWidth; gaugeWord.classList.add('swap'); }
    };

    let at = 0, kqShown = 0;
    const st = { values: [], conf: 50, confTouched: false, event: null };

    const flash = (el) => { const row = el.closest('div'); row.classList.remove('flash'); void row.offsetWidth; row.classList.add('flash'); };
    const confWord = (v) => (v < 34 ? 'Weak' : v < 67 ? 'Moderate' : 'Strong');
    const score = () => {
      if (!st.values.length) return null;
      const s = 22 + st.values.length * 12 + (st.confTouched ? st.conf * 0.38 : 0) + (st.event ? 12 : 0);
      return Math.max(0, Math.min(96, Math.round(s)));
    };
    const paintScore = () => {
      const s = score();
      if (s === null) {
        m.kq.textContent = '–'; m.kq.className = 'kq kq-lg tier-3';
        m.tier.className = 'tier-pill tier-pill--nurture'; m.tier.textContent = 'Nurture';
        m.mini.textContent = '–'; m.mini.className = 'kq tier-3';
        setMeter(m.meter, 0); kqShown = 0; return;
      }
      tween(kqShown, s, 700, (v) => { m.kq.textContent = v; m.mini.textContent = v; });
      kqShown = s; paintTier(m.kq, m.tier, s); paintTier(m.mini, null, s); bump(m.kq); bump(m.mini);
      setMeter(m.meter, Math.ceil(s / 20));
    };
    const paintValues = () => { m.values.innerHTML = st.values.length ? st.values.map((v) => `<span class="ma-pill">${v}</span>`).join('') : EMPTY; flash(m.values); };
    const paintConf = () => { m.conf.className = ''; m.conf.textContent = `${confWord(st.conf)} · ${st.conf}`; flash(m.conf); };
    const paintEvent = () => {
      const b = events.find((e) => e.dataset.event === st.event);
      m.event.innerHTML = b ? `<img src="${$('img', b).getAttribute('src')}" alt="">${st.event}` : EMPTY;
      flash(m.event);
    };

    // No error copy: a gentle shake says "choose something first".
    const nudge = () => { const s = steps[at]; s.classList.remove('shake'); void s.offsetWidth; s.classList.add('shake'); };
    const go = (i) => {
      const dir = i > at ? 1 : -1;
      steps.forEach((s, n) => { s.hidden = n !== i; s.classList.remove('is-entering', 'is-entering-back', 'shake'); });
      void steps[i].offsetWidth;
      steps[i].classList.add(dir > 0 ? 'is-entering' : 'is-entering-back');
      at = i; setAdv(i);
      dots.forEach((d, n) => { d.classList.toggle('on', n === i); d.classList.toggle('done', n < i); });
      back.classList.toggle('is-visible', i > 0 && i < 3);
      nav.classList.toggle('is-final', i === 3);
    };

    chips.forEach((c) => c.addEventListener('click', () => {
      const v = c.dataset.value;
      const on = c.getAttribute('aria-pressed') === 'true';
      if (!on && st.values.length >= 2) { nudge(); return; }
      c.setAttribute('aria-pressed', String(!on));
      st.values = on ? st.values.filter((x) => x !== v) : [...st.values, v];
      chipsBox.classList.toggle('is-full', st.values.length >= 2);
      paintValues(); paintScore();
    }));

    const paintRange = () => { range.style.setProperty('--p', range.value + '%'); paintGauge(); };
    range.addEventListener('input', () => { st.conf = +range.value; st.confTouched = true; paintRange(); paintConf(); paintScore(); });
    paintRange();

    const pick = (b) => {
      events.forEach((e) => { const on = e === b; e.setAttribute('aria-checked', String(on)); e.tabIndex = on ? 0 : -1; });
      st.event = b.dataset.event; paintEvent(); paintScore();
    };
    events.forEach((b, i) => {
      b.tabIndex = i === 0 ? 0 : -1;
      b.addEventListener('click', () => pick(b));
      b.addEventListener('keydown', (e) => {
        const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
        if (!d) return;
        e.preventDefault();
        const n = events[(i + d + events.length) % events.length];
        n.focus(); pick(n);
      });
    });

    nextBtn.addEventListener('click', async () => {
      if (at === 0 && !st.values.length) { nudge(); return; }
      if (at === 1 && !st.confTouched) { st.confTouched = true; paintConf(); paintScore(); }
      if (at === 2 && !st.event) { nudge(); return; }
      if (at < 2) { go(at + 1); const f = $('button, input', steps[at]); if (f) f.focus({ preventScroll: true }); return; }

      const r = nextBtn.getBoundingClientRect();
      go(3);
      const text = `“What would ${EVENT_Q[st.event]} need to look like for you to feel ${FEEL[st.values[0]]}?”`;
      confetti(r.left + r.width / 2, r.top + r.height / 2, 70);
      m.starter.classList.add('typing');
      await window.Knomee.typeText(m.starter, text, 18);
      m.starter.classList.remove('typing');
      flash(m.starter);
    });
    back.addEventListener('click', () => { if (at > 0) go(at - 1); });

    $('[data-restart]', wrap).addEventListener('click', () => {
      st.values = []; st.conf = 50; st.confTouched = false; st.event = null;
      chips.forEach((c) => c.setAttribute('aria-pressed', 'false')); chipsBox.classList.remove('is-full');
      range.value = 50; paintRange();
      events.forEach((e, i) => { e.setAttribute('aria-checked', 'false'); e.tabIndex = i === 0 ? 0 : -1; });
      m.values.innerHTML = EMPTY; m.conf.className = 'ma-empty'; m.conf.textContent = '—';
      m.event.innerHTML = EMPTY; m.starter.innerHTML = EMPTY;
      paintScore(); go(0); chips[0].focus({ preventScroll: true });
    });

    go(0);
  }

  /* =========================================================
     3. FEATURE EXPLORER — advances when its progress line fills
     ========================================================= */
  function explorer() {
    const sec = $('.explorer');
    const wrap = sec && $('[data-tabs]', sec);
    if (!wrap) return;
    $$('.panel', sec).forEach((p) => $$('.ui-group, .ui-row, .uc-card, .us-q, .us-values', p).forEach((el, i) => el.style.setProperty('--r', i)));
    if (reduced.matches) return;
    const tabs = $$('[role="tab"]', wrap);
    let hover = false, focus = false, inView = false;
    const paint = () => sec.classList.toggle('is-paused', hover || focus || !inView);
    sec.addEventListener('pointerenter', () => { hover = true; paint(); });
    sec.addEventListener('pointerleave', () => { hover = false; paint(); });
    sec.addEventListener('focusin', () => { focus = true; paint(); });
    sec.addEventListener('focusout', (e) => { if (!sec.contains(e.relatedTarget)) { focus = false; paint(); } });
    if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => { inView = e.isIntersecting; paint(); }, { threshold: 0.35 }).observe(sec);
    paint();
    tabs.forEach((t, i) => $('.ex-n', t).addEventListener('animationend', () => {
      if (t.getAttribute('aria-selected') === 'true' && wrap._select) wrap._select((i + 1) % tabs.length);
    }));
  }

  const init = () => { heroCard(); mirror(); explorer(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

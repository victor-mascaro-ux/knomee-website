/* ============================================================
   V1 · "Both sides"
   1. Under the hero: a prospect answers on their phone and Jordan's
      card beside it fills in.
   2. Interactive discovery: three product questions; the advisor
      view beside them updates live.
   3. The feature explorer's pinned list follows the feature you've
      scrolled to.
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
  const STAGES = ['Pre-Contemplation', 'Contemplation', 'Preparation', 'Action', 'Maintenance'];
  function setMeter(meter, k, stageEl) {
    $$('i', meter).forEach((bar, i) => bar.classList.toggle('on', i < k));
    if (stageEl) stageEl.textContent = k ? STAGES[k - 1] : '—';
  }

  /* =========================================================
     1. PROOF — the prospect's phone feeds Jordan's card, on a loop
        that pauses off screen, on the pause button and under reduced
        motion.
     ========================================================= */
  function stage() {
    const root = $('.stage');
    if (!root) return;
    const screen = $('.stage-phone .phone-screen', root);
    const scr = { values: $('.ps-values', root), confidence: $('.ps-confidence', root), done: $('.ps-done', root), fid: $('.ps-fid', root) };
    const chip = (v) => $(`.joy-photo[data-v="${v}"]`, root);
    const next = $('.ps-next', root);
    const tap = $('.ps-tap', root);
    const kq = $('[data-kq]', root);
    const pill = $('[data-tier]', root);
    const meter = $('[data-meter]', root);
    const stageWord = $('[data-stage]', root);
    const tags = $('[data-tags]', root);
    const starter = $('[data-starter]', root);
    const pauseBtn = $('.stage-pause', root);
    const STARTER = '“What would feeling secure look like for your family?”';

    let kqVal = 0, userPaused = false, inView = true;
    const playing = () => !userPaused && inView && !document.hidden;

    // A wait that only counts time while the demo is playing.
    const wait = (ms) => new Promise((res) => {
      let left = ms, last = performance.now();
      const tick = (now) => {
        if (playing()) left -= now - last;
        last = now;
        if (left <= 0) res(); else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });

    const show = (name) => {
      Object.values(scr).forEach((el) => {
        if (el.classList.contains('is-current') && el !== scr[name]) {
          el.classList.remove('is-current'); el.classList.add('is-leaving');
          setTimeout(() => el.classList.remove('is-leaving'), 500);
        }
      });
      scr[name].classList.add('is-current');
    };
    const tapOn = (el) => {
      const a = screen.getBoundingClientRect(), b = el.getBoundingClientRect();
      tap.style.left = (b.left - a.left + b.width / 2) + 'px';
      tap.style.top = (b.top - a.top + b.height / 2) + 'px';
      tap.classList.remove('is-tapping'); void tap.offsetWidth; tap.classList.add('is-tapping');
    };
    const setKQ = (n) => { tween(kqVal, n, 900, (v) => { kq.textContent = v; }); kqVal = n; paintTier(kq, pill, n); bump(kq); };
    const addTag = (t) => { const s = document.createElement('span'); s.textContent = t; tags.appendChild(s); };
    const type = async (text) => {
      starter.classList.add('typing');
      for (let i = 1; i <= text.length; i++) { starter.textContent = text.slice(0, i); await wait(26); }
      starter.classList.remove('typing');
    };

    const reset = () => {
      show('values');
      $$('.joy-photo', root).forEach((c) => c.classList.remove('is-on'));
      scr.confidence.classList.remove('is-strong');
      kqVal = 0; kq.textContent = '–'; paintTier(kq, pill, 0);
      setMeter(meter, 0, stageWord); tags.innerHTML = ''; starter.textContent = '';
    };

    if (reduced.matches) {
      show('fid'); scr.confidence.classList.add('is-strong');
      chip('security').classList.add('is-on'); chip('family').classList.add('is-on');
      addTag('Security'); addTag('Supporting my family'); kq.textContent = '82'; paintTier(kq, pill, 82); setMeter(meter, 4, stageWord); starter.textContent = STARTER;
      return;
    }

    (async function loop() {
      for (;;) {
        reset();
        await wait(1000);
        tapOn(chip('security')); await wait(180); chip('security').classList.add('is-on');
        await wait(260); addTag('Security'); setMeter(meter, 1, stageWord); setKQ(24);
        await wait(1100);
        tapOn(chip('family')); await wait(180); chip('family').classList.add('is-on');
        await wait(260); addTag('Supporting my family'); setMeter(meter, 2, stageWord); setKQ(46);
        await wait(1100);
        tapOn(next); next.classList.add('is-pressed'); await wait(160); next.classList.remove('is-pressed');
        await wait(200); show('confidence');
        await wait(700); scr.confidence.classList.add('is-strong');
        await wait(600); setMeter(meter, 3, stageWord); setKQ(68);
        await wait(800); setMeter(meter, 4, stageWord); setKQ(82);
        await wait(1400); show('done');
        await wait(2100); show('fid');
        await wait(700); await type(STARTER);
        await wait(4200);
      }
    })();

    pauseBtn.addEventListener('click', () => {
      userPaused = !userPaused;
      pauseBtn.setAttribute('aria-pressed', String(userPaused));
      pauseBtn.setAttribute('aria-label', userPaused ? 'Play' : 'Pause');
    });
    if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => { inView = e.isIntersecting; }, { threshold: 0.2 }).observe(root);
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
    const goals = $$('.goal-card', wrap);
    const range = $('#q-conf', wrap);
    const events = $$('.q-event', wrap);
    const m = {
      kq: $('[data-m-kq]', wrap), tier: $('[data-m-tier]', wrap), meter: $('[data-m-meter]', wrap),
      goal: $('[data-m-goal]', wrap), conf: $('[data-m-conf]', wrap), event: $('[data-m-event]', wrap),
      starter: $('[data-m-starter]', wrap), mini: $('[data-mini-kq]', wrap), stage: $('[data-m-stage]', wrap),
    };
    // The starter is the ask, built from the goal and the life event they chose.
    const EVENT_Q = { 'Retirement': 'retirement', 'New Business': 'the new business', 'Property Purchase': 'the property purchase', 'Graduation': 'the graduation', 'New Baby': 'the new baby', 'Relocation': 'the move' };
    const EMPTY = '<span class="ma-empty">—</span>';
    // Each question belongs to its own Knomee adventure; the header follows along.
    const ADV = [['goals', 'Goals'], ['confidence', 'Confidence'], ['life-events', 'Life Events']];
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
    const st = { goal: null, conf: 50, confTouched: false, event: null };

    const flash = (el) => { const row = el.closest('div'); row.classList.remove('flash'); void row.offsetWidth; row.classList.add('flash'); };
    const confWord = (v) => (v < 34 ? 'Weak' : v < 67 ? 'Moderate' : 'Strong');
    const score = () => {
      if (!st.goal) return null;
      const s = 30 + (st.confTouched ? st.conf * 0.4 : 0) + (st.event ? 14 : 0);
      return Math.max(0, Math.min(96, Math.round(s)));
    };
    const paintScore = () => {
      const s = score();
      if (s === null) {
        m.kq.textContent = '–'; m.kq.className = 'kq kq-lg tier-3';
        m.tier.className = 'tier-pill tier-pill--nurture'; m.tier.textContent = 'Nurture';
        m.mini.textContent = '–'; m.mini.className = 'kq tier-3';
        setMeter(m.meter, 0, m.stage); kqShown = 0; return;
      }
      tween(kqShown, s, 700, (v) => { m.kq.textContent = v; m.mini.textContent = v; });
      kqShown = s; paintTier(m.kq, m.tier, s); paintTier(m.mini, null, s); bump(m.kq); bump(m.mini);
      setMeter(m.meter, Math.ceil(s / 20), m.stage);
    };
    const paintGoal = () => { m.goal.innerHTML = st.goal ? `<span class="ma-pill">${st.goal}</span>` : EMPTY; flash(m.goal); };
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

    const sun = range.closest('[data-sun]');
    const paintRange = () => { sun.style.setProperty('--v', range.value); paintGauge(); };
    range.addEventListener('input', () => { st.conf = +range.value; st.confTouched = true; paintRange(); paintConf(); paintScore(); });
    paintRange();

    // Goals and life events are both single choices: click, or arrow keys to move and pick.
    const radios = (items, key, paint) => {
      const pick = (b) => {
        items.forEach((e) => { const on = e === b; e.setAttribute('aria-checked', String(on)); e.tabIndex = on ? 0 : -1; });
        st[key] = b.dataset[key]; paint(); paintScore();
      };
      items.forEach((b, i) => {
        b.tabIndex = i === 0 ? 0 : -1;
        b.addEventListener('click', () => pick(b));
        b.addEventListener('keydown', (e) => {
          const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
          if (!d) return;
          e.preventDefault();
          const n = items[(i + d + items.length) % items.length];
          n.focus(); pick(n);
        });
      });
      return () => items.forEach((e, i) => { e.setAttribute('aria-checked', 'false'); e.tabIndex = i === 0 ? 0 : -1; });
    };
    const clearGoals = radios(goals, 'goal', paintGoal);
    const clearEvents = radios(events, 'event', paintEvent);

    nextBtn.addEventListener('click', async () => {
      if (at === 0 && !st.goal) { nudge(); return; }
      if (at === 1 && !st.confTouched) { st.confTouched = true; paintConf(); paintScore(); }
      if (at === 2 && !st.event) { nudge(); return; }
      if (at < 2) { go(at + 1); const f = $('button, input', steps[at]); if (f) f.focus({ preventScroll: true }); return; }

      const r = nextBtn.getBoundingClientRect();
      go(3);
      const text = `Ask how ${EVENT_Q[st.event]} changes their plans for ${st.goal.toLowerCase()}.`;
      confetti(r.left + r.width / 2, r.top + r.height / 2, 70);
      m.starter.classList.add('typing');
      await window.Knomee.typeText(m.starter, text, 18);
      m.starter.classList.remove('typing');
      flash(m.starter);
    });
    back.addEventListener('click', () => { if (at > 0) go(at - 1); });

    $('[data-restart]', wrap).addEventListener('click', () => {
      st.goal = null; st.conf = 50; st.confTouched = false; st.event = null;
      clearGoals();
      range.value = 50; sun.classList.add('is-untouched'); paintRange();
      clearEvents();
      m.goal.innerHTML = EMPTY; m.conf.className = 'ma-empty'; m.conf.textContent = '—';
      m.event.innerHTML = EMPTY; m.starter.innerHTML = EMPTY;
      paintScore(); go(0); goals[0].focus({ preventScroll: true });
    });

    go(0);
  }

  /* =========================================================
     3. FEATURE EXPLORER — the pinned list follows the feature on screen
     ========================================================= */
  function explorer() {
    const sec = $('.explorer');
    if (!sec) return;
    const panels = $$('.panel', sec);
    const items = $$('.ex-item', sec);
    panels.forEach((p) => $$('.ui-group, .ui-row, .uc-card, .us-q, .us-values', p).forEach((el, i) => el.style.setProperty('--r', i)));
    if (!('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        items.forEach((it) => it.classList.toggle('is-active', it.getAttribute('href') === '#' + e.target.id));
      });
    }, { rootMargin: '-45% 0px -45% 0px' });
    panels.forEach((p) => io.observe(p));
  }

  const init = () => { stage(); mirror(); explorer(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

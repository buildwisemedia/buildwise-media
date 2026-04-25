/* COMPONENT 1: HERO — CSS animations only, no JS needed */

/* COMPONENT 2: TRUST BAR */
(function(){
(function() {
  const blocks = document.querySelectorAll('.stat-block');

  function animateCount(el, target, prefix, suffix, duration) {
    const start = performance.now();
    const isDecimal = target % 1 !== 0;

    function step(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * target);

      if (target <= 5) {
        const currentDec = (eased * target).toFixed(1);
        el.textContent = prefix + (progress >= 1 ? '3–5' : currentDec) + suffix;
      } else {
        el.textContent = prefix + current + (progress >= 1 ? suffix : '');
      }

      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const block = entry.target;
        block.classList.add('visible');

        const valueEl = block.querySelector('.stat-value');
        const target = parseFloat(block.dataset.target);
        const prefix = block.dataset.prefix || '';
        const suffix = block.dataset.suffix || '';
        const delay = parseFloat(getComputedStyle(valueEl).transitionDelay) * 1000 || 0;

        setTimeout(() => {
          animateCount(valueEl, target, prefix, suffix, 1400);
        }, delay);

        observer.unobserve(block);
      }
    });
  }, { threshold: 0.3 });

  blocks.forEach(block => observer.observe(block));
})();
})();

/* COMPONENT 3: POOR FOUR */
(function(){
(function() {
  const els = document.querySelectorAll('.section-label, .section-headline, .pain-card, .poor-four-link');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });
  els.forEach(el => observer.observe(el));
})();
})();

/* COMPONENT 4: SOLUTION BRIDGE */
(function(){
(function() {
  const els = document.querySelectorAll('.solution-divider, .solution-headline, .solution-body, .solution-guarantee, .solution-cta');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });
  els.forEach(el => observer.observe(el));
})();
})();

/* COMPONENT 5: RESULTS PREVIEW */
(function(){
(function() {
  // Scroll reveal
  const els = document.querySelectorAll('.section-label, .section-headline, .anchor-study, .spotlight-card, .results-link');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });
  els.forEach(el => observer.observe(el));

  // Quote carousel
  const slides = document.querySelectorAll('.quote-slide');
  const dots = document.querySelectorAll('.carousel-dot');
  let current = 0;
  let interval;
  const DURATION = 5000;

  function goTo(index) {
    slides[current].classList.remove('active');
    dots[current].classList.remove('active');
    dots[current].classList.add('done');

    current = index;

    // Reset all dot fills
    dots.forEach(d => d.classList.remove('done', 'active'));
    for (let i = 0; i < current; i++) dots[i].classList.add('done');
    dots[current].classList.add('active');

    slides[current].classList.add('active');
  }

  function advance() {
    goTo((current + 1) % slides.length);
  }

  function startAuto() {
    clearInterval(interval);
    interval = setInterval(advance, DURATION);
  }

  // Dot clicks
  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      goTo(parseInt(dot.dataset.index));
      startAuto(); // Reset timer on manual click
    });
  });

  // Pause on hover
  const carousel = document.getElementById('quoteCarousel');
  carousel.addEventListener('mouseenter', () => clearInterval(interval));
  carousel.addEventListener('mouseleave', startAuto);

  startAuto();
})();
})();

/* COMPONENT 6: ACCELERATION CURVE */
(function(){
// Node positions along the 7s energy cycle (matching animateMotion keyTimes)
// keyTimes: 0, 0.18, 0.36, 0.58, 0.78, 0.94
// In ms:    0, 1260, 2520, 4060, 5460, 6580
var nodes = [
  { idx: 0, time: 0,    color: '#7A6F63', big: false }, // 2023
  { idx: 1, time: 1260, color: '#7A6F63', big: false }, // 2024
  { idx: 2, time: 2520, color: '#7A6F63', big: false }, // 2025
  { idx: 3, time: 4060, color: '#5A9E6F', big: true  }, // NOW
  { idx: 4, time: 5460, color: '#D4943A', big: true  }, // MAY
  { idx: 5, time: 6580, color: '#5B8DB8', big: true  }, // DEC
];

var cycleDur = 7000;
var pulseRunning = false;

function pulseNode(node) {
  var g = document.querySelector('.curve-node[data-idx="' + node.idx + '"]');
  if (!g) return;
  var ring = g.querySelector('.node-pulse-ring');
  var glow = g.querySelector('.node-glow');

  // Pulse ring
  if (ring) {
    ring.style.transition = 'none';
    ring.setAttribute('r', node.big ? '14' : '12');
    ring.setAttribute('opacity', '0');
    requestAnimationFrame(function() {
      ring.style.transition = 'r 0.6s ease-out, opacity 0.6s ease-out';
      ring.setAttribute('r', node.big ? '28' : '20');
      ring.setAttribute('opacity', node.big ? '0.7' : '0.4');
      setTimeout(function() {
        ring.style.transition = 'r 0.8s ease-in, opacity 0.8s ease-in';
        ring.setAttribute('r', node.big ? '34' : '24');
        ring.setAttribute('opacity', '0');
      }, 600);
    });
  }

  // Glow flash (colored nodes only)
  if (glow) {
    glow.style.transition = 'none';
    glow.setAttribute('opacity', '0');
    glow.setAttribute('r', '7');
    requestAnimationFrame(function() {
      glow.style.transition = 'r 0.5s ease-out, opacity 0.5s ease-out';
      glow.setAttribute('r', node.big ? '18' : '12');
      glow.setAttribute('opacity', '0.5');
      setTimeout(function() {
        glow.style.transition = 'r 1s ease-in, opacity 1s ease-in';
        glow.setAttribute('r', '7');
        glow.setAttribute('opacity', '0');
      }, 500);
    });
  }
}

function startEnergyLoop() {
  if (pulseRunning) return;
  pulseRunning = true;

  var wrap = document.getElementById('curveWrap');
  wrap.classList.add('energy-active');

  function runCycle() {
    nodes.forEach(function(node) {
      setTimeout(function() { pulseNode(node); }, node.time);
    });
  }

  // First cycle
  runCycle();
  // Repeat
  setInterval(runCycle, cycleDur);
}

// Scroll observer
var observer = new IntersectionObserver(function(entries) {
  entries.forEach(function(entry) {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);

      // Start energy flow 3s after curve becomes visible (draw animation is 2.8s)
      if (entry.target.id === 'curveWrap') {
        setTimeout(startEnergyLoop, 3200);
      }
    }
  });
}, { threshold: 0.25, rootMargin: '0px 0px -100px 0px' });

document.querySelectorAll('.accel-label, .accel-headline, .accel-header-right, .power-strip, .accel-footer').forEach(function(el) {
  observer.observe(el);
});
// Curve wrap observed separately with id check
observer.observe(document.getElementById('curveWrap'));

// Stain word — progressive, irreversible
(function() {
  var word = document.getElementById('stainWord');
  if (!word) return;
  var hoverCount = 0;
  word.addEventListener('mouseenter', function() {
    hoverCount++;
    if (hoverCount === 1) { word.classList.add('stained'); }
    else if (hoverCount >= 2) { word.classList.remove('stained'); word.classList.add('deep-stain'); }
  });
  word.addEventListener('touchstart', function() {
    hoverCount++;
    if (hoverCount === 1) { word.classList.add('stained'); }
    else if (hoverCount >= 2) { word.classList.remove('stained'); word.classList.add('deep-stain'); }
  }, { passive: true });
})();
})();

/* COMPONENT 7: DOT GRID */
(function(){
// Build the grid
(function() {
  var grid = document.getElementById('dotGrid');
  if (!grid) return;
  var total = 2500;
  // 82.7% never (2068), 16.7% free (417), 0.5% paid (12), 0.1% build (3)
  var never = 2068, free = 417, paid = 12;

  for (var i = 0; i < total; i++) {
    var d = document.createElement('div');
    d.className = 'dot';
    if (i >= never + free + paid) d.className += ' ai-build';
    else if (i >= never + free) d.className += ' ai-paid';
    else if (i >= never) d.className += ' ai-free';
    d.dataset.row = Math.floor(i / 50);
    grid.appendChild(d);
  }
})();

// Row-by-row reveal animation
var revealStarted = false;
function revealDots() {
  if (revealStarted) return;
  revealStarted = true;

  var dots = document.querySelectorAll('.dot');
  var totalRows = 50;
  var dotsPerRow = 50;
  var baseDelay = 20; // ms per row — fast cascade

  for (var row = 0; row < totalRows; row++) {
    (function(r) {
      setTimeout(function() {
        for (var col = 0; col < dotsPerRow; col++) {
          var idx = r * dotsPerRow + col;
          if (dots[idx]) {
            // Slight random jitter within each row for organic feel
            var jitter = Math.random() * 40;
            (function(dot, j) {
              setTimeout(function() { dot.classList.add('revealed'); }, j);
            })(dots[idx], jitter);
          }
        }
      }, r * baseDelay);
    })(row);
  }
}

// Scroll observer
var observer = new IntersectionObserver(function(entries) {
  entries.forEach(function(entry) {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);

      // Trigger dot reveal when grid wrapper becomes visible
      if (entry.target.id === 'dotgridWrap') {
        setTimeout(revealDots, 300);
      }
    }
  });
}, { threshold: 0.2, rootMargin: '0px 0px -80px 0px' });

document.querySelectorAll('#dotgridWrap, #dotgridText, #dotgridCloser').forEach(function(el) {
  observer.observe(el);
});
})();

/* COMPONENT 8: THREE PHASES */
(function(){
// Scroll observer
var observer = new IntersectionObserver(function(entries) {
  entries.forEach(function(entry) {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);

      // Fire node pulses in sequence when timeline becomes visible
      if (entry.target.id === 'timeline') {
        setTimeout(function() {
          document.getElementById('phase1').classList.add('pulse-active');
        }, 800);
        setTimeout(function() {
          document.getElementById('phase2').classList.add('pulse-active');
        }, 1400);
        setTimeout(function() {
          document.getElementById('phase3').classList.add('pulse-active');
        }, 2000);
      }
    }
  });
}, { threshold: 0.2, rootMargin: '0px 0px -80px 0px' });

document.querySelectorAll('.phases-label, .phases-headline, .phases-subtext, .phase-card, .phases-cta-wrap').forEach(function(el) {
  observer.observe(el);
});
observer.observe(document.getElementById('timeline'));
})();

/* COMPONENT 9: COMPOUNDING SLIDER */
(function(){
(function() {
  var MONTHS = 12;
  var metrics = [
    { base: 8,  growth: 1.30, max: 200 },
    { base: 2,  growth: 1.22, max: 30 },
    { base: 2,  growth: 1.38, max: 200 },
    { base: 0,  growth: 0,    max: 18 }
  ];
  var narratives = [
    { max: 0,  text: 'Month zero. Your engine is about to go live.' },
    { max: 3,  text: "You're just getting started. The foundation is being laid." },
    { max: 6,  text: "The flywheel is spinning. Your competitors haven't noticed yet." },
    { max: 9,  text: "This is where the gap becomes a moat." },
    { max: 12, text: "By now, catching you costs them 10\u00d7 what it cost you to get here." }
  ];
  var punchlines = [
    { min: 6,  text: "This isn't a prediction. It's math." }
  ];
  var month = 0, isDragging = false, hasInteracted = false, animFrames = {};
  var track = document.getElementById('sliderTrack');
  var fill = document.getElementById('sliderFill');
  var thumb = document.getElementById('sliderThumb');
  var badge = document.getElementById('sliderBadge');
  var narr = document.getElementById('narrativeText');
  var ticksEl = document.getElementById('sliderTicks');
  if (!track) return;

  // Build ticks
  for (var i = 0; i <= MONTHS; i++) {
    var t = document.createElement('div');
    t.className = 'slider-tick';
    t.style.left = (i / MONTHS * 100) + '%';
    t.style.height = (i % 3 === 0 ? '12px' : '6px');
    t.style.top = '50%'; t.style.transform = 'translateX(-50%) translateY(-50%)';
    t.style.position = 'absolute'; t.style.width = '1px';
    t.style.background = '#2E2822';
    t.dataset.idx = i;
    ticksEl.appendChild(t);
  }

  // Build sparklines
  metrics.forEach(function(m, idx) {
    var wrap = document.getElementById('spark-' + idx);
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%'); svg.setAttribute('height', '32');
    svg.setAttribute('viewBox', '0 0 120 32'); svg.style.overflow = 'visible';
    var future = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    future.setAttribute('fill', 'none'); future.setAttribute('stroke', 'rgba(212,148,58,0.12)');
    future.setAttribute('stroke-width', '1.5'); future.setAttribute('stroke-dasharray', '3 3');
    future.id = 'spark-future-' + idx;
    var active = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    active.setAttribute('fill', 'none'); active.setAttribute('stroke', '#D4943A');
    active.setAttribute('stroke-width', '2'); active.setAttribute('stroke-linecap', 'round');
    active.setAttribute('stroke-linejoin', 'round'); active.id = 'spark-active-' + idx;
    var dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('r', '3'); dot.setAttribute('fill', '#D4943A');
    dot.setAttribute('stroke', '#1C1714'); dot.setAttribute('stroke-width', '2');
    dot.id = 'spark-dot-' + idx;
    svg.appendChild(future); svg.appendChild(active); svg.appendChild(dot); wrap.appendChild(svg);
  });

  function calcValue(base, growth, m) { return growth === 0 ? Math.round(m * 1.4) : Math.round(base * Math.pow(growth, m)); }
  function calcMult(growth, m) { return growth === 0 ? 0 : Math.pow(growth, m); }
  function getSparkPoints(mIdx) {
    var m = metrics[mIdx];
    var maxVal = m.growth === 0 ? MONTHS * 1.4 : m.base * Math.pow(m.growth, MONTHS);
    var pts = [];
    for (var i = 0; i <= MONTHS; i++) { var v = calcValue(m.base, m.growth, i); pts.push((4 + (i / MONTHS) * 112) + ',' + (28 - (v / maxVal) * 24)); }
    return pts;
  }
  function animateNumber(el, from, to, dur) {
    if (animFrames[el.id]) cancelAnimationFrame(animFrames[el.id]);
    var start = performance.now();
    function tick(now) { var p = Math.min((now - start) / dur, 1); var eased = 1 - Math.pow(1 - p, 3); el.textContent = Math.round(from + (to - from) * eased).toLocaleString(); if (p < 1) animFrames[el.id] = requestAnimationFrame(tick); }
    animFrames[el.id] = requestAnimationFrame(tick);
  }
  function update(newMonth) {
    var prev = month; month = newMonth;
    var pct = (month / MONTHS) * 100;
    fill.style.width = pct + '%'; thumb.style.left = pct + '%';
    if (isDragging) { fill.classList.add('dragging'); thumb.classList.add('dragging'); } else { fill.classList.remove('dragging'); thumb.classList.remove('dragging'); }
    ticksEl.querySelectorAll('.slider-tick').forEach(function(t) { t.style.background = parseInt(t.dataset.idx) <= month ? '#D4943A' : '#2E2822'; t.style.opacity = parseInt(t.dataset.idx) <= month ? '0.5' : '1'; });
    var avgMult = metrics.filter(function(m){return m.growth > 0}).reduce(function(a, m){return a + calcMult(m.growth, month)}, 0) / metrics.filter(function(m){return m.growth > 0}).length;
    badge.innerHTML = month === 0 ? 'Today' : 'Month ' + month + '<span class="slider-badge-sub">' + avgMult.toFixed(1) + '\u00d7 avg. growth</span>';
    metrics.forEach(function(m, idx) {
      var val = calcValue(m.base, m.growth, month); var prevVal = calcValue(m.base, m.growth, prev);
      var mult = calcMult(m.growth, month);
      var valEl = document.getElementById('val-' + idx); var multEl = document.getElementById('mult-' + idx); var barEl = document.getElementById('bar-' + idx);
      animateNumber(valEl, prevVal, val, 500);
      if (month === 0) valEl.classList.add('zero'); else valEl.classList.remove('zero');
      if (month > 0 && m.growth > 0) { multEl.textContent = mult.toFixed(1) + '\u00d7 from start'; }
      else if (month > 0 && m.growth === 0) { multEl.textContent = val + ' months ahead'; }
      else { multEl.textContent = ''; }
      var barPct = m.growth > 0 ? Math.min((mult / calcMult(m.growth, MONTHS)) * 100, 100) : Math.min((val / m.max) * 100, 100);
      barEl.style.width = barPct + '%';
      var pts = getSparkPoints(idx); var activePts = pts.slice(0, month + 1); var futurePts = pts.slice(month);
      document.getElementById('spark-active-' + idx).setAttribute('points', activePts.join(' '));
      document.getElementById('spark-future-' + idx).setAttribute('points', futurePts.join(' '));
      var lastPt = activePts[activePts.length - 1].split(',');
      var dot = document.getElementById('spark-dot-' + idx); dot.setAttribute('cx', lastPt[0]); dot.setAttribute('cy', lastPt[1]);
    });
    var txt = narratives[0].text;
    for (var n = 0; n < narratives.length; n++) { if (month <= narratives[n].max) { txt = narratives[n].text; break; } }
    var punch = '';
    for (var p = 0; p < punchlines.length; p++) { if (month >= punchlines[p].min) punch = punchlines[p].text; }
    narr.innerHTML = txt + (punch ? '<div class="punchline">' + punch + '</div>' : '');
  }
  function getMonthFromX(clientX) { var rect = track.getBoundingClientRect(); return Math.round(Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)) * MONTHS); }

  track.addEventListener('mousedown', function(e) { isDragging = true; hasInteracted = true; thumb.classList.remove('nudge'); update(getMonthFromX(e.clientX)); });
  track.addEventListener('touchstart', function(e) { isDragging = true; hasInteracted = true; thumb.classList.remove('nudge'); update(getMonthFromX(e.touches[0].clientX)); }, { passive: true });
  window.addEventListener('mousemove', function(e) { if (isDragging) { e.preventDefault(); update(getMonthFromX(e.clientX)); } });
  window.addEventListener('touchmove', function(e) { if (isDragging) update(getMonthFromX(e.touches[0].clientX)); }, { passive: true });
  window.addEventListener('mouseup', function() { isDragging = false; update(month); });
  window.addEventListener('touchend', function() { isDragging = false; update(month); });

  // Auto-advance hint if user hasn't interacted
  setTimeout(function() { if (hasInteracted) return; thumb.classList.remove('nudge'); var m = 0; var iv = setInterval(function() { m++; update(m); if (m >= 3 || hasInteracted) clearInterval(iv); }, 450); }, 2500);

  // Start with nudge animation
  thumb.classList.add('nudge');

  update(0);
})();

// Scroll observer
var observer = new IntersectionObserver(function(entries) {
  entries.forEach(function(entry) {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

document.querySelectorAll('.compound-label, .compound-headline, .compound-subtext, .slider-wrap, .metric-grid, .slider-narrative').forEach(function(el) {
  observer.observe(el);
});
})();

/* COMPONENT 10: ENGINE RUNS */
(function(){
// ═══ LIVE METRICS — smooth counting animation ═══
var engineRunning = false;
var counters = {
  attract: { el: null, val: 0, target: 47, speed: 280 },
  nurture: { el: null, val: 0, target: 312, speed: 45 },
  convert: { el: null, val: 0, target: 18, speed: 800 },
  optimize: { el: null, val: 0, target: 14, speed: 1100 }
};

function startCounters() {
  if (engineRunning) return;
  engineRunning = true;

  counters.attract.el = document.getElementById('attract-val');
  counters.nurture.el = document.getElementById('nurture-val');
  counters.convert.el = document.getElementById('convert-val');
  counters.optimize.el = document.getElementById('optimize-val');

  // Animate each counter to its target over ~3 seconds
  Object.keys(counters).forEach(function(key) {
    var c = counters[key];
    var duration = 2800;
    var start = performance.now();
    function tick(now) {
      var p = Math.min((now - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      c.val = Math.round(c.target * eased);
      c.el.textContent = c.val;
      if (p < 1) requestAnimationFrame(tick);
      else {
        // After reaching target, slowly increment
        startLiveIncrement(key);
      }
    }
    requestAnimationFrame(tick);
  });

  // Activate particles
  document.querySelectorAll('.flow-particle').forEach(function(p) {
    p.classList.add('active');
  });

  // Start activity feed
  startActivityFeed();
}

function startLiveIncrement(key) {
  var c = counters[key];
  setInterval(function() {
    c.val++;
    c.el.textContent = c.val;
  }, c.speed + Math.random() * c.speed * 0.5);
}

// ═══ ACTIVITY FEED ═══
var activities = [
  { icon: 'lead', emoji: '↗', text: '+1 Lead — HVAC, Atlanta' },
  { icon: 'ad', emoji: '◆', text: 'Ad Creative #14 deployed' },
  { icon: 'followup', emoji: '↩', text: 'Follow-up sent — 2m response' },
  { icon: 'book', emoji: '✓', text: 'Consultation booked — 10:30am' },
  { icon: 'optimize', emoji: '⟳', text: 'Creative #9 paused — low CTR' },
  { icon: 'lead', emoji: '↗', text: '+1 Lead — Remodeler, Denver' },
  { icon: 'ad', emoji: '◆', text: 'Ad set budget shifted +$4' },
  { icon: 'followup', emoji: '↩', text: 'SMS reminder sent — tomorrow' },
  { icon: 'book', emoji: '✓', text: 'Consultation booked — 2:00pm' },
  { icon: 'optimize', emoji: '⟳', text: 'Creative #15 winning — scaled' },
  { icon: 'lead', emoji: '↗', text: '+1 Lead — Med Spa, Phoenix' },
  { icon: 'ad', emoji: '◆', text: 'New angle test: social proof' },
  { icon: 'followup', emoji: '↩', text: 'Follow-up #3 sent — nurture' },
  { icon: 'book', emoji: '✓', text: 'Consultation booked — 9:15am' },
  { icon: 'optimize', emoji: '⟳', text: 'Landing page A/B: +12% CVR' },
  { icon: 'lead', emoji: '↗', text: '+1 Lead — Pest Control, Tampa' },
  { icon: 'ad', emoji: '◆', text: 'Video creative #3 launched' },
  { icon: 'followup', emoji: '↩', text: 'Email drip — day 3 sent' },
  { icon: 'book', emoji: '✓', text: 'Consultation booked — 11:45am' },
  { icon: 'optimize', emoji: '⟳', text: 'Geo target tightened — +15mi' },
];

var activityIdx = 0;
var maxVisible = 6;

function addActivity() {
  var list = document.getElementById('activityList');
  var a = activities[activityIdx % activities.length];
  activityIdx++;

  var item = document.createElement('div');
  item.className = 'activity-item';

  var times = ['just now', '12s ago', '28s ago', '1m ago', '2m ago', '3m ago'];
  var timeIdx = Math.min(list.children.length, times.length - 1);

  item.innerHTML = '<div class="activity-icon ' + a.icon + '">' + a.emoji + '</div>' +
    '<span class="activity-text">' + a.text + '</span>' +
    '<span class="activity-time">just now</span>';

  // Update all existing items' timestamps
  var items = list.querySelectorAll('.activity-item');
  for (var i = 0; i < items.length; i++) {
    var t = items[i].querySelector('.activity-time');
    if (t) t.textContent = times[Math.min(i + 1, times.length - 1)];
  }

  // Insert at top
  list.insertBefore(item, list.firstChild);

  // Remove overflow
  while (list.children.length > maxVisible) {
    list.removeChild(list.lastChild);
  }
}

function startActivityFeed() {
  // Seed first few
  addActivity();
  setTimeout(addActivity, 400);
  setTimeout(addActivity, 900);
  setTimeout(addActivity, 1500);

  // Then drip new ones
  setInterval(function() {
    addActivity();
  }, 2800 + Math.random() * 1500);
}

// ═══ SCROLL OBSERVER ═══
var observer = new IntersectionObserver(function(entries) {
  entries.forEach(function(entry) {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);

      if (entry.target.id === 'dashboard') {
        setTimeout(startCounters, 600);
      }
    }
  });
}, { threshold: 0.2, rootMargin: '0px 0px -80px 0px' });

document.querySelectorAll('.engine-label, .engine-headline, .engine-subtext, #dashboard, .engine-testimonial, .engine-cta-wrap').forEach(function(el) {
  observer.observe(el);
});
})();

/* COMPONENT 11: WHY BUILDWISE PREVIEW */
(function(){
// IntersectionObserver — animate on scroll
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.why-label, .why-headline, .why-body, .stat-card, .why-cta-wrap').forEach(el => {
  observer.observe(el);
});
})();

/* COMPONENT 12: INDUSTRIES */
(function(){
var observer = new IntersectionObserver(function(entries) {
  entries.forEach(function(entry) {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

document.querySelectorAll('.ind-label, .ind-headline, .ind-subtext, .hero-card, .compact-card, .ind-fallback').forEach(function(el) {
  observer.observe(el);
});
})();

/* COMPONENT 13: OBJECTION HANDLER */
(function(){
(function() {
  const els = document.querySelectorAll('.section-label, .section-headline, .column-label, .doubt-card, .proof-card');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  els.forEach(el => observer.observe(el));
})();
})();

/* COMPONENT 14: FAQ */
function toggleFaq(trigger) {
  const item = trigger.closest('.faq-item');
  const wasOpen = item.classList.contains('open');

  // Close all
  document.querySelectorAll('.faq-item.open').forEach(el => el.classList.remove('open'));

  // Toggle clicked (if it wasn't already open)
  if (!wasOpen) item.classList.add('open');
}

(function() {
  const els = document.querySelectorAll('.section-label, .section-headline, .faq-item');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  els.forEach(el => observer.observe(el));
})();

/* COMPONENT 15: FINAL CTA */
(function(){
(function() {
  const els = document.querySelectorAll('.cta-divider, .cta-headline, .cta-body, .cta-qualifier, .cta-button-wrap, .cta-trust');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });
  els.forEach(el => observer.observe(el));
})();
})();

/* Nav hamburger */
document.getElementById('navHamburger').addEventListener('click',function(){document.getElementById('navMobileMenu').classList.toggle('active');});


/* Sticky mobile CTA */
(function(){var hero=document.querySelector('.hero');var sticky=document.getElementById('stickyMobileCta');if(!hero||!sticky)return;var obs=new IntersectionObserver(function(e){sticky.classList.toggle('visible',!e[0].isIntersecting);},{threshold:0});obs.observe(hero);})();

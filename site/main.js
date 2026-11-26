import { DATA } from './data.js';
import { buildUI } from './ui.js';
import { createScene } from './scene.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
let lenis = null;
const scrollTo = (target) => {
  const el = document.querySelector(target);
  if (!el) return;
  lenis ? lenis.scrollTo(el, { duration: 1.6 }) : el.scrollIntoView({ behavior: 'smooth' });
};

const ui = buildUI(DATA, { onNav: scrollTo });

// ── loader
const loader = document.getElementById('loader');
const loaderNum = document.getElementById('loaderNum');
const loaderBar = document.getElementById('loaderBar');
let shown = 0, target = 8, ready = false, revealed = false;

await Promise.race([
  Promise.all([
    document.fonts.load('800 100px Unbounded'),
    document.fonts.load('600 20px Unbounded'),
    document.fonts.load('700 20px "JetBrains Mono"'),
    document.fonts.load('600 20px Manrope'),
  ]),
  new Promise((r) => setTimeout(r, 2500)),
]).catch(() => {});
target = 45;

const scene = createScene(document.getElementById('webgl'), DATA);
scene.resize();
target = 100; ready = true;

// ── smooth scroll
if (window.Lenis && !reduce) {
  lenis = new window.Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 0.9 });
  lenis.stop();
}

// ── section anchors → continuous progress p (0 … sections-1)
let anchors = [];
const measure = () => {
  const vh = innerHeight;
  anchors = ui.sections.map((s) => s.offsetTop + Math.max(0, (s.offsetHeight - vh) / 2));
};
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const progress = (y) => {
  if (y <= anchors[0]) return 0;
  for (let i = 0; i < anchors.length - 1; i++) {
    if (y < anchors[i + 1]) return i + smooth(0.1, 0.9, (y - anchors[i]) / (anchors[i + 1] - anchors[i]));
  }
  return anchors.length - 1;
};
measure();
addEventListener('resize', () => { scene.resize(); measure(); });
addEventListener('load', measure);

addEventListener('pointermove', (e) => {
  const overUI = !!e.target.closest('a, button, .ach__item, .prog, .stat, .nav, .vid, .thumb, .feat, .xp__item, .skills');
  scene.setPointer(e.clientX, e.clientY, overUI);
});
addEventListener('click', (e) => { if (!e.target.closest('a, button')) scene.click(); });

// ── loop
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  lenis?.raf(now);

  if (!revealed) {
    shown += (target - shown) * Math.min(1, dt * 6) + dt * 20;
    shown = Math.min(shown, target);
    if (location.search.includes('shot=')) shown = target;
    loaderNum.textContent = Math.floor(shown);
    loaderBar.style.width = shown + '%';
    if (ready && shown >= 99.5) {
      revealed = true;
      loader.classList.add('out');
      document.body.classList.remove('loading');
      lenis?.start();
      scene.start(now / 1000 + 0.25);
      setTimeout(() => ui.start(), 350);
      measure();
      // ?shot=<section id> jumps straight to a section (used to make the screenshots in the build guide)
      const shot = new URLSearchParams(location.search).get('shot');
      if (shot && document.getElementById(shot)) {
        const el = document.getElementById(shot);
        const y = el.offsetTop + Math.max(0, (el.offsetHeight - innerHeight) / 2);
        lenis ? lenis.scrollTo(y, { immediate: true }) : scrollTo(0, y);
      }
    }
  }

  const y = lenis ? lenis.scroll : scrollY;
  const p = progress(y);
  const r = scene.update(dt, now / 1000, p, lenis ? lenis.velocity : 0);
  ui.update(p, r.tip, r.hot);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

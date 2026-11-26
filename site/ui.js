// DOM: builds every section from DATA, text reveals, counters, cursor, HUD, video showcase.
export function fmt(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1e4) return Math.round(n / 1e3) + 'K';
  return Math.round(n).toLocaleString('en-US');
}
const initials = (s) => s.split(/\s+/).map((w) => w[0] || '').join('').slice(0, 2).toUpperCase();
const arrow = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const icoOn = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg>';
const icoOff = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="m22 9-6 6M16 9l6 6"/></svg>';
const VOLUME = 0.12;

export function buildUI(D, { onNav }) {
  const $ = (s) => document.querySelector(s);
  $('#navLogo').innerHTML = `<img src="${D.avatar}" alt=""><span>${D.brand}</span><i class="nav__check" aria-label="Verified on X">✓</i>`;

  $('#home').innerHTML = `
    <div class="col">
      <p class="kicker fade"><img class="chip-av" src="${D.avatar}" alt=""><span class="dot"></span>${D.handle} · ${D.status}</p>
      <h1 class="rv">Hi, I'm<br><span class="hl">${D.firstName}</span><br>${D.lastName}</h1>
      <p class="role fade">${D.roles.join('<i>✦</i>')}</p>
      <p class="lead fade">${D.intro}</p>
      <div class="ctas fade">
        <a class="btn" href="#work" data-nav>Watch my content ${arrow}</a>
        <a class="btn btn--ghost" href="${D.calendly}" target="_blank" rel="noopener">Book a call</a>
      </div>
    </div>
    <div class="scroll-hint fade"><span></span>Scroll to explore</div>`;

  $('#about').innerHTML = `
    <div class="col">
      <p class="kicker fade"><b>01</b> About · ${D.brand}</p>
      <h2 class="rv">${D.about.title}</h2>
      <p class="lead fade">${D.about.body}</p>
      <div class="stats">${D.stats.map((s) => `
        <div class="stat fade"><div class="stat__v" data-count="${s.value}" data-suffix="${s.suffix}">0</div><div class="stat__l">${s.label}</div></div>`).join('')}
      </div>
    </div>`;

  const F = D.featured;
  $('#achievements').innerHTML = `
    <div class="col">
      <p class="kicker fade"><b>02</b> Achievements</p>
      <h2 class="rv">Wins I'm <span class="hl">proud</span> of.</h2>
      <a class="feat fade" href="${F.url}" target="_blank" rel="noopener">
        <div class="feat__img"><img src="${F.image}" alt="${F.title} game jam artwork" loading="lazy"></div>
        <div class="feat__body">
          <span class="feat__kick">${F.kicker}</span>
          <div class="feat__title">${F.title} <span class="feat__prize">${F.prize}</span></div>
          <p>${F.body}</p>
          <span class="feat__link">View the winners post ${arrow}</span>
        </div>
      </a>
      <div class="ach">${D.achievements.slice(1).map((a) => `
        <div class="ach__item fade"><span class="ach__big">${a.big}</span><div><div class="ach__title">${a.title}</div><div class="ach__org">${a.org}</div></div><span class="tag">${a.tag}</span></div>`).join('')}
      </div>
    </div>`;

  const marq = [...D.programs, ...D.programs].map((p) => `<span>${p.name}</span>`).join('');
  $('#programs').innerHTML = `
    <div class="col">
      <p class="kicker fade"><b>03</b> Creator & Ambassador Programs</p>
      <h2 class="rv">Programs I <span class="hl">create</span> for.</h2>
      <div class="progs">${D.programs.map((p) => `
        <${p.url ? `a href="${p.url}" target="_blank" rel="noopener"` : 'div'} class="prog fade"><div class="prog__logo${p.logo ? ' has-img' : ''}">${p.logo ? `<img src="${p.logo}" alt="${p.name} logo" loading="lazy">` : initials(p.name)}</div><div><div class="prog__name">${p.name}</div><div class="prog__meta">${p.role}</div></div></${p.url ? 'a' : 'div'}>`).join('')}
      </div>
    </div>
    <div class="marquee" aria-hidden="true"><div class="marquee__track">${marq}${marq}</div></div>`;

  $('#experience').innerHTML = `
    <div class="col">
      <p class="kicker fade"><b>04</b> Experience</p>
      <h2 class="rv">From bug hunts to <span class="hl">brand</span> content.</h2>
      <div class="xp">${D.experience.map((x) => `
        <div class="xp__item fade"><span class="xp__dot"></span><div><div class="xp__role">${x.role}</div><div class="xp__co">${x.co}</div></div><span class="xp__when">${x.when}</span></div>`).join('')}
      </div>
      <div class="skills fade">${D.skills.map((s) => `<span>${s}</span>`).join('')}</div>
    </div>`;

  $('#work').innerHTML = `
    <div class="wrap">
      <div class="show__head">
        <div>
          <p class="kicker fade"><b>05</b> Content showcase</p>
          <h2 class="rv">My best <span class="hl">content</span>.</h2>
        </div>
        <button class="sound fade" id="soundBtn" type="button" aria-pressed="false">${icoOff}<span>Sound off</span></button>
      </div>
      <div class="bento">${D.videos.map((v, i) => `
        <figure class="vid vid--${v.ratio} fade" style="--i:${i}">
          <video src="${v.src}" poster="${v.poster}" muted loop playsinline preload="metadata"></video>
          <figcaption>
            <span class="tag">${v.tag}</span>
            <span class="vid__title">${v.title}</span>
            <a class="vid__link" href="${v.url}" target="_blank" rel="noopener" aria-label="Open on X">${arrow}</a>
          </figcaption>
          <button class="vid__mute" type="button" aria-label="Toggle sound">${icoOff}</button>
          <span class="vid__bar"><i></i></span>
        </figure>`).join('')}
      </div>
      <div class="thumbs">${D.thumbs.map((t) => `
        <figure class="thumb fade"><img src="${t.src}" alt="${t.label}" loading="lazy"><figcaption>${t.label}</figcaption></figure>`).join('')}
      </div>
    </div>`;

  // trusted-by strip (every logo is a link)
  $('#trusted').innerHTML = `
    <p class="trusted__label fade">Created for & worked with</p>
    <div class="trusted__row">${D.trusted.map((b) => `
      <${b.url ? `a href="${b.url}" target="_blank" rel="noopener"` : 'span'} class="brand fade">${b.logo ? `<img src="${b.logo}" alt="">` : ''}<span>${b.name}</span></${b.url ? 'a' : 'span'}>`).join('')}
    </div>`;

  // how I work: three clay cards joined by a curve
  $('#process').innerHTML = `
    <div class="wrap">
      <p class="kicker kicker--c fade">How a campaign works</p>
      <h2 class="rv proc__h">Here's how <span class="hl">we work</span>.</h2>
      <div class="steps">
        <svg class="steps__line" viewBox="0 0 1000 200" preserveAspectRatio="none" aria-hidden="true"><path d="M60 120 C 220 10, 330 10, 500 100 S 790 200, 940 80" /></svg>
        ${D.process.map((s, i) => `
        <div class="step fade" style="--r:${[-4, 3, -2][i]}deg">
          <span class="step__n">${s.n}</span>
          <span class="step__ico">${['🎮', '🎬', '📈'][i]}</span>
          <h3>${s.title}</h3>
          <p>${s.body}</p>
        </div>`).join('')}
      </div>
    </div>`;

  // layered paper-cut CTA panel
  const hole = (cx, cy, rx, ry, amp, ph) => {
    const pts = [];
    for (let i = 0; i < 48; i++) {
      const a = (i / 48) * Math.PI * 2;
      const w = 1 + amp * (Math.sin(a * 3 + ph) * 0.6 + Math.sin(a * 5 - ph * 1.7) * 0.4);
      pts.push([cx + Math.cos(a) * rx * w, cy + Math.sin(a) * ry * w]);
    }
    let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
    for (let i = 0; i < pts.length; i++) {
      const p1 = pts[(i + 1) % pts.length], p2 = pts[(i + 2) % pts.length];
      d += ` Q${p1[0].toFixed(1)} ${p1[1].toFixed(1)} ${((p1[0] + p2[0]) / 2).toFixed(1)} ${((p1[1] + p2[1]) / 2).toFixed(1)}`;
    }
    return `M-20 -20 H1020 V620 H-20 Z ${d} Z`;
  };
  const layers = [
    { c: '#3a2bb8', rx: 560, ry: 360, amp: 0.05, ph: 0.4, dep: 6 },
    { c: '#4a3bdc', rx: 510, ry: 320, amp: 0.07, ph: 1.6, dep: 12 },
    { c: '#5e4ff2', rx: 470, ry: 290, amp: 0.08, ph: 2.9, dep: 18 },
    { c: '#7666f7', rx: 440, ry: 268, amp: 0.09, ph: 4.2, dep: 26 },
  ];
  const C = D.cta;
  $('#contact').innerHTML = `
    <div class="col">
      <div class="cut fade" id="cut">
        <div class="cut__bg"></div>
        ${layers.map((l) => `<svg class="cut__layer" style="--dep:${l.dep}" viewBox="0 0 1000 600" preserveAspectRatio="none" aria-hidden="true"><path fill="${l.c}" fill-rule="evenodd" d="${hole(500, 300, l.rx, l.ry, l.amp, l.ph)}"/></svg>`).join('')}
        <div class="cut__inner">
          <img class="contact__av" src="${D.avatar}" alt="${D.firstName} ${D.lastName}">
          <p class="kicker kicker--c"><b>06</b> ${C.kicker}</p>
          <h2 class="rv">${C.title}</h2>
          <p class="cut__body">${C.body}</p>
          <div class="aud">${C.audiences.map((a) => `<span>${a}</span>`).join('')}</div>
          <div class="ctas ctas--c">
            <a class="btn btn--lime" href="${D.calendly}" target="_blank" rel="noopener">Book a 30-min call ${arrow}</a>
            <a class="btn btn--glass" href="mailto:${D.email}?subject=UGC%20campaign%20for%20my%20project">Email a brief</a>
            <a class="btn btn--glass" href="${D.telegram}" target="_blank" rel="noopener">Message on Telegram</a>
            <a class="btn btn--glass" href="https://x.com/VolcanicQT" target="_blank" rel="noopener">DM on X</a>
          </div>
          <a class="mail" href="mailto:${D.email}">${D.email}</a>
        </div>
      </div>
      <div class="socials fade">${D.socials.map((s) => `<a href="${s.url}" target="_blank" rel="noopener">${s.label}</a>`).join('')}</div>
    </div>
    <div class="foot"><span>© 2026 ${D.firstName} ${D.lastName} · Kolkata, India</span><span>${D.handle}</span></div>`;
  const cut = document.getElementById('cut');
  cut.addEventListener('pointermove', (e) => {
    const r = cut.getBoundingClientRect();
    cut.style.setProperty('--mx', ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
    cut.style.setProperty('--my', ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
  });
  cut.addEventListener('pointerleave', () => { cut.style.setProperty('--mx', 0); cut.style.setProperty('--my', 0); });

  // ── split headings into words for the masked reveal
  let wi = 0;
  const split = (node) => {
    [...node.childNodes].forEach((ch) => {
      if (ch.nodeType === 3) {
        const frag = document.createDocumentFragment();
        ch.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
          const w = document.createElement('span'); w.className = 'w';
          const i = document.createElement('span'); i.textContent = part; i.style.setProperty('--d', `${(wi++ * 0.07).toFixed(2)}s`);
          w.appendChild(i); frag.appendChild(w);
        });
        ch.replaceWith(frag);
      } else if (ch.nodeType === 1 && ch.tagName !== 'BR') split(ch);
    });
  };
  document.querySelectorAll('.rv').forEach((el) => { wi = 0; split(el); });
  document.querySelectorAll('.sec').forEach((sec) => {
    sec.querySelectorAll('.fade').forEach((el, i) => el.style.setProperty('--d', `${0.12 + Math.min(i, 10) * 0.06}s`));
  });

  // ── counters
  const count = (el) => {
    const to = +el.dataset.count, suf = el.dataset.suffix || '', t0 = performance.now(), dur = 1800;
    const tick = (now) => {
      const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 4);
      el.textContent = fmt(to * e) + suf;
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  let started = false;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting || !started) return;
      en.target.classList.add('in');
      if (en.target.dataset.count && !en.target.dataset.done) { en.target.dataset.done = 1; count(en.target); }
      io.unobserve(en.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

  // ── video showcase: autoplay muted while visible; the most visible one gets low-volume sound when sound is on
  const vids = [...document.querySelectorAll('.vid')].map((fig) => ({ fig, v: fig.querySelector('video'), bar: fig.querySelector('.vid__bar i'), btn: fig.querySelector('.vid__mute'), ratio: 0 }));
  const soundBtn = $('#soundBtn');
  let soundOn = false, pinned = null;
  const applySound = () => {
    let best = pinned && pinned.ratio > 0.2 ? pinned : null;
    if (!best) vids.forEach((o) => { if (o.ratio > 0.35 && (!best || o.ratio > best.ratio)) best = o; });
    vids.forEach((o) => {
      const on = soundOn && o === best;
      o.v.volume = VOLUME;
      o.v.muted = !on;
      o.fig.classList.toggle('is-loud', on);
      o.btn.innerHTML = on ? icoOn : icoOff;
    });
    soundBtn.innerHTML = `${soundOn ? icoOn : icoOff}<span>${soundOn ? 'Sound on' : 'Sound off'}</span>`;
    soundBtn.setAttribute('aria-pressed', soundOn);
    videoLoud = !!(soundOn && best);
  };

  // ── background music: a soft electric-piano loop at low volume, ducked while a video plays with sound
  const MUSIC_VOL = 0.16, DUCK_VOL = 0.025;
  const music = new Audio();
  music.src = music.canPlayType('audio/ogg; codecs="vorbis"') ? D.music.ogg : D.music.m4a;
  music.loop = true; music.preload = 'auto'; music.volume = 0;
  const musicBtn = $('#musicBtn');
  let musicWanted = true, musicPlaying = false, videoLoud = false;
  const setMusicUI = () => { musicBtn.classList.toggle('on', musicPlaying); musicBtn.setAttribute('aria-pressed', musicPlaying); musicBtn.title = musicPlaying ? 'Pause music' : 'Play music'; };
  const startMusic = () => music.play().then(() => { musicPlaying = true; setMusicUI(); }).catch(() => {});
  musicBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    musicWanted = !musicPlaying;
    if (musicWanted) startMusic(); else { music.pause(); musicPlaying = false; setMusicUI(); }
  });
  setInterval(() => {
    if (!musicPlaying) return;
    const target = videoLoud ? DUCK_VOL : MUSIC_VOL;
    music.volume = Math.max(0, Math.min(1, music.volume + (target - music.volume) * 0.08));
  }, 50);
  const vio = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      const o = vids.find((x) => x.fig === en.target); if (!o) return;
      o.ratio = en.isIntersecting ? en.intersectionRatio : 0;
      if (o.ratio > 0.15) o.v.play().catch(() => {}); else o.v.pause();
    });
    applySound();
  }, { threshold: [0, 0.15, 0.35, 0.5, 0.75, 1] });
  vids.forEach((o) => {
    vio.observe(o.fig);
    o.v.addEventListener('timeupdate', () => { if (o.v.duration) o.bar.style.transform = `scaleX(${o.v.currentTime / o.v.duration})`; });
    o.btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (soundOn && pinned === o && !o.v.muted) { soundOn = false; pinned = null; }
      else { soundOn = true; pinned = o; o.v.play().catch(() => {}); }
      applySound();
    });
  });
  soundBtn.addEventListener('click', () => { soundOn = !soundOn; pinned = null; applySound(); });
  // browsers only allow sound after a user gesture: the first click/tap/key on the page turns low-volume sound on
  const firstGesture = (e) => {
    if (!soundOn) { soundOn = true; applySound(); }
    if (musicWanted && !musicPlaying && !e.target.closest?.('#musicBtn')) startMusic();
    ['pointerdown', 'keydown'].forEach((t) => removeEventListener(t, firstGesture));
  };
  ['pointerdown', 'keydown'].forEach((t) => addEventListener(t, firstGesture));

  // nav clicks
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-nav]');
    if (!a) return;
    e.preventDefault();
    onNav(a.getAttribute('href'));
  });

  // cursor
  const cursor = $('#cursor'), tip = $('#tip');
  const ptr = { x: innerWidth / 2, y: innerHeight / 2 }, cpos = { ...ptr };
  let overLink = false;
  addEventListener('pointermove', (e) => {
    ptr.x = e.clientX; ptr.y = e.clientY;
    const g = e.target.closest?.('.btn, .sound, .music, .socials a, .vid__mute');
    if (g) { const r = g.getBoundingClientRect(); g.style.setProperty('--gx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%'); g.style.setProperty('--gy', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%'); }
    overLink = !!e.target.closest('a,button,.prog,.ach__item,.vid');
  });

  const sections = [...document.querySelectorAll('.sec')];
  const navLinks = [...document.querySelectorAll('.nav__links a')];
  const hudIdx = $('#hudIdx'), hudName = $('#hudName'), hudBar = $('#hudBar');
  const blob1 = $('#blob1'), blob2 = $('#blob2');
  let lastIdx = -1;

  return {
    sections,
    start() {
      started = true;
      startMusic(); // plays right away where the browser allows it; otherwise on the first click / tap / key
      document.querySelectorAll('.rv, .fade, [data-count]').forEach((el) => io.observe(el));
    },
    update(p, hover, hot) {
      cpos.x += (ptr.x - cpos.x) * 0.3; cpos.y += (ptr.y - cpos.y) * 0.3;
      cursor.style.transform = `translate(${cpos.x}px, ${cpos.y}px)`;
      const cur = hot ? 'pointer' : ''; if (document.body.style.cursor !== cur) document.body.style.cursor = cur;
      tip.style.left = ptr.x + 'px'; tip.style.top = ptr.y + 'px';
      if (hover) { if (tip.textContent !== hover) tip.textContent = hover; tip.classList.add('on'); }
      else tip.classList.remove('on');

      const idx = Math.round(p);
      if (idx !== lastIdx) {
        lastIdx = idx;
        hudIdx.textContent = String(idx + 1).padStart(2, '0');
        hudName.textContent = sections[idx]?.dataset.name || '';
        navLinks.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + sections[idx]?.id));
      }
      hudBar.style.width = `${(p / (sections.length - 1)) * 100}%`;
      blob1.style.transform = `translate(${-Math.sin(p * 1.05) * 38}vw, ${Math.sin(p * 0.7) * 14}vh)`;
      blob2.style.transform = `translate(${Math.sin(p * 0.9) * 30}vw, ${-Math.cos(p * 0.8) * 12}vh)`;
    },
  };
}

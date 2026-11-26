// Three.js scene: glossy plastic 3D illustration objects that re-arrange per section.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { fmt } from './ui.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const damp = (a, b, k, dt) => lerp(a, b, 1 - Math.exp(-k * dt));
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOutBack = (t) => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createScene(canvas, DATA) {
  const isMobile = () => innerWidth < 760;

  // ── renderer
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile() ? 1.5 : 2));
  renderer.setSize(innerWidth, innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.9;

  const camera = new THREE.PerspectiveCamera(30, innerWidth / innerHeight, 0.1, 120);
  camera.position.set(0, 0, 24);

  const key = new THREE.DirectionalLight(0xffffff, 2.3);
  key.position.set(7, 11, 14);
  key.castShadow = true;
  Object.assign(key.shadow.camera, { left: -20, right: 20, top: 16, bottom: -16, near: 1, far: 80 });
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.03;
  key.shadow.radius = 4;
  scene.add(key, key.target);
  const rim = new THREE.DirectionalLight(0x9d90ff, 1.6);
  rim.position.set(-10, 4, -6);
  scene.add(rim);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x7d70f0, 0.55));

  // soft shadow on the "wall" behind everything, like a studio backdrop
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), new THREE.ShadowMaterial({ color: 0x2a1d9e, opacity: 0.17 }));
  wall.position.z = -12;
  wall.receiveShadow = true;
  scene.add(wall);

  const world = new THREE.Group();
  scene.add(world);

  // ── materials
  const speckle = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const g = c.getContext('2d');
    g.fillStyle = '#1c1b24'; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 3200; i++) {
      const v = (40 + Math.random() * 60) | 0;
      g.fillStyle = `rgba(${v},${v},${v + 10},${Math.random() * 0.75})`;
      g.fillRect(Math.random() * 256, Math.random() * 256, 1.3, 1.3);
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 2);
    return t;
  })();
  const M = {
    white: new THREE.MeshPhysicalMaterial({ color: 0xf2f1fb, roughness: 0.3, clearcoat: 0.7, clearcoatRoughness: 0.22 }),
    black: new THREE.MeshPhysicalMaterial({ color: 0xffffff, map: speckle, roughness: 0.62, clearcoat: 0.35, clearcoatRoughness: 0.55 }),
    bezel: new THREE.MeshStandardMaterial({ color: 0x24222d, roughness: 0.45 }),
    lime: new THREE.MeshPhysicalMaterial({ color: 0xc8f23a, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.15 }),
    purple: new THREE.MeshPhysicalMaterial({ color: 0x6252f2, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.2 }),
    lav: new THREE.MeshPhysicalMaterial({ color: 0xc4befa, roughness: 0.38, clearcoat: 0.6, clearcoatRoughness: 0.3 }),
    ink: new THREE.MeshPhysicalMaterial({ color: 0x3527c9, roughness: 0.35, clearcoat: 0.8 }),
    cable: new THREE.MeshPhysicalMaterial({ color: 0x8a7df8, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.15 }),
    chrome: new THREE.MeshStandardMaterial({ color: 0xd8dae4, metalness: 1, roughness: 0.22 }),
    btnW: new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.25, clearcoat: 1 }),
  };
  const shadowed = (o) => { o.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); return o; };

  // ── label textures for cube faces
  const texCache = new Map();
  function labelTex(text, { bg = null, fg = '#ffffff' } = {}) {
    const k = `${text}|${bg}|${fg}`;
    if (texCache.has(k)) return texCache.get(k);
    const S = 256, c = document.createElement('canvas'); c.width = c.height = S;
    const g = c.getContext('2d');
    if (bg) { g.fillStyle = bg; g.beginPath(); g.roundRect(0, 0, S, S, 54); g.fill(); }
    let size = 150;
    g.font = `800 ${size}px Unbounded, sans-serif`;
    const max = S * 0.72, w = g.measureText(text).width;
    if (w > max) size *= max / w;
    g.font = `800 ${size}px Unbounded, sans-serif`;
    g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, S / 2, S / 2 + size * 0.05);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    texCache.set(k, t);
    return t;
  }
  const decalGeo = new THREE.PlaneGeometry(0.66, 0.66);
  const decalMat = (label, opts) => new THREE.MeshStandardMaterial({
    map: labelTex(label, opts), transparent: true, roughness: 0.45,
    color: opts?.bg ? 0xffffff : 0x1d1a33, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4,
  });
  const DIRS = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
  function addDecal(mesh, d, label, opts) {
    const pl = new THREE.Mesh(decalGeo, decalMat(label, opts));
    pl.position.set(d[0] * 0.473, d[1] * 0.473, d[2] * 0.473);
    pl.lookAt(d[0] * 2, d[1] * 2, d[2] * 2);
    mesh.add(pl);
  }

  // ── the cube (3×3×3 with one cubie popped out) — does Rubik turns
  const cubeRoot = new THREE.Group(); world.add(cubeRoot);
  const cube = new THREE.Group(); cubeRoot.add(cube);
  const pivot = new THREE.Group(); cube.add(pivot);
  const cubieGeo = new RoundedBoxGeometry(0.94, 0.94, 0.94, 5, 0.13);
  const R = rng(11);
  const cubies = [];
  let li = 0;
  for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++) for (let z = -1; z <= 1; z++) {
    if (x === 1 && y === 1 && z === 1) continue;
    const m = new THREE.Mesh(cubieGeo, M.white);
    m.position.set(x, y, z); m.castShadow = m.receiveShadow = true;
    cube.add(m);
    DIRS.forEach((d) => {
      if (d[0] * x + d[1] * y + d[2] * z !== 1) return;
      if (R() > (d[2] === 1 ? 0.75 : 0.45)) return;
      addDecal(m, d, DATA.cubeLabels[li++ % DATA.cubeLabels.length]);
    });
    cubies.push({
      mesh: m, idx: cubies.length, cubePos: m.position.clone(), base: m.quaternion.clone(),
      jit: V(R() - 0.5, R() - 0.5, R() - 0.5).multiplyScalar(1.5),
      axis: V(R() - 0.5, R() - 0.5, R() - 0.5).normalize(), ang: (R() * 2 + 1) * (R() < 0.5 ? -1 : 1), hover: 0,
    });
  }
  const cubieMeshes = cubies.map((c) => c.mesh);

  // floating popped-out cubie
  const floatRoot = new THREE.Group(); world.add(floatRoot);
  const floatCube = new THREE.Mesh(cubieGeo, M.white); floatCube.castShadow = floatCube.receiveShadow = true;
  addDecal(floatCube, [0, 1, 0], DATA.floatBadge, { bg: '#c8f23a', fg: '#15131f' });
  addDecal(floatCube, [0, 0, 1], DATA.floatLabel);
  addDecal(floatCube, [1, 0, 0], '★');
  floatRoot.add(floatCube);

  // ── handheld device with live screen
  const screenC = document.createElement('canvas'); screenC.width = 512; screenC.height = 358;
  const sg = screenC.getContext('2d');
  const screenTex = new THREE.CanvasTexture(screenC); screenTex.colorSpace = THREE.SRGBColorSpace;
  const avatar = new Image(); avatar.src = DATA.avatar;
  function drawScreen(t, mode) {
    const W = 512, H = 358;
    const gr = sg.createLinearGradient(0, 0, W, H); gr.addColorStop(0, '#6a5cf6'); gr.addColorStop(1, '#4334d4');
    sg.globalAlpha = 1; sg.fillStyle = gr; sg.fillRect(0, 0, W, H);
    sg.strokeStyle = 'rgba(255,255,255,.17)'; sg.lineWidth = 1.5; sg.beginPath();
    for (let x = 16; x < W; x += 32) { sg.moveTo(x, 0); sg.lineTo(x, H); }
    for (let y = 19; y < H; y += 32) { sg.moveTo(0, y); sg.lineTo(W, y); }
    sg.stroke();
    const a = Math.max(0, 1 - Math.abs(mode)), wStat = Math.max(0, 1 - Math.abs(mode - 1)), wMe = Math.max(0, 1 - Math.abs(mode - 2));
    if (wMe > 0.01) {
      sg.globalAlpha = wMe;
      const cx = 118, cy = H / 2, r = 82;
      sg.save(); sg.beginPath(); sg.arc(cx, cy, r + 8, 0, Math.PI * 2); sg.fillStyle = '#c8f23a'; sg.fill();
      sg.beginPath(); sg.arc(cx, cy, r, 0, Math.PI * 2); sg.clip();
      if (avatar.complete && avatar.naturalWidth) sg.drawImage(avatar, cx - r, cy - r, r * 2, r * 2);
      else { sg.fillStyle = '#2b1fa8'; sg.fill(); }
      sg.restore();
      sg.textAlign = 'left'; sg.textBaseline = 'alphabetic';
      sg.fillStyle = '#c8f23a'; sg.font = '700 20px "JetBrains Mono", monospace';
      sg.fillText('● ONLINE', 228, 120);
      sg.fillStyle = '#fff'; sg.font = '800 36px Unbounded, sans-serif';
      sg.fillText(DATA.brand, 226, 180);
      sg.font = '600 24px Manrope, sans-serif'; sg.fillStyle = 'rgba(255,255,255,.82)';
      sg.fillText('Gamer · Streamer · Creator', 228, 222);
      const bw = ((t * 60) % 240);
      sg.fillStyle = 'rgba(255,255,255,.2)'; sg.fillRect(228, 250, 240, 10);
      sg.fillStyle = '#c8f23a'; sg.fillRect(228, 250, bw, 10);
    }
    if (a > 0.01) {
      sg.globalAlpha = a;
      sg.beginPath();
      for (let x = 14; x <= W - 14; x += 3) {
        const k = x / W;
        const v = Math.sin(k * 9 + t * 1.6) * 0.45 + Math.sin(k * 23 - t * 2.4) * 0.22 + Math.pow(Math.max(0, Math.sin(k * 5.2 - t * 0.9)), 14) * 1.7;
        const y = H * 0.6 - v * H * 0.24;
        x === 14 ? sg.moveTo(x, y) : sg.lineTo(x, y);
      }
      sg.strokeStyle = '#fff'; sg.lineWidth = 7; sg.lineJoin = sg.lineCap = 'round';
      sg.shadowColor = 'rgba(255,255,255,.8)'; sg.shadowBlur = 14; sg.stroke(); sg.shadowBlur = 0;
    }
    if (wStat > 0.01) {
      sg.globalAlpha = wStat;
      const s = DATA.stats[Math.floor(t / 2.6) % DATA.stats.length];
      sg.fillStyle = '#c8f23a'; sg.font = '700 22px "JetBrains Mono", monospace'; sg.textAlign = 'left'; sg.textBaseline = 'alphabetic';
      sg.fillText('● LIVE', 28, 52);
      sg.fillStyle = '#fff'; const txt = fmt(s.value) + s.suffix; let fs2 = 118; sg.font = '800 118px Unbounded, sans-serif';
      while (sg.measureText(txt).width > 450 && fs2 > 60) { fs2 -= 4; sg.font = '800 ' + fs2 + 'px Unbounded, sans-serif'; }
      sg.fillText(txt, 26, 220);
      sg.font = '600 28px Manrope, sans-serif'; sg.fillStyle = 'rgba(255,255,255,.8)';
      sg.fillText(s.label.toUpperCase(), 30, 280);
    }
    sg.globalAlpha = 1;
    screenTex.needsUpdate = true;
  }
  const deviceRoot = new THREE.Group(); world.add(deviceRoot);
  const device = new THREE.Group(); deviceRoot.add(device);
  {
    const body = new THREE.Mesh(new RoundedBoxGeometry(3.4, 3.7, 0.75, 6, 0.34), M.black); device.add(body);
    const bez = new THREE.Mesh(new RoundedBoxGeometry(2.78, 2.02, 0.12, 4, 0.1), M.bezel); bez.position.set(0, 0.62, 0.34); device.add(bez);
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(2.52, 1.76), new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false }));
    scr.position.set(0, 0.62, 0.405); device.add(scr);
    const cam = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.03, 8, 24), M.bezel); cam.position.set(1.45, 1.62, 0.38); device.add(cam);
    const dh = new THREE.Mesh(new RoundedBoxGeometry(0.98, 0.33, 0.3, 4, 0.11), M.lime); dh.position.set(-0.8, -1.06, 0.4);
    const dv = dh.clone(); dv.rotation.z = Math.PI / 2; device.add(dh, dv);
    const slot = new THREE.Mesh(new RoundedBoxGeometry(1.28, 0.62, 0.14, 4, 0.26), M.bezel); slot.position.set(0.78, -1.06, 0.36); device.add(slot);
    const bw = new THREE.Mesh(new THREE.SphereGeometry(0.22, 32, 16), M.btnW); bw.scale.z = 0.6; bw.position.set(0.5, -1.06, 0.45);
    const bp = new THREE.Mesh(new THREE.SphereGeometry(0.22, 32, 16), M.purple); bp.scale.z = 0.6; bp.position.set(1.06, -1.06, 0.45);
    device.add(bw, bp);
    [0.95, 0.25].forEach((y) => { const sb = new THREE.Mesh(new RoundedBoxGeometry(0.14, 0.5, 0.32, 2, 0.06), M.black); sb.position.set(-1.72, y, 0); device.add(sb); });
    const plug = new THREE.Mesh(new RoundedBoxGeometry(0.38, 0.34, 0.26, 2, 0.06), M.chrome); plug.position.set(0.4, -1.98, 0); device.add(plug);
    shadowed(device);
    scr.castShadow = false;
  }

  // ── pixel-art extrusions (badge, cursor, coins)
  function pixelShape(rows, map, px = 0.2) {
    const h = rows.length, w = Math.max(...rows.map((r) => r.length));
    const geos = {};
    rows.forEach((row, j) => [...row].forEach((ch, i) => {
      const m = map[ch]; if (!m) return;
      const g = new THREE.BoxGeometry(px, px, px * m.depth);
      g.translate((i - (w - 1) / 2) * px, ((h - 1) / 2 - j) * px, 0);
      (geos[ch] ||= []).push(g);
    }));
    const grp = new THREE.Group();
    for (const ch in geos) grp.add(new THREE.Mesh(mergeGeometries(geos[ch]), map[ch].mat));
    return shadowed(grp);
  }
  function discRows(R, edge, shape) {
    const N = Math.ceil(R + 1.5) * 2 + 1, c = (N - 1) / 2, rows = [];
    for (let j = 0; j < N; j++) {
      let s = '';
      for (let i = 0; i < N; i++) {
        const dx = i - c, dy = j - c, d = Math.hypot(dx, dy), rr = shape ? shape(Math.atan2(dy, dx)) : R;
        s += d <= rr ? (d > rr - edge ? 'X' : 'O') : '.';
      }
      rows.push(s);
    }
    return rows;
  }
  function stamp(rows, sym, ox = 0, oy = 0) {
    const g = rows.map((r) => [...r]);
    const y0 = Math.round((g.length - sym.length) / 2) + oy, x0 = Math.round((g[0].length - sym[0].length) / 2) + ox;
    sym.forEach((r, j) => [...r].forEach((ch, i) => { if (ch === '#') g[y0 + j][x0 + i] = 'S'; }));
    return g.map((r) => r.join(''));
  }
  const PMAP = {
    X: { mat: M.purple, depth: 1.7 },
    O: { mat: M.lav, depth: 1.35 },
    S: { mat: M.ink, depth: 2.1 },
  };
  const smileyRows = stamp(discRows(6.6, 1.3, (th) => 6.6 + 0.75 * Math.cos(th * 10)),
    ['.#...#.', '.#...#.', '.......', '#.....#', '.#...#.', '..###..'], 0, 0);
  const starRows = stamp(discRows(6.4, 1.3), ['...#...', '..###..', '#######', '.#####.', '..###..', '.##.##.', '.#...#.']);
  const playRows = stamp(discRows(6.4, 1.3), ['#....', '###..', '#####', '###..', '#....'], 1, 0);
  const cursorRows = [
    'X..........', 'XX.........', 'XOX........', 'XOOX.......', 'XOOOX......', 'XOOOOX.....', 'XOOOOOX....',
    'XOOOOOOX...', 'XOOOOOOOX..', 'XOOOOOOOOX.', 'XOOOOOXXXXX', 'XOOXOOX....', 'XOX.XOOX...', 'XX..XOOX...',
    'X....XOOX..', '.....XOOX..', '......XX...',
  ];
  const mkRoot = (obj) => { const r = new THREE.Group(); r.add(obj); world.add(r); return r; };
  const smileyRoot = mkRoot(pixelShape(smileyRows, PMAP));
  const cursorRoot = mkRoot(pixelShape(cursorRows, PMAP, 0.21));
  const coinARoot = mkRoot(pixelShape(starRows, PMAP));
  const coinBRoot = mkRoot(pixelShape(playRows, PMAP));

  // ── fuzzy clay blobs (organic, felt-like)
  const feltTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const g = c.getContext('2d'); g.fillStyle = '#808080'; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 14000; i++) {
      const v = (Math.random() * 255) | 0;
      g.fillStyle = `rgba(${v},${v},${v},.5)`; g.fillRect(Math.random() * 256, Math.random() * 256, 1.4, 1.4);
    }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(5, 3);
    return t;
  })();
  const BLOBC = { lav: [0xbab1fb, 0xffffff], purple: [0x6d5cf5, 0xb7adff], lime: [0xc8f23a, 0xf4ffd0], pale: [0xe6e2ff, 0xffffff] };
  const blobMat = {};
  for (const k in BLOBC) blobMat[k] = new THREE.MeshPhysicalMaterial({
    color: BLOBC[k][0], roughness: 0.92, sheen: 1, sheenRoughness: 0.55, sheenColor: new THREE.Color(BLOBC[k][1]),
    bumpMap: feltTex, bumpScale: 1.2,
  });
  function blobGeo(seed) {
    const g = new THREE.IcosahedronGeometry(1, 22);
    const pos = g.attributes.position, r = rng(seed), v = V();
    const f = [0, 1, 2, 3].map(() => ({ a: V(r() - 0.5, r() - 0.5, r() - 0.5).normalize(), k: 1.4 + r() * 2.4, amp: 0.1 + r() * 0.14, ph: r() * 6 }));
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      let d = 1; f.forEach((o) => { d += Math.sin(v.dot(o.a) * o.k * 2 + o.ph) * o.amp; });
      v.multiplyScalar(d); pos.setXYZ(i, v.x, v.y, v.z);
    }
    g.computeVertexNormals();
    return g;
  }
  const blobGeos = [3, 7, 13, 21, 34].map(blobGeo);
  function makeBlob(i, color, s) {
    const m = new THREE.Mesh(blobGeos[i % blobGeos.length], blobMat[color]);
    m.scale.setScalar(s); m.castShadow = true; m.receiveShadow = true;
    m.userData.spin = V((i % 3) * 0.05 + 0.03, 0.06 + (i % 2) * 0.05, 0.02);
    return m;
  }
  function pillTex(text) {
    const c = document.createElement('canvas'); c.width = 320; c.height = 112;
    const g = c.getContext('2d');
    g.fillStyle = '#15131f'; g.beginPath(); g.roundRect(4, 4, 312, 104, 52); g.fill();
    g.fillStyle = '#c8f23a'; g.beginPath(); g.arc(58, 56, 30, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#15131f'; g.font = '800 34px Unbounded, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('↗', 58, 58);
    g.fillStyle = '#fff'; g.font = '700 38px Unbounded, sans-serif'; g.textAlign = 'left';
    let size = 38; while (g.measureText(text).width > 200 && size > 20) { size -= 2; g.font = `700 ${size}px Unbounded, sans-serif`; }
    g.fillText(text, 102, 58);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    return t;
  }
  // background layer: drifts with scroll (parallax) and wraps around; some blobs are links
  const BG = [
    { p: [-10.8, 4.6, -7], s: 1.5, c: 'lav', link: 4 },
    { p: [11.2, -4.8, -7.5], s: 1.7, c: 'purple', link: 0 },
    { p: [-11.4, -4.4, -5], s: 1.1, c: 'lime', link: 1 },
    { p: [10.6, 4.4, -6], s: 1.2, c: 'pale', link: 2 },
    { p: [0.5, -9.5, -9], s: 2.1, c: 'lav' },
    { p: [-5.5, 9.5, -8.5], s: 1.2, c: 'purple', link: 3 },
    { p: [6.5, 13, -8], s: 1.0, c: 'lime' },
    { p: [-8.5, 15, -7], s: 1.4, c: 'pale' },
  ];
  const bgBlobs = BG.map((b, i) => {
    const grp = new THREE.Group();
    const mesh = makeBlob(i, b.c, b.s);
    grp.add(mesh);
    const link = b.link !== undefined ? DATA.blobLinks[b.link] : null;
    if (link) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: pillTex(link.label), toneMapped: false }));
      sp.scale.set(2.3, 0.8, 1); sp.position.set(0, -b.s * 0.15, b.s + 0.35); grp.add(sp);
      mesh.userData.link = link; sp.userData.link = link;
    }
    world.add(grp);
    return { grp, mesh, base: V(...b.p), hov: 0, phase: i * 1.3, link };
  });
  const blobHits = bgBlobs.flatMap((b) => b.grp.children);

  // ── hero: clay "creator studio" diorama (streamer in a gaming chair, gaming PC, tripod camera, ring light, hex badges)
  const CM = (hex, rough = 0.55, extra = {}) => new THREE.MeshPhysicalMaterial({ color: hex, roughness: rough, clearcoat: 0.25, clearcoatRoughness: 0.6, ...extra });
  const SM = {
    skin: CM(0xc98a62, 0.62), hair: CM(0x1b1530, 0.75), hoodie: CM(0x6d5cf5, 0.75, { sheen: 0.7, sheenColor: new THREE.Color(0xb7adff) }),
    pants: CM(0x2a2350, 0.7), shoe: CM(0xffffff, 0.45), black: CM(0x1c1b24, 0.45), white: CM(0xf2f1fb, 0.4),
    lav: CM(0xc9c3fb, 0.7, { sheen: 0.6, sheenColor: new THREE.Color(0xffffff) }), base: CM(0xdcd8ff, 0.85, { sheen: 0.8, sheenColor: new THREE.Color(0xffffff) }),
    pot: CM(0xf2f1fb, 0.5), leaf: CM(0x9ed82a, 0.6), lime: M.lime, purple: M.purple,
    glow: new THREE.MeshBasicMaterial({ color: 0xfbfaff, toneMapped: false }), rec: new THREE.MeshBasicMaterial({ color: 0xff3b5c, toneMapped: false }),
  };
  const meGroup = new THREE.Group();
  const studio = new THREE.Group(); meGroup.add(studio);
  const put = (geo, mat, x, y, z, parent = studio, rx = 0, ry = 0, rz = 0) => {
    const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz);
    m.castShadow = m.receiveShadow = true; parent.add(m); return m;
  };
  const RB = (w, h, d, r = 0.1) => new RoundedBoxGeometry(w, h, d, 4, r);
  const CAP = (r, l) => new THREE.CapsuleGeometry(r, l, 6, 16);
  const CYL = (rt, rb, h, s = 24) => new THREE.CylinderGeometry(rt, rb, h, s);
  const SPH = (r) => new THREE.SphereGeometry(r, 28, 20);
  const rod = (a, b, r, mat, parent) => {
    const dir = b.clone().sub(a), len = dir.length();
    const m = put(CYL(r, r, len, 10), mat, 0, 0, 0, parent);
    m.position.copy(a).add(b).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(V(0, 1, 0), dir.normalize());
    return m;
  };

  // platform + rug
  put(CYL(5.0, 5.2, 0.5, 72), SM.base, 0, -4.05, 0);
  put(new THREE.TorusGeometry(5.05, 0.08, 12, 120), SM.lime, 0, -3.81, 0, studio, Math.PI / 2);
  put(CYL(2.5, 2.5, 0.06, 56), SM.lav, 0.2, -3.77, 0.7);

  // desk with monitor, keyboard, plant and a gaming PC
  const desk = new THREE.Group(); desk.position.set(-0.4, 0, -2.5); studio.add(desk);
  put(RB(5.0, 0.22, 1.7, 0.08), SM.white, 0, -1.6, 0, desk);
  put(RB(0.18, 2.05, 1.5, 0.06), SM.white, -2.3, -2.72, 0, desk);
  put(RB(0.18, 2.05, 1.5, 0.06), SM.white, 2.3, -2.72, 0, desk);
  put(RB(2.6, 1.55, 0.14, 0.06), SM.black, -0.8, -0.3, -0.25, desk);
  const mon = new THREE.Mesh(new THREE.PlaneGeometry(2.42, 1.38), new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false }));
  mon.position.set(-0.8, -0.3, -0.17); desk.add(mon);
  put(CYL(0.07, 0.07, 0.6), SM.black, -0.8, -1.2, -0.3, desk);
  put(RB(0.8, 0.06, 0.5, 0.03), SM.black, -0.8, -1.47, -0.3, desk);
  put(RB(1.5, 0.07, 0.45, 0.03), SM.black, -0.8, -1.45, 0.4, desk);
  put(RB(0.22, 0.08, 0.32, 0.08), SM.black, 0.25, -1.45, 0.45, desk);
  put(CYL(0.28, 0.22, 0.45), SM.pot, -2.1, -1.25, 0.2, desk);
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    put(new THREE.ConeGeometry(0.09, 0.85, 8), SM.leaf, -2.1 + Math.cos(a) * 0.1, -0.68, 0.2 + Math.sin(a) * 0.1, desk, Math.sin(a) * 0.45, 0, -Math.cos(a) * 0.45);
  }
  const pc = new THREE.Group(); pc.position.set(1.6, -0.35, 0); desk.add(pc);
  put(RB(1.05, 2.25, 1.5, 0.08), SM.black, 0, 0, 0, pc);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(0.88, 2.02), new THREE.MeshPhysicalMaterial({ color: 0x9a90ff, transparent: true, opacity: 0.22, roughness: 0.05 }));
  glass.position.set(0, 0, 0.765); pc.add(glass);
  const fanMats = [0xc8f23a, 0x8a7df8, 0xff6fd8].map((c) => new THREE.MeshBasicMaterial({ color: c, toneMapped: false }));
  const fans = [0.62, 0, -0.62].map((y, i) => {
    put(new THREE.TorusGeometry(0.27, 0.045, 10, 32), fanMats[i], 0, y, 0.75, pc);
    const bl = put(CYL(0.21, 0.21, 0.03, 5), SM.black, 0, y, 0.72, pc, Math.PI / 2);
    return bl;
  });

  // gaming chair
  const chair = new THREE.Group(); chair.position.set(0.1, 0, 0.5); studio.add(chair);
  put(RB(1.9, 0.38, 1.7, 0.16), SM.purple, 0, -2.2, 0, chair);
  put(RB(1.9, 2.5, 0.38, 0.18), SM.purple, 0, -0.75, -0.85, chair, -0.12);
  put(RB(0.46, 2.3, 0.05, 0.02), SM.lime, 0, -0.62, -0.64, chair, -0.12);
  put(RB(1.1, 0.5, 0.32, 0.14), SM.black, 0, 0.42, -1.02, chair, -0.12);
  for (const s of [-1, 1]) {
    put(RB(0.24, 0.13, 1.2, 0.05), SM.black, s * 1.05, -1.62, 0.05, chair);
    put(CYL(0.06, 0.06, 0.5), SM.black, s * 1.05, -1.92, 0.05, chair);
  }
  put(CYL(0.11, 0.11, 1.1), SM.black, 0, -2.9, 0, chair);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    put(RB(1.0, 0.1, 0.15, 0.04), SM.black, Math.cos(a) * 0.5, -3.4, Math.sin(a) * 0.5, chair, 0, -a, 0);
    put(SPH(0.13), SM.black, Math.cos(a) * 1.0, -3.6, Math.sin(a) * 1.0, chair);
  }

  // the creator: hoodie, headphones, glasses, controller in hand
  const kid = new THREE.Group(); kid.position.set(0.1, 0, 0.6); studio.add(kid);
  put(CAP(0.62, 0.75), SM.hoodie, 0, -1.05, -0.25, kid);
  put(new THREE.TorusGeometry(0.42, 0.16, 10, 24), SM.hoodie, 0, -0.45, -0.4, kid, Math.PI / 2.4);
  put(CYL(0.2, 0.22, 0.4), SM.skin, 0, -0.55, -0.15, kid);
  for (const s of [-1, 1]) {
    put(CAP(0.25, 0.85), SM.pants, s * 0.32, -1.85, 0.42, kid, Math.PI / 2);
    put(CAP(0.22, 0.75), SM.pants, s * 0.32, -2.55, 0.98, kid);
    put(RB(0.38, 0.25, 0.64, 0.11), SM.shoe, s * 0.32, -3.12, 1.14, kid);
    put(CAP(0.17, 0.5), SM.hoodie, s * 0.7, -1.05, 0.05, kid, 0.55, 0, s * 0.25);
    put(CAP(0.15, 0.45), SM.hoodie, s * 0.48, -1.38, 0.5, kid, Math.PI / 2 - 0.3, 0, 0);
    put(SPH(0.15), SM.skin, s * 0.32, -1.3, 0.86, kid);
  }
  const pad = put(RB(0.9, 0.22, 0.44, 0.1), SM.black, 0, -1.24, 0.92, kid, -0.5);
  [[0.22, 0.05], [0.3, -0.04], [-0.24, 0]].forEach(([x, z], i) => put(SPH(0.05), i === 2 ? SM.purple : SM.lime, x, 0.12, z, pad));
  const head = new THREE.Group(); head.position.set(0, 0.12, -0.12); kid.add(head);
  put(SPH(0.72), SM.skin, 0, 0, 0, head).scale.set(1, 1.06, 1);
  for (const s of [-1, 1]) put(SPH(0.13), SM.skin, s * 0.71, -0.05, 0, head);
  put(SPH(0.1), SM.skin, 0, -0.08, 0.72, head);
  put(new THREE.SphereGeometry(0.77, 36, 18, 0, Math.PI * 2, 0, Math.PI * 0.5), SM.hair, 0, 0.12, -0.1, head, -0.62);
  [[-0.3, 0.66, 0.34, 0.24], [0.04, 0.72, 0.36, 0.23], [0.36, 0.64, 0.3, 0.21], [0.55, 0.45, 0.12, 0.2], [-0.55, 0.45, 0.12, 0.2]].forEach(([x, y, z, r]) => put(SPH(r), SM.hair, x, y, z, head));
  for (const s of [-1, 1]) {
    put(SPH(0.06), SM.black, s * 0.26, 0.03, 0.665, head);
    put(new THREE.TorusGeometry(0.2, 0.04, 10, 28), SM.black, s * 0.27, 0.03, 0.72, head);
  }
  put(RB(0.18, 0.05, 0.05, 0.02), SM.black, 0, 0.06, 0.74, head);
  put(new THREE.TorusGeometry(0.12, 0.025, 8, 16, Math.PI), SM.black, 0, -0.28, 0.63, head, 0, 0, Math.PI);
  put(new THREE.TorusGeometry(0.82, 0.07, 12, 40, Math.PI), SM.purple, 0, 0.05, 0, head);
  for (const s of [-1, 1]) {
    put(CYL(0.25, 0.25, 0.2, 28), SM.black, s * 0.8, -0.05, 0, head, 0, 0, Math.PI / 2);
    put(new THREE.TorusGeometry(0.2, 0.05, 10, 28), SM.lime, s * 0.91, -0.05, 0, head, 0, Math.PI / 2, 0);
  }

  // ring light on a stand, facing the creator, with a real light
  const ringG = new THREE.Group(); ringG.position.set(-2.7, 0, 2.2); studio.add(ringG);
  rod(V(0, -3.8, 0), V(0, 0.2, 0), 0.045, SM.black, ringG);
  for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2; rod(V(0, -2.9, 0), V(Math.cos(a) * 0.6, -3.8, Math.sin(a) * 0.6), 0.035, SM.black, ringG); }
  const ringHead = new THREE.Group(); ringHead.position.set(0, 0.55, 0); ringHead.rotation.y = 0.75; ringG.add(ringHead);
  const ringMesh = put(new THREE.TorusGeometry(0.75, 0.1, 16, 64), SM.glow, 0, 0, 0, ringHead);
  ringMesh.castShadow = false;
  put(RB(0.3, 0.55, 0.06, 0.04), SM.black, 0, 0, 0.02, ringHead);
  const ringLight = new THREE.PointLight(0xf1edff, 7, 7, 1.6); ringLight.position.set(0.6, 0.55, -0.4); ringG.add(ringLight);

  // camera on a tripod, pointed at the creator, REC light blinking
  const camG = new THREE.Group(); camG.position.set(2.7, -0.9, 2.5); camG.rotation.y = Math.atan2(-2.6, -1.9); studio.add(camG);
  for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2 + 0.4; rod(V(0, -0.15, 0), V(Math.cos(a) * 0.75, -2.9, Math.sin(a) * 0.75), 0.035, SM.black, camG); }
  put(CYL(0.09, 0.09, 0.2), SM.black, 0, -0.1, 0, camG);
  put(RB(0.75, 0.52, 0.45, 0.08), SM.black, 0, 0.2, 0, camG);
  put(CYL(0.19, 0.2, 0.38, 28), SM.black, 0, 0.2, 0.4, camG, Math.PI / 2);
  put(new THREE.TorusGeometry(0.19, 0.03, 8, 28), SM.lime, 0, 0.2, 0.6, camG);
  put(RB(0.3, 0.2, 0.25, 0.05), SM.black, -0.1, 0.55, -0.05, camG);
  const rec = put(SPH(0.05), SM.rec, 0.28, 0.4, -0.2, camG);

  // floating hex badges with program logos
  const texL = new THREE.TextureLoader();
  const hexes = [['assets/logos/immutable.png', SM.purple, -3.6, 2.9], ['assets/logos/ygg.png', SM.lime, -4.7, 1.4], ['assets/logos/loadout.png', SM.lav, -2.5, 1.45]].map(([src, mat, x, y], i) => {
    const g = new THREE.Group(); g.position.set(x, y, -1.2); studio.add(g);
    put(CYL(0.78, 0.78, 0.32, 6), mat, 0, 0, 0, g, Math.PI / 2, 0, 0).rotation.y = Math.PI / 6;
    const t = texL.load(src); t.colorSpace = THREE.SRGBColorSpace;
    const face = new THREE.Mesh(new THREE.CircleGeometry(0.42, 40), new THREE.MeshBasicMaterial({ map: t, toneMapped: false }));
    face.position.z = 0.17; g.add(face);
    g.userData.base = g.position.clone(); g.userData.i = i;
    return g;
  });

  studio.rotation.set(0.1, -0.5, 0);

  const heroBlobs = [
    [-5.6, 3.4, -2.2, 0.9, 'lav'], [5.6, 2.8, -2.2, 1.0, 'pale'], [5.4, -3.4, 1.6, 0.85, 'lime'],
    [-5.6, -3.2, 1.4, 0.8, 'purple'], [3.9, 4.0, -1.2, 0.4, 'lime'], [-1.2, 4.6, -1.5, 0.5, 'purple'],
  ].map(([x, y, z, s, c], i) => { const m = makeBlob(i + 2, c, s); m.position.set(x, y, z); m.userData.base = m.position.clone(); meGroup.add(m); return m; });
  const studioAnim = (t, dt) => {
    fans.forEach((b, i) => { b.rotation.y += dt * (6 + i * 2); });
    fanMats.forEach((m, i) => m.color.setHSL(((t * 0.08 + i * 0.33) % 1), 0.85, 0.62));
    head.rotation.set(Math.sin(t * 2.2) * 0.05, Math.sin(t * 0.7) * 0.22, Math.sin(t * 1.1) * 0.04);
    pad.position.y = -1.24 + Math.sin(t * 9) * 0.012;
    rec.visible = Math.floor(t * 1.6) % 2 === 0;
    ringLight.intensity = 6.5 + Math.sin(t * 2) * 0.6;
    hexes.forEach((h) => { h.position.y = h.userData.base.y + Math.sin(t * 0.9 + h.userData.i * 1.4) * 0.15; h.rotation.y = Math.sin(t * 0.6 + h.userData.i) * 0.35; });
  };
  const meRoot = mkRoot(meGroup);

  // ── cable between device and cube
  const cable = new THREE.Mesh(new THREE.BufferGeometry(), M.cable);
  cable.castShadow = true; world.add(cable);
  function updateCable(amt) {
    if (amt < 0.03) { cable.visible = false; return; }
    cable.visible = true;
    const a = world.worldToLocal(device.localToWorld(V(0.4, -2.1, 0)));
    const b = world.worldToLocal(cubeRoot.localToWorld(V(-1.3, -0.2, 0.25)));
    const m1 = a.clone().add(V(0, -1.8, 0.8));
    const m2 = b.clone().add(V(-1.6, -1.4, 0.6));
    const curve = new THREE.CatmullRomCurve3([a, m1, m2, b]);
    cable.geometry.dispose();
    cable.geometry = new THREE.TubeGeometry(curve, 90, 0.075 * clamp(amt), 10, false);
  }

  // ── objects & per-section layouts
  const objs = {
    d: { root: deviceRoot, tip: DATA.tips.device },
    c: { root: cubeRoot },
    f: { root: floatRoot, tip: DATA.tips.float },
    sm: { root: smileyRoot, tip: DATA.tips.smiley },
    cu: { root: cursorRoot, tip: DATA.tips.cursor },
    ca: { root: coinARoot, tip: DATA.tips.coinA },
    cb: { root: coinBRoot, tip: DATA.tips.coinB },
    me: { root: meRoot, tip: DATA.tips.me, still: true },
  };
  Object.values(objs).forEach((o, i) => {
    o.p = V(); o.r = V(); o.s = 1; o.phase = i * 1.7; o.spin = 0; o.spinT = 0; o.delay = 0.1 + i * 0.09; o.init = false;
    o.root.userData.obj = o;
  });

  // design coordinates: [x,y,z], rot [x,y,z], scale
  const L = (p, r = [0, 0, 0], s = 1) => ({ p, r, s });
  const OFF = [-15, 0, -6];
  const DESK = [
    { // 0 hero
      d: L([10.9, -3.3, 1.4], [0.1, -0.45, 0.05], 0.5), c: L([11.4, 0.4, -1.5], [0.5, -0.72, 0], 0.5), f: L([10.4, 3.6, 0.2], [0.45, 0.55, 0.25], 0.5),
      sm: L([1.0, 4.8, -2.5], [0.1, -0.35, 0.12], 0.5), cu: L([0.6, -4.6, 2.5], [0, 0.35, 0.2], 0.45),
      ca: L([12.2, 4.8, -3], [0, -0.55, 0.1], 0.45), cb: L([-1.0, 6.0, -4], [0.1, -0.7, -0.15], 0.4), explode: 0, screen: 2, cable: 0,
    },
    { // 1 about
      d: L([-4.6, 0, 2], [0.06, 0.3, -0.04], 1.45), c: L([-8.8, 4.3, -5], [0.8, 0.4, 0.2], 0.55), f: L([-1.0, 4.0, -2], [0.3, -0.4, 0.5], 0.7),
      sm: L([-9.2, -3.5, -1], [0, 0.5, -0.1], 0.9), cu: L([-0.4, -3.9, 3], [0, 0.2, 0.4], 0.8),
      ca: L([1.4, 4.7, -6], [0, 0.8, 0], 0.6), cb: L([-1.5, -1.2, -7], [0, 0.4, 0], 0.5), explode: 0, screen: 1, cable: 0,
    },
    { // 2 achievements
      d: L([-18, -3, -4], [0.2, 1, 0], 0.9), c: L([5.3, 0.2, -1], [0.35, 0.7, 0.1], 1.0), f: L([5.5, 4.7, 1.5], [0.6, 0.9, 0.3], 0.8),
      sm: L([9.7, -3.9, -1], [0, -0.4, 0], 0.8), cu: L([2.0, -4.7, 2.5], [0, -0.3, 0.3], 0.75),
      ca: L([10.4, 2.5, -3], [0, -0.6, 0], 0.7), cb: L([1.2, 4.9, -5], [0, 0.3, 0], 0.55), explode: 1, screen: 0, cable: 0,
    },
    { // 3 programs
      d: L([-18, 2, -4], [0, 1, 0], 0.8), c: L([-10, -5.2, -8], [0.5, 0.5, 0], 0.5), f: L([-1.0, 4.7, -3], [0.4, 0.4, 0], 0.6),
      sm: L([-7.6, -2.9, 0.5], [0, 0.45, -0.1], 1.4), cu: L([-2.2, 3.4, 1], [0, 0.3, 0.3], 1.15),
      ca: L([-4.8, 1.1, 2], [0, 0.6, 0.08], 1.9), cb: L([-1.4, -2.5, 3], [0, 0.35, -0.1], 1.35), explode: 0, screen: 0, cable: 0,
    },
    { // 4 experience
      d: L([5.4, 0.4, 1], [0.05, -0.38, 0.05], 1.35), c: L([9.4, 4.3, -4], [0.5, 0.5, 0], 0.6), f: L([2.0, 4.7, -3], [0.3, -0.5, 0.2], 0.55),
      sm: L([10.1, -4.0, -2], [0, -0.5, 0], 0.7), cu: L([2.4, -2.6, 3], [0, -0.4, 0.3], 0.8),
      ca: L([-11, 4, -5], [0, 0.5, 0], 0.6), cb: L([-10, -4.2, -4], [0, 0.5, 0], 0.6), explode: 0, screen: 0, cable: 0,
    },
    { // 5 showcase (videos fill the middle, objects frame the edges)
      d: L([-11.5, 4.6, -8], [0.1, 0.6, -0.1], 0.7), c: L([11.5, -4.8, -8], [0.6, -0.5, 0], 0.65), f: L([11.8, 4.4, -6], [0.5, 0.5, 0.3], 0.7),
      sm: L([-11.8, -4.4, -5], [0, 0.5, 0], 0.75), cu: L([-12.5, 0.2, -3], [0, 0.4, 0.3], 0.7),
      ca: L([12.6, 0, -5], [0, -0.5, 0], 0.7), cb: L([0, -8, -8], [0, 0.4, 0], 0.6), explode: 0, screen: 1, cable: 0,
    },
    { // 6 contact
      d: L([-8.2, -1.2, 0], [0.08, 0.5, -0.06], 0.85), c: L([8.0, -2.4, 0], [0.5, -0.72, 0], 0.9), f: L([8.6, 0.6, 0.6], [0.45, 0.55, 0.25], 0.75),
      sm: L([-9.0, 3.6, -2], [0.1, 0.4, 0.1], 0.7), cu: L([9.4, 3.8, -1], [0, -0.3, -0.2], 0.65),
      ca: L([-4.2, -5.6, -1], [0, 0.5, 0], 0.65), cb: L([4.4, -5.8, -1], [0, -0.5, 0], 0.6), explode: 0, screen: 2, cable: 0,
    },
  ];
  void OFF;
  DESK.forEach((st, i) => { st.me = i === 0 ? L([5.8, -0.5, 0], [0.12, 0, 0], 0.95) : L([5.6, -15, 0], [0.12, 0, 0], 0.7); });
  let STATES = [];
  function buildStates() {
    const mob = isMobile();
    const k = clamp(camera.aspect / 1.78, 0.7, 1.15);
    const yOff = [2.6, 1.6, 1.6, 1.6, 1.6, 0, -1.2];
    STATES = DESK.map((st, i) => {
      const o = { explode: st.explode, screen: st.screen, cable: st.cable };
      for (const key in objs) {
        const s = st[key];
        o[key] = mob
          ? { p: [s.p[0] * 0.42, s.p[1] * 0.62 + yOff[i], s.p[2]], r: s.r, s: s.s * 0.72 }
          : { p: [s.p[0] * k, s.p[1], s.p[2]], r: s.r, s: s.s * (k < 1 ? lerp(0.85, 1, (k - 0.7) / 0.3) : 1) };
      }
      return o;
    });
  }
  buildStates();
  function blend(p) {
    const i = clamp(Math.floor(p), 0, STATES.length - 1), j = Math.min(i + 1, STATES.length - 1), t = clamp(p - i);
    const a = STATES[i], b = STATES[j], out = {};
    for (const key in objs) {
      out[key] = {
        p: a[key].p.map((v, n) => lerp(v, b[key].p[n], t)),
        r: a[key].r.map((v, n) => lerp(v, b[key].r[n], t)),
        s: lerp(a[key].s, b[key].s, t),
      };
    }
    out.explode = lerp(a.explode, b.explode, t);
    out.screen = lerp(a.screen, b.screen, t);
    out.cable = lerp(a.cable, b.cable, t);
    return out;
  }

  // ── Rubik moves
  let move = null, moveTimer = 1.2;
  function startMove() {
    const axis = ['x', 'y', 'z'][(Math.random() * 3) | 0];
    const layer = [-1, 0, 1][(Math.random() * 3) | 0];
    const members = cubies.filter((c) => Math.round(c.cubePos[axis]) === layer);
    pivot.rotation.set(0, 0, 0); pivot.updateMatrixWorld(true);
    members.forEach((c) => { c.mesh.position.copy(c.cubePos); c.mesh.quaternion.copy(c.base); c.hover = 0; });
    cube.updateMatrixWorld(true);
    members.forEach((c) => pivot.attach(c.mesh));
    move = { axis, members, t: 0, dir: Math.random() < 0.5 ? -1 : 1 };
  }
  function stepMove(dt) {
    move.t += dt / 0.75;
    const e = easeInOut(clamp(move.t));
    pivot.rotation[move.axis] = e * move.dir * Math.PI / 2;
    if (move.t >= 1) {
      pivot.updateMatrixWorld(true);
      const H = Math.PI / 2;
      move.members.forEach((c) => {
        cube.attach(c.mesh);
        c.mesh.position.set(Math.round(c.mesh.position.x), Math.round(c.mesh.position.y), Math.round(c.mesh.position.z));
        const r = c.mesh.rotation;
        r.set(Math.round(r.x / H) * H, Math.round(r.y / H) * H, Math.round(r.z / H) * H);
        c.cubePos.copy(c.mesh.position); c.base.copy(c.mesh.quaternion);
      });
      pivot.rotation.set(0, 0, 0);
      move = null;
    }
  }

  // ── pointer / raycast
  const ptr = new THREE.Vector2(9, 9), ptrN = { x: 0, y: 0 }, ray = new THREE.Raycaster();
  let ptrActive = false, overUI = false, hoveredCubie = null, hoveredObj = null, hoveredLink = null;
  const hitRoots = Object.values(objs).map((o) => o.root);
  function findObj(o) { while (o && !o.userData.obj) o = o.parent; return o?.userData.obj; }

  // ── state
  const tq = new THREE.Quaternion(), tv = V();
  let explodeCur = 0, screenCur = 2, cableCur = 1, introT0 = null, tilt = 0;
  const camT = V(0, 0, 24);

  return {
    start(now) { introT0 = now; },
    setPointer(x, y, ui) {
      ptr.set((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1);
      ptrN.x = ptr.x; ptrN.y = ptr.y; ptrActive = true; overUI = ui;
    },
    click() {
      if (hoveredLink) { window.open(hoveredLink.url, '_blank', 'noopener'); return; }
      if (hoveredObj) {
        hoveredObj.spinT += Math.PI * 2;
        if (hoveredObj === objs.c && !move && explodeCur < 0.02) startMove();
      }
    },
    resize() {
      camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile() ? 1.5 : 2));
      renderer.setSize(innerWidth, innerHeight, false);
      world.scale.setScalar(isMobile() ? 0.62 : 1);
      buildStates();
    },
    update(dt, t, p, vel) {
      const st = blend(p);
      const intro = (o) => (introT0 === null ? 0 : easeOutBack(clamp((t - introT0 - o.delay) / 1.1)));

      // objects
      for (const key in objs) {
        const o = objs[key], s = st[key];
        tv.set(s.p[0], s.p[1], s.p[2]);
        if (!o.init) { o.p.copy(tv); o.r.set(...s.r); o.s = s.s; o.init = true; }
        const kk = 4.2;
        o.p.set(damp(o.p.x, tv.x, kk, dt), damp(o.p.y, tv.y, kk, dt), damp(o.p.z, tv.z, kk, dt));
        o.r.set(damp(o.r.x, s.r[0], kk, dt), damp(o.r.y, s.r[1], kk, dt), damp(o.r.z, s.r[2], kk, dt));
        o.s = damp(o.s, s.s, kk, dt);
        o.spin = damp(o.spin, o.spinT, 3.2, dt);
        const ie = intro(o);
        const hov = o === hoveredObj && key !== 'c' ? 1 : 0;
        o.hov = damp(o.hov || 0, hov, 8, dt);
        o.root.position.set(o.p.x, o.p.y + Math.sin(t * 0.9 + o.phase) * 0.16 - (1 - clamp(ie)) * 2.5, o.p.z);
        const wob = o.still ? 0.15 : 1;
        o.root.rotation.set(
          o.r.x + Math.sin(t * 0.55 + o.phase) * 0.05 * wob,
          o.r.y + Math.sin(t * 0.42 + o.phase) * 0.09 * wob + o.spin,
          o.r.z + Math.cos(t * 0.5 + o.phase) * 0.03 * wob,
        );
        o.root.scale.setScalar(Math.max(0.0001, o.s * ie * (1 + o.hov * 0.06)));
      }
      floatCube.rotation.set(t * 0.35, t * 0.5, 0);

      // clay blobs: hero blobs breathe around the photo, background blobs drift with scroll and wrap
      heroBlobs.forEach((m, i) => {
        m.position.set(m.userData.base.x + Math.sin(t * 0.7 + i) * 0.12, m.userData.base.y + Math.cos(t * 0.6 + i * 1.7) * 0.16, m.userData.base.z);
        m.rotation.x += dt * m.userData.spin.x; m.rotation.y += dt * m.userData.spin.y;
      });
      studioAnim(t, dt);
      const bgIntro = introT0 === null ? 0 : clamp((t - introT0 - 0.3) / 1.2);
      bgBlobs.forEach((b) => {
        const range = 26, depth = 0.6 + (-b.base.z - 5) * 0.12;
        let y = b.base.y + p * 3.4 * depth + Math.sin(t * 0.5 + b.phase) * 0.25;
        y = ((y + range / 2) % range + range) % range - range / 2;
        b.grp.position.set(b.base.x * (isMobile() ? 0.55 : 1) + Math.cos(t * 0.35 + b.phase) * 0.3, y, b.base.z);
        b.hov = damp(b.hov, b.link && b.link === hoveredLink ? 1 : 0, 8, dt);
        b.grp.scale.setScalar(Math.max(0.0001, easeOutBack(bgIntro) * (1 + b.hov * 0.12)));
        b.mesh.rotation.x += dt * b.mesh.userData.spin.x; b.mesh.rotation.y += dt * b.mesh.userData.spin.y;
      });
      cube.rotation.y = Math.sin(t * 0.3) * 0.25;

      // cube explode / Rubik
      explodeCur = damp(explodeCur, st.explode, 3, dt);
      if (move) stepMove(dt);
      else {
        moveTimer -= dt;
        if (moveTimer <= 0 && explodeCur < 0.02 && introT0 !== null) { startMove(); moveTimer = 1.5 + Math.random(); }
      }
      if (!move) {
        const e = explodeCur;
        for (const c of cubies) {
          c.hover = damp(c.hover, c === hoveredCubie ? 1 : 0, 9, dt);
          tv.copy(c.cubePos).multiplyScalar(lerp(1, 2.5, e)).addScaledVector(c.jit, e);
          if (c.hover > 0.001 && c.cubePos.lengthSq() > 0) tv.addScaledVector(c.cubePos.clone().normalize(), c.hover * 0.3);
          c.mesh.position.copy(tv);
          if (e > 0.001) {
            tq.setFromAxisAngle(c.axis, c.ang * e + Math.sin(t * 0.6 + c.idx) * 0.35 * e);
            c.mesh.quaternion.copy(c.base).multiply(tq);
          } else c.mesh.quaternion.copy(c.base);
        }
      }

      // screen + cable
      screenCur = damp(screenCur, st.screen, 4, dt);
      drawScreen(t, clamp(screenCur, 0, 2));
      cableCur = damp(cableCur, st.cable, 5, dt);

      // camera & world parallax + scroll tilt
      tilt = damp(tilt, clamp((vel || 0) * 0.012, -0.35, 0.35), 4, dt);
      camT.set(ptrN.x * 0.7, ptrN.y * 0.45, 24);
      camera.position.lerp(camT, 1 - Math.exp(-3 * dt));
      camera.lookAt(0, 0, 0);
      world.rotation.x = tilt * 0.4;
      world.rotation.z = -tilt * 0.08;

      scene.updateMatrixWorld();
      updateCable(cableCur * (introT0 === null ? 0 : clamp((t - introT0 - 0.6) / 0.8)));

      // hover raycast
      hoveredCubie = null; hoveredObj = null; hoveredLink = null;
      let tip = null;
      if (ptrActive && !overUI && introT0 !== null) {
        ray.setFromCamera(ptr, camera);
        const hit = ray.intersectObjects(hitRoots, true)[0];
        const bh = ray.intersectObjects(blobHits, false)[0];
        if (bh && bh.object.userData.link && (!hit || bh.distance < hit.distance)) {
          hoveredLink = bh.object.userData.link;
          tip = `Open ${hoveredLink.label} ↗`;
        } else if (hit) {
          hoveredObj = findObj(hit.object);
          if (hoveredObj === objs.c) {
            let m = hit.object;
            while (m && !cubieMeshes.includes(m)) m = m.parent;
            if (!move) hoveredCubie = cubies.find((c) => c.mesh === m) || null;
            const a = hoveredCubie && DATA.achievements[hoveredCubie.idx % DATA.achievements.length];
            tip = a ? `${a.big} · ${a.title}` : 'Click to twist';
          } else tip = hoveredObj?.tip || null;
        }
      }

      renderer.render(scene, camera);
      return { tip, hot: !!hoveredObj || !!hoveredLink };
    },
  };
}

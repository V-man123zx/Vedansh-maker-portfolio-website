// The showroom: one fixed Three.js world. Scrolling moves the camera along a copper wire that
// leaves a chip, flies over a circuit-board floor, passes each project's CAD and media, then ends
// at an LED. Stops are laid out procedurally, so adding a project to the data adds a stop.
import * as THREE from "three";
import { emptyModel, loadCad, MAT } from "./models.js";

const V3 = THREE.Vector3;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const smooth = x => x * x * x * (x * (x * 6 - 15) + 10);
const SRGB = THREE.SRGBColorSpace;
const FOV = 40, BG = 0x050f0b, TRAVEL = .9, HOLD = .9, SPACING = 38;
// model radius on its stage; the media hangs a little larger than this
const REACH = { hand: 1.25, glove: 1.25, gripper: 1.3, box: 1.35, reactor: 1.3 };
export const PORTRAIT_QUERY = "(max-aspect-ratio: 21/20)";

function radial(inner, outer) {
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const g = c.getContext("2d"), r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  r.addColorStop(0, inner); r.addColorStop(.3, outer); r.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = r; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = SRGB; return t;
}

function boardTexture(aniso) {
  const S = 1024, c = document.createElement("canvas"); c.width = c.height = S; const g = c.getContext("2d");
  g.fillStyle = "#06150f"; g.fillRect(0, 0, S, S);
  const rnd = (a, b) => a + Math.random() * (b - a), grid = 32, snap = v => Math.round(v / grid) * grid;
  const dirs = [[1, 0], [0, 1], [-1, 0], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]];
  g.lineCap = g.lineJoin = "round";
  for (let i = 0; i < 90; i++) {
    let x = snap(rnd(0, S)), y = snap(rnd(0, S)), d = Math.floor(rnd(0, 4));
    g.strokeStyle = `rgba(190,135,60,${rnd(.25, .5).toFixed(2)})`; g.lineWidth = Math.random() < .3 ? 7 : 4;
    g.beginPath(); g.moveTo(x, y); const sx = x, sy = y;
    for (let k = 0, n = 2 + Math.floor(rnd(0, 4)); k < n; k++) {
      const L = grid * Math.floor(rnd(2, 7)); x += dirs[d][0] * L; y += dirs[d][1] * L; g.lineTo(x, y);
      d = d < 4 ? (Math.random() < .5 ? 4 + Math.floor(rnd(0, 4)) : Math.floor(rnd(0, 4))) : Math.floor(rnd(0, 4));
    }
    g.stroke();
    [[sx, sy], [x, y]].forEach(([px, py]) => { g.fillStyle = "rgba(205,150,70,.7)"; g.beginPath(); g.arc(px, py, 8, 0, 7); g.fill(); g.fillStyle = "#04100b"; g.beginPath(); g.arc(px, py, 3.5, 0, 7); g.fill(); });
  }
  for (let i = 0; i < 26; i++) {
    const x = snap(rnd(0, S)), y = snap(rnd(0, S)), w = grid * Math.floor(rnd(2, 5)), h = grid * Math.floor(rnd(1, 3));
    g.strokeStyle = "rgba(230,230,215,.14)"; g.lineWidth = 2; g.strokeRect(x, y, w, h);
    g.fillStyle = "rgba(200,160,80,.45)"; for (let k = 0; k < w / 12; k++) { g.fillRect(x + 4 + k * 12, y - 9, 6, 7); g.fillRect(x + 4 + k * 12, y + h + 2, 6, 7); }
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = aniso; t.colorSpace = SRGB; return t;
}

function captionTexture(text) {
  const c = document.createElement("canvas"); c.width = 512; c.height = 64; const g = c.getContext("2d");
  const draw = () => { g.clearRect(0, 0, 512, 64); g.fillStyle = "#e0b052"; g.font = '34px "Share Tech Mono", monospace'; g.textBaseline = "middle"; g.fillText(text, 4, 34); };
  draw(); const t = new THREE.CanvasTexture(c); t.colorSpace = SRGB;
  if (document.fonts) document.fonts.ready.then(() => { draw(); t.needsUpdate = true; });
  return t;
}

export function createShowroom(canvas, opts) {
  const { projects, media, overlays, ticks, track, tip, hint, onStop, onOpenMedia, reduce = false, debugS = null } = opts;
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" }); }
  catch (e) { return null; }
  if (!renderer.getContext()) return null;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
  renderer.setClearColor(BG, 1);
  const scene = new THREE.Scene(); scene.fog = new THREE.FogExp2(BG, .022);
  const camera = new THREE.PerspectiveCamera(FOV, 1, .05, 300);
  scene.add(new THREE.HemisphereLight(0xd8efe4, 0x08130f, 2.4));
  const key = new THREE.DirectionalLight(0xfff2de, 2.8); key.position.set(-6, 10, 8); scene.add(key);
  const rim = new THREE.DirectionalLight(0x9fd8ff, 1.2); rim.position.set(6, 4, -8); scene.add(rim);
  const headLight = new THREE.PointLight(0xffc35a, 14, 10, 2); scene.add(headLight);
  const aniso = renderer.capabilities.getMaxAnisotropy();
  const glowTex = radial("rgba(255,255,255,1)", "rgba(255,200,110,.55)");
  const poolTex = radial("rgba(255,190,90,.5)", "rgba(255,170,60,.16)");
  const redTex = radial("rgba(255,230,220,1)", "rgba(255,60,40,.5)");
  const disposables = [glowTex, poolTex, redTex];
  const unitPlane = new THREE.PlaneGeometry(1, 1), unitBox = new THREE.BoxGeometry(1, 1, 1), holeGeo = new THREE.TorusGeometry(.045, .016, 8, 20);
  const boardMat = new THREE.MeshStandardMaterial({ color: 0x0c2a1e, roughness: .65, metalness: .1 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xd8b25a, metalness: .85, roughness: .3 });

  // ---- stops: hero chip, every project, the LED at the end ----
  const N = projects.length;
  const STOPS = [{ C: [0, 0, 0], yaw: 0, hold: .45 }];
  // stops run nearly straight into the screen with a gentle sideways drift, so flying between them stays calm
  projects.forEach((p, i) => { const k = i + 1; STOPS.push({ C: [Math.sin(k * .8) * 2.5, 0, -k * SPACING], yaw: 0, hold: HOLD, p }); });
  STOPS.push({ C: [0, 0, -(N + 1) * SPACING], yaw: 0, hold: .7 });
  const END = STOPS.length - 1;
  let acc = 0;
  STOPS.forEach((s, k) => {
    s.g = new THREE.Group(); s.g.position.set(...s.C); s.g.rotation.y = s.yaw; scene.add(s.g); s.g.updateMatrixWorld(true);
    s.a = acc; s.b = acc + s.hold; acc = s.b + (k < END ? TRAVEL : 0);
  });
  const TOTAL = acc;
  const snapAt = k => (k ? STOPS[k].a + STOPS[k].hold * .5 : 0);
  const L = (k, x, y, z) => STOPS[k].g.localToWorld(new V3(x, y, z));

  // circuit-board floor
  const floorTex = boardTexture(aniso), floorLen = (N + 2) * SPACING + 120;
  floorTex.repeat.set(400 / 25, floorLen / 25);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(400, floorLen), new THREE.MeshStandardMaterial({ map: floorTex, roughness: .8, metalness: .25 }));
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, -6, 40 - floorLen / 2); scene.add(floor);

  // ---- media frames: each photo or video is a small board floating in space ----
  const videos = [];
  function makeFrame(item, project) {
    const g = new THREE.Group(); g.rotation.order = "YXZ";
    const mat = new THREE.MeshBasicMaterial({ color: 0x1a2a24 });
    const img = new THREE.Mesh(unitPlane, mat), back = new THREE.Mesh(unitBox, boardMat); back.position.z = -.04; g.add(back, img);
    const holes = [0, 1, 2, 3].map(() => { const h = new THREE.Mesh(holeGeo, goldMat); g.add(h); return h; });
    const capTex = captionTexture((item.video ? "▶ " : "") + item.c.toUpperCase()); disposables.push(capTex);
    const cap = new THREE.Mesh(unitPlane, new THREE.MeshBasicMaterial({ map: capTex, transparent: true, depthWrite: false })); g.add(cap);
    const f = { item, project, g, ar: item.w / item.h, pick: [img, back], loaded: false, video: null };
    img.userData.frame = back.userData.frame = f;
    f.size = (w, h) => {
      img.scale.set(w, h, 1); back.scale.set(w + .24, h + .24, .05);
      holes.forEach((o, i) => o.position.set((i % 2 ? 1 : -1) * (w / 2 + .07), (i < 2 ? 1 : -1) * (h / 2 + .07), 0));
      cap.scale.set(1.6, .2, 1); cap.position.set(-w / 2 + .68, -h / 2 - .3, 0); f.w = w; f.h = h;
    };
    // textures load only when the camera gets close
    f.load = () => {
      if (f.loaded) return; f.loaded = true;
      const tl = new THREE.TextureLoader();
      const use = t => { t.colorSpace = SRGB; t.anisotropy = 4; mat.map = t; mat.color.set(0xffffff); mat.needsUpdate = true; disposables.push(t); };
      tl.load(item.video ? item.poster : item.src, t => { if (!f.video || mat.map !== f.vt) use(t); });
      if (item.video) {
        const v = document.createElement("video"); Object.assign(v, { src: item.src, muted: true, loop: true, playsInline: true, preload: "auto" }); v.setAttribute("playsinline", "");
        const vt = new THREE.VideoTexture(v); vt.colorSpace = SRGB; f.video = v; f.vt = vt; disposables.push(vt);
        v.addEventListener("playing", () => { if (mat.map !== vt) { mat.map = vt; mat.color.set(0xffffff); mat.needsUpdate = true; } });
        videos.push(f);
      }
    };
    return f;
  }

  const projStops = projects.map((p, i) => {
    const k = i + 1, S = STOPS[k];
    // only real CAD is shown: the stop stays empty until its .glb arrives, and projects without CAD give the space to their media
    const model = emptyModel();
    const holder = new THREE.Group(), spin = new THREE.Group();
    const reach = REACH[p.model] || 1.5;
    spin.add(model.root); holder.add(spin); holder.scale.setScalar(reach / model.size); S.g.add(holder);
    const pad = new THREE.Mesh(new THREE.TorusGeometry(1.9, .06, 10, 64), new THREE.MeshStandardMaterial({ color: 0xd8b25a, metalness: .85, roughness: .3, emissive: 0x000000 }));
    pad.rotation.x = Math.PI / 2; pad.position.y = -1.7; S.g.add(pad);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(1.84, 64), new THREE.MeshStandardMaterial({ color: 0x14241d, roughness: .7, metalness: .3 }));
    disc.rotation.x = -Math.PI / 2; disc.position.y = -1.72; S.g.add(disc);
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(7, 7), new THREE.MeshBasicMaterial({ map: poolTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: .08 }));
    pool.rotation.x = -Math.PI / 2; pool.position.y = -1.71; S.g.add(pool);
    pad.visible = disc.visible = pool.visible = !!p.cad;
    const frames = media(p).map(m => { const f = makeFrame(m, p); S.g.add(f.g); return f; });
    const ps = { k, p, model, holder, spin, pad, disc, pool, frames, yaw: .5, pitch: 0, idle: 9, r: reach };
    // the CAD loads once the camera gets near (lazily, it's the heaviest asset)
    ps.loadCad = () => {
      if (!p.cad || ps.cadReq) return; ps.cadReq = true;
      loadCad(p.cad, p.title).then(m => { spin.remove(ps.model.root); ps.model = m; spin.add(m.root); holder.scale.setScalar(ps.r / m.size); }).catch(e => console.warn("CAD failed to load", p.cad, e));
    };
    return ps;
  });

  // hero chip: where the signal starts
  const chip = (() => {
    const g = new THREE.Group(); STOPS[0].g.add(g);
    const tc = document.createElement("canvas"); tc.width = tc.height = 512; const x = tc.getContext("2d");
    const paint = () => {
      x.fillStyle = "#18191a"; x.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 1400; i++) { x.fillStyle = `rgba(255,255,255,${Math.random() * .03})`; x.fillRect(Math.random() * 512, Math.random() * 512, 2, 2); }
      x.fillStyle = "#0c0d0e"; x.beginPath(); x.arc(70, 70, 26, 0, 7); x.fill();
      x.fillStyle = "#c9ccc7"; x.textAlign = "center"; x.font = '700 92px "Chakra Petch", sans-serif'; x.fillText("VW-01", 256, 250);
      x.fillStyle = "#8b908b"; x.font = '38px "Share Tech Mono", monospace'; x.fillText("MAKER MCU · REV 3", 256, 320); x.fillText(`${N} BUILDS`, 256, 370);
    };
    paint();
    const tex = new THREE.CanvasTexture(tc); tex.colorSpace = SRGB; tex.anisotropy = aniso; disposables.push(tex);
    if (document.fonts) document.fonts.ready.then(() => { paint(); tex.needsUpdate = true; });
    const side = new THREE.MeshStandardMaterial({ color: 0x1b1d1e, roughness: .55 });
    g.add(new THREE.Mesh(new THREE.BoxGeometry(3, .32, 3), [side, side, new THREE.MeshStandardMaterial({ map: tex, roughness: .5 }), side, side, side]));
    const n = 12, inst = new THREE.InstancedMesh(unitBox, goldMat, n * 4), m = new THREE.Matrix4(); let k = 0;
    [[0, -1], [0, 1], [-1, 0], [1, 0]].forEach(([sx, sz]) => { for (let i = 0; i < n; i++) { const o = -1.25 + i * 2.5 / (n - 1); m.compose(new V3(sx ? sx * 1.72 : o, -.14, sz ? sz * 1.72 : o), new THREE.Quaternion(), new V3(sx ? .45 : .09, .05, sz ? .45 : .09)); inst.setMatrixAt(k++, m); } });
    g.add(inst);
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), new THREE.MeshBasicMaterial({ map: poolTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: .55 }));
    pool.rotation.x = -Math.PI / 2; pool.position.y = -.2; g.add(pool);
    return g;
  })();

  // end terminal: a header and the LED the signal lights
  const term = (() => {
    const g = new THREE.Group(); STOPS[END].g.add(g);
    const block = new THREE.Mesh(new THREE.BoxGeometry(1.9, .5, .7), MAT.dark); block.position.set(0, -.5, 0); g.add(block);
    for (let i = 0; i < 8; i++) { const pn = new THREE.Mesh(new THREE.BoxGeometry(.07, .55, .07), goldMat); pn.position.set(-.7 + i * .2, -.42, .42); g.add(pn); }
    const ledMat = new THREE.MeshStandardMaterial({ color: 0x5a1410, roughness: .25, emissive: 0xff2a14, emissiveIntensity: 0, transparent: true, opacity: .92 });
    const base = new THREE.Mesh(new THREE.CylinderGeometry(.34, .34, .12, 32), ledMat); base.position.set(0, -.19, 0); g.add(base);
    const body = new THREE.Mesh(new THREE.CylinderGeometry(.28, .28, .45, 32), ledMat); body.position.set(0, .1, 0); g.add(body);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(.28, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), ledMat); dome.position.set(0, .32, 0); g.add(dome);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: redTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 })); halo.position.set(0, .2, 0); halo.scale.set(3.4, 3.4, 1); g.add(halo);
    const light = new THREE.PointLight(0xff3a20, 0, 8, 2); light.position.set(0, .6, .6); g.add(light);
    const pad = new THREE.Mesh(new THREE.TorusGeometry(1.6, .06, 10, 64), goldMat); pad.rotation.x = Math.PI / 2; pad.position.y = -.78; g.add(pad);
    return { ledMat, halo, light };
  })();

  // floating SMD parts and dust
  const debris = (() => {
    const count = reduce ? 500 : 1100, inst = new THREE.InstancedMesh(unitBox, new THREE.MeshStandardMaterial({ roughness: .5, metalness: .35 }), count);
    const items = [], col = new THREE.Color(), kinds = [[.24, .07, .11, 0x1a1a1a], [.18, .09, .1, 0xb0895a], [.5, .07, .5, 0x141414], [.12, .05, .07, 0x6a6e70]];
    const zMin = STOPS[END].C[2] - 20;
    for (let i = 0; i < count; i++) {
      const p = new V3((Math.random() - .5) * 50 + Math.sin(i) * 4, -4.8 + Math.random() * 12, 16 + Math.random() * (zMin - 16));
      if (STOPS.some(s => Math.hypot(p.x - s.C[0], p.z - s.C[2]) < 13 && Math.abs(p.y - s.C[1]) < 6)) { i--; continue; }
      const kd = kinds[Math.floor(Math.random() * kinds.length)];
      items.push({ p, s: new V3(kd[0], kd[1], kd[2]), q: new THREE.Euler(Math.random() * 6, Math.random() * 6, Math.random() * 6), w: (Math.random() - .5) * .6 });
      inst.setColorAt(i, col.setHex(kd[3]));
    }
    scene.add(inst);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion();
    const update = (dt, z) => { items.forEach((it, i) => { if (dt && Math.abs(it.p.z - z) > 70) return; it.q.x += it.w * dt; it.q.y += it.w * dt * .7; m.compose(it.p, q.setFromEuler(it.q), it.s); inst.setMatrixAt(i, m); }); inst.instanceMatrix.needsUpdate = true; };
    update(0, 0);
    const D = 5000, pos = new Float32Array(D * 3);
    for (let i = 0; i < D; i++) { pos[i * 3] = (Math.random() - .5) * 56; pos[i * 3 + 1] = -5 + Math.random() * 14; pos[i * 3 + 2] = 16 + Math.random() * (zMin - 16); }
    const dg = new THREE.BufferGeometry(); dg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    scene.add(new THREE.Points(dg, new THREE.PointsMaterial({ color: 0x9cb6aa, size: .035, transparent: true, opacity: .55, depthWrite: false })));
    return { update };
  })();

  // ---- the wire ----
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x8a5e2a, metalness: .75, roughness: .35 });
  const litMat = new THREE.MeshBasicMaterial({ color: 0xffd58a });
  const haloMat = new THREE.MeshBasicMaterial({ color: 0xff9a2a, transparent: true, opacity: .16, blending: THREE.AdditiveBlending, depthWrite: false });
  const head = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffd27a, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); head.scale.set(1.1, 1.1, 1); scene.add(head);
  const headCore = new THREE.Mesh(new THREE.SphereGeometry(.07, 16, 12), new THREE.MeshBasicMaterial({ color: 0xfff4d6 })); scene.add(headCore);
  const RADIAL = 6;
  let wire = null, rail = null, unit = innerHeight;
  const poses = [];

  const D_STOP = 10, TAN = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
  function camPose(k, portrait) {
    if (k === 0) return portrait ? { pos: [1.3, 3.3, 10.5], look: [1.1, -.6, -4] } : { pos: [2.6, 2.5, 6.8], look: [2.5, .1, -4] };
    if (k === END) return portrait ? { pos: [0, 1.6, 8.6], look: [0, 1.9, 0] } : { pos: [0, 1.25, 6.2], look: [0, 1.35, 0] };
    return { pos: [0, 0, D_STOP], look: [0, 0, 0] };
  }

  // Each project stop is laid out in screen space so the media fills most of the view. On wide
  // screens the model stands in a left column above the caption card and the media takes the rest;
  // on tall screens the media stacks on top with the model under it and the card at the bottom.
  // A project without CAD gives the model's space to its media.
  function layoutStop(ps, wide, vw, vh) {
    const HH = D_STOP * TAN, HW = HH * vw / vh;
    const X = fx => (fx - .5) * 2 * HW, Y = fy => (.5 - fy) * 2 * HH; // screen fraction -> world, on the z = 0 plane
    const top = 72 / vh, cad = !!ps.p.cad;
    let areas, mx, my, r;
    if (wide) {
      const cardTop = 1 - (66 + 200) / vh;
      // without a model the media either takes the whole width above the card or the full height beside it
      areas = cad ? [{ x0: .31, x1: .985, y0: top, y1: 1 - 30 / vh }]
        : [{ x0: .02, x1: .985, y0: top, y1: cardTop - 12 / vh }, { x0: .29, x1: .985, y0: top, y1: 1 - 30 / vh }];
      mx = X(.155); my = Y(top + (cardTop - top) * .5);
      r = Math.min(.27 * HW * .62, (cardTop - top) * HH * .55);
      if (!cad) { r = .5; my = Y(1 - 40 / vh) + r; } // the wire skims along under the card
    } else {
      const bottom = 1 - (62 + 206) / vh;
      areas = [{ x0: .03, x1: .97, y0: top, y1: cad ? top + (bottom - top) * .72 : bottom - 12 / vh }];
      mx = 0; my = Y(areas[0].y1 + (bottom - areas[0].y1) * .55); r = (bottom - areas[0].y1) * HH * .6;
      if (!cad) { r = .5; my = Y(1 - 40 / vh) + r; }
    }
    // pack the media into rows, choosing the area and row count that make it largest; videos run 18% larger
    const items = ps.frames.map(f => ({ f, hf: f.item.video ? 1.18 : 1 }));
    const gap = .4, capH = .46;
    let best = null;
    areas.forEach(area => {
      const aw = (area.x1 - area.x0) * 2 * HW, ah = (area.y1 - area.y0) * 2 * HH;
      for (let R = 1; R <= items.length; R++) {
        const per = Math.ceil(items.length / R), rows = [];
        for (let i = 0; i < items.length; i += per) rows.push(items.slice(i, i + per));
        const wUnit = Math.max(...rows.map(rw => rw.reduce((a, it) => a + it.hf * it.f.ar, 0)));
        const gapW = Math.max(...rows.map(rw => (rw.length - 1) * gap)) + .3;
        const hUnit = rows.reduce((a, rw) => a + Math.max(...rw.map(it => it.hf)), 0);
        const sc = Math.min((aw - gapW) / wUnit, (ah - rows.length * capH - (rows.length - 1) * gap - .2) / hUnit);
        if (!best || sc > best.sc) best = { sc, rows, area, ah };
      }
    });
    const { sc, rows, area, ah } = best;
    const totalH = rows.reduce((a, rw) => a + sc * Math.max(...rw.map(it => it.hf)) + capH, 0) + (rows.length - 1) * gap;
    let y = Y(area.y0) - (ah - totalH) / 2 - .12, gi = 0;
    const cx = X((area.x0 + area.x1) / 2);
    rows.forEach(rw => {
      const rh = sc * Math.max(...rw.map(it => it.hf)), w = rw.reduce((a, it) => a + sc * it.hf * it.f.ar, 0) + (rw.length - 1) * gap;
      let x = cx - w / 2;
      rw.forEach(it => {
        const fw = sc * it.hf * it.f.ar, fh = sc * it.hf;
        it.f.size(fw, fh); it.f.g.position.set(x + fw / 2, y - rh / 2, gi++ % 2 ? .12 : -.12);
        it.f.g.rotation.y = Math.atan2(-(x + fw / 2), D_STOP) * .35; it.f.g.rotation.x = Math.atan2(y - rh / 2, D_STOP) * .3;
        x += fw + gap;
      });
      y -= rh + capH + gap;
    });
    // the model and its pad
    ps.holder.position.set(mx, my, 0);
    ps.r = r * (REACH[ps.p.model] || 1.5) / 1.5; ps.holder.scale.setScalar(ps.r / ps.model.size);
    // the camera looks straight on, so tip the pad toward it to read as a ring rather than a line
    [ps.pad, ps.disc, ps.pool].forEach(o => { o.position.set(mx, my - r * 1.12 - (o === ps.disc ? .02 : o === ps.pool ? .01 : 0), 0); o.scale.setScalar(r / 1.5); o.rotation.x = o === ps.pad ? Math.PI / 2 + .3 : -Math.PI / 2 + .3; });
    return { mx, my, r, HH, wide };
  }

  function build() {
    const vw = innerWidth, vh = innerHeight, aspect = vw / vh, portrait = matchMedia(PORTRAIT_QUERY).matches;
    renderer.setSize(vw, vh, false); camera.aspect = aspect; camera.updateProjectionMatrix();
    const layouts = [];
    STOPS.forEach((s, k) => {
      const ps = projStops[k - 1] && k < END ? projStops[k - 1] : null;
      layouts[k] = ps ? layoutStop(ps, !portrait, vw, vh) : null;
      const pose = camPose(k, portrait);
      poses[k] = { pos: L(k, ...pose.pos), look: L(k, ...pose.look), D: pose.pos[2] };
      s.g.updateMatrixWorld(true);
    });

    // wire points, with the index where each stop's stretch starts and ends
    const pts = [], marks = [];
    pts.push(L(0, 1.62, -.12, .35), L(0, 2.25, -.22, .5), L(0, 3.1, -.55, -.3), L(0, 3.4, -.95, -2.7));
    marks[0] = { entry: 0, exit: 3 };
    for (let k = 1; k <= END; k++) {
      const lay = layouts[k], fy = lay ? lay.my - lay.r : 0, fx = lay ? lay.mx : 0;
      const E = pts[pts.length - 1], A0 = lay ? L(k, fx * .5 - .6, fy - 1.6, 17) : L(k, -.6, -2.3, 17), dir = A0.clone().sub(E).setY(0).normalize(), side = new V3(-dir.z, 0, dir.x), sw = k % 2 ? 1 : -1;
      pts.push(E.clone().lerp(A0, .3).addScaledVector(side, 1.2 * sw).add(new V3(0, -.3, 0)));
      pts.push(E.clone().lerp(A0, .66).addScaledVector(side, -1 * sw).add(new V3(0, .5, 0)));
      if (k === END) { pts.push(A0, L(k, .5, -2.0, 9.5), L(k, .5, -1.1, 4.4), L(k, .2, -.45, 1.6), L(k, 0, -.3, .42)); marks[k] = { entry: pts.length - 1, exit: pts.length - 1 }; break; }
      // pass by: skim the front edge of the model's pad, then duck behind the media and on to the next stop
      const sg = lay.wide ? -1 : sw, r = lay.r;
      pts.push(A0, L(k, fx * .8 + .3, fy - 1.1, 9.5), L(k, fx + sg * r * .9, fy - .25, 4.2));
      const entry = pts.length;
      pts.push(L(k, fx + sg * r * 1.45, fy, 1.2), L(k, fx + sg * r * 1.6, fy + .2, -1.2));
      const exit = pts.length - 1;
      pts.push(L(k, fx + sg * r * 1.3, lay.my, -4.5), L(k, fx * .5, lay.my + lay.HH * .3, -9));
      marks[k] = { entry, exit };
    }
    const curve = new THREE.CatmullRomCurve3(pts, false, "centripetal", .5), n = pts.length;
    curve.arcLengthDivisions = (n - 1) * 20;
    const lengths = curve.getLengths(), div = curve.arcLengthDivisions, len = lengths[div];
    const segs = Math.min(16000, Math.round(len * 8));
    const geo = new THREE.TubeGeometry(curve, segs, .045, RADIAL, false), hgeo = new THREE.TubeGeometry(curve, segs, .1, RADIAL, false);
    if (wire) { scene.remove(wire.base, wire.lit, wire.halo); [wire.base, wire.lit, wire.halo].forEach(m => m.geometry.dispose()); }
    const base = new THREE.Mesh(geo, baseMat), lit = new THREE.Mesh(geo.clone(), litMat), halo = new THREE.Mesh(hgeo, haloMat);
    base.frustumCulled = lit.frustumCulled = halo.frustumCulled = false; halo.renderOrder = 2;
    scene.add(base, lit, halo);
    const tOf = i => i / (n - 1);
    wire = { curve, lengths, div, len, segs, base, lit, halo, marks: marks.map(m => ({ entry: tOf(m.entry), exit: tOf(m.exit) })) };

    // camera rail: each stop's framing, joined by a calm arc up over the media wall and a long,
    // nearly straight glide down onto the next stop (the camera no longer chases the wire's turns)
    const HH = D_STOP * TAN, cp = [], lp = [], idx = [];
    for (let k = 0; k <= END; k++) {
      idx[k] = cp.length; cp.push(poses[k].pos); lp.push(poses[k].look);
      if (k === END) break;
      if (k === 0) { cp.push(L(0, 2.5, 2.4, -4)); lp.push(L(0, 2, 1, -16)); }
      else { cp.push(L(k, 0, HH * 1.2, 1), L(k, 0, HH * 1.05, -8)); lp.push(L(k, 0, HH * .8, -12), L(k, 0, HH * .5, -22)); }
      const n = k + 1, ny = n === END ? 1.6 : 0;
      cp.push(L(n, 0, ny + HH * .55, 23), L(n, 0, ny + HH * .2, 16)); lp.push(L(n, 0, ny, 0), L(n, 0, ny, 0));
    }
    const cam = new THREE.CatmullRomCurve3(cp, false, "centripetal", .5), look = new THREE.CatmullRomCurve3(lp, false, "centripetal", .5);
    const CD = cp.length * 40; cam.arcLengthDivisions = CD;
    const cl = cam.getLengths();
    rail = { cam, look, u: idx.map(i => cl[Math.round(i / (cp.length - 1) * CD)] / cl[CD]) };

    unit = vh;
    if (track) track.style.height = (TOTAL * unit + vh) + "px";
  }

  // ---- interaction ----
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  let hov = null, drag = null, nearProj = null, curK = 0;
  function hit(e) {
    ndc.set(e.clientX / innerWidth * 2 - 1, -e.clientY / innerHeight * 2 + 1); ray.setFromCamera(ndc, camera);
    const objs = [];
    projStops.forEach(ps => { if (Math.abs(ps.k - curK) <= 1) { objs.push(...ps.model.parts); ps.frames.forEach(f => objs.push(...f.pick)); } });
    const h = ray.intersectObjects(objs, false)[0]; return h ? h.object : null;
  }
  function setHov(o, e) {
    if (hov && hov !== o && hov.userData.part) hov.material = hov.userData.mat;
    hov = o;
    if (o && o.userData.part) { o.material = MAT.hot; tip.textContent = o.userData.part; }
    else if (o && o.userData.frame) tip.textContent = `${o.userData.frame.item.c} · click to open`;
    tip.hidden = !o;
    if (o) { tip.style.left = Math.min(e.clientX + 14, innerWidth - tip.offsetWidth - 8) + "px"; tip.style.top = (e.clientY + 16) + "px"; }
    canvas.classList.toggle("point", !!(o && o.userData.frame)); canvas.classList.toggle("grab", !!nearProj && !(o && o.userData.frame));
  }
  const onDown = e => { drag = { x: e.clientX, y: e.clientY, moved: false, ps: nearProj, yaw: nearProj && nearProj.yaw, pitch: nearProj && nearProj.pitch }; };
  const onMove = e => {
    if (drag && drag.ps) {
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (Math.abs(dx) > 5) drag.moved = true;
      if (drag.moved) { drag.ps.yaw = drag.yaw + dx * .01; if (e.pointerType === "mouse") drag.ps.pitch = clamp(drag.pitch + dy * .005, -.5, .7); drag.ps.idle = 0; }
    }
    if (e.pointerType === "mouse") setHov(hit(e), e);
  };
  const onUp = e => {
    if (drag && !drag.moved && e.target === canvas) { const o = hit(e); if (o && o.userData.frame) onOpenMedia(o.userData.frame.project, o.userData.frame.item); }
    drag = null;
  };
  const onLeave = () => setHov(null, null);
  canvas.addEventListener("pointerdown", onDown); canvas.addEventListener("pointermove", onMove); canvas.addEventListener("pointerleave", onLeave); addEventListener("pointerup", onUp);

  let lastW = innerWidth, lastH = innerHeight;
  const onResize = () => {
    if (innerWidth !== lastW || Math.abs(innerHeight - lastH) > 140) { lastW = innerWidth; lastH = innerHeight; build(); }
    else { renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); }
  };
  addEventListener("resize", onResize);
  const pq = matchMedia(PORTRAIT_QUERY); pq.addEventListener("change", build);

  build();

  // ---- moving between stops ----
  // Every input (wheel, trackpad, swipe, keys, directory) becomes one eased flight to a stop, so the
  // camera never rests partway along the wire. A single hop takes about two and a half seconds.
  const HOP = 2.6, PER_EXTRA = .3, MAX_FLIGHT = 5;
  let tween = null, queued = 0, lastWheel = 0, ignoreScrollUntil = 0, idle = 0, lastY = scrollY, dirY = 1, touch0 = null;
  let lastU = 0, lastLit = 0, drift = 1;
  const ease = p => -(Math.cos(Math.PI * p) - 1) / 2;
  // the next stop from timeline position s, going in direction d
  function stopFrom(s, d) {
    const snaps = STOPS.map((_, k) => snapAt(k));
    if (d > 0) { const i = snaps.findIndex(v => v > s + 1e-3); return i < 0 ? END : i; }
    for (let i = END; i >= 0; i--) if (snaps[i] < s - 1e-3) return i;
    return 0;
  }
  function flyTo(k) {
    k = Math.max(0, Math.min(END, k));
    const s1 = snapAt(k);
    if (Math.abs(sCur - s1) < 1e-3) return;
    const span = Math.abs(s1 - sCur) / (HOLD + TRAVEL);
    tween = {
      s0: sCur, s1, u0: lastU, u1: rail.u[k], l0: lastLit, l1: k === 0 ? 0 : wire.marks[k].exit, t0: performance.now(),
      dur: reduce ? 1 : Math.min(MAX_FLIGHT, HOP + PER_EXTRA * Math.max(0, span - 1)) * 1000
    };
  }
  const hop = d => { if (tween) queued = d; else flyTo(stopFrom(sCur, d)); };
  const inScroller = e => e.target.closest && e.target.closest(".dir-list, .lb");

  // a wheel or trackpad gesture is one hop; its trailing momentum is ignored. Rolling the wheel
  // forward (away from you, deltaY < 0) flies forward into the screen.
  const onWheel = e => {
    if (e.ctrlKey || inScroller(e)) return;
    e.preventDefault();
    const now = performance.now(), fresh = now - lastWheel > 220; lastWheel = now;
    if (!fresh || Math.abs(e.deltaY) < 1) return;
    const d = -Math.sign(e.deltaY);
    if (!tween) hop(d); else if ((now - tween.t0) / tween.dur > .4) queued = d;
  };
  const onTouchStart = e => { touch0 = inScroller(e) ? null : { x: e.touches[0].clientX, y: e.touches[0].clientY }; };
  const onTouchMove = e => { if (touch0 && e.cancelable) e.preventDefault(); };
  const onTouchEnd = e => {
    if (!touch0) return;
    const t = e.changedTouches[0], dy = touch0.y - t.clientY, dx = touch0.x - t.clientX; touch0 = null;
    if (Math.abs(dy) > 40 && Math.abs(dy) > Math.abs(dx)) hop(Math.sign(dy));
  };
  const onKey = e => {
    if (e.target.closest && e.target.closest("input, textarea, select, .lb")) return;
    if (e.key === " " && e.target.closest && e.target.closest("button, a")) return;
    const d = { ArrowDown: 1, PageDown: 1, " ": e.shiftKey ? -1 : 1, ArrowUp: -1, PageUp: -1 }[e.key];
    if (e.key === "Home" || e.key === "End") { e.preventDefault(); flyTo(e.key === "Home" ? 0 : END); }
    else if (d) { e.preventDefault(); hop(d); }
  };
  // anything that still scrolls the page natively (dragging the scrollbar) settles onto a stop
  const onScroll = () => {
    if (tween || performance.now() < ignoreScrollUntil || debugS != null) return;
    const y = scrollY; if (y !== lastY) { dirY = Math.sign(y - lastY); lastY = y; }
    clearTimeout(idle);
    idle = setTimeout(() => {
      const s = clamp(scrollY / unit, 0, TOTAL);
      if (!tween && !STOPS.some((_, k) => Math.abs(snapAt(k) - s) < .002)) { sCur = s; flyTo(stopFrom(s, dirY)); }
    }, 160);
  };
  addEventListener("wheel", onWheel, { passive: false }); addEventListener("scroll", onScroll, { passive: true });
  addEventListener("touchstart", onTouchStart, { passive: true }); addEventListener("touchmove", onTouchMove, { passive: false });
  addEventListener("touchend", onTouchEnd, { passive: true }); addEventListener("keydown", onKey);

  let sCur = debugS != null ? debugS : clamp(scrollY / unit, 0, TOTAL), last = performance.now(), raf = 0, reportedK = -1;
  const lp = new V3();
  const wireArc = t => { const i = clamp(t) * wire.div, a = Math.floor(i), b = Math.min(wire.div, a + 1); return (wire.lengths[a] + (wire.lengths[b] - wire.lengths[a]) * (i - a)) / wire.len; };

  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    const tw = tween;
    let e = 0;
    if (tw) {
      const p = clamp((now - tw.t0) / tw.dur); e = ease(p);
      sCur = tw.s0 + (tw.s1 - tw.s0) * e;
      ignoreScrollUntil = now + 150; scrollTo(0, sCur * unit);
      if (p >= 1) { tween = null; sCur = tw.s1; lastY = scrollY; const q = queued; queued = 0; if (q) hop(q); }
    } else {
      const sT = debugS != null ? debugS : clamp(scrollY / unit, 0, TOTAL);
      sCur = debugS != null ? sT : sCur + (sT - sCur) * Math.min(1, dt * 6);
    }

    // where on the timeline are we
    let k = END, mode = "hold", f = 1;
    for (let i = 0; i <= END; i++) {
      const s = STOPS[i];
      if (sCur <= s.b) { if (sCur >= s.a || i === 0) { k = i; mode = "hold"; f = clamp((sCur - s.a) / s.hold); } else { k = i - 1; mode = "travel"; f = clamp((sCur - STOPS[i - 1].b) / TRAVEL); } break; }
    }
    curK = mode === "travel" && f > .5 ? k + 1 : k;
    let u, litT, fov = FOV;
    if (mode === "hold") {
      u = rail.u[k];
      const m = wire.marks[k]; litT = k === 0 ? m.entry + (m.exit - m.entry) * smooth(clamp(f / .7)) : m.exit;
    } else {
      u = rail.u[k] + (rail.u[k + 1] - rail.u[k]) * smooth(f);
      litT = wire.marks[k].exit + (wire.marks[k + 1].exit - wire.marks[k].exit) * clamp(f * 1.12);
      if (!reduce) fov = FOV + 3 * Math.sin(f * Math.PI);
    }
    // in flight, the camera and signal follow the eased flight rather than the timeline segments
    if (tw) {
      u = tw.u0 + (tw.u1 - tw.u0) * e; litT = tw.l0 + (tw.l1 - tw.l0) * Math.min(1, e * 1.1);
      fov = reduce ? FOV : FOV + 3 * Math.sin(e * Math.PI);
    }
    lastU = u; lastLit = litT;
    drift += ((tween ? 0 : 1) - drift) * Math.min(1, dt * 2.5);
    const ct = rail.cam.getUtoTmapping(u);
    camera.position.copy(rail.cam.getPoint(ct)); lp.copy(rail.look.getPoint(ct));
    if (!reduce && curK > 0) { const yw = STOPS[curK].yaw, d = Math.sin(now / 2600) * .3 * drift; camera.position.x += Math.cos(yw) * d; camera.position.z -= Math.sin(yw) * d; }
    camera.lookAt(lp);
    if (Math.abs(camera.fov - fov) > .01) { camera.fov = fov; camera.updateProjectionMatrix(); }

    // the signal
    const segs = Math.round(wireArc(litT) * wire.segs), per = RADIAL * 6;
    wire.lit.geometry.setDrawRange(0, segs * per); wire.halo.geometry.setDrawRange(0, segs * per); wire.base.geometry.setDrawRange(segs * per, Infinity);
    const hp = wire.curve.getPoint(clamp(litT)); head.position.copy(hp); headCore.position.copy(hp); headLight.position.copy(hp).add(new V3(0, .4, 0));
    const live = litT > .0005 && litT < .9995; head.visible = headCore.visible = live; headLight.intensity = live ? 14 : 0;
    head.material.opacity = .75 + .25 * Math.sin(now / 110);

    // stops near the camera do work; far ones are hidden
    STOPS.forEach((s, i) => { s.g.visible = Math.abs(i - curK) <= 3; });
    nearProj = null;
    projStops.forEach(ps => {
      const S = STOPS[ps.k], on = litT >= wire.marks[ps.k].exit - 1e-5, near = Math.abs(ps.k - curK) <= 2;
      if (ticks[ps.k]) ticks[ps.k].classList.toggle("on", on);
      if (!S.g.visible) return;
      ps.pad.material.emissive.setHex(on ? 0x8a5a00 : 0x000000); ps.pool.material.opacity = on ? .3 : .08;
      ps.idle += dt; if (!drag && ps.idle > 2 && !reduce) ps.yaw += dt * .3;
      ps.spin.rotation.set(ps.model.tilt * .5 + ps.pitch, ps.yaw, 0);
      ps.model.tick(dt, (now / 9000 + ps.k * .37) % 1, reduce); // assembles and explodes on a slow loop while you look
      if (Math.abs(sCur - (S.a + S.b) / 2) < S.hold / 2 + .25) nearProj = ps;
      if (near) { ps.frames.forEach(fr => fr.load()); ps.loadCad(); }
      const play = sCur > S.a - 1.1 && sCur < S.b + .9;
      ps.frames.forEach(fr => { const v = fr.video; if (!v) return; if (play && v.paused) v.play().catch(() => {}); else if (!play && !v.paused) v.pause(); });
    });
    const endOn = litT >= wire.marks[END].entry - 1e-5, pulse = reduce ? 1 : .85 + .15 * Math.sin(now / 300);
    term.ledMat.emissiveIntensity = endOn ? 2.2 * pulse : .05; term.halo.material.opacity = endOn ? .9 * pulse : 0; term.light.intensity = endOn ? 10 : 0;
    if (ticks[0]) ticks[0].classList.toggle("on", litT > .0005);
    if (ticks[END]) ticks[END].classList.toggle("on", endOn);
    chip.rotation.y = reduce ? .2 : .2 + Math.sin(now / 3000) * .18;
    if (!reduce) debris.update(dt, camera.position.z);

    // text overlays fade with distance from their stop
    let best = 0, bestV = -1;
    for (let i = Math.max(0, curK - 2); i <= Math.min(END, curK + 2); i++) {
      const el = overlays[i]; if (!el) continue;
      const S = STOPS[i], d = sCur < S.a ? S.a - sCur : sCur > S.b ? sCur - S.b : 0, v = clamp(1 - d / .32);
      el.style.setProperty("--o", v.toFixed(3)); el.classList.toggle("live", v > .6); el.classList.toggle("gone", v <= 0);
      if (el.dataset.kind === "panel") el.classList.toggle("on", litT >= wire.marks[i].exit - 1e-5);
      if (v > bestV) { bestV = v; best = i; }
    }
    if (best !== reportedK) {
      overlays.forEach((el, i) => { if (el && Math.abs(i - best) > 2) { el.style.setProperty("--o", "0"); el.classList.remove("live"); el.classList.add("gone"); } });
      reportedK = best; onStop && onStop(best);
    }
    if (hint) hint.style.setProperty("--o", nearProj ? clamp(bestV).toFixed(3) : "0");

    renderer.render(scene, camera);
  }
  raf = requestAnimationFrame(frame);

  return {
    total: TOTAL,
    stops: STOPS.length,
    // scroll position (px) that frames stop k
    scrollFor: k => snapAt(k) * unit,
    // fly to stop k
    goTo(k) { flyTo(k); },
    // jump the camera to the current scroll position instead of flying there
    sync() { if (debugS == null) sCur = clamp(scrollY / unit, 0, TOTAL); },
    destroy() {
      clearTimeout(idle); removeEventListener("scroll", onScroll); removeEventListener("wheel", onWheel); removeEventListener("keydown", onKey);
      removeEventListener("touchstart", onTouchStart); removeEventListener("touchmove", onTouchMove); removeEventListener("touchend", onTouchEnd);
      cancelAnimationFrame(raf);
      removeEventListener("resize", onResize); pq.removeEventListener("change", build); removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointerdown", onDown); canvas.removeEventListener("pointermove", onMove); canvas.removeEventListener("pointerleave", onLeave);
      videos.forEach(f => { f.video.pause(); f.video.removeAttribute("src"); f.video.load(); });
      scene.traverse(o => { if (o.geometry) o.geometry.dispose(); });
      disposables.forEach(t => t.dispose()); floorTex.dispose();
      renderer.dispose();
    }
  };
}

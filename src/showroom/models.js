// Real CAD for the showroom: loadCad() turns a Fusion .glb export into a model the stop can spin,
// explode (each part slides out from the center) and name part by part on hover.
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const std = (color, roughness = .5, metalness = .2, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });
export const MAT = {
  carbon: std(0x232628, .42, .35),
  blue: std(0x2f6fd8, .72, 0),
  dark: std(0x2a2d2f, .5, .5),
  alu: std(0xb9bec2, .3, .85),
  steel: std(0x8d9398, .35, .8),
  pcb: std(0x1f7a4a, .6, 0),
  yellow: std(0xe8b400, .6, 0),
  orange: std(0xe0662a, .55, 0),
  white: std(0xe6e4dc, .5, 0),
  red: std(0xb3262a, .45, .1),
  wood: std(0xb98a55, .8, 0),
  ply: std(0xd2b07c, .75, 0),
  tpu: std(0x2b2b2e, .9, 0),
  prop: std(0xdfe4e7, .4, 0, { transparent: true, opacity: .88 }),
  shell: std(0x2b2e31, .38, .25),
  stepper: std(0xc9cdd0, .28, .9),
  glass: std(0x9fd8ff, .1, .1, { transparent: true, opacity: .35 }),
  glow: std(0x7fe8ff, .3, 0, { emissive: 0x2ab8ff, emissiveIntensity: 1.4 }),
  hot: std(0xffc65a, .4, 0, { emissive: 0x6a4500 })
};
const edgeMat = new THREE.LineBasicMaterial({ color: 0x050d0a, transparent: true, opacity: .45 });

function finish(root, size, opts = {}) {
  root.traverse(o => { if (o.isGroup && o.userData.dir) o.userData.base = o.position.clone(); });
  const parts = []; root.traverse(o => { if (o.isMesh && o.userData.part) parts.push(o); });
  const anim = opts.anim || (() => {});
  const amount = opts.explode ?? 1;
  let t = 0;
  return {
    root, size, parts, tilt: opts.tilt ?? .45,
    tick(dt, p, reduce) {
      t += dt; if (!reduce) anim(t, dt);
      const e = reduce ? .25 * amount : Math.max(0, Math.sin(p * Math.PI) - .25) * amount;
      root.traverse(o => { if (o.userData.base) o.position.copy(o.userData.base).addScaledVector(o.userData.dir, e); });
    }
  };
}

// what a stop holds before its CAD has loaded (or when the project has none)
export const emptyModel = () => finish(new THREE.Group(), 1);

// CAD names that say nothing about the part ("Body3", "Component1", "SOLID (2)")
const GENERIC_PART = /^(body|component|solid|compound|part)\s*\(?\d*\)?$/i;

// Load a CAD export (.glb/.gltf) as a model the stop can spin, explode and label.
// `title` labels parts whose CAD names are generic.
export function loadCad(url, title = "Part") {
  return new GLTFLoader().loadAsync(url).then(gltf => {
    const root = new THREE.Group(), scene = gltf.scene;
    const bb = new THREE.Box3().setFromObject(scene), c = bb.getCenter(new THREE.Vector3()), s = bb.getSize(new THREE.Vector3());
    scene.position.sub(c); root.add(scene);
    const parts = [];
    let tris = 0;
    scene.traverse(o => { if (o.isMesh) tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; });
    scene.traverse(o => {
      if (!o.isMesh) return;
      if (!o.geometry.attributes.normal) o.geometry.computeVertexNormals();
      o.material.side = THREE.DoubleSide;
      const name = (o.name || "").replace(/[_-]+/g, " ").trim();
      o.userData.part = !name || GENERIC_PART.test(name) ? `${title} · CAD part` : name;
      o.userData.mat = o.material; parts.push(o);
      // outline sharp edges like the CAD view, unless the model is too dense for it
      if (tris < 150000) o.add(new THREE.LineSegments(new THREE.EdgesGeometry(o.geometry, 30), edgeMat));
      const mc = new THREE.Box3().setFromObject(o).getCenter(new THREE.Vector3()).sub(c);
      o.userData.dir = mc.lengthSq() > 1e-6 ? mc.normalize().multiplyScalar(Math.max(s.x, s.y, s.z) * .12 / Math.max(1e-6, scene.scale.x)) : new THREE.Vector3();
      o.userData.base = o.position.clone();
    });
    // flat things (boards, plates) tip toward the camera so you see their face, not their edge
    const flat = s.y < .35 * Math.max(s.x, s.z);
    return finish(root, Math.max(s.x, s.y, s.z) / 2, { tilt: flat ? 1.9 : .3, explode: 1 });
  });
}

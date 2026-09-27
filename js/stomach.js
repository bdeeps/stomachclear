// StomachClear's 3D upper digestive tract: a stylised but anatomically placed mouth, pharynx,
// oesophagus, lower oesophageal sphincter, stomach (cardia, fundus, body, antrum, pylorus),
// the start of the duodenum, and the neighbours that frame it (diaphragm, liver, lower ribs,
// pancreas behind, heart above).
//
// Orientation: we face the patient (anterior view), as in an anatomy atlas, so the patient's
// RIGHT is on YOUR LEFT. Axes: +x = patient's left, +y = up (towards the head), +z = forwards
// (towards you). One model unit is 5 cm.
// Placement and sizes follow standard anatomy (Gray's Anatomy, 42nd ed.; NIDDK "Your Digestive
// System & How It Works"; Britannica "Human digestive system"):
//  - the oesophagus is about 25 cm long, runs down behind the windpipe and the heart, and goes
//    through the diaphragm (the oesophageal hiatus) a little left of the midline;
//  - the stomach is J-shaped and lies in the upper left of the abdomen, under the left dome of
//    the diaphragm and partly behind the lower left ribs; the fundus bulges up above the cardia;
//    the pylorus is just right of the midline (about the level of the first lumbar vertebra);
//  - the liver fills the upper right under the right (higher) dome of the diaphragm, and its
//    left lobe lies in front of part of the stomach; the pancreas lies behind the stomach;
//  - the stomach wall has a mucosa folded into rugae, a submucosa, three muscle layers (inner
//    oblique, middle circular, outer longitudinal) and an outer serosa.
import { THREE, M, tube, torus, clamp, lerp, smooth } from './kit.js';

export const CM = 0.2;                          // model units per centimetre
const v3 = (p) => (p.isVector3 ? p.clone() : new THREE.Vector3(...p));

// ---------------------------------------------------------------- colours
export const C = {
  serosa: 0xe2a497, mucosa: 0xc9464f, muscle: 0xb5504c, oes: 0xd98d86, duo: 0xe3b28f,
  liver: 0x7d2f25, gall: 0x5f8f3a, dia: 0xc0625a, bone: 0xefe6d6, pancreas: 0xe7c27b, heart: 0x93303a,
  acid: 0xff5a5a, food: 0xf2c46a, chyme: 0xe8d59a, mucus: 0xdff3ff, air: 0x8fd3ff,
};
export const tissue = (color, o = {}) => new THREE.MeshPhysicalMaterial({ color, roughness: 0.5, metalness: 0, clearcoat: 0.5, clearcoatRoughness: 0.4, side: THREE.DoubleSide, transparent: true, opacity: 1, ...o });

// ---------------------------------------------------------------- a tube whose radius can change
// A hollow organ as a tube along a smooth centre line. radius(u, θ) sets the wall radius at
// arc-length fraction u (0 → 1) and angle θ around the tube. It can be re-shaped every frame
// (peristalsis, stretching) without rebuilding the geometry.
export function organTube(points, { rings = 120, seg = 40, mat, radius } = {}) {
  const curve = new THREE.CatmullRomCurve3(points.map(v3), false, 'centripetal');
  const fr = curve.computeFrenetFrames(rings, false);
  const P = [], N = fr.normals, B = fr.binormals, T = fr.tangents;
  for (let i = 0; i <= rings; i++) P.push(curve.getPointAt(i / rings));
  const nv = (rings + 1) * (seg + 1), pos = new Float32Array(nv * 3), uv = new Float32Array(nv * 2), idx = [];
  for (let i = 0; i <= rings; i++) for (let j = 0; j <= seg; j++) { const k = i * (seg + 1) + j; uv[k * 2] = i / rings; uv[k * 2 + 1] = j / seg; }
  for (let i = 0; i < rings; i++) for (let j = 0; j < seg; j++) { const a = i * (seg + 1) + j, b = a + seg + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setIndex(idx);
  const mesh = new THREE.Mesh(g, mat); mesh.castShadow = true; mesh.receiveShadow = true;
  const length = curve.getLength();
  const cos = [], sin = [];
  for (let j = 0; j <= seg; j++) { const a = (j / seg) * Math.PI * 2; cos.push(Math.cos(a)); sin.push(Math.sin(a)); }
  mesh.shape = (fn) => {
    for (let i = 0; i <= rings; i++) {
      const u = i / rings, p = P[i], n = N[i], b = B[i];
      for (let j = 0; j <= seg; j++) {
        const r = Math.max(0.002, fn(u, (j / seg) * Math.PI * 2)), k = (i * (seg + 1) + j) * 3;
        pos[k] = p.x + (n.x * cos[j] + b.x * sin[j]) * r;
        pos[k + 1] = p.y + (n.y * cos[j] + b.y * sin[j]) * r;
        pos[k + 2] = p.z + (n.z * cos[j] + b.z * sin[j]) * r;
      }
    }
    g.attributes.position.needsUpdate = true;
    g.computeVertexNormals();
    g.computeBoundingSphere();
  };
  // A point inside the tube: u along it, rho (0 = centre, 1 = wall at radius r), theta around.
  mesh.at = (u, rho = 0, theta = 0, r = 0, out = new THREE.Vector3()) => {
    const f = clamp(u, 0, 1) * rings, i = Math.min(rings - 1, Math.floor(f)), k = f - i;
    const p = out.copy(P[i]).lerp(P[i + 1], k);
    const n = N[i].clone().lerp(N[i + 1], k), b = B[i].clone().lerp(B[i + 1], k);
    return p.addScaledVector(n, Math.cos(theta) * rho * r).addScaledVector(b, Math.sin(theta) * rho * r);
  };
  mesh.tangent = (u) => T[Math.round(clamp(u, 0, 1) * rings)].clone();
  mesh.curve = curve; mesh.length = length;
  mesh.shape(radius || (() => 0.2));
  return mesh;
}

// ---------------------------------------------------------------- the stomach's shape
// Centre line from the top of the fundus, down the body, round the bottom and up through the
// antrum to the pylorus (stomach space, units of 5 cm): about 25 cm along the middle and about
// 10 cm across when comfortably full.
export const STOMACH_PTS = [[1.3, 2.3, -0.35], [1.58, 1.72, -0.15], [1.68, 0.9, 0.05], [1.52, 0.02, 0.2], [1.05, -0.68, 0.32], [0.38, -0.93, 0.35], [-0.22, -0.74, 0.3], [-0.6, -0.4, 0.2]];
// Regions by fraction of that length (Gray's Anatomy): fundus above the cardia, body, antrum,
// pyloric canal and the pyloric sphincter at the very end.
export const REGION = { fundus: [0, 0.16], body: [0.16, 0.6], antrum: [0.6, 0.88], canal: [0.88, 0.97], pylorus: [0.97, 1] };
const RPROF = [[0, 0], [0.02, 0.55], [0.06, 0.8], [0.15, 0.95], [0.35, 1.0], [0.5, 0.93], [0.62, 0.8], [0.78, 0.58], [0.9, 0.36], [0.96, 0.26], [1, 0.22]];
export function stomachR(u) {
  if (u < 0.06) { const k = u / 0.06; return 0.8 * Math.sqrt(Math.max(0, 1 - (1 - k) * (1 - k))); }   // the dome of the fundus
  for (let i = 1; i < RPROF.length; i++) if (u <= RPROF[i][0]) { const [a, ra] = RPROF[i - 1], [b, rb] = RPROF[i]; return lerp(ra, rb, smooth((u - a) / (b - a))); }
  return 0.22;
}
// Rugae: folds of the lining that run mostly along the stomach, deepest in the body and along
// the greater curvature; they flatten out as the stomach stretches.
export const rugae = (u, th, amp) => amp * Math.pow(Math.max(0, Math.sin(9 * th + 2.2 * u)), 3) * (u < 0.9 ? 1 : 0.3) * clamp(u / 0.08, 0, 1);

// Path of the oesophagus (stomach space): from the bottom of the pharynx (level of the cricoid
// cartilage) down behind the windpipe and heart, through the diaphragm into the cardia.
export const OES_PTS = [[0, 6.85, -0.45], [0.02, 5.8, -0.7], [0.12, 4.4, -0.85], [0.3, 3.2, -0.72], [0.48, 2.55, -0.5], [0.66, 2.02, -0.3], [0.86, 1.62, -0.18]];
export const DUO_PTS = [[-0.6, -0.4, 0.2], [-0.95, -0.36, 0.02], [-1.3, -0.52, -0.22], [-1.45, -1.0, -0.32], [-1.45, -1.7, -0.3], [-1.25, -2.15, -0.2], [-0.85, -2.33, -0.15]];

// The diaphragm: two domes, the right one higher over the liver, with the central tendon under
// the heart (Gray's). Height at (x, z) in stomach space.
export const diaY = (x, z) => {
  const dome = (cx, peak, w) => peak * Math.exp(-((x - cx) ** 2) / (2 * w * w));
  return 1.1 + Math.max(dome(-1.45, 2.2, 1.05), dome(1.45, 1.85, 1.0), dome(0, 1.55, 1.6)) - 0.18 * z * z;
};

// ---------------------------------------------------------------- labels and layout helpers
const TINT = { acid: '#ff8a8a', food: '#ffd166', side: '#8ef0ff', gold: '#ffd166', muscle: '#ffb0a0', nerve: '#c9a7ff', good: '#6ee7a8', mucus: '#bfe8ff' };
export function tint(l, cls) { const c = TINT[cls]; if (c) { l.element.style.borderColor = c; l.element.style.color = c; } return l; }
export function sideLabels(stage, parent, y, x, z = 0.8) {
  return [tint(stage.label("← Patient's right", [-x, y, z], parent), 'side'), tint(stage.label("Patient's left →", [x, y, z], parent), 'side')];
}
// On a phone-width stage the readout covers the upper left: re-centre once, unless orbited.
export function fitNarrow(stage, view) {
  let done = false;
  return () => {
    const narrow = stage.host.clientWidth < 560;
    if (narrow && !done && !stage.moved && !document.body.classList.contains('gb-reel')) { stage.setView(view.pos, view.target, 0.01); done = true; }
    return narrow;
  };
}
// On phones keep only the readout's headline and two rows.
export function compactReadout(stage, api) {
  const full = api.readout;
  if (!full) return api;
  api.readout = (s) => {
    const html = full(s);
    if (stage.host.clientWidth >= 560 || !html) return html;
    let rows = 0;
    return html.replace(/<small>[\s\S]*?<\/small>/g, '').replace(/<div class="row">[\s\S]*?<\/div>/g, (m) => (++rows <= 2 ? m : ''));
  };
  return api;
}
// A flat board with a canvas chart on it.
export function board(canvasTex, w, h) {
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: canvasTex.tex, transparent: true, toneMapped: false, side: THREE.DoubleSide }));
}
export const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// Cut the front off a material (world plane z = zc): shows the wall in section.
export function cutPlane(zc) { return new THREE.Plane(new THREE.Vector3(0, 0, -1), zc); }

// ---------------------------------------------------------------- the stomach on its own
// Outer wall (serosa and muscle) and the folded lining (mucosa) as two dynamic tubes, the
// pyloric sphincter as a thick ring, and helpers to squeeze and stretch it.
export function makeStomach({ rings = 110, seg = 44 } = {}) {
  const g = new THREE.Group();
  const outerMat = tissue(C.serosa), innerMat = tissue(C.mucosa, { roughness: 0.6, clearcoat: 0.8 });
  const outer = organTube(STOMACH_PTS, { rings, seg, mat: outerMat });
  const inner = organTube(STOMACH_PTS, { rings, seg, mat: innerMat });
  g.add(outer, inner);
  const endP = outer.at(1), endT = outer.tangent(1);
  const pyl = torus(0.2, 0.085, tissue(C.muscle), 40);
  pyl.position.copy(endP); pyl.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), endT); g.add(pyl);
  const st = { scale: 1, squeeze: null, pyl: 0 };
  // squeeze(u) → 0..1 fraction the ring at u is pinched in by a peristaltic wave.
  const apply = () => {
    const k = st.scale, amp = 0.13 * clamp(1.5 - k, 0.15, 1.2);
    const R = (u) => {
      let r = stomachR(u) * (u > 0.9 ? lerp(1, k, 0.4) : k);
      if (u > 0.93) r *= lerp(0.35, 1.25, st.pyl);                 // the pyloric canal: shut or open
      if (st.squeeze) r *= 1 - st.squeeze(u);
      return r;
    };
    outer.shape((u) => R(u));
    inner.shape((u, th) => { const r = R(u); return r * 0.82 + rugae(u, th, amp * Math.min(1, r * 2.5)); });
    pyl.scale.setScalar(lerp(0.75, 1.15, st.pyl));
  };
  apply();
  return {
    group: g, outer, inner, pyl, outerMat, innerMat,
    set({ scale, squeeze, pylorus } = {}) { if (scale !== undefined) st.scale = scale; if (squeeze !== undefined) st.squeeze = squeeze; if (pylorus !== undefined) st.pyl = pylorus; apply(); },
    get scale() { return st.scale; },
    // Radius at u for the current shape (used to keep particles inside).
    radiusAt(u) { let r = stomachR(u) * st.scale * 0.8; if (u > 0.93) r *= lerp(0.35, 1.25, st.pyl); if (st.squeeze) r *= 1 - st.squeeze(u); return r; },
    at: (u, rho, th, r, out) => outer.at(u, rho, th, r, out),
    setCut(plane) { [outerMat, innerMat].forEach((m) => { m.clippingPlanes = plane ? [plane] : null; m.needsUpdate = true; }); },
  };
}

// Volume of the stomach shape at scale 1, integrated from the radius profile (units³ → mL).
export function stomachVolume1() {
  const cur = new THREE.CatmullRomCurve3(STOMACH_PTS.map(v3), false, 'centripetal'), L = cur.getLength();
  let v = 0; const n = 400;
  for (let i = 0; i < n; i++) { const r = stomachR((i + 0.5) / n) * 0.82; v += Math.PI * r * r * (L / n); }
  return v * 125;                                        // 1 unit³ = (5 cm)³ = 125 mL
}

// ---------------------------------------------------------------- the whole upper tract
export function makeUpperGI(stage, opts = {}) {
  const o = { labels: true, head: true, context: true, ...opts };
  const root = new THREE.Group();
  const G = {}; ['head', 'oes', 'stomach', 'duo', 'liver', 'dia', 'ribs', 'pancreas', 'heart'].forEach((k) => { G[k] = new THREE.Group(); root.add(G[k]); });
  const ghosts = [];

  // ---- stomach
  const stom = makeStomach();
  G.stomach.add(stom.group);

  // ---- oesophagus and its lower sphincter
  const oesMat = tissue(C.oes);
  const oes = organTube(OES_PTS, { rings: 90, seg: 20, mat: oesMat, radius: () => 0.15 });
  G.oes.add(oes);
  const les = torus(0.17, 0.065, tissue(C.muscle), 32);
  les.position.copy(oes.at(0.9)); les.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), oes.tangent(0.9)); G.oes.add(les);

  // ---- duodenum (the first part of the small intestine), faded where IntestineClear takes over
  const duoMat = tissue(C.duo);
  const duo = organTube(DUO_PTS, { rings: 70, seg: 20, mat: duoMat, radius: (u) => 0.26 * (u < 0.06 ? lerp(0.85, 1, u / 0.06) : 1) });
  G.duo.add(duo);
  const duoFade = organTube([[-0.85, -2.33, -0.15], [-0.2, -2.42, -0.15], [0.4, -2.3, -0.2]], { rings: 20, seg: 16, mat: M.ghost(C.duo, 0.18), radius: () => 0.26 });
  G.duo.add(duoFade);

  // ---- head and mouth, pharynx and windpipe (ghosted context)
  let tongue = null;
  if (o.head) {
    const head = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 28), M.ghost(0xe8c3a8, 0.07)); head.scale.set(0.95, 1.2, 1.05); head.position.set(0, 8.95, 0.15); G.head.add(head); ghosts.push(head);
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.62, 1.6, 28, 1, true), M.ghost(0xe8c3a8, 0.08)); neck.position.set(0, 7.2, -0.1); G.head.add(neck); ghosts.push(neck);
    const lips = torus(0.26, 0.07, tissue(0xc86a6a), 32); lips.scale.set(1, 0.45, 1); lips.position.set(0, 8.3, 1.12); G.head.add(lips);
    tongue = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 18), tissue(0xe07a86)); tongue.scale.set(0.34, 0.14, 0.62); tongue.position.set(0, 8.2, 0.55); G.head.add(tongue);
    const phar = tube([[0, 8.35, 0.9], [0, 8.4, 0.2], [0, 8.05, -0.3], [0, 7.4, -0.42], [0, 6.85, -0.45]], 0.17, tissue(C.oes, { opacity: 0.85 }), false, 60); G.head.add(phar);
    const trachea = tube([[0, 7.55, -0.1], [0, 6.6, -0.12], [0, 5.3, -0.22], [0, 4.7, -0.3]], 0.14, M.ghost(C.air, 0.28), false, 40); G.head.add(trachea);
    [[-1, 4.7, -0.3], [1, 4.7, -0.3]].forEach(([sx]) => { const b = tube([[0, 4.7, -0.3], [sx * 0.45, 4.35, -0.35], [sx * 0.9, 4.1, -0.4]], 0.1, M.ghost(C.air, 0.28), false, 20); G.head.add(b); });
  }

  // ---- context: diaphragm, liver, ribs, pancreas, heart
  if (o.context) {
    const dg = new THREE.PlaneGeometry(6.6, 3.6, 60, 30); dg.rotateX(-Math.PI / 2);
    const dp = dg.attributes.position;
    for (let i = 0; i < dp.count; i++) { const x = dp.getX(i), z = dp.getZ(i); dp.setY(i, diaY(x, z)); }
    dg.computeVertexNormals();
    const dia = new THREE.Mesh(dg, M.ghost(C.dia, 0.2)); dia.position.z = -0.3; G.dia.add(dia); ghosts.push(dia);
    // Liver: a wedge, thick on the right, thinning into the left lobe in front of the stomach.
    const lg = new THREE.SphereGeometry(1, 48, 32), lp = lg.attributes.position;
    for (let i = 0; i < lp.count; i++) {
      let x = lp.getX(i), y = lp.getY(i), z = lp.getZ(i);
      const X = -1.25 + x * 1.95, thin = lerp(1, 0.32, clamp((X + 0.9) / 2.6, 0, 1));
      let Y = 2.15 + y * 1.0 * thin; const Z = 0.25 + z * 1.35 * lerp(1, 0.7, clamp((X + 0.5) / 2, 0, 1));
      Y = Math.min(Y, diaY(X, Z - 0.3) - 0.08);
      lp.setXYZ(i, X, Y, Z);
    }
    lg.computeVertexNormals();
    const liver = new THREE.Mesh(lg, tissue(C.liver, { opacity: 0.55, depthWrite: false })); liver.renderOrder = 3; G.liver.add(liver);
    const gall = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), tissue(C.gall, { opacity: 0.7 })); gall.scale.set(0.16, 0.32, 0.16); gall.position.set(-1.05, 1.15, 0.9); gall.rotation.z = 0.4; G.liver.add(gall);
    // Lower ribs: arcs of an oval, sloping down from back to front, with the gap at the front
    // where the costal margin rises to the breastbone.
    const boneMat = M.ghost(C.bone, 0.28);
    for (let r = 0; r < 6; r++) {
      const yb = 5.9 - r * 0.72;
      for (const side of [-1, 1]) {
        const pts = [];
        for (let k = 0; k <= 24; k++) { const a = lerp(-0.1, 0.42 - r * 0.02, k / 24) * Math.PI; const x = side * 3.0 * Math.cos(a), z = 2.0 * Math.sin(a) - 0.2; pts.push([x, yb - 1.5 * Math.sin(a) - 0.2, z]); }
        const rib = tube(pts, 0.07, boneMat, false, 60); G.ribs.add(rib); ghosts.push(rib);
      }
    }
    const pan = tube([[-1.2, -1.05, -0.62], [-0.4, -0.72, -0.95], [0.5, -0.35, -1.1], [1.35, 0.1, -1.1], [2.0, 0.45, -1.0]], 0.22, tissue(C.pancreas, { opacity: 0.85 }), false, 60);
    G.pancreas.add(pan);
    const hg = new THREE.SphereGeometry(1, 32, 22); const heart = new THREE.Mesh(hg, M.ghost(C.heart, 0.22)); heart.scale.set(1.15, 1.0, 0.9); heart.rotation.z = 0.6; heart.position.set(0.35, 4.05, 0.25); G.heart.add(heart); ghosts.push(heart);
  }

  // ---- labels
  const labels = [], minor = [];
  const L = (html, pos, parent, cls = '', main = false) => { const l = tint(stage.label(html, pos, parent), cls); l.userData.stomach = parent === G.stomach; labels.push(l); if (!main) minor.push(l); return l; };
  if (o.labels) {
    const S = (u, dx, dy, dz = 0.6) => stom.at(u, 0, 0, 0).add(new THREE.Vector3(dx, dy, dz)).toArray();
    L('Fundus', S(0.03, 1.05, 0.2), G.stomach, 'muscle', true);
    L('Cardia', S(0.22, -1.2, -0.45), G.stomach, 'muscle');
    L('Body', S(0.4, 1.35, 0.25), G.stomach, 'muscle');
    L('Antrum', S(0.74, 0.1, -0.95), G.stomach, 'muscle');
    L('Pylorus and pyloric sphincter', S(1, -0.4, -0.8, 0.7), G.stomach, 'muscle', true);
    L('Oesophagus (about 25 cm)', oes.at(0.3).add(new THREE.Vector3(1.45, 0.2, 0.5)).toArray(), G.oes, '', true);
    L('Lower oesophageal sphincter', oes.at(0.88).add(new THREE.Vector3(-1.25, 0.95, 0.6)).toArray(), G.oes, '');
    L('Duodenum', [-2.2, -1.2, 0.2], G.duo, 'food', true);
    L('→ see IntestineClear', [0.4, -2.8, 0.3], G.duo, 'food');
    if (o.head) { L('Mouth', [1.0, 8.3, 1.1], G.head, '', true); L('Windpipe (in front)', [-1.3, 6.3, 0], G.head, ''); }
    if (o.context) {
      L('Diaphragm', [3.05, 3.3, 0.2], G.dia, '');
      L('Liver', [-2.9, 1.55, 0.8], G.liver, '', true);
      L('Gallbladder', [-1.7, 0.6, 0.9], G.liver, '');
      L('Pancreas (behind)', [2.75, -0.5, -0.9], G.pancreas, 'gold');
      L('Heart (above the diaphragm)', [-1.55, 4.55, 0.4], G.heart, '');
      L('Lower ribs', [3.3, 4.1, 0.6], G.ribs, '');
    }
  }
  const xr = { rugaeL: null };
  if (o.labels) xr.rugaeL = L('Rugae: folds of the lining', stom.at(0.45, 0, 0, 0).add(new THREE.Vector3(0.1, -0.35, 1.0)).toArray(), G.stomach, 'acid');

  const api = {
    root, G, stom, oes, les, duo, tongue, labels, minor,
    setXray(k, plane) {
      stom.outerMat.opacity = lerp(1, 0.28, k); stom.outerMat.depthWrite = k < 0.5;
      stom.setCut(k > 0.5 ? plane : null);
      oesMat.opacity = lerp(1, 0.45, k); duoMat.opacity = lerp(1, 0.5, k);
      if (xr.rugaeL) xr.rugaeL.userData.xr = k > 0.5;
    },
    setExplode(k) {
      const e = smooth(k);
      const off = { head: [0, 1.2, 0], oes: [-0.3, 0.6, 0.4], stomach: [1.0, -0.3, 0], duo: [-1.4, -1.1, 0.6], liver: [-1.9, 0.6, 0.4], dia: [0, 1.6, -0.3], ribs: [0, 0.9, -1.4], pancreas: [0.6, -1.3, -1.2], heart: [0.4, 2.0, 0] };
      for (const [n, v] of Object.entries(off)) G[n].position.set(...v).multiplyScalar(e);
    },
    showLabels(on, narrow = false) { labels.forEach((l) => { l.visible = on && (l.userData.xr === undefined || l.userData.xr); }); if (on && narrow) minor.forEach((l) => { l.visible = false; }); },
  };
  api.setExplode(0);
  return api;
}

// ---------------------------------------------------------------- the stomach wall, magnified
// A block of stomach wall with its layers (inside at the top): mucus gel, mucosa with gastric
// pits and a ruga, submucosa, the three muscle layers with their fibres drawn in their real
// directions (oblique, circular, longitudinal), and the serosa. Proportions are exaggerated so
// thin layers can be seen; the whole wall is only about 3 to 5 mm thick.
function stripes(angleDeg, color, bg) {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d'); g.fillStyle = bg; g.fillRect(0, 0, 256, 256);
  g.save(); g.translate(128, 128); g.rotate((angleDeg * Math.PI) / 180); g.strokeStyle = color; g.lineWidth = 7;
  for (let x = -400; x <= 400; x += 18) { g.beginPath(); g.moveTo(x, -400); g.lineTo(x, 400); g.stroke(); }
  g.restore();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 2);
  return t;
}
export const WALL = [
  { id: 'mucus', name: 'Mucus and bicarbonate gel', h: 0.07, color: C.mucus, cls: 'mucus' },
  { id: 'mucosa', name: 'Mucosa: lining with gastric pits', h: 0.42, color: C.mucosa, cls: 'acid' },
  { id: 'sub', name: 'Submucosa: blood vessels, nerves', h: 0.24, color: 0xe9b7a6, cls: '' },
  { id: 'obl', name: 'Oblique muscle (inner)', h: 0.14, color: C.muscle, fibre: 45, cls: 'muscle' },
  { id: 'circ', name: 'Circular muscle (middle)', h: 0.18, color: C.muscle, fibre: 90, cls: 'muscle' },
  { id: 'long', name: 'Longitudinal muscle (outer)', h: 0.14, color: C.muscle, fibre: 0, cls: 'muscle' },
  { id: 'ser', name: 'Serosa (outer skin)', h: 0.05, color: C.serosa, cls: '' },
];
export function makeWallBlock(stage, { w = 2.6, d = 1.5, labels = true } = {}) {
  const g = new THREE.Group(), layers = [], labs = [];
  const fold = (x) => 0.16 * Math.exp(-((x + 0.2) ** 2) / 0.12);     // one ruga across the block
  // A slab between y = lo(x) and y = hi(x), extruded front to back.
  const slab = (lo, hi, mat) => {
    const sh = new THREE.Shape(), n = 40;
    sh.moveTo(-w / 2, lo(-w / 2));
    for (let k = 0; k <= n; k++) { const x = -w / 2 + (w * k) / n; sh.lineTo(x, hi(x)); }
    for (let k = n; k >= 0; k--) { const x = -w / 2 + (w * k) / n; sh.lineTo(x, lo(x)); }
    const eg = new THREE.ExtrudeGeometry(sh, { depth: d, bevelEnabled: false, steps: 1, curveSegments: 4 }); eg.translate(0, 0, -d / 2);
    return new THREE.Mesh(eg, mat);
  };
  let y = 0;
  [...WALL].reverse().forEach((L) => {
    let mesh;
    if (L.id === 'mucosa') {
      mesh = slab(() => 0, (x) => L.h + fold(x), tissue(L.color, { side: THREE.FrontSide }));
      const pitM = M.matte(0x4a1016);
      for (let k = 0; k < 26; k++) {
        const x = -w / 2 + 0.12 + rnd(k) * (w - 0.24), z = -d / 2 + 0.12 + rnd(k + 50) * (d - 0.24);
        const pit = new THREE.Mesh(new THREE.CircleGeometry(0.035, 10), pitM); pit.rotation.x = -Math.PI / 2; pit.position.set(x, L.h + fold(x) + 0.004, z); mesh.add(pit);
      }
      for (let k = 0; k < 9; k++) {                        // pits and their glands, seen in the cut front face
        const x = -w / 2 + 0.18 + k * ((w - 0.36) / 8), top = L.h + fold(x);
        const slot = new THREE.Mesh(new THREE.PlaneGeometry(0.035, top * 0.8), M.matte(0x5a1820)); slot.position.set(x, top * 0.6, d / 2 + 0.003); mesh.add(slot);
      }
    } else if (L.id === 'mucus') {
      mesh = slab((x) => fold(x), (x) => fold(x) + L.h, tissue(L.color, { side: THREE.FrontSide, opacity: 0.55, depthWrite: false }));
    } else {
      const mat = L.fibre !== undefined ? new THREE.MeshStandardMaterial({ color: 0xffffff, map: stripes(L.fibre, '#8e2f2f', '#c65a55'), roughness: 0.6 }) : tissue(L.color, { side: THREE.FrontSide });
      mesh = new THREE.Mesh(new THREE.BoxGeometry(w, L.h, d), mat);
      mesh.geometry.translate(0, L.h / 2, 0);
    }
    mesh.castShadow = true;
    mesh.position.y = y; mesh.userData.home = y;
    y += L.h;
    g.add(mesh); layers.push({ ...L, mesh });
    if (labels) { const l = tint(stage.label(L.name, [w / 2 + 0.2, L.h / 2, d / 2], mesh), L.cls); l.center.set(0, 0.5); labs.push(l); }
  });
  const inside = labels ? tint(stage.label('Inside: food and acid', [0.9, y + 0.5, 0], g), 'food') : null;
  const outside = labels ? tint(stage.label('Outside of the stomach', [0, -0.3, 0], g), '') : null;
  return {
    group: g, layers, labs, inside, outside, height: y,
    explode(k) { const e = smooth(k); layers.forEach((L, i) => { L.mesh.position.y = L.mesh.userData.home + e * i * 0.22; }); if (inside) inside.position.y = y + 0.5 + e * 1.4; },
  };
}

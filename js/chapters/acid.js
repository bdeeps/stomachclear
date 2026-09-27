// Chapter 3: acid and enzymes. A cut through the stomach lining: gastric pits leading down into
// glands lined with mucous cells, parietal cells (acid) and chief cells (pepsinogen), under a
// protective mucus and bicarbonate gel; a close-up of the proton pump; and a pH board.
// Facts:
//  - Parietal cells make hydrochloric acid with the H⁺/K⁺-ATPase ("proton pump"), which swaps
//    H⁺ out for K⁺ in, powered by ATP; the juice they make is about 150–160 mmol/L HCl, pH about
//    0.8 (Guyton & Hall, 14th ed., ch. 65). They also make intrinsic factor for vitamin B12.
//  - Chief cells make pepsinogen, turned into pepsin by acid; pepsin works best at pH about 1.8
//    to 3.5 and stops working above about pH 5 (Guyton & Hall, ch. 65). Gastric lipase digests a
//    small share of fat.
//  - The stomach makes about 1.5 L of gastric juice a day (Guyton & Hall, table 65-1). Basal acid
//    output is a few mmol an hour; after a meal it rises several-fold, peaking within about an
//    hour (Feldman, Sleisenger & Fordtran's Gastrointestinal and Liver Disease, ch. 51).
//  - The contents are usually about pH 1.5 to 3.5 (StatPearls, "Physiology, Gastric"); a meal
//    buffers them up to about pH 5 for a while, then acid brings them back below 2 within a
//    couple of hours (Malagelada et al., Gastroenterology 70:203, 1976; Dressman et al., Pharm
//    Res 7:756, 1990).
//  - The lining protects itself with a layer of mucus gel into which surface cells secrete
//    bicarbonate, keeping the cell surface near neutral while the lumen is at pH 1–2 (Allen &
//    Flemström, Am J Physiol Cell Physiol 288:C1, 2005). Surface cells are replaced every few days.
//  - Ulcers: most are caused by H. pylori infection or NSAID painkillers (NIDDK, "Peptic Ulcers").
// Everyday pH values: lemon juice about 2.0–2.6 and vinegar about 2.4–3.4 (US FDA, "Approximate
// pH of foods"); black coffee about 5; pure water 7; blood 7.35–7.45 (StatPearls, "Physiology,
// Acid Base Balance"); baking soda in water about 8.3.
//
// The live pH is a small mixing model, not a measurement: a basal secretion of 2 mmol/h rising
// to about 18 mmol/h an hour after a meal, secreted at 160 mmol/L, diluted by about 60 mL/h of
// swallowed saliva and other fluid, emptied at 60% of the contents an hour; the meal (500 mL)
// brings 30 mmol of buffer. With the pumps blocked (a proton pump inhibitor) secretion drops
// by about 90%.
import { THREE, M, canvasTexture, swarm, clamp, lerp } from '../kit.js';
import { tissue, C, tint, board, fitNarrow, compactReadout, rnd } from '../stomach.js';

// ---------------------------------------------------------------- the pH model
export const secretion = (m, ppi) => (2 + 16 * (m / 45) * Math.exp(1 - m / 45)) * (ppi ? 0.1 : 1);   // mmol/h, m = minutes since the meal
export function newGut() { return { V: 0.1, A: 2.6, B: 0, Bm: 1, m: 1e6, hist: [] }; }
export function stepGut(g, hours, ppi) {
  const n = Math.max(1, Math.ceil(hours / (1 / 120))), dt = hours / n;
  for (let i = 0; i < n; i++) {
    const S = secretion(g.m, ppi);
    g.V += (0.06 + S / 160 - 0.6 * g.V) * dt;
    g.A += (S - 0.6 * g.A) * dt;
    g.B += -0.6 * g.B * dt;
    const k = Math.min(g.A, g.B); g.A -= k; g.B -= k;
    g.m += dt * 60;
  }
}
export const eat = (g) => { g.V += 0.5; g.B += 30; g.Bm = g.B; g.m = 0; };
export function pHof(g) { return g.B > 0.5 ? 3.5 + 2 * (g.B / g.Bm) : clamp(3 - Math.log10(Math.max(g.A / g.V, 0.3)), 0.8, 6); }

const SCALE = [
  { v: 2.3, name: 'Lemon juice', up: true }, { v: 2.9, name: 'Vinegar', up: false }, { v: 5.0, name: 'Black coffee', up: true },
  { v: 7.0, name: 'Water', up: false }, { v: 7.4, name: 'Blood', up: true }, { v: 8.3, name: 'Baking soda', up: false },
];
const phColour = (p) => `hsl(${clamp(p / 14, 0, 1) * 260},80%,55%)`;
function drawBoard(g, w, h, st) {
  g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(10,12,18,.92)'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#e8ecf4'; g.font = '600 30px sans-serif'; g.fillText('How acidic? The pH scale', 20, 40);
  const L = 30, R = w - 30, y0 = 118, X = (p) => L + (p / 14) * (R - L);
  for (let i = 0; i < R - L; i++) { g.fillStyle = phColour((i / (R - L)) * 14); g.fillRect(L + i, y0, 1.5, 34); }
  g.fillStyle = 'rgba(255,255,255,.75)'; g.font = '20px sans-serif';
  for (let p = 0; p <= 14; p += 2) g.fillText(p, X(p) - 6, y0 + 58);
  g.font = '19px sans-serif';
  SCALE.forEach((s) => { const x = X(s.v); g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, s.up ? y0 - 4 : y0 + 38); g.lineTo(x, s.up ? y0 - 18 : y0 + 66); g.stroke(); g.fillStyle = '#d7dce6'; g.fillText(s.name, x - g.measureText(s.name).width / 2, s.up ? y0 - 24 : y0 + 86); });
  // Stomach range.
  g.fillStyle = 'rgba(255,90,90,.35)'; g.fillRect(X(1.5), y0 - 2, X(3.5) - X(1.5), 38);
  g.fillStyle = '#ff8a8a'; g.font = '600 19px sans-serif'; g.fillText('Stomach 1.5–3.5', X(0.2), y0 + 110);
  // Live marker.
  const px = X(st.pH); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(px, y0 + 36); g.lineTo(px - 11, y0 + 56); g.lineTo(px + 11, y0 + 56); g.fill();
  // History of pH over the last 6 hours.
  const top = y0 + 140, bot = h - 40, TL = 70, TR = w - 20, span = 6;
  const Y = (p) => top + (p / 7) * (bot - top);
  g.strokeStyle = 'rgba(255,255,255,.1)'; g.lineWidth = 1; g.fillStyle = 'rgba(255,255,255,.6)'; g.font = '18px sans-serif';
  for (let p = 1; p <= 7; p += 2) { g.beginPath(); g.moveTo(TL, Y(p)); g.lineTo(TR, Y(p)); g.stroke(); g.fillText('pH ' + p, 6, Y(p) + 6); }
  g.fillText('last 6 hours →', TR - 130, bot + 28);
  g.fillStyle = 'rgba(255,209,102,.25)'; g.fillRect(TL, Y(3.5), TR - TL, Y(5) - Y(3.5)); g.fillStyle = 'rgba(255,209,102,.8)'; g.font = '16px sans-serif'; g.fillText('above ~5: pepsin stops working', TL + 8, Y(5) + 18);
  const H = st.hist; if (H.length > 1) {
    const now = H[H.length - 1][0];
    g.strokeStyle = '#ff6b9a'; g.lineWidth = 4; g.beginPath();
    H.forEach(([t, p], i) => { const x = TR - ((now - t) / span) * (TR - TL); if (x < TL) return; const y = Y(clamp(p, 0.5, 7)); if (i === 0 || x <= TL + 1) g.moveTo(x, y); else g.lineTo(x, y); });
    g.stroke();
  }
}

export default {
  id: 'acid',
  short: 'Acid and enzymes',
  title: 'A bath of acid that doesn’t digest itself',
  subtitle: 'Parietal cells pump acid, chief cells make pepsin, and mucus keeps the lining safe.',
  view: { pos: [2.2, 4.3, 13.8], target: [2.0, 3.9, 0] },
  learn: `<p>The stomach lining is covered in millions of tiny <b>gastric pits</b>. Each leads down into a gland lined with different workers. <b>Parietal cells</b> make <b>hydrochloric acid</b>. Each has millions of <b>proton pumps</b> (the H⁺/K⁺-ATPase), tiny machines that use energy from <b>ATP</b> to push hydrogen ions out in exchange for potassium. The juice they make is about <b>pH 0.8</b>, and the stomach’s contents are usually about <b>pH 1.5 to 3.5</b>, as sour as lemon juice or stronger.</p>
    <p><b>Chief cells</b> make <b>pepsinogen</b>. Acid snips it into <b>pepsin</b>, an enzyme that cuts proteins into shorter pieces. Pepsin works best at about pH 2 and stops above about pH 5. A little <b>gastric lipase</b> starts on fats. Altogether the stomach makes about <b>1.5 litres</b> of gastric juice a day. The acid also kills many germs swallowed with food.</p>
    <p>So why doesn’t the stomach digest itself? Its surface cells coat it in a thick <b>mucus</b> gel and pump <b>bicarbonate</b>, an antacid, into it, so the cells sit in almost neutral conditions while acid swirls just above. The surface cells are also replaced every few days. If that shield is weakened, most often by the germ <b>H. pylori</b> or by some painkillers, acid and pepsin can eat a sore into the lining: an <b>ulcer</b>. That needs a doctor.</p>
    <p class="tip"><b>Try it:</b> eat a meal and watch food push the pH up, then acid bring it back down. Thin the mucus to see how an ulcer starts. Then see what blocking the pumps does (this is how some acid medicines work: only a doctor can say who needs them).</p>`,
  terms: [
    { t: 'Parietal cell', d: 'A cell in the stomach glands that makes hydrochloric acid, and intrinsic factor for vitamin B12.' },
    { t: 'Proton pump', d: 'The H⁺/K⁺-ATPase: a protein that uses ATP to push hydrogen ions out of the cell in exchange for potassium ions.' },
    { t: 'Chief cell', d: 'A cell deep in the stomach glands that makes pepsinogen.' },
    { t: 'Pepsin', d: 'An enzyme, made active by acid, that breaks proteins into smaller pieces.' },
    { t: 'pH', d: 'A scale of how acidic something is. 7 is neutral; each step down is ten times more acidic.' },
    { t: 'Mucus barrier', d: 'The slimy gel, laced with bicarbonate, that protects the stomach lining from its own acid.' },
    { t: 'Ulcer', d: 'A sore where the lining has been eaten away. Most are caused by H. pylori or some painkillers.' },
  ],
  defaults: { thin: false, ppi: false, pump: true, labels: true, speed: 2 },
  controls: [
    { key: 'meal', type: 'buttons', label: 'Food', items: [{ label: 'Eat a meal', act: (s, inst) => inst.eat?.() }] },
    { key: 'speed', type: 'seg', label: 'Clock', options: [{ v: 0.5, label: '30 s/min' }, { v: 2, label: '1 s = 2 min' }, { v: 6, label: '1 s = 6 min' }] },
    { key: 'thin', type: 'toggle', label: 'Weak mucus layer (how an ulcer starts)' },
    { key: 'ppi', type: 'toggle', label: 'Block the proton pumps (acid medicine)' },
    { key: 'pump', type: 'toggle', label: 'Proton pump close-up' },
    { key: 'labels', type: 'toggle', label: 'Labels' },
  ],
  quiz: [
    { q: 'What do parietal cells make?', options: ['Pepsinogen', 'Hydrochloric acid', 'Mucus only', 'Bile'], answer: 1, why: 'Their proton pumps push hydrogen ions out, and with chloride that makes hydrochloric acid. (They also make intrinsic factor for vitamin B12.)' },
    { q: 'Why doesn’t the stomach digest itself?', options: ['Acid can’t touch living cells', 'A mucus gel full of bicarbonate keeps the cell surface nearly neutral', 'The stomach has no protein', 'Pepsin only works outside the body'], answer: 1, why: 'Mucus and bicarbonate form a shield, and the surface cells are replaced every few days.' },
    { q: 'Pepsin is made active by…', options: ['Saliva', 'Acid', 'Bile', 'Chewing'], answer: 1, why: 'Chief cells release inactive pepsinogen; acid in the stomach turns it into pepsin, which works best near pH 2.' },
  ],
  reel: [
    { ms: 5600, caption: 'Parietal cells pump out hydrochloric acid, about as sour as lemon juice or stronger.', set: { thin: false, ppi: false, pump: true, labels: false, speed: 2 }, view: { pos: [1.6, 4.2, 12.8], target: [1.6, 3.7, 0] }, spin: 0.15 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const SURF = 4.0, BASE = 0.8, W = 7.2, GL = [-2.3, 0, 2.3];
    // ---- the lining: tissue between the glands, cut open at the front (z = 0)
    const tis = new THREE.Mesh(new THREE.BoxGeometry(W, SURF - BASE, 1.4), tissue(0xd9828a, { side: THREE.FrontSide, opacity: 0.9 }));
    tis.position.set(0, (SURF + BASE) / 2, -0.75); root.add(tis);
    const sub = new THREE.Mesh(new THREE.BoxGeometry(W, 0.5, 1.6), tissue(0xe9b7a6)); sub.position.set(0, BASE - 0.25, -0.65); root.add(sub);
    // Glands: open channels cut in half.
    GL.forEach((x) => {
      const ch = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.16, SURF - BASE - 0.2, 20, 1, true, Math.PI / 2, Math.PI), tissue(0x6e1e2a, { side: THREE.DoubleSide }));
      ch.position.set(x, (SURF + BASE + 0.2) / 2, -0.05); root.add(ch);
      const pit = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.2, 0.5, 24, 1, true, Math.PI / 2, Math.PI), tissue(0x6e1e2a, { side: THREE.DoubleSide }));
      pit.position.set(x, SURF - 0.25, -0.05); root.add(pit);
    });
    // Cells: by depth, surface mucous cells, neck cells, parietal cells, chief cells.
    const TYPES = { surface: { c: 0xf4d6dc, r: [0.14, 0.2, 0.14] }, neck: { c: 0xc9b3d6, r: [0.13, 0.15, 0.13] }, parietal: { c: 0xff7d8f, r: [0.21, 0.19, 0.19] }, chief: { c: 0x7f86e0, r: [0.16, 0.15, 0.15] } };
    const typeAt = (y) => (y > 3.45 ? 'surface' : y > 3.0 ? 'neck' : y > 1.8 ? 'parietal' : 'chief');
    const cells = [], cellMat = {};
    Object.entries(TYPES).forEach(([k, v]) => { cellMat[k] = tissue(v.c, { roughness: 0.55 }); });
    const sph = new THREE.SphereGeometry(1, 18, 12);
    const addCell = (x, y, z, type) => { const t = TYPES[type]; const m = new THREE.Mesh(sph, cellMat[type]); m.scale.set(...t.r); m.position.set(x, y, z); m.castShadow = true; root.add(m); cells.push(m); m.userData.type = type; return m; };
    GL.forEach((gx) => {
      for (let y = BASE + 0.25; y < SURF - 0.05; y += 0.33) { const type = typeAt(y); const r = type === 'parietal' ? 0.4 : 0.34; addCell(gx - r, y, -0.02, type); addCell(gx + r, y, -0.02, type); addCell(gx, y, -0.36, type); }
    });
    // Surface mucous cells along the top between the pits.
    for (let x = -W / 2 + 0.2; x < W / 2; x += 0.3) { if (GL.some((g) => Math.abs(g - x) < 0.45)) continue; addCell(x, SURF - 0.12, -0.12, 'surface'); }
    const nuc = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), M.matte(0x3a2a5a));
    cells.filter((c) => c.userData.type === 'parietal').forEach((c) => { const n = nuc.clone(); n.position.copy(c.position).add(new THREE.Vector3(0, 0, 0.17)); root.add(n); });
    // Mucus gel on top.
    const mucus = new THREE.Mesh(new THREE.BoxGeometry(W, 1, 1.5), tissue(C.mucus, { opacity: 0.35, depthWrite: false, side: THREE.FrontSide })); mucus.renderOrder = 3; root.add(mucus);
    // An ulcer crater (grows while the mucus is weak and the contents are acidic).
    const crater = new THREE.Mesh(new THREE.CircleGeometry(1, 32, Math.PI, Math.PI), tissue(0x5a0d18, { side: THREE.DoubleSide })); crater.position.set(-1.15, SURF + 0.005, -0.03); root.add(crater);
    const rim = new THREE.Mesh(new THREE.CircleGeometry(1, 30), tissue(0x7a1622, { side: THREE.DoubleSide })); rim.rotation.x = -Math.PI / 2; rim.position.set(-1.15, SURF + 0.012, -0.6); root.add(rim);

    // ---- particles
    const NH = 170, NB = 36, NP = 30, NS = 60, NF = 26;
    const hMesh = swarm(NH, new THREE.SphereGeometry(0.045, 8, 6), M.glow(0xff5a5a)); root.add(hMesh);
    const bMesh = swarm(NB, new THREE.SphereGeometry(0.04, 8, 6), M.glow(0x6fb6ff)); root.add(bMesh);
    const pMesh = swarm(NP, new THREE.CapsuleGeometry(0.035, 0.12, 4, 8), M.glow(0xffffff)); root.add(pMesh);
    const sMesh = swarm(NS, new THREE.SphereGeometry(0.04, 8, 6), M.glow(0xff5a5a)); root.add(sMesh);
    const fMesh = swarm(NF, new THREE.DodecahedronGeometry(0.13, 0), M.plastic(C.food, { roughness: 0.8 })); root.add(fMesh);
    [hMesh, bMesh, pMesh, sMesh, fMesh].forEach((m) => { m.frustumCulled = false; });
    const PEPSINOGEN = new THREE.Color(0xb68cff), PEPSIN = new THREE.Color(0xffa24a);
    for (let i = 0; i < NP; i++) pMesh.setColorAt(i, PEPSINOGEN);

    // ---- proton pump close-up
    const pumpG = new THREE.Group(); pumpG.position.set(6.6, 1.5, 0); root.add(pumpG);
    const mem = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.36, 1.2), tissue(0xf1d7a0, { opacity: 0.85 })); pumpG.add(mem);
    const pumps = [-1.0, 0, 1.0].map((x) => { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.7, 20), tissue(0x6fd3b0)); p.position.set(x, 0, 0.1); pumpG.add(p); return p; });
    const atp = pumps.map((p) => { const a = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 8), M.glow(0xffe066, { transparent: true, opacity: 0 })); a.position.copy(p.position).add(new THREE.Vector3(0.28, -0.42, 0.2)); pumpG.add(a); return a; });
    const NI = 24, ionH = swarm(NI, new THREE.SphereGeometry(0.07, 10, 8), M.glow(0xff5a5a)), ionK = swarm(NI, new THREE.SphereGeometry(0.08, 10, 8), M.glow(0xc38bff));
    ionH.frustumCulled = ionK.frustumCulled = false; pumpG.add(ionH, ionK);
    const frame = new THREE.Mesh(new THREE.PlaneGeometry(3.9, 2.9), M.ghost(0x8ef0ff, 0.05)); frame.position.z = -0.7; pumpG.add(frame);
    const pumpLabs = [
      tint(stage.label('Proton pump close-up', [0, 1.65, 0], pumpG), 'side'),
      tint(stage.label('Gland side: H⁺ out', [-0.9, 1.05, 0.3], pumpG), 'acid'),
      tint(stage.label('Inside the parietal cell: K⁺ in', [0.3, -1.2, 0.3], pumpG), 'nerve'),
      tint(stage.label('ATP powers each swap', [1.45, -0.62, 0.4], pumpG), 'gold'),
    ];
    const blocked = tint(stage.label('<b>Pumps blocked</b>', [0, 0.7, 0.6], pumpG), 'gold');

    // ---- labels
    const labs = [
      tint(stage.label('Parietal cells: acid', [3.4, 2.4, 0.2], root), 'acid'),
      tint(stage.label('Chief cells: pepsinogen', [3.5, 1.2, 0.2], root), 'nerve'),
      tint(stage.label('Mucous neck cells', [3.2, 3.25, 0.2], root), ''),
      tint(stage.label('Gastric pit', [1.15, 4.35, 0.5], root), ''),
      tint(stage.label('Mucus and bicarbonate gel', [-2.4, 4.55, 0.6], root), 'mucus'),
      tint(stage.label('Stomach contents', [2.9, 5.3, 0.4], root), 'food'),
    ];
    const ulcerL = tint(stage.label('Ulcer: acid and pepsin eat into the lining', [-1.2, 3.2, 0.7], root), 'acid');

    // ---- board
    const gut = newGut(); let clock = 0;
    const st = { pH: pHof(gut), hist: [] };
    // Start with a meal eaten three hours ago, so the board already has a story on it.
    for (let k = 0; k < 110; k++) { if (k === 20) eat(gut); stepGut(gut, 1 / 30, false); clock += 1 / 30; st.hist.push([clock, pHof(gut)]); }
    const chart = canvasTexture(760, 560, (g, w, h) => drawBoard(g, w, h, st));
    const brd = board(chart, 4.9, 3.6); brd.position.set(6.6, 5.3, 0); root.add(brd);

    const o = new THREE.Object3D();
    let t = 0, redraw = 0, ulcer = 0, histT = 0;
    const fit = fitNarrow(stage, { pos: [2.2, 4.6, 19], target: [2.2, 4.0, 0] });
    const inst = {
      eat() { eat(gut); },
      update(dt, s) {
        dt = Math.max(0, dt); t += dt;
        const hours = (dt * s.speed) / 60;
        stepGut(gut, hours, s.ppi); clock += hours;
        const pH = pHof(gut); st.pH = pH;
        histT += hours; if (histT > 1 / 30 || !st.hist.length) { histT = 0; st.hist.push([clock, pH]); if (st.hist.length > 400) st.hist.shift(); }
        const S = secretion(gut.m, s.ppi);
        // Mucus thickness and ulcer.
        const mh = s.thin ? 0.08 : 0.42;
        mucus.scale.y = lerp(mucus.scale.y || 1, mh, Math.min(1, dt * 3)); mucus.position.set(0, SURF + mucus.scale.y / 2, -0.6);
        const top = SURF + mucus.scale.y;
        ulcer = clamp(ulcer + (s.thin && pH < 3 ? 0.05 : -0.08) * dt * s.speed, 0, 1);
        crater.visible = rim.visible = ulcer > 0.02;
        crater.scale.set(0.2 + 0.55 * ulcer, 0.12 + 0.75 * ulcer, 1); rim.scale.set(crater.scale.x, 0.55, 1);
        cells.forEach((c) => { if (c.userData.type === 'surface' && Math.abs(c.position.x - crater.position.x) < crater.scale.x && crater.visible) c.visible = false; else c.visible = true; });
        // Acid in the lumen: more dots the lower the pH.
        const nH = Math.round(NH * clamp((4.6 - pH) / 3.6, 0, 1));
        for (let i = 0; i < NH; i++) {
          if (i >= nH) { hMesh.place(i, [0, -50, 0]); continue; }
          const deep = s.thin && i % 5 === 0;                      // with thin mucus some reach the cells
          const x = -W / 2 + 0.1 + rnd(i) * (W - 0.2) + 0.25 * Math.sin(t * 0.9 + i);
          const ylo = deep ? SURF - 0.25 : top + 0.05, y = ylo + ((rnd(i + 9) + 0.12 * Math.sin(t * 1.3 + i * 2)) % 1 + 1) % 1 * (6.6 - ylo);
          hMesh.place(i, [x, deep ? lerp(ylo, top + 0.3, (Math.sin(t * 2 + i) + 1) / 2) : y, -0.8 + rnd(i + 3) * 1.0]);
        }
        hMesh.done();
        // Bicarbonate in the gel.
        for (let i = 0; i < NB; i++) { const x = -W / 2 + 0.15 + rnd(i + 70) * (W - 0.3), y = SURF + 0.03 + ((rnd(i + 90) + t * 0.05) % 1) * Math.max(0.04, mucus.scale.y - 0.06); bMesh.place(i, [x + 0.05 * Math.sin(t + i), y, -0.9 + rnd(i + 5) * 1.1]); }
        bMesh.done();
        // Acid streaming up the glands from the parietal cells (rate ∝ secretion).
        const flow = clamp(S / 18, 0, 1);
        for (let i = 0; i < NS; i++) {
          const gx = GL[i % 3], ph = (rnd(i + 200) + t * (0.15 + 0.35 * flow)) % 1, y = lerp(1.9 + rnd(i) * 1.0, SURF + 0.3, ph);
          const show = i < NS * flow;
          sMesh.place(i, show ? [gx + 0.08 * Math.sin(i + t * 3), y, -0.1] : [0, -50, 0]);
        }
        sMesh.done();
        // Pepsinogen from the chief cells, turned into pepsin once it meets acid.
        const active = pH < 5;
        for (let i = 0; i < NP; i++) {
          const gx = GL[i % 3], ph = (rnd(i + 400) + t * 0.12) % 1;
          let p;
          if (ph < 0.5) p = [gx + 0.06 * Math.sin(t * 2 + i), lerp(1.0 + rnd(i) * 0.7, SURF + 0.2, ph / 0.5), -0.1];
          else p = [gx + (rnd(i + 3) - 0.5) * 2.6 * (ph - 0.5) * 2, lerp(SURF + 0.3, 6.3, (ph - 0.5) * 2), -0.3 - rnd(i + 8) * 0.5];
          pMesh.place(i, p, [0, 0, t * 0.7 + i], 1);
          pMesh.setColorAt(i, ph > 0.5 && active ? PEPSIN : PEPSINOGEN);
        }
        pMesh.instanceColor.needsUpdate = true; pMesh.done();
        // Food in the stomach contents (fewer as it empties and is broken down).
        const nF = Math.round(NF * clamp((gut.V - 0.1) / 0.5, 0, 1));
        for (let i = 0; i < NF; i++) fMesh.place(i, i < nF ? [-W / 2 + 0.3 + rnd(i + 600) * (W - 0.6), top + 0.35 + rnd(i + 650) * 1.9 + 0.1 * Math.sin(t + i), -0.6 + rnd(i + 3) * 0.6] : [0, -50, 0], [t * 0.2 + i, i, 0]);
        fMesh.done();
        // Proton pumps: each cycle swaps one H⁺ out (up) for one K⁺ in (down), using one ATP.
        pumpG.visible = s.pump;
        const rate = s.ppi ? 0 : 0.35 + 0.9 * flow;
        pumps.forEach((p, k) => { p.material.color.set(s.ppi ? 0x6b7280 : 0x6fd3b0); p.rotation.y += dt * rate * 4; const ph = (t * rate + k / 3) % 1; atp[k].material.opacity = rate > 0 ? Math.max(0, 1 - Math.abs(ph - 0.5) * 6) : 0; });
        for (let i = 0; i < NI; i++) {
          const k = i % 3, ph = (t * rate * 0.5 + i / NI) % 1, px = pumps[k].position.x;
          ionH.place(i, [px + (rnd(i) - 0.5) * 0.5 * (1 - Math.abs(ph - 0.5) * 2 < 0.4 ? 1 : 0.2), lerp(-1.2, 1.3, ph), 0.2 + (rnd(i + 1) - 0.5) * 0.4]);
          ionK.place(i, [px + 0.12 + (rnd(i + 7) - 0.5) * 0.4, lerp(1.2, -1.25, (ph + 0.5) % 1), 0.3 + (rnd(i + 2) - 0.5) * 0.3]);
        }
        ionH.done(); ionK.done();
        redraw += dt; if (redraw > 0.15) { redraw = 0; chart.redraw(); }
        const narrow = fit();
        labs.forEach((l) => { l.visible = s.labels && !narrow; });
        pumpLabs.forEach((l) => { l.visible = s.labels && s.pump && !narrow; });
        blocked.visible = s.pump && s.ppi;
        ulcerL.visible = s.labels && ulcer > 0.3;
      },
      readout: (s) => {
        const pH = pHof(gut), S = secretion(gut.m, s.ppi), m = Math.round(gut.m);
        const when = m > 600 ? 'long after a meal' : m < 60 ? `${m} min after a meal` : `${Math.floor(m / 60)} h ${m % 60} min after a meal`;
        return `<div class="big">Stomach contents: pH ${pH.toFixed(1)}</div>
          <div class="row"><span>Time</span><b>${when}</b></div>
          <div class="row"><span>Acid being made</span><b>${S.toFixed(1)} mmol an hour</b></div>
          <div class="row"><span>Pepsin</span><b class="${pH < 5 ? 'ok' : 'no'}">${pH < 3.5 ? 'fully active' : pH < 5 ? 'working slowly' : 'switched off (not acidic enough)'}</b></div>
          <div class="row"><span>Lining</span><b class="${s.thin ? 'no' : 'ok'}">${s.thin ? (ulcer > 0.3 ? 'damaged: an ulcer' : 'exposed to acid') : 'protected by mucus'}</b></div>
          <small>${s.ppi ? 'Pumps blocked: much less acid, so the pH stays higher. Medicines like this are prescribed by doctors.' : gut.B > 0.5 ? 'Food soaks up acid for a while, so the pH rises after eating.' : 'Red dots: hydrogen ions (acid). Blue: bicarbonate in the mucus. Purple turns orange: pepsinogen becomes pepsin.'} A simple model.</small>`;
      },
    };
    return compactReadout(stage, inst);
  },
};

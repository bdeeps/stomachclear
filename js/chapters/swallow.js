// Chapter 2: from the mouth down. A side view, cut down the middle, of chewing and swallowing:
// the tongue pushes the bolus back, the soft palate seals the nose, the larynx rises and the
// epiglottis tips over the airway, then a peristaltic wave carries the bolus down the oesophagus
// and the lower oesophageal sphincter (LES) relaxes to let it into the stomach.
// Timings (Guyton & Hall, Textbook of Medical Physiology, 14th ed., ch. 64 "Swallowing"):
//  - the voluntary (oral) stage takes about a second; the pharyngeal stage takes less than
//    6 seconds and interrupts breathing for only part of a breathing cycle, usually 1–2 s;
//  - the primary peristaltic wave travels from the pharynx to the stomach in about 8 to 10 s;
//    food swallowed upright gets there faster, in about 5 to 8 s, helped by gravity;
//  - the LES relaxes ahead of the wave ("receptive relaxation") and closes after the bolus passes.
// Oesophagus about 25 cm long (Britannica). Saliva: about 1 to 1.5 L a day, with salivary
// amylase that starts breaking starch down (Guyton & Hall, table 65-1; NIDDK).
// The board is a simplified high-resolution manometry plot (time across, depth down, squeeze
// pressure as colour), the test doctors use to study swallowing (Chicago Classification v4.0,
// Yadlapati et al., Neurogastroenterol Motil 2021).
import { THREE, M, tube, canvasTexture, clamp, lerp, smooth } from '../kit.js';
import { organTube, tissue, C, tint, board, fitNarrow, compactReadout } from '../stomach.js';

const OES = [[0.5, 6.95, 0], [0.53, 5.6, 0], [0.5, 4.1, 0], [0.42, 3.0, 0], [0.3, 2.4, 0], [0.18, 1.98, 0]];
const MOUTH_PATH = [[-0.6, 8.36, 0.02], [-0.15, 8.4, 0.02], [0.33, 8.28, 0.02], [0.47, 7.8, 0.02], [0.5, 7.25, 0.02], [0.5, 6.95, 0.02]];
const LEN_CM = 25;

// The swallow timeline in seconds after the start. wave = seconds for the oesophageal wave.
export function timeline(upright) {
  const wave = upright ? 6.5 : 8.5;             // with gravity helping vs the wave alone
  const o0 = 1.7;                               // bolus enters the oesophagus
  return { oral: [0, 1.0], phar: [1.0, o0], wave, o0, o1: o0 + wave, lesOpen: [1.6, o0 + wave + 0.8], airway: [0.95, 1.95], palate: [0.7, 1.9], end: o0 + wave + 1.6 };
}
const within = (t, [a, b], ramp = 0.18) => clamp(Math.min((t - a) / ramp, (b - t) / ramp), 0, 1);
// Where the bolus is: 0..1 along the mouth path, then 0..1 down the oesophagus.
function bolusAt(t, T) {
  if (t < T.oral[1]) return { part: 'mouth', k: smooth(t / T.oral[1]) * 0.45 };
  if (t < T.o0) return { part: 'mouth', k: 0.45 + 0.55 * ((t - T.oral[1]) / (T.o0 - T.oral[1])) };
  if (t < T.o1) { const k = (t - T.o0) / T.wave; return { part: 'oes', k: k * (0.85 + 0.15 * k) }; }
  return { part: 'stomach', k: clamp((t - T.o1) / 1.2, 0, 1) };
}
export function phaseOf(t, T) {
  if (t < T.oral[1]) return 'Oral stage: the tongue pushes the food back (you choose to do this)';
  if (t < T.o0) return 'Pharyngeal stage: automatic from here. Airway sealed';
  if (t < T.o1) return 'Oesophageal stage: a squeeze wave carries it down';
  if (t < T.end) return 'In the stomach: the sphincter closes again';
  return 'Waiting for the next swallow';
}

// ---------------------------------------------------------------- manometry board
function drawHRM(g, w, h, st) {
  g.clearRect(0, 0, w, h);
  g.fillStyle = 'rgba(10,12,18,.92)'; g.fillRect(0, 0, w, h);
  const T = st.T, L = 118, R = w - 16, top = 70, bot = h - 58, tMax = 12;
  const X = (t) => L + (t / tMax) * (R - L), Y = (d) => top + (d / 30) * (bot - top);
  g.fillStyle = '#e8ecf4'; g.font = '600 30px sans-serif'; g.fillText('Squeeze along the food pipe', 16, 42);
  const col = (p) => { const k = clamp(p, 0, 1); const stops = [[20, 40, 120], [40, 150, 220], [70, 210, 120], [250, 220, 70], [240, 70, 60]]; const f = k * 4, i = Math.min(3, Math.floor(f)), a = stops[i], b = stops[i + 1], m = f - i; return `rgb(${a.map((v, j) => Math.round(v + (b[j] - v) * m)).join(',')})`; };
  const dx = 4, dy = 4;
  for (let px = L; px < R; px += dx) {
    const t = ((px - L) / (R - L)) * tMax;
    for (let py = top; py < bot; py += dy) {
      const d = ((py - top) / (bot - top)) * 30;          // cm below the top of the pharynx
      let p = 0.08;
      if (d < 3) p = 0.55 * (1 - within(t, [1.1, 1.8], 0.12)) + 0.9 * Math.exp(-(((t - 1.25 - d * 0.1) / 0.25) ** 2));   // upper sphincter band, throat squeeze
      else if (d > 26.5 && d < 29.5) p = 0.45 * (1 - within(t, T.lesOpen, 0.4)) + 0.7 * Math.exp(-(((t - T.o1 - 0.4) / 0.6) ** 2));   // LES, then its after-squeeze
      else if (d >= 3 && d <= 26.5) { const tw = T.o0 + ((d - 3) / 23.5) * T.wave; p = 0.08 + 0.8 * Math.exp(-(((t - tw - 0.35) / 0.55) ** 2)); }
      g.fillStyle = col(p); g.fillRect(px, py, dx, dy);
    }
  }
  g.fillStyle = 'rgba(255,255,255,.8)'; g.font = '24px sans-serif';
  for (let t = 0; t <= tMax; t += 4) g.fillText(t + ' s', Math.min(R - 40, X(t) - 12), bot + 30);
  [['Throat', 1.5], ['Oeso-', 12], ['phagus', 16], ['LES', 28.5]].forEach(([s, d]) => g.fillText(s, 12, Y(d) + 8));
  if (st.t <= tMax) { g.strokeStyle = '#fff'; g.lineWidth = 4; g.beginPath(); g.moveTo(X(st.t), top - 6); g.lineTo(X(st.t), bot + 4); g.stroke(); }
  const lx = w - 200; for (let i = 0; i < 100; i++) { g.fillStyle = col(i / 100); g.fillRect(lx + i * 1.2, 24, 1.4, 16); }
  g.fillStyle = 'rgba(255,255,255,.7)'; g.font = '20px sans-serif'; g.fillText('low', lx - 42, 40); g.fillText('high', lx + 126, 40);
}

export default {
  id: 'swallow',
  short: 'Chew and swallow',
  title: 'From the mouth down',
  subtitle: 'Chewing, a sealed airway and a squeeze that works upside down.',
  view: { pos: [-1.9, 6.3, 13.2], target: [-2.0, 5.7, 0] },
  learn: `<p>Digestion starts before you swallow. Teeth grind the food and the tongue mixes it with <b>saliva</b>, about 1 to 1.5 litres a day. Saliva makes food slippery and carries an enzyme, <b>salivary amylase</b>, that starts breaking <b>starch</b> into sugar. Chew a piece of plain rice or roti for a minute and it starts to taste sweet. The tongue then rolls the food into a soft ball, a <b>bolus</b>. (How the tongue tastes is in <a href="/tongueclear/">TongueClear</a>.)</p>
    <p>This is a <b>side view</b>, cut down the middle: the face is on the left. Pushing the bolus to the back of the mouth is the only part you choose. After that a reflex takes over. The <b>soft palate</b> lifts to close off the nose, the voice box rises and a flap, the <b>epiglottis</b>, tips over the <b>windpipe</b>. For about a second you cannot breathe, so food goes down the right pipe.</p>
    <p>In the <b>oesophagus</b>, rings of muscle squeeze one after another just behind the bolus: a <b>peristaltic wave</b>. It takes about <b>8 to 10 seconds</b> to cross the 25 cm, or about <b>5 to 8</b> when you are sitting up and gravity helps. Because it is a squeeze, not a slide, it works <b>upside down</b> too, which is how astronauts eat. At the bottom, the <b>lower oesophageal sphincter</b> relaxes just in time, lets the bolus into the stomach and shuts again.</p>
    <p class="tip"><b>Try it:</b> press Swallow and watch the epiglottis and the wave. Then turn the person upside down: the food still reaches the stomach. The board shows the squeeze as doctors measure it.</p>`,
  terms: [
    { t: 'Bolus', d: 'A soft, rounded lump of chewed food mixed with saliva, ready to swallow.' },
    { t: 'Salivary amylase', d: 'An enzyme in saliva that starts breaking starch into sugars.' },
    { t: 'Epiglottis', d: 'A leaf-shaped flap that tips over the entrance to the windpipe when you swallow.' },
    { t: 'Peristalsis', d: 'A wave of muscle squeezing along a tube that pushes its contents forward, like squeezing toothpaste.' },
    { t: 'Lower oesophageal sphincter (LES)', d: 'The ring of muscle at the bottom of the oesophagus that opens for food and keeps stomach acid out.' },
    { t: 'Manometry', d: 'A test that measures squeeze pressure along the oesophagus with a thin tube.' },
  ],
  defaults: { t: 0, upside: false, slow: 1, auto: true, labels: true },
  controls: [
    { key: 'go', type: 'buttons', label: 'Swallow', items: [{ label: 'Swallow now', act: (s) => { s.t = 0; } }] },
    { key: 'upside', type: 'toggle', label: 'Upside down (like doing a handstand)' },
    { key: 'slow', type: 'seg', label: 'Speed', options: [{ v: 1, label: 'Real time' }, { v: 0.5, label: '½' }, { v: 0.25, label: '¼' }] },
    { key: 'auto', type: 'toggle', label: 'Swallow again every 14 s' },
    { key: 'labels', type: 'toggle', label: 'Labels' },
  ],
  quiz: [
    { q: 'What stops food going into your windpipe?', options: ['You breathe out hard', 'The epiglottis tips over the airway and the voice box rises', 'The tongue blocks it', 'Nothing: food and air share the same pipe'], answer: 1, why: 'During the automatic stage of the swallow the epiglottis covers the airway and breathing stops for about a second.' },
    { q: 'Can you swallow while upside down?', options: ['No, food needs gravity', 'Yes, peristalsis squeezes it along', 'Only liquids', 'Only in space'], answer: 1, why: 'Rings of muscle squeeze behind the bolus and push it, so it works in any position. Gravity only speeds it up when you sit up.' },
    { q: 'Which food starts being digested in your mouth?', options: ['Starch, by amylase in saliva', 'Protein, by pepsin', 'Fat, by bile', 'None: the mouth only chews'], answer: 0, why: 'Salivary amylase starts breaking starch into sugars, which is why plain rice or bread tastes sweeter the longer you chew.' },
  ],
  reel: [
    { ms: 5200, caption: 'When you swallow, a flap called the epiglottis seals your windpipe for about a second.', set: { t: 0.35, upside: false, slow: 0.25, auto: false, labels: false }, view: { pos: [0.1, 7.7, 5.2], target: [0.1, 7.8, 0] }, spin: 0 },
    { ms: 5600, caption: 'Then a squeeze wave carries food down the oesophagus. It even works upside down.', set: { t: 2.2, upside: true, slow: 1, auto: false, labels: false }, view: { pos: [0.5, 5.4, 9.0], target: [0.3, 5.6, 0] }, spin: 0 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const pivot = new THREE.Group(); pivot.position.set(0, 6.0, 0); root.add(pivot);
    const body = new THREE.Group(); body.position.set(0, -6.0, 0); pivot.add(body);
    const flat = (pts, color, depth = 0.3, o = {}) => {
      const sh = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
      const gg = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: false, curveSegments: 12 }); gg.translate(0, 0, -depth / 2);
      const m = new THREE.Mesh(gg, o.ghost ? M.ghost(color, o.ghost) : tissue(color, o)); m.castShadow = !o.ghost; return m;
    };
    const smoothShape = (pts, n = 80) => new THREE.CatmullRomCurve3(pts.map(([x, y]) => new THREE.Vector3(x, y, 0)), true, 'centripetal').getPoints(n).map((p) => [p.x, p.y]);
    // Head and neck outline (face to the left, −x).
    const HEAD = smoothShape([[0.9, 6.2], [0.85, 7.3], [1.25, 8.4], [1.2, 9.6], [0.3, 10.3], [-0.8, 10.0], [-1.05, 9.4], [-1.05, 9.05], [-1.4, 8.75], [-1.1, 8.6], [-1.16, 8.45], [-1.06, 8.33], [-1.16, 8.2], [-1.05, 7.85], [-0.6, 7.6], [-0.35, 7.2], [-0.42, 6.2]], 120);
    const head = flat(HEAD, 0xe8c3a8, 0.02, { ghost: 0.12 }); head.position.z = -0.25; body.add(head);
    const outline = tube(HEAD.map(([x, y]) => [x, y, -0.2]), 0.02, M.ghost(0xe8c3a8, 0.5), true, 200); body.add(outline);
    // Spine behind the throat.
    for (let i = 0; i < 7; i++) { const v = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.26, 0.4), M.ghost(C.bone, 0.35)); v.position.set(0.98, 6.5 + i * 0.33, 0); body.add(v); }
    // Palate: hard palate (bone) and the soft palate that lifts.
    const hard = flat([[-0.95, 8.6], [-0.05, 8.63], [-0.05, 8.71], [-0.95, 8.69]], C.bone); body.add(hard);
    const softP = new THREE.Group(); softP.position.set(-0.05, 8.67, 0); body.add(softP);
    softP.add(flat([[0, 0.04], [0.3, -0.12], [0.36, -0.24], [0.3, -0.26], [0.22, -0.14], [0, -0.04]], 0xd77a80));
    // Tongue.
    const tongueG = new THREE.Group(); body.add(tongueG);
    tongueG.add(flat(smoothShape([[-0.98, 8.33], [-0.55, 8.52], [0.0, 8.5], [0.28, 8.2], [0.27, 7.78], [0.0, 7.72], [-0.5, 7.95], [-0.9, 8.17]], 60), 0xe07a86, 0.5));
    // Pharynx back wall, larynx and windpipe (ghost air), oesophagus behind it.
    const pharWall = tube([[0.72, 9.0, 0], [0.7, 8.2, 0], [0.68, 7.4, 0], [0.64, 6.9, 0]], 0.06, tissue(C.muscle), false, 30); body.add(pharWall);
    const larynx = new THREE.Group(); body.add(larynx);
    const trachea = flat([[0.02, 7.5], [0.34, 7.5], [0.34, 4.6], [0.02, 4.6]], C.air, 0.3, { ghost: 0.22 }); larynx.add(trachea);
    const rings = []; for (let i = 0; i < 9; i++) { const r = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.05, 0.34), M.ghost(0xcfe8ff, 0.35)); r.position.set(0.18, 7.0 - i * 0.28, 0); larynx.add(r); rings.push(r); }
    const epi = new THREE.Group(); epi.position.set(0.2, 7.55, 0.02); larynx.add(epi);
    epi.add(flat([[0, 0], [0.06, 0.22], [0.12, 0.45], [0.06, 0.48], [-0.02, 0.24]], 0xf1d9a8, 0.28));
    // Oesophagus with a dynamic squeeze.
    const oesMat = tissue(C.oes, { opacity: 0.55, depthWrite: false });
    const oes = organTube(OES, { rings: 110, seg: 18, mat: oesMat, radius: () => 0.1 }); oes.renderOrder = 2; body.add(oes);
    const lesRing = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.05, 10, 24), tissue(C.muscle)); lesRing.position.copy(oes.at(0.95)); lesRing.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), oes.tangent(0.95)); body.add(lesRing);
    // Diaphragm, heart and stomach (context).
    const dia = tube([[-1.6, 2.2, 0], [-0.6, 2.6, 0], [0.3, 2.5, 0], [1.1, 2.1, 0]], 0.06, M.ghost(C.dia, 0.6), false, 30); body.add(dia);
    const heart = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 20), M.ghost(C.heart, 0.18)); heart.scale.set(0.9, 0.75, 0.5); heart.position.set(-0.55, 3.55, -0.3); body.add(heart);
    const stom = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 24), tissue(C.serosa, { opacity: 0.35, depthWrite: false })); stom.scale.set(0.95, 0.8, 0.6); stom.position.set(-0.25, 1.35, -0.1); body.add(stom);
    // The bolus.
    const bolus = new THREE.Mesh(new THREE.SphereGeometry(0.16, 24, 16), M.plastic(C.food, { roughness: 0.7 })); body.add(bolus);
    const mouthCurve = new THREE.CatmullRomCurve3(MOUTH_PATH.map((p) => new THREE.Vector3(...p)));
    // Labels.
    const labs = [
      tint(stage.label('Tongue', [-0.55, 7.55, 0.3], body), ''),
      tint(stage.label('Soft palate', [-0.35, 9.05, 0.3], body), ''),
      tint(stage.label('Epiglottis', [-0.75, 7.25, 0.3], body), 'gold'),
      tint(stage.label('Windpipe (air)', [-0.75, 5.6, 0.3], body), 'side'),
      tint(stage.label('Oesophagus (food)', [1.75, 5.2, 0.3], body), 'food'),
      tint(stage.label('Spine', [1.6, 7.5, 0.3], body), ''),
      tint(stage.label('Throat (pharynx)', [1.75, 8.6, 0.3], body), 'muscle'),
      tint(stage.label('Diaphragm', [-1.85, 2.55, 0.3], body), ''),
      tint(stage.label('Lower oesophageal sphincter', [1.95, 2.1, 0.3], body), 'muscle'),
      tint(stage.label('Stomach', [-1.25, 0.8, 0.3], body), 'muscle'),
      tint(stage.label('Heart', [-1.25, 3.95, 0.3], body), ''),
    ];
    const view = tint(stage.label('Side view, cut down the middle: the face is on the left', [0, 0.2, 0.4], root), 'side');
    const status = tint(stage.label('', [-1.9, 6.75, 0.3], body), 'gold');
    // Board.
    const st = { T: timeline(true), t: 0 };
    const chart = canvasTexture(720, 440, (g, w, h) => drawHRM(g, w, h, st));
    const brd = board(chart, 4.9, 3.0); brd.position.set(-4.7, 2.7, 0); root.add(brd);

    let lastUp = null, rot = 0, redrawT = 0;
    const fit = fitNarrow(stage, { pos: [-0.8, 5.8, 19], target: [-1.2, 5.3, 0] });
    return compactReadout(stage, {
      update(dt, s) {
        dt = Math.max(0, dt);
        s.t += dt * s.slow;
        const T = timeline(!s.upside);
        if (s.upside !== lastUp) { lastUp = s.upside; st.T = T; chart.redraw(); }
        if (s.auto && s.t > 14) s.t = 0;
        rot += ((s.upside ? Math.PI : 0) - rot) * Math.min(1, dt * 3);
        pivot.rotation.z = rot;
        const t = s.t;
        // Mouth and throat movements.
        tongueG.position.set(0.05 * within(t, [0.1, 1.2], 0.3), 0.06 * within(t, [0.1, 1.2], 0.3), 0);
        softP.rotation.z = 0.75 * within(t, T.palate, 0.25);
        const air = within(t, T.airway, 0.2);
        larynx.position.y = 0.16 * within(t, [0.8, 2.0], 0.25);
        epi.rotation.z = -2.1 * air;
        // Bolus and oesophagus.
        const b = bolusAt(t, T);
        let ub = -1;
        if (t > T.end) bolus.visible = false; else bolus.visible = true;
        if (b.part === 'mouth') bolus.position.copy(mouthCurve.getPointAt(clamp(b.k, 0, 1)));
        else if (b.part === 'oes') { ub = b.k; oes.at(ub, 0, 0, 0, bolus.position); bolus.position.z = 0.02; }
        else { bolus.position.copy(oes.at(1)).lerp(stom.position.clone().add(new THREE.Vector3(0.1, 0.05, 0)), b.k); bolus.scale.setScalar(1 - 0.6 * b.k); }
        if (b.part !== 'stomach') bolus.scale.setScalar(1);
        const les = within(t, T.lesOpen, 0.4);
        oes.shape((u) => {
          let r = 0.09;
          if (ub >= 0) { const d = u - ub; r += 0.1 * Math.exp(-((d / 0.035) ** 2)); if (d < -0.02 && d > -0.14) r *= 0.4; }
          if (u < 0.04) r = lerp(0.05, 0.16, within(t, [1.2, 1.85], 0.12));      // upper sphincter
          if (u > 0.9) r = Math.min(r, lerp(0.03, 0.17, les));
          return r;
        });
        lesRing.scale.setScalar(lerp(0.85, 1.25, les));
        redrawT += dt; if (redrawT > 0.1) { redrawT = 0; st.t = t; chart.redraw(); }
        const narrow = fit();
        labs.forEach((l) => { l.visible = s.labels && !narrow; }); view.visible = s.labels;
        view.element.textContent = s.upside ? 'Side view, upside down: the face is now on the right' : 'Side view, cut down the middle: the face is on the left';
        status.visible = s.labels && air > 0.5; status.element.innerHTML = '<b>Airway closed: no breathing</b>';
      },
      readout: (s) => {
        const T = timeline(!s.upside), t = s.t, b = bolusAt(t, T);
        const depth = b.part === 'oes' ? Math.round(b.k * LEN_CM) + ' cm down' : b.part === 'mouth' ? (t < T.oral[1] ? 'in the mouth' : 'in the throat') : 'in the stomach';
        const les = within(t, T.lesOpen, 0.4) > 0.5, air = within(t, T.airway, 0.2) > 0.5;
        return `<div class="big">${t.toFixed(1)} s after the swallow</div>
          <div class="row"><span>Stage</span><b>${phaseOf(t, T).split(':')[0]}</b></div>
          <div class="row"><span>Food</span><b>${depth}</b></div>
          <div class="row"><span>Airway</span><b class="${air ? 'no' : 'ok'}">${air ? 'sealed by the epiglottis' : 'open'}</b></div>
          <div class="row"><span>Lower sphincter</span><b>${les ? 'relaxed, open' : 'shut'}</b></div>
          <small>${phaseOf(t, T)}. The trip down takes about ${T.wave} s ${s.upside ? 'upside down, pushed by the squeeze alone' : 'sitting up, with gravity helping'}.</small>`;
      },
    });
  },
};

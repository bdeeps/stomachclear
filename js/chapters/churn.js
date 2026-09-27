// Chapter 4: the mixing mill. Peristaltic waves start in the middle of the body of the stomach
// about three times a minute and sweep towards the pylorus, getting stronger in the antrum. Just
// before a wave arrives the pylorus opens a little and lets a squirt of chyme through; then it
// shuts and the wave jets the rest back into the stomach (retropulsion), grinding lumps smaller.
// Only particles smaller than about 1–2 mm get through (Guyton & Hall, 14th ed., ch. 64;
// Camilleri, "Physiology of the stomach and gastric emptying", in Sleisenger & Fordtran).
// Gastric emptying: liquids leave fast and roughly exponentially; solids wait (a lag phase)
// while they are ground up, then leave steadily; fat and fibre slow emptying. A standard low-fat
// test meal normally has 60% or less left at 2 h and 10% or less at 4 h (Abell et al., Am J
// Gastroenterol 103:753, 2008, the ANMS/SNM consensus). Half-emptying times for water are
// about 10–20 min (Hunt & Stubbs, J Physiol 245:209, 1975, and later scintigraphy studies).
// The curves here use the power-exponential model f(t) = 2^−(t/t½)^β (Elashoff et al.,
// Gastroenterology 83:1306, 1982) with illustrative half-times: water 12 min, plain rice 70 min,
// dal 95 min, fried food 125 min. Real times vary a lot from person to person and meal to meal.
import { THREE, M, canvasTexture, swarm, clamp, lerp, smooth } from '../kit.js';
import { makeStomach, organTube, tissue, C, tint, board, fitNarrow, compactReadout, cutPlane, rnd, DUO_PTS } from '../stomach.js';

export const FOODS = {
  water: { name: 'Water', half: 12, beta: 1.0, size: 0, color: 0x8fd3ff },
  rice: { name: 'Plain rice', half: 70, beta: 1.4, size: 5, color: 0xf6f0dc },
  dal: { name: 'Dal', half: 95, beta: 1.4, size: 5, color: 0xf2c46a },
  fried: { name: 'Fried food', half: 125, beta: 1.3, size: 8, color: 0xc98a3c },
};
export const left = (f, t) => Math.pow(2, -Math.pow(Math.max(0, t) / f.half, f.beta));      // fraction still in the stomach
export const grind = (f, t) => (f.size ? 1 + (f.size - 1) * Math.exp(-t / 35) : 0);        // typical particle size, mm
const PERIOD = 20, TRAVEL = 18;                    // a new wave every 20 s (3 a minute), each takes ~18 s

function drawChart(g, w, h, st) {
  g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(10,12,18,.92)'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#e8ecf4'; g.font = '600 30px sans-serif'; g.fillText('How much is still in the stomach', 20, 42);
  const L = 80, R = w - 24, top = 74, bot = h - 60, X = (t) => L + (t / 240) * (R - L), Y = (f) => bot - f * (bot - top);
  g.strokeStyle = 'rgba(255,255,255,.1)'; g.lineWidth = 1; g.fillStyle = 'rgba(255,255,255,.65)'; g.font = '20px sans-serif';
  for (let p = 0; p <= 100; p += 25) { g.beginPath(); g.moveTo(L, Y(p / 100)); g.lineTo(R, Y(p / 100)); g.stroke(); g.fillText(p + '%', 12, Y(p / 100) + 7); }
  for (let t = 0; t <= 240; t += 60) g.fillText(t / 60 + ' h', X(t) - 14, bot + 30);
  // Test-meal limits (Abell 2008).
  g.fillStyle = 'rgba(255,209,102,.9)'; [[120, 0.6], [240, 0.1]].forEach(([t, f]) => { g.beginPath(); g.arc(X(t), Y(f), 7, 0, 7); g.fill(); });
  g.font = '16px sans-serif'; g.fillText('normal limits for a test meal', X(122) - 20, Y(0.6) - 14);
  Object.entries(FOODS).forEach(([k, f]) => {
    const on = k === st.food;
    g.strokeStyle = on ? '#ff6b9a' : 'rgba(255,255,255,.28)'; g.lineWidth = on ? 5 : 2; g.beginPath();
    for (let t = 0; t <= 240; t += 3) { const x = X(t), y = Y(left(f, t)); if (t === 0) g.moveTo(x, y); else g.lineTo(x, y); }
    g.stroke();
    const tl = k === 'water' ? 18 : k === 'rice' ? 100 : k === 'dal' ? 150 : 205;
    g.fillStyle = on ? '#ff9fbd' : 'rgba(255,255,255,.55)'; g.font = (on ? '600 ' : '') + '19px sans-serif'; g.fillText(f.name, X(tl) + 4, Y(left(f, tl)) - 8);
  });
  const x = X(Math.min(240, st.t)); g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.moveTo(x, top); g.lineTo(x, bot); g.stroke();
  g.fillStyle = 'rgba(255,255,255,.6)'; g.font = '17px sans-serif'; g.fillText('time since eating →', R - 170, bot + 52);
}

export default {
  id: 'churn',
  short: 'The mixing mill',
  title: 'Churning food into chyme',
  subtitle: 'Three squeezes a minute, a gatekeeper at the exit, and 2 to 4 hours to empty.',
  view: { pos: [-1.1, 5.0, 13.2], target: [-1.3, 4.4, 0] },
  learn: `<p>The stomach isn’t just a bag: it is a <b>mill</b>. About <b>three times a minute</b>, a ring of squeezing muscle starts in the middle of the stomach and sweeps down towards the exit, getting stronger in the <b>antrum</b>. This <b>peristalsis</b> mixes food with acid and pepsin into a thick soup called <b>chyme</b>.</p>
    <p>At the end sits the <b>pylorus</b>. As a wave arrives, it opens just a crack and lets a small squirt of chyme into the duodenum. Then it shuts, and the wave has nowhere to go, so it jets the lumps back into the stomach to be ground again. Only pieces smaller than about <b>1 to 2 mm</b> get through. A <a href="/mixerclear/#blades">mixer grinder</a> does the same job with blades at about 20,000 turns a minute; your stomach does it with slow, strong squeezes and chemistry.</p>
    <p>How long it takes depends on the food. <b>Water</b> starts leaving within minutes. A meal usually takes about <b>2 to 4 hours</b>: carbohydrates like plain rice leave fastest, protein-rich dal takes longer, and <b>fat</b> slows things most, because fat reaching the duodenum sends signals that hold the stomach back. The duodenum then gets bile from the <a href="/liverclear/">liver</a> and juices from the <a href="/pancreasclear/">pancreas</a>, and the rest of digestion happens in the intestines (<a href="/intestineclear/">IntestineClear</a>).</p>
    <p class="tip"><b>Try it:</b> watch a wave push food to the pylorus and most of it squirt back. Pick different foods and move the clock: see how much is left after 2 hours.</p>`,
  terms: [
    { t: 'Chyme', d: 'The thick, soupy mix of partly digested food and gastric juice that leaves the stomach.' },
    { t: 'Peristaltic wave', d: 'A ring of muscle squeezing that travels along the gut, here about three times a minute.' },
    { t: 'Retropulsion', d: 'Food being jetted back into the stomach when a wave meets the closed pylorus. It grinds lumps smaller.' },
    { t: 'Gastric emptying', d: 'How quickly the stomach passes its contents on to the duodenum.' },
    { t: 'Lag phase', d: 'The first part of emptying a solid meal, when food is being ground and little leaves.' },
  ],
  defaults: { food: 'rice', clock: 30, play: true, labels: true },
  controls: [
    { key: 'food', type: 'seg', label: 'What did you eat?', options: Object.entries(FOODS).map(([v, f]) => ({ v, label: f.name })) },
    { key: 'clock', type: 'range', label: 'Time since eating', min: 0, max: 240, step: 1, ends: ['just ate', '4 hours'], fmt: (v) => (v < 60 ? Math.round(v) + ' min' : Math.floor(v / 60) + ' h ' + Math.round(v % 60) + ' min') },
    { key: 'play', type: 'toggle', label: 'Run the clock (1 s = 2 min)' },
    { key: 'again', type: 'buttons', label: 'Meal', items: [{ label: 'Eat again', act: (s) => { s.clock = 0; } }] },
    { key: 'labels', type: 'toggle', label: 'Labels' },
  ],
  quiz: [
    { q: 'About how often does a squeeze wave sweep across the stomach?', options: ['Once an hour', 'About three times a minute', 'Every second', 'Only when you move'], answer: 1, why: 'The stomach’s pacemaker cells set a rhythm of about three waves a minute.' },
    { q: 'What happens to a lump that is too big to pass the pylorus?', options: ['It is stuck forever', 'It is jetted back into the stomach and ground again', 'It is absorbed right there', 'It goes back up the oesophagus'], answer: 1, why: 'The pylorus shuts as the wave arrives, so the lump is squirted back (retropulsion) and broken smaller.' },
    { q: 'Which usually leaves the stomach slowest?', options: ['A glass of water', 'Plain rice', 'Fried, fatty food', 'They all take exactly the same time'], answer: 2, why: 'Fat reaching the duodenum triggers signals that slow the stomach down, so fatty meals stay longest.' },
  ],
  reel: [
    { ms: 5600, caption: 'About three times a minute, a squeeze sweeps the stomach and grinds food into soupy chyme.', set: { food: 'rice', play: false, clock: 20, labels: false }, view: { pos: [1.2, 5.0, 10.8], target: [1.4, 4.5, 0] }, spin: 0 },
    { ms: 5200, caption: 'Only bits under about 2 mm get past the pylorus. Water leaves in minutes, a fried meal takes hours.', set: { food: 'fried', play: false, labels: false }, anim: { clock: [10, 200] }, spin: 0.1 },
  ],

  build({ stage }) {
    stage.renderer.localClippingEnabled = true;
    const root = new THREE.Group(); root.position.set(0.3, 3.4, 0); root.scale.setScalar(1.5); stage.root.add(root);
    const stom = makeStomach(); root.add(stom.group);
    stom.setCut(cutPlane(0.08));
    stom.outerMat.opacity = 0.35; stom.outerMat.depthWrite = false;
    const duoMat = tissue(C.duo, { opacity: 0.5, depthWrite: false });
    const duo = organTube(DUO_PTS, { rings: 60, seg: 18, mat: duoMat, radius: () => 0.26 }); root.add(duo);
    // Chyme particles.
    const N = 190, bits = swarm(N, new THREE.IcosahedronGeometry(0.085, 0), M.plastic(0xffffff, { roughness: 0.8 })); bits.frustumCulled = false; root.add(bits);
    const P = Array.from({ length: N }, (_, i) => ({ u: 0.18 + rnd(i) * 0.7, rho: Math.sqrt(rnd(i + 11)) * 0.8, th: rnd(i + 23) * Math.PI * 2, out: -1, gone: false, sz: 0.6 + 0.8 * rnd(i + 31) }));
    const col = new THREE.Color();
    const labs = [
      tint(stage.label('Wave of squeezing', [2.6, 0.2, 0.6], root), 'muscle'),
      tint(stage.label('Pylorus: opens a crack', [-0.9, -1.25, 0.6], root), 'muscle'),
      tint(stage.label('Chyme', [1.3, 1.35, 0.6], root), 'food'),
      tint(stage.label('Duodenum', [-2.05, -1.0, 0.3], root), 'food'),
      tint(stage.label('Fundus: food waits here', [1.35, 2.75, 0.2], root), ''),
    ];
    const gate = tint(stage.label('', [-0.4, 0.45, 0.6], root), 'gold');
    const st = { food: 'rice', t: 0 };
    const chart = canvasTexture(760, 520, (g, w, h) => drawChart(g, w, h, st));
    const brd = board(chart, 5.0, 3.42); brd.position.set(-5.7, 2.2, 0); stage.root.add(brd);

    let t = 0, redraw = 0, lastFood = null, lastClock = -1;
    const waveU = (k) => 0.3 + 0.7 * k;              // wave position for progress k 0..1
    const fit = fitNarrow(stage, { pos: [-1.4, 4.8, 19], target: [-1.6, 4.0, 0] });
    const p = new THREE.Vector3();
    return compactReadout(stage, {
      update(dt, s) {
        dt = Math.max(0, dt); t += dt;
        if (s.play) s.clock = s.clock + dt * 2 > 240 ? 0 : s.clock + dt * 2;
        const f = FOODS[s.food];
        // Active waves: one every PERIOD s, each travelling for TRAVEL s.
        const waves = [];
        for (let k = 0; k < 2; k++) { const age = ((t % PERIOD) + k * PERIOD); if (age < TRAVEL) waves.push(age / TRAVEL); }
        const squeeze = (u) => { let q = 0; for (const w of waves) { const uw = waveU(w), d = lerp(0.1, 0.62, smooth((uw - 0.3) / 0.6)); q = Math.max(q, d * Math.exp(-(((u - uw) / 0.045) ** 2))); } return q; };
        const lead = waves.length ? Math.max(...waves.map(waveU)) : 0;
        const pyl = clamp(Math.min((lead - 0.62) / 0.06, (0.9 - lead) / 0.03), 0, 1);
        stom.set({ squeeze, pylorus: pyl });
        // How many bits should still be inside.
        const nIn = Math.round(N * left(f, s.clock));
        if (s.food !== lastFood || s.clock < lastClock - 1) {       // new meal: refill
          lastFood = s.food; P.forEach((q, i) => { q.gone = i >= nIn; q.out = -1; q.u = 0.18 + rnd(i + t) * 0.7; });
          col.set(f.color); for (let i = 0; i < N; i++) bits.setColorAt(i, col); bits.instanceColor.needsUpdate = true;
        }
        lastClock = s.clock;
        let inside = P.filter((q) => !q.gone && q.out < 0).length;
        const size = grind(f, s.clock), scale = f.size ? clamp(size / 4, 0.6, 1.8) : 0.6;
        const vw = 0.7 / TRAVEL;                                    // wave speed in u per second
        P.forEach((q, i) => {
          if (q.gone) { bits.place(i, [0, -80, 0]); return; }
          if (q.out >= 0) {                                         // travelling down the duodenum
            q.out += dt / 3; if (q.out >= 1) { q.gone = true; bits.place(i, [0, -80, 0]); return; }
            duo.at(q.out, q.rho * 0.6, q.th, 0.22, p); bits.place(i, p.toArray(), [t + i, i, 0], scale * q.sz * 0.7); return;
          }
          // Waves push food near the wall forwards; at the closed pylorus it jets back up the middle.
          for (const w of waves) {
            const uw = waveU(w), d = q.u - uw;
            if (d > 0 && d < 0.1) q.u += vw * dt * (q.rho > 0.35 ? 1.1 : 0.6);
            if (uw > 0.8 && pyl < 0.3 && d > -0.04 && d < 0.2 && q.rho < 0.5) q.u -= vw * dt * 4.5;
          }
          q.u -= 0.004 * dt; q.th += dt * 0.2 * (rnd(i) - 0.5); q.rho = clamp(q.rho + (rnd(i + Math.floor(t * 2)) - 0.5) * dt * 0.4, 0.05, 0.85);
          q.u = clamp(q.u, 0.14, 0.975);
          // Leave through the open pylorus if small enough and the stomach should be emptier.
          if (inside > nIn && q.u > 0.93 && pyl > 0.4 && (f.size === 0 || size * q.sz < 2.6)) { q.out = 0; inside--; }
          stom.at(q.u, q.rho, q.th, stom.radiusAt(q.u) * 0.95, p);
          bits.place(i, p.toArray(), [t * 0.3 + i, i, 0], scale * q.sz);
        });
        // If the clock jumps ahead, catch up without waiting for waves.
        if (inside > nIn + 6) { let extra = inside - nIn; for (const q of P) { if (extra <= 0) break; if (!q.gone && q.out < 0) { q.gone = true; extra--; } } }
        if (inside < nIn - 6) { let need = nIn - inside; for (const q of P) { if (need <= 0) break; if (q.gone) { q.gone = false; q.out = -1; q.u = 0.2 + rnd(need) * 0.5; need--; } } }
        bits.done();
        st.food = s.food; st.t = s.clock;
        redraw += dt; if (redraw > 0.2) { redraw = 0; chart.redraw(); }
        const narrow = fit();
        labs.forEach((l) => { l.visible = s.labels && !narrow; });
        gate.visible = s.labels; gate.element.innerHTML = pyl > 0.4 ? '<b>Pylorus open: a squirt of chyme</b>' : lead > 0.85 ? '<b>Pylorus shut: lumps jet back</b>' : '<b>Pylorus nearly shut</b>';
        labs[0].position.copy(stom.at(clamp(lead || 0.5, 0.35, 0.9), 0, 0, 0)).add(new THREE.Vector3(0.5, -1.1, 0.6));
      },
      readout: (s) => {
        const f = FOODS[s.food], L = left(f, s.clock), sz = grind(f, s.clock);
        const h = Math.floor(s.clock / 60), m = Math.round(s.clock % 60);
        return `<div class="big">${Math.round(L * 100)}% still in the stomach</div>
          <div class="row"><span>${f.name}, eaten</span><b>${h ? h + ' h ' : ''}${m} min ago</b></div>
          <div class="row"><span>Squeeze waves</span><b>about 3 a minute</b></div>
          <div class="row"><span>Typical piece size</span><b>${f.size ? (sz < 2 ? 'under 2 mm: can pass' : '~' + sz.toFixed(0) + ' mm: too big yet') : 'liquid: passes freely'}</b></div>
          <div class="row"><span>Half gone after</span><b>about ${f.half} min</b></div>
          <small>Squeezes are shown in real time; the meal clock runs fast. Illustrative emptying curves: real times vary between people and meals.</small>`;
      },
    });
  },
};

// Chapter 5: hunger and fullness. The stomach stretches as it fills (with "receptive relaxation"
// of the fundus keeping the pressure low), stretch receptors send signals up the vagus nerve to
// the brain, and the stomach itself makes hormones: ghrelin (the "hunger hormone", mostly from
// the fundus) and gastrin (from G cells in the antrum, which boosts acid when food arrives).
// Facts:
//  - Capacity: empty about 75 mL; about 1 to 1.5 L comfortably; up to about 2 to 4 L at the
//    most in adults (Guyton & Hall, 14th ed., ch. 64; Wikipedia "Stomach", citing its sources).
//    Competitive eaters stretch theirs further, which is risky.
//  - Ghrelin was discovered in 1999 in the rat stomach (Kojima et al., Nature 402:656). In people
//    its level rises before each meal and falls within about an hour after eating (Cummings et
//    al., Diabetes 50:1714, 2001). The daily curve here copies that shape; the scale is relative.
//  - Gastrin: Edkins, 1905; G cells in the antrum release it in response to protein and stretch;
//    it drives acid secretion (Guyton & Hall, ch. 65).
//  - Growling (borborygmi) is gas and fluid being pushed along by the muscle. Between meals the
//    "migrating motor complex", a strong housekeeping wave, sweeps through about every 90 to
//    120 minutes (Deloose et al., Nat Rev Gastroenterol Hepatol 9:271, 2012), which is why an
//    empty stomach growls.
//  - Many fullness signals also come from hormones made in the intestine (CCK, GLP-1, PYY) once
//    food arrives there (see IntestineClear).
import { THREE, M, canvasTexture, swarm, clamp, lerp, smooth, tube } from '../kit.js';
import { makeStomach, stomachVolume1, organTube, tissue, C, tint, board, fitNarrow, compactReadout, rnd, OES_PTS, DUO_PTS } from '../stomach.js';

const MEALS = [8, 13, 20];                        // breakfast, lunch, dinner (hours)
export const SIZES = { light: { name: 'Light', mL: 400 }, normal: { name: 'Normal', mL: 900 }, feast: { name: 'Feast', mL: 1800 }, contest: { name: 'Eating contest', mL: 3500 } };
const V1 = stomachVolume1();

// Hours since the most recent meal, and the gap to the next one.
function sinceMeal(h) {
  let last = -99, next = 99;
  for (const d of [-1, 0, 1]) for (const m of MEALS) { const t = m + d * 24; if (t <= h && t > last) last = t; if (t > h && t < next) next = t; }
  return { since: h - last, gap: next - last };
}
// Ghrelin, relative 0..1: falls to a low about an hour after eating, then climbs until the next meal.
export function ghrelin(h, big = 1) {
  const { since, gap } = sinceMeal(h);
  const trough = 0.25 / Math.max(0.6, big), peak = 0.95;
  if (since < 1) return lerp(peak * 0.9, trough, smooth(since));
  return lerp(trough, peak, smooth((since - 1) / Math.max(1, gap - 1)) * (gap > 8 ? 0.85 : 1));
}
// Volume in the stomach (mL): a resting 75 mL plus each meal emptying with a half-time of 90 min.
export function volume(h, size) {
  let v = 75;
  for (const d of [-1, 0]) for (const m of MEALS) { const t = h - (m + d * 24); if (t >= 0 && t < 10) v += size * Math.pow(2, -Math.pow((t * 60) / 90, 1.2)) * clamp(t / 0.33, 0, 1); }
  return v;
}
export function feeling(v) {
  if (v < 300) return 'empty';
  if (v < 1000) return 'comfortable';
  if (v < 1600) return 'full';
  if (v < 2600) return 'very full, uncomfortable';
  return 'over-stretched: risky';
}
const hhmm = (h) => { h = ((h % 24) + 24) % 24; const H = Math.floor(h), m = Math.floor((h - H) * 60); return `${String(H).padStart(2, '0')}:${String(m).padStart(2, '0')}`; };

function drawChart(g, w, h, st) {
  g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(10,12,18,.92)'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#e8ecf4'; g.font = '600 30px sans-serif'; g.fillText('Ghrelin, the hunger hormone, over a day', 18, 42);
  const L = 60, R = w - 20, top = 90, bot = h - 60, X = (t) => L + ((t - 6) / 24) * (R - L), Y = (f) => bot - f * (bot - top);
  g.fillStyle = 'rgba(255,255,255,.6)'; g.font = '20px sans-serif';
  for (let t = 6; t <= 30; t += 6) g.fillText(hhmm(t), X(t) - 26, bot + 30);
  g.fillText('high', 6, Y(0.95) + 6); g.fillText('low', 10, Y(0.15) + 6);
  MEALS.forEach((m) => { const x = X(m < 6 ? m + 24 : m); g.fillStyle = 'rgba(255,209,102,.18)'; g.fillRect(x - 3, top - 10, 30, bot - top + 10); g.fillStyle = '#ffd166'; g.font = '18px sans-serif'; g.fillText(m === 8 ? 'breakfast' : m === 13 ? 'lunch' : 'dinner', x - 30, top - 16); });
  g.strokeStyle = '#6ee7a8'; g.lineWidth = 5; g.beginPath();
  for (let t = 6; t <= 30; t += 0.05) { const y = Y(ghrelin(t % 24, st.big)); if (t === 6) g.moveTo(X(t), y); else g.lineTo(X(t), y); }
  g.stroke();
  const hh = st.h < 6 ? st.h + 24 : st.h; const x = X(hh);
  g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.moveTo(x, top - 6); g.lineTo(x, bot); g.stroke();
  g.fillStyle = '#fff'; g.beginPath(); g.arc(x, Y(ghrelin(st.h, st.big)), 9, 0, 7); g.fill();
  g.fillStyle = 'rgba(255,255,255,.55)'; g.font = '16px sans-serif'; g.fillText('shape after Cummings et al., 2001', R - 270, bot + 52);
}

// A low rumble for the growl button (Web Audio, only when sound is on).
let actx = null;
function rumble(muted) {
  if (muted) return;
  try { actx ||= new (window.AudioContext || window.webkitAudioContext)(); } catch { return; }
  if (actx.state === 'suspended') actx.resume();
  const t = actx.currentTime, n = actx.sampleRate * 1.6, buf = actx.createBuffer(1, n, actx.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) { const k = i / n; d[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * k) * (0.6 + 0.4 * Math.sin(i / 900)); }
  const src = actx.createBufferSource(), f = actx.createBiquadFilter(), g = actx.createGain();
  src.buffer = buf; f.type = 'lowpass'; f.frequency.value = 180; g.gain.value = 0.9;
  src.connect(f).connect(g).connect(actx.destination); src.start(t);
}

export default {
  id: 'signals',
  short: 'Hungry or full?',
  title: 'Hunger, fullness and a growling stomach',
  subtitle: 'Stretch sensors, a nerve to the brain, and hormones made by the stomach itself.',
  view: { pos: [-0.5, 5.6, 14], target: [-0.7, 5.1, 0] },
  learn: `<p>An empty stomach holds only about <b>75 mL</b>, and its lining lies in deep folds. As you eat, the top of the stomach <b>relaxes</b> to make room, so it can take about <b>1 to 1.5 litres</b> comfortably without the pressure inside rising much. At the most it stretches to about <b>2 to 4 litres</b>, which is very uncomfortable.</p>
    <p>The wall is full of <b>stretch receptors</b>. As it fills, they send signals up the <b>vagus nerve</b> to the brain: <i>that’s enough</i>. More “full” signals follow from hormones made in the intestine once food arrives there, which takes a while. That is one reason eating slowly helps you notice when you are full.</p>
    <p>The stomach makes hormones too. <b>Ghrelin</b>, the <b>hunger hormone</b>, comes mostly from the top of the stomach. Its level climbs before your usual meal times and falls within about an hour after eating. <b>Gastrin</b>, from the antrum, is released when food arrives and tells the parietal cells to make more acid.</p>
    <p>And the growling? Its proper name is <b>borborygmi</b>: gas and liquid being squeezed along. Between meals a strong “housekeeping” wave sweeps through about every 1.5 to 2 hours to clear leftovers, and with little food to muffle it, an empty stomach sounds loudest.</p>
    <p class="tip"><b>Try it:</b> move through the day and watch the stomach fill and empty while ghrelin rises and falls. Try a feast, then press Growl (turn the sound on).</p>`,
  terms: [
    { t: 'Stretch receptor', d: 'A nerve ending in the stomach wall that fires when the wall is stretched.' },
    { t: 'Vagus nerve', d: 'A long nerve linking the brain with the heart, lungs and gut. It carries fullness signals up and digestion orders down.' },
    { t: 'Ghrelin', d: 'The hunger hormone, made mostly by the stomach. It rises before meals and falls after eating.' },
    { t: 'Gastrin', d: 'A hormone from the antrum that makes the stomach produce more acid when food arrives.' },
    { t: 'Receptive relaxation', d: 'The top of the stomach relaxing as food arrives, so it holds more without the pressure rising.' },
    { t: 'Borborygmi', d: 'The rumbling sounds of gas and liquid moving through the gut.' },
  ],
  defaults: { hour: 13.7, play: true, size: 'normal', labels: true },
  controls: [
    { key: 'hour', type: 'range', label: 'Time of day', min: 0, max: 23.99, step: 0.05, ends: ['midnight', '11:59 pm'], fmt: (v) => hhmm(v) },
    { key: 'play', type: 'toggle', label: 'Run the clock (1 s = 10 min)' },
    { key: 'size', type: 'seg', label: 'Meal size', options: Object.entries(SIZES).map(([v, o]) => ({ v, label: o.name })) },
    { key: 'growl', type: 'buttons', label: 'Sounds', items: [{ label: 'Growl', act: (s, inst) => inst.growl?.() }] },
    { key: 'labels', type: 'toggle', label: 'Labels' },
  ],
  quiz: [
    { q: 'Ghrelin is often called…', options: ['The fullness hormone', 'The hunger hormone', 'The acid hormone', 'The sleep hormone'], answer: 1, why: 'Ghrelin, made mostly by the stomach, rises before meals and is linked to feeling hungry. It falls after you eat.' },
    { q: 'How does the stomach tell the brain it is full?', options: ['By sound', 'Stretch receptors signal along the vagus nerve, joined later by gut hormones', 'It doesn’t: the brain guesses', 'Through the lungs'], answer: 1, why: 'Stretch sensors in the wall fire as it fills and signal up the vagus nerve; hormones from the intestine add to it.' },
    { q: 'What makes a stomach growl?', options: ['Acid boiling', 'Gas and fluid being squeezed along by the muscle', 'The stomach shrinking', 'Hunger pangs are just imaginary'], answer: 1, why: 'Borborygmi are gas and liquid pushed along by waves of muscle. An empty stomach has little to muffle them.' },
  ],
  reel: [
    { ms: 5400, caption: 'An empty stomach holds about 75 mL. Its wall stretches to hold a litre or more, and tells your brain it’s full.', set: { play: false, size: 'feast', labels: false }, anim: { hour: [7.6, 8.9] }, spin: 0.12 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); root.position.set(0.6, 2.4, 0); root.scale.setScalar(1.2); stage.root.add(root);
    const stom = makeStomach({ rings: 90, seg: 40 }); root.add(stom.group);
    const oes = organTube(OES_PTS.slice(4), { rings: 20, seg: 16, mat: tissue(C.oes), radius: () => 0.15 }); root.add(oes);
    const duo = organTube(DUO_PTS, { rings: 50, seg: 16, mat: tissue(C.duo), radius: () => 0.26 }); root.add(duo);
    // Stretch receptors: small sensors on the wall that glow as it stretches.
    const NR = 46, rec = swarm(NR, new THREE.SphereGeometry(0.06, 10, 8), M.glow(0xc9a7ff)); rec.frustumCulled = false; root.add(rec);
    const recAt = Array.from({ length: NR }, (_, i) => ({ u: 0.05 + rnd(i) * 0.85, th: rnd(i + 5) * Math.PI * 2 }));
    // Brain and vagus nerve.
    const brain = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 22), tissue(0xf0b7c4, { opacity: 0.8 })); brain.scale.set(0.85, 0.62, 0.7); brain.position.set(0.9, 5.25, -0.2); root.add(brain);
    const nervePts = [[0.5, 1.0, 0.45], [0.3, 2.2, 0.25], [0.3, 3.6, 0.2], [0.75, 4.75, 0]];
    const nerve = tube(nervePts, 0.045, M.glow(0x9d7cff), false, 80); root.add(nerve);
    const nCurve = new THREE.CatmullRomCurve3(nervePts.map((p) => new THREE.Vector3(...p)));
    const NS = 14, spikes = swarm(NS, new THREE.SphereGeometry(0.09, 10, 8), M.glow(0xffffff)); spikes.frustumCulled = false; root.add(spikes);
    // Blood vessel carrying hormones (ghrelin from the fundus, gastrin from the antrum).
    const vesPts = [[1.55, 2.35, -0.2], [1.75, 3.4, -0.3], [1.3, 4.7, -0.3]];
    const ves = tube(vesPts, 0.07, tissue(0xd8404c, { opacity: 0.55, depthWrite: false }), false, 60); root.add(ves);
    const vCurve = new THREE.CatmullRomCurve3(vesPts.map((p) => new THREE.Vector3(...p)));
    const NG = 24, ghr = swarm(NG, new THREE.OctahedronGeometry(0.08, 0), M.glow(0x6ee7a8)); ghr.frustumCulled = false; root.add(ghr);
    const NGa = 12, gas = swarm(NGa, new THREE.OctahedronGeometry(0.07, 0), M.glow(0x6fb6ff)); gas.frustumCulled = false; root.add(gas);
    const aCurve = new THREE.CatmullRomCurve3([[0.2, -0.95, 0.3], [-0.5, -0.3, 0.8], [-0.2, 0.9, 0.9], [1.0, 1.0, 1.0]].map((p) => new THREE.Vector3(...p)));
    // Bubbles for the growl.
    const NB = 14, bub = swarm(NB, new THREE.SphereGeometry(0.16, 14, 10), M.ghost(0xffffff, 0.55)); bub.frustumCulled = false; root.add(bub);
    const labs = [
      tint(stage.label('Brain', [2.1, 5.6, 0], root), 'nerve'),
      tint(stage.label('Vagus nerve: “I’m full”', [-1.0, 3.3, 0.4], root), 'nerve'),
      tint(stage.label('Stretch receptors', [2.75, 0.4, 0.4], root), 'nerve'),
      tint(stage.label('Ghrelin from the fundus', [3.0, 3.3, 0], root), 'good'),
      tint(stage.label('Gastrin: “make more acid”', [-1.4, 0.2, 0.9], root), 'mucus'),
    ];
    const vol = tint(stage.label('', [0.9, -2.35, 0.4], root), 'gold');
    const growlL = tint(stage.label('<b>Rumble: borborygmi</b>', [2.2, -0.6, 0.6], root), 'gold');
    const st = { h: 12.5, big: 1 };
    const chart = canvasTexture(780, 460, (g, w, h) => drawChart(g, w, h, st));
    const brd = board(chart, 5.2, 3.07); brd.position.set(-5.4, 2.3, 0); stage.root.add(brd);

    let t = 0, redraw = 0, growlT = 9, k = 0.5;
    const p = new THREE.Vector3();
    const fit = fitNarrow(stage, { pos: [-0.9, 5.4, 20], target: [-0.9, 4.8, 0] });
    const inst = {
      growl() { growlT = 0; rumble(document.getElementById('btnSound')?.classList.contains('muted')); },
      update(dt, s) {
        dt = Math.max(0, dt); t += dt;
        if (s.play) s.hour = (s.hour + dt / 6) % 24;
        const size = SIZES[s.size].mL, V = volume(s.hour, size), G = ghrelin(s.hour, size / 900);
        st.h = s.hour; st.big = size / 900;
        // Stretch: radius scale from the volume; the empty stomach keeps some size, its lining folded.
        const target = clamp(Math.sqrt(V / V1), 0.42, 2.0);
        k += (target - k) * Math.min(1, dt * 4);
        // A growl: one strong wave sweeps through.
        growlT += dt;
        const gw = growlT < 3 ? growlT / 3 : -1;
        stom.set({ scale: k, squeeze: gw >= 0 ? (u) => 0.35 * Math.exp(-(((u - (0.2 + 0.8 * gw)) / 0.06) ** 2)) : null });
        const stretch = clamp((V - 150) / 1300, 0, 1.4);
        for (let i = 0; i < NR; i++) { const a = recAt[i]; stom.at(a.u, 1.02, a.th, stom.radiusAt(a.u) / 0.8, p); rec.place(i, p.toArray(), null, 0.6 + 0.9 * stretch * (0.7 + 0.3 * Math.sin(t * 6 + i))); }
        rec.done();
        rec.material.color.setHSL(0.72, 0.8, 0.45 + 0.35 * Math.min(1, stretch));
        for (let i = 0; i < NS; i++) { const on = i < Math.round(NS * Math.min(1, stretch)); const u = (t * 0.45 + i / NS) % 1; if (on) { nCurve.getPointAt(u, p); spikes.place(i, p.toArray()); } else spikes.place(i, [0, -80, 0]); }
        spikes.done();
        for (let i = 0; i < NG; i++) { const on = i < Math.round(NG * G); const u = (t * 0.12 + i / NG) % 1; if (on) { vCurve.getPointAt(u, p); ghr.place(i, [p.x, p.y + 0.08 * Math.sin(i), p.z + 0.1]); } else ghr.place(i, [0, -80, 0]); }
        ghr.done();
        const gastrin = clamp((V - 200) / 700, 0, 1);
        for (let i = 0; i < NGa; i++) { const on = i < Math.round(NGa * gastrin); const u = (t * 0.1 + i / NGa) % 1; if (on) { aCurve.getPointAt(u, p); gas.place(i, p.toArray()); } else gas.place(i, [0, -80, 0]); }
        gas.done();
        for (let i = 0; i < NB; i++) { if (gw < 0) { bub.place(i, [0, -80, 0]); continue; } const u = clamp(0.12 + 0.85 * gw - 0.03 * (i % 5), 0.05, 0.98); stom.at(u, 0.5 * rnd(i), rnd(i + 3) * 6.28, stom.radiusAt(u), p); bub.place(i, p.toArray(), null, 0.6 + rnd(i + 9)); }
        bub.done();
        redraw += dt; if (redraw > 0.2) { redraw = 0; chart.redraw(); }
        const narrow = fit();
        labs.forEach((l) => { l.visible = s.labels && !narrow; });
        vol.visible = s.labels; vol.element.innerHTML = `<b>${Math.round(V)} mL: ${feeling(V)}</b>`;
        growlL.visible = gw >= 0;
      },
      readout: (s) => {
        const size = SIZES[s.size].mL, V = volume(s.hour, size), G = ghrelin(s.hour, size / 900), stretch = clamp((V - 150) / 1300, 0, 1.4);
        return `<div class="big">${hhmm(s.hour)} · ${Math.round(V)} mL inside</div>
          <div class="row"><span>How it feels</span><b class="${V > 1600 ? 'no' : ''}">${feeling(V)}</b></div>
          <div class="row"><span>Ghrelin (hunger hormone)</span><b>${G > 0.7 ? 'high: hungry' : G > 0.45 ? 'rising' : 'low'}</b></div>
          <div class="row"><span>Stretch signal to the brain</span><b>${stretch < 0.1 ? 'quiet' : stretch < 0.6 ? 'some' : stretch < 1 ? 'strong: “full”' : 'very strong'}</b></div>
          <div class="row"><span>Comfortable, and the most</span><b>1–1.5 L, about 2–4 L</b></div>
          <small>${s.size === 'contest' ? 'Stretching the stomach this far is risky: competitive eating has caused serious injuries.' : 'Meals at 8:00, 13:00 and 20:00. Each empties with a half-time of about 90 minutes in this model.'}</small>`;
      },
    };
    return compactReadout(stage, inst);
  },
};

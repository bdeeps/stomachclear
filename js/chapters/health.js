// Chapter 6: keeping it healthy and what goes wrong. General facts only, never medical advice.
// Scene 1, reflux: acid gets past a weak or relaxed lower oesophageal sphincter (LES) into the
//   oesophagus, felt as heartburn. Things that make it more likely include a big or fatty meal and
//   lying down soon after eating (NIDDK, "Acid Reflux (GER & GERD) in Adults"); lying on the right
//   side gives more reflux than lying on the left (Khoury et al., Am J Gastroenterol 94:2069,
//   1999). About 20% of people in the US have GERD (NIDDK); an Indian Society of Gastroenterology
//   task force found weekly reflux symptoms in about 7.6% of people surveyed in India (Bhatia et
//   al., Indian J Gastroenterol 30:118, 2011). The reflux score here is a teaching rule of thumb.
// Scene 2, H. pylori: a spiral bacterium about 3 µm long that lives in the stomach's mucus and
//   makes urease, which turns urea into ammonia to neutralise the acid around it. It infects
//   about half the world's people, usually from childhood; most never have symptoms, but it
//   causes most stomach ulcers and raises the risk of stomach cancer (NIDDK "Peptic Ulcers";
//   WHO/IARC). Marshall and Warren cultured it in 1982; Marshall drank a culture in 1984 to show
//   it causes gastritis; they won the 2005 Nobel Prize (nobelprize.org). Doctors treat it with a
//   combination of antibiotics and acid-reducing medicine.
// Scene 3, vomiting: a protective reflex run by the brainstem (the area postrema and nearby
//   "vomiting centre" in the medulla). After a deep breath the airway closes, the diaphragm and
//   belly muscles squeeze the stomach, the LES and upper sphincter open, and the contents are
//   forced up and out (Guyton & Hall, 14th ed., ch. 67).
// Food poisoning: about 600 million people fall ill from contaminated food each year (WHO fact
//   sheet "Food safety", 2022). Spicy food and stress do not cause ulcers, though they can make
//   symptoms worse (NIDDK "Peptic Ulcers").
import { THREE, M, swarm, clamp, lerp, smooth, tube } from '../kit.js';
import { makeUpperGI, tissue, C, tint, fitNarrow, compactReadout, rnd } from '../stomach.js';

const POSTURE = { sit: { name: 'Sitting up', rot: 0, add: 0 }, right: { name: 'Lying on the right side', rot: Math.PI / 2, add: 0.35 }, left: { name: 'Lying on the left side', rot: -Math.PI / 2, add: 0.1 } };
export const refluxScore = (les, big, posture) => clamp(0.1 + (big ? 0.35 : 0) + POSTURE[posture].add - les * 0.6, 0, 1);
const VIEWS = {
  reflux: { pos: [-0.6, 5.2, 13.5], target: [-0.9, 4.5, 0] },
  hpylori: { pos: [-1.0, 4.6, 10.5], target: [-1.4, 3.9, 0] },
  vomit: { pos: [-1.6, 6.8, 18], target: [-2.2, 6.0, 0] },
};

export default {
  id: 'health',
  short: 'Healthy stomach',
  title: 'Keeping it healthy, and what goes wrong',
  subtitle: 'Heartburn, H. pylori and ulcers, food poisoning, and why we vomit.',
  view: VIEWS.reflux,
  learn: `<p>Stomach trouble is very common, so it is worth understanding. This chapter shares general facts only: for anything about your own health, <b>talk to a doctor</b>.</p>
    <p><b>Acidity and heartburn.</b> If the <b>lower oesophageal sphincter</b> is weak or relaxes at the wrong time, acid splashes up into the oesophagus, whose lining has no mucus shield. That burning feeling behind the breastbone is <b>heartburn</b>; when it keeps happening, doctors call it <b>GERD</b>. A big or fatty meal and lying down soon after eating make reflux more likely. It is common: about 1 in 5 people in the US, and a survey in India found weekly symptoms in about 1 in 13.</p>
    <p><b>H. pylori and ulcers.</b> For a century doctors blamed ulcers on stress and spicy food. In 1982 two Australians, <b>Barry Marshall</b> and <b>Robin Warren</b>, grew a spiral bacterium, <b>Helicobacter pylori</b>, from stomach samples. Nobody believed it could live in acid, so in 1984 Marshall <b>drank a culture</b> and made himself ill. They won the <b>2005 Nobel Prize</b>. H. pylori hides in the mucus and makes ammonia to neutralise acid around itself. About half the world carries it and most never notice, but it causes most ulcers. Doctors can test for it and treat it. <b>Spicy food does not cause ulcers</b>, though it can make an existing one hurt more.</p>
    <p><b>Food poisoning and vomiting.</b> About 600 million people a year fall ill from contaminated food (WHO). Stomach acid kills many germs, but not all. <b>Vomiting</b> is a protective reflex run by the brainstem: a deep breath, the airway shuts, and the diaphragm and belly muscles squeeze the stomach until its contents are forced out. See a doctor for vomiting that won’t stop, signs of dehydration, <b>blood</b> in vomit or black stools, trouble swallowing, or heartburn that keeps coming back.</p>
    <p class="tip"><b>Try it:</b> weaken the sphincter and lie down after a big meal to see reflux, then switch to H. pylori and watch an ulcer start. Trigger the vomiting reflex and follow the squeeze.</p>`,
  terms: [
    { t: 'Heartburn', d: 'A burning feeling behind the breastbone when stomach acid flows back up into the oesophagus. Nothing to do with the heart.' },
    { t: 'GERD', d: 'Gastro-oesophageal reflux disease: reflux that happens often or causes damage.' },
    { t: 'Helicobacter pylori', d: 'A spiral bacterium that lives in the stomach’s mucus. It causes most stomach ulcers.' },
    { t: 'Urease', d: 'An enzyme H. pylori uses to make ammonia, which neutralises the acid around it.' },
    { t: 'Peptic ulcer', d: 'A sore in the lining of the stomach or duodenum.' },
    { t: 'Vomiting reflex', d: 'A protective reflex, run by the brainstem, that forces the stomach’s contents out.' },
  ],
  defaults: { scene: 'reflux', les: 0.8, big: false, posture: 'sit', bugs: true, labels: true, vt: 99 },
  controls: [
    { key: 'scene', type: 'seg', label: 'Show', options: [{ v: 'reflux', label: 'Heartburn' }, { v: 'hpylori', label: 'H. pylori and ulcers' }, { v: 'vomit', label: 'Vomiting' }] },
    { key: 'les', type: 'range', label: 'Heartburn: how tight the sphincter is', min: 0, max: 1, step: 0.01, ends: ['weak', 'strong'], fmt: (v) => Math.round(v * 100) + '%' },
    { key: 'big', type: 'toggle', label: 'Heartburn: just ate a big, fatty meal' },
    { key: 'posture', type: 'seg', label: 'Heartburn: position', options: Object.entries(POSTURE).map(([v, p]) => ({ v, label: p.name.replace('Lying on the ', '').replace(' side', ' side down') })) },
    { key: 'bugs', type: 'toggle', label: 'H. pylori: infection present' },
    { key: 'go', type: 'buttons', label: 'Vomiting', items: [{ label: 'Trigger the reflex', act: (s) => { s.scene = 'vomit'; s.vt = 0; } }] },
    { key: 'labels', type: 'toggle', label: 'Labels' },
  ],
  quiz: [
    { q: 'What is heartburn?', options: ['A heart problem', 'Stomach acid flowing back up into the oesophagus', 'Eating food that is too hot', 'An ulcer in the mouth'], answer: 1, why: 'When the lower oesophageal sphincter lets acid back up, it irritates the oesophagus lining, which has no mucus shield. It has nothing to do with the heart.' },
    { q: 'What causes most stomach ulcers?', options: ['Spicy food', 'Stress alone', 'H. pylori bacteria (and some painkillers)', 'Drinking water with meals'], answer: 2, why: 'Marshall and Warren showed that H. pylori causes most ulcers; NSAID painkillers cause many of the rest. Spicy food and stress don’t cause them.' },
    { q: 'Why do we vomit?', options: ['The stomach runs out of room', 'It is a protective reflex, run by the brainstem, to get rid of harmful contents', 'The oesophagus pumps backwards all the time', 'Acid boils over'], answer: 1, why: 'The brainstem coordinates a deep breath, a closed airway and a hard squeeze by the diaphragm and belly muscles.' },
  ],
  reel: [
    { ms: 5400, caption: 'Heartburn is acid slipping past a weak sphincter at the top of the stomach, not a heart problem.', set: { scene: 'reflux', les: 0.3, big: true, posture: 'sit', labels: false }, anim: { les: [0.8, 0.2] }, view: { pos: [0.3, 4.9, 9.5], target: [0.2, 4.4, 0] }, spin: 0 },
    { ms: 5600, caption: 'Most ulcers are caused by H. pylori. Barry Marshall proved it in 1984 by drinking the bacteria.', set: { scene: 'hpylori', bugs: true, labels: false }, view: { pos: [-0.6, 3.9, 7.2], target: [-0.6, 3.1, 0] }, spin: 0.15 },
  ],

  build({ stage }) {
    stage.renderer.localClippingEnabled = true;
    // ---------------------------------------------------- reflux and vomiting: the upper tract
    const gHold = new THREE.Group(); gHold.position.set(0.4, 4.3, 0); stage.root.add(gHold);
    const gi = makeUpperGI(stage, { labels: false, head: false, context: false });
    gi.root.position.set(-0.6, -1.9, 0); gHold.add(gi.root);         // pivot near the LES
    gi.setXray(1, new THREE.Plane(new THREE.Vector3(0, 0, -1), 0.05));
    gi.stom.outerMat.opacity = 0.35;
    const dia = tube([[-2.4, 2.0, 0.3], [-1.2, 3.3, 0.3], [0, 2.7, 0.3], [0.7, 2.55, 0.3], [1.6, 2.95, 0.3], [2.6, 2.2, 0.3]], 0.06, M.ghost(C.dia, 0.7), false, 60); gi.root.add(dia);
    const belly = tube([[-2.6, 2.3, 1.4], [-2.8, 0.5, 1.6], [-2.2, -1.6, 1.7], [0, -2.4, 1.9], [2.3, -1.4, 1.7], [2.9, 0.6, 1.6], [2.7, 2.4, 1.4]], 0.09, M.ghost(0xc0625a, 0.35), false, 80); gi.root.add(belly);
    // Acid/food particles: candidate spots inside the stomach, of which the lowest are filled.
    const cand = [];
    for (let i = 0; i < 500; i++) cand.push({ u: 0.06 + rnd(i) * 0.9, rho: Math.sqrt(rnd(i + 3)) * 0.8, th: rnd(i + 7) * Math.PI * 2 });
    const NA = 150, acid = swarm(NA, new THREE.SphereGeometry(0.06, 8, 6), M.glow(0xff5a5a)); acid.frustumCulled = false; gi.root.add(acid);
    const NU = 60, up = swarm(NU, new THREE.SphereGeometry(0.07, 8, 6), M.glow(0xff7a5a)); up.frustumCulled = false; gi.root.add(up);
    const burnMat = M.ghost(0xff4020, 0); const burn = tube([gi.oes.at(0.55), gi.oes.at(0.7), gi.oes.at(0.82), gi.oes.at(0.92)].map((v) => v.toArray()), 0.24, burnMat, false, 30); gi.root.add(burn);
    const rLabs = [
      tint(stage.label('Oesophagus: no mucus shield', gi.oes.at(0.62).add(new THREE.Vector3(1.9, 0.2, 0.4)).toArray(), gi.root), ''),
      tint(stage.label('Lower oesophageal sphincter', gi.oes.at(0.9).add(new THREE.Vector3(-2.2, 0.2, 0.4)).toArray(), gi.root), 'muscle'),
      tint(stage.label('Stomach acid', [0.9, -0.3, 1.0], gi.root), 'acid'),
      tint(stage.label('Diaphragm', [-2.2, 2.75, 0.4], gi.root), ''),
    ];
    const burnL = tint(stage.label('<b>Heartburn</b>', gi.oes.at(0.7).add(new THREE.Vector3(-1.4, 0, 0.4)).toArray(), gi.root), 'acid');
    const vLabs = [
      tint(stage.label('Diaphragm pushes down', [0.4, 3.4, 0.4], gi.root), 'muscle'),
      tint(stage.label('Belly muscles squeeze', [3.4, -0.9, 1.4], gi.root), 'muscle'),
      tint(stage.label('Both sphincters open', gi.oes.at(0.35).add(new THREE.Vector3(1.8, 0, 0.4)).toArray(), gi.root), 'gold'),
    ];
    const vStage = tint(stage.label('', [2.9, 6.6, 0.4], gi.root), 'gold');

    // ---------------------------------------------------- H. pylori close-up
    const hp = new THREE.Group(); hp.position.set(-0.6, 2.0, 0); stage.root.add(hp);
    const lining = new THREE.Mesh(new THREE.BoxGeometry(6.4, 1.6, 2.0), tissue(0xd9828a)); lining.position.y = 0.8; hp.add(lining);
    const cellsM = tissue(0xf4d6dc); const cellsA = [];
    for (let i = 0; i < 20; i++) for (let j = 0; j < 6; j++) { const c = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), cellsM.clone()); c.scale.set(0.15, 0.2, 0.15); c.position.set(-3.05 + i * 0.32, 1.65, -0.85 + j * 0.34); hp.add(c); cellsA.push(c); }
    const mucus = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.9, 2.0), tissue(C.mucus, { opacity: 0.3, depthWrite: false })); mucus.position.y = 2.25; mucus.renderOrder = 3; hp.add(mucus);
    const crater = new THREE.Mesh(new THREE.CircleGeometry(1, 32, Math.PI, Math.PI), tissue(0x5a0d18)); crater.position.set(0.6, 1.62, 1.01); hp.add(crater);
    const helix = (n = 60) => { const pts = []; for (let i = 0; i <= n; i++) { const k = i / n, a = k * Math.PI * 5; pts.push(new THREE.Vector3(k * 0.55 - 0.27, Math.cos(a) * 0.06, Math.sin(a) * 0.06)); } return pts; };
    const bugGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(helix()), 60, 0.035, 8, false);
    const bugMat = M.plastic(0x7cd67c, { transparent: true, opacity: 1 }), cloudMat = M.ghost(0x8fd3ff, 0.18);
    const bugs = Array.from({ length: 14 }, (_, i) => {
      const b = new THREE.Group(); const body = new THREE.Mesh(bugGeo, bugMat); b.add(body);
      for (let f = 0; f < 3; f++) { const fl = tube([[-0.27, 0, 0], [-0.45, 0.05 * (f - 1), 0.04], [-0.62, -0.03 * (f - 1), -0.03]], 0.008, M.glow(0xbfe8a8), false, 10); b.add(fl); }
      const cloud = new THREE.Mesh(new THREE.SphereGeometry(0.32, 14, 10), cloudMat); b.add(cloud);
      b.userData = { x: -2.8 + rnd(i) * 5.6, z: -0.8 + rnd(i + 4) * 1.6, ph: rnd(i + 9) * 6.28 };
      hp.add(b); return b;
    });
    const NH = 110, hAcid = swarm(NH, new THREE.SphereGeometry(0.045, 8, 6), M.glow(0xff5a5a)); hAcid.frustumCulled = false; hp.add(hAcid);
    const hLabs = [
      tint(stage.label('H. pylori: a spiral germ about 3 µm long', [1.0, 3.55, 0.9], hp), 'good'),
      tint(stage.label('Ammonia cloud neutralises acid', [2.7, 2.9, 0.9], hp), 'mucus'),
      tint(stage.label('Mucus layer', [-3.9, 2.25, 0.9], hp), 'mucus'),
      tint(stage.label('Stomach lining', [-3.9, 1.0, 0.9], hp), ''),
      tint(stage.label('Acid', [2.9, 3.9, 0.3], hp), 'acid'),
    ];
    const ulcerL = tint(stage.label('Inflamed lining, then an ulcer', [0.6, 0.5, 1.1], hp), 'acid');
    const heal = tint(stage.label('', [0, 4.4, 0], hp), 'gold');

    let t = 0, lastScene = null, rot = 0, reflux = 0, bugK = 1, ulcer = 0, sortT = 9, lowest = [];
    const p = new THREE.Vector3(), w = new THREE.Vector3(), cool = new THREE.Color(0xf4d6dc), hot = new THREE.Color(0xe0505a);
    const fit = fitNarrow(stage, { pos: [-0.8, 5.4, 19], target: [-0.8, 4.6, 0] });
    const inst = {
      update(dt, s) {
        dt = Math.max(0, dt); t += dt; s.vt += dt;
        if (s.scene !== lastScene) { if ((lastScene !== null || s.scene !== 'reflux') && !document.body.classList.contains('gb-reel')) { const v = VIEWS[s.scene]; stage.setView(v.pos, v.target, 0.9); } lastScene = s.scene; }
        const narrow = fit();
        const showGI = s.scene !== 'hpylori';
        gHold.visible = showGI; hp.visible = !showGI;
        // ---- reflux / vomiting
        if (showGI) {
          const vom = s.scene === 'vomit';
          const targetRot = vom ? 0 : POSTURE[s.posture].rot;
          rot += (targetRot - rot) * Math.min(1, dt * 3);
          gHold.rotation.z = rot;
          const R = vom ? 0 : refluxScore(s.les, s.big, s.posture);
          reflux += (R - reflux) * Math.min(1, dt * 2);
          // Vomiting sequence (seconds after the trigger).
          const vt = s.vt, retch = vom ? smooth(clamp((vt - 1) / 1, 0, 1)) * (1 - smooth(clamp((vt - 4.2) / 1, 0, 1))) : 0, expel = vom ? clamp(Math.min((vt - 2.2) / 0.3, (4.2 - vt) / 0.4), 0, 1) : 0;
          gi.stom.set({ scale: 1 - 0.28 * retch, pylorus: 0 });
          dia.position.y = -0.35 * retch; belly.scale.set(1 - 0.12 * retch, 1, 1 - 0.2 * retch); belly.visible = vom;
          const lesOpen = vom ? expel : clamp(reflux * 1.4, 0, 1);
          gi.les.scale.setScalar(lerp(1, 1.5, lesOpen));
          gi.oes.shape((u) => (u > 0.85 ? lerp(0.07, 0.17, lesOpen) : u < 0.05 ? lerp(0.08, 0.16, vom ? expel : 0) : 0.15));
          // Acid pools in the lowest part of the stomach (re-sorted as the body turns).
          sortT += dt;
          if (sortT > 0.25) {
            sortT = 0; gi.root.updateMatrixWorld(true);
            lowest = cand.map((c) => { gi.stom.at(c.u, c.rho, c.th, 0.8, p); w.copy(p).applyMatrix4(gi.root.matrixWorld); return { c, y: w.y }; }).sort((a, b) => a.y - b.y).slice(0, NA).map((o) => o.c);
          }
          const nA = vom ? Math.round(NA * (1 - 0.9 * clamp((vt - 2.2) / 2, 0, 1))) : Math.round(NA * (s.big ? 1 : 0.55));
          for (let i = 0; i < NA; i++) {
            const c = lowest[i]; if (!c || i >= nA) { acid.place(i, [0, -80, 0]); continue; }
            gi.stom.at(c.u, c.rho, c.th + 0.05 * Math.sin(t + i), gi.stom.radiusAt(c.u) / 0.8, p); acid.place(i, p.toArray());
          }
          acid.done();
          // Acid (or vomit) moving up the oesophagus.
          const reach = vom ? 1 : 0.45 * reflux, flow = vom ? expel : reflux;
          for (let i = 0; i < NU; i++) {
            const k = (t * (vom ? 1.4 : 0.35) + i / NU) % 1;
            if (flow < 0.03 || (vom && vt > 5)) { up.place(i, [0, -80, 0]); continue; }
            const u = 1 - k * reach;
            gi.oes.at(u, 0.5 * rnd(i), rnd(i + 2) * 6.28, 0.12, p); up.place(i, p.toArray());
          }
          up.done();
          up.material.color.set(vom ? 0xffc46a : 0xff7a5a);
          burnMat.opacity = vom ? 0 : 0.5 * clamp(reflux * 1.8, 0, 1) * (0.75 + 0.25 * Math.sin(t * 5));
          rLabs.forEach((l) => { l.visible = s.labels && !vom && !narrow; });
          burnL.visible = s.labels && !vom && reflux > 0.15;
          vLabs.forEach((l) => { l.visible = s.labels && vom && vt < 5 && vt > 0.8 && !narrow; });
          vStage.visible = s.labels && vom;
          vStage.element.innerHTML = !vom ? '' : vt < 1 ? '<b>1. Feeling sick, deep breath</b>' : vt < 2.2 ? '<b>2. Airway shuts, muscles squeeze</b>' : vt < 4.3 ? '<b>3. Sphincters open: out it comes</b>' : vt < 8 ? '<b>4. Over. The brainstem ran it all</b>' : '<b>Press “Trigger the reflex”</b>';
        }
        // ---- H. pylori
        if (!showGI) {
          bugK += ((s.bugs ? 1 : 0) - bugK) * Math.min(1, dt * 1.2);
          ulcer = clamp(ulcer + (s.bugs ? 0.07 : -0.1) * dt, 0, 1);
          bugs.forEach((b, i) => {
            const u = b.userData; b.visible = bugK > 0.03;
            b.position.set(u.x + 0.25 * Math.sin(t * 0.8 + u.ph), 2.05 + 0.18 * Math.sin(t * 1.3 + u.ph * 2), u.z + 0.2 * Math.cos(t * 0.7 + u.ph));
            b.rotation.set(t * 3 + u.ph, 0.4 * Math.sin(t + u.ph), 0.3 * Math.sin(t * 0.9 + i));
            b.scale.setScalar(bugK);
          });
          bugMat.opacity = bugK;
          const inflam = Math.min(1, ulcer * 1.5) * bugK;
          cellsA.forEach((c) => { const d = Math.abs(c.position.x - 0.6); c.material.color.copy(cool).lerp(hot, inflam * clamp(1.4 - d / 2.2, 0, 1)); c.visible = !(ulcer > 0.25 && d < ulcer * 0.9 && c.position.z > -0.2); });
          crater.visible = ulcer > 0.15; crater.scale.set(0.2 + 0.8 * ulcer, 0.15 + 0.7 * ulcer, 1);
          for (let i = 0; i < NH; i++) {
            let x = -3.1 + rnd(i) * 6.2, y = 2.75 + ((rnd(i + 5) + t * 0.04) % 1) * 1.5, z = -0.9 + rnd(i + 8) * 1.8;
            // No acid right around the germs: their ammonia neutralises it.
            if (bugK > 0.5 && bugs.some((b) => Math.abs(b.position.x - x) < 0.35 && Math.abs(b.position.z - z) < 0.35)) y += 0.5;
            hAcid.place(i, [x, y, z]);
          }
          hAcid.done();
          hLabs.forEach((l) => { l.visible = s.labels && !narrow; }); hLabs[0].visible = hLabs[1].visible = s.labels && s.bugs && !narrow;
          ulcerL.visible = s.labels && ulcer > 0.35 && s.bugs;
          heal.visible = s.labels && !s.bugs; heal.element.innerHTML = '<b>Treated by doctors: the germs are gone and the lining heals</b>';
        }
      },
      readout: (s) => {
        if (s.scene === 'hpylori') return `<div class="big">${s.bugs ? 'H. pylori infection' : 'Infection cleared'}</div>
          <div class="row"><span>People who carry it</span><b>about half the world</b></div>
          <div class="row"><span>How it survives acid</span><b>hides in mucus, makes ammonia</b></div>
          <div class="row"><span>Ulcers it causes</span><b>most stomach ulcers</b></div>
          <div class="row"><span>Lining</span><b class="${s.bugs && ulcer > 0.35 ? 'no' : 'ok'}">${s.bugs ? (ulcer > 0.35 ? 'inflamed, ulcer forming' : 'getting inflamed') : 'healing'}</b></div>
          <small>Discovered by Marshall and Warren (1982, Nobel Prize 2005). Only a doctor can test for it and decide on treatment. Spicy food does not cause ulcers.</small>`;
        if (s.scene === 'vomit') return `<div class="big">The vomiting reflex</div>
          <div class="row"><span>Run by</span><b>the brainstem</b></div>
          <div class="row"><span>Muscles that do the work</span><b>diaphragm and belly</b></div>
          <div class="row"><span>Airway</span><b>closed to protect the lungs</b></div>
          <small>A protective reflex, often after eating something harmful. See a doctor if vomiting won’t stop, if you can’t keep fluids down, or if there is blood in it.</small>`;
        const R = refluxScore(s.les, s.big, s.posture);
        return `<div class="big">${R < 0.05 ? 'No reflux' : R < 0.3 ? 'A little reflux' : 'Lots of reflux: heartburn'}</div>
          <div class="row"><span>Sphincter</span><b>${Math.round(s.les * 100)}% tight</b></div>
          <div class="row"><span>Meal</span><b>${s.big ? 'big and fatty' : 'normal'}</b></div>
          <div class="row"><span>Position</span><b>${POSTURE[s.posture].name}</b></div>
          <small>A teaching model, not a diagnosis. Heartburn that keeps coming back, or trouble swallowing, is worth seeing a doctor about.</small>`;
      },
    };
    return compactReadout(stage, inst);
  },
};

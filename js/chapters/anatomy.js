// Chapter 1: the upper digestive tract. Mouth → pharynx → oesophagus → lower oesophageal
// sphincter → stomach (cardia, fundus, body, antrum, pylorus) → start of the duodenum, with the
// diaphragm, liver, lower ribs, pancreas and heart around it, and a magnified block of the
// stomach wall showing its layers.
// Facts: NIDDK "Your Digestive System & How It Works" (niddk.nih.gov); Britannica "Stomach"
// and "Esophagus" (oesophagus about 25 cm); Gray's Anatomy (42nd ed.): regions, relations,
// three muscle layers (inner oblique, middle circular, outer longitudinal).
// Capacity: an empty stomach holds about 75 mL; about 1 to 1.5 L is comfortable after a meal
// (Guyton & Hall, Textbook of Medical Physiology, 14th ed., ch. 64); Wikipedia "Stomach" cites a
// maximum of about 2 to 4 L in adults.
// Gastric juice: about 1.5 L a day, pH about 1 to 3.5 (Guyton & Hall, table 65-1).
import { THREE } from '../kit.js';
import { makeUpperGI, makeWallBlock, sideLabels, tint, fitNarrow, compactReadout, cutPlane } from '../stomach.js';

export default {
  id: 'anatomy',
  short: 'Inside the stomach',
  title: 'The stomach and the road to it',
  subtitle: 'A muscular bag under your left ribs, fed by a 25 cm tube.',
  view: { pos: [-2.6, 7.4, 19.5], target: [-2.9, 6.3, 0] },
  learn: `<p>Digestion starts in the <b>mouth</b>, where teeth and the tongue turn food into a soft ball (see <a href="/tongueclear/">TongueClear</a>). Then it goes down the <b>oesophagus</b>, a muscular tube about <b>25 cm</b> long that runs behind the windpipe and the heart and passes through the <b>diaphragm</b>, the sheet of muscle you breathe with.</p>
    <p>At the bottom a ring of muscle, the <b>lower oesophageal sphincter</b>, opens to let food into the <b>stomach</b> and closes to keep acid out of the oesophagus. We are looking at the patient from the front, so the patient's <b>left</b> is on <b>your right</b>. The stomach sits in the <b>upper left</b> of the belly, tucked under the left ribs, with the big <b>liver</b> on its right and the <b>pancreas</b> behind it.</p>
    <p>The stomach is shaped like a <b>J</b>. Food enters at the <b>cardia</b>. The dome that bulges up is the <b>fundus</b>, the big middle part is the <b>body</b>, and the narrower lower part is the <b>antrum</b>, the grinding end. It finishes at the <b>pylorus</b>, a strong ring of muscle (the <b>pyloric sphincter</b>) that lets food out into the <b>duodenum</b>, the start of the small intestine. What happens next is in <a href="/intestineclear/">IntestineClear</a>.</p>
    <p>The wall has layers. Inside is the <b>mucosa</b>, folded into ridges called <b>rugae</b> and dotted with millions of tiny <b>gastric pits</b> that make gastric juice. Under it is the <b>submucosa</b>, with blood vessels and nerves. Then come <b>three</b> layers of muscle running in different directions, <b>oblique</b>, <b>circular</b> and <b>longitudinal</b>, so the stomach can squeeze every which way. Most of the gut has only two.</p>
    <p class="tip"><b>Try it:</b> switch on X-ray to cut the stomach open and see the rugae, then take everything apart. Open the wall close-up and pull its layers apart.</p>`,
  terms: [
    { t: 'Oesophagus', d: 'The muscular food pipe, about 25 cm long, from the throat to the stomach. Also spelt esophagus.' },
    { t: 'Sphincter', d: 'A ring of muscle that closes a tube. The stomach has one at each end.' },
    { t: 'Fundus', d: 'The rounded top of the stomach, above where the oesophagus joins. Swallowed air often collects here.' },
    { t: 'Antrum', d: 'The lower, narrower part of the stomach, where the strongest squeezing grinds food.' },
    { t: 'Pylorus', d: 'The exit of the stomach, with a thick ring of muscle that controls how fast food leaves.' },
    { t: 'Rugae', d: 'Folds in the stomach lining that flatten out as the stomach fills.' },
    { t: 'Duodenum', d: 'The first part of the small intestine, about 25 cm long, just after the stomach.' },
  ],
  defaults: { explode: 0, xray: false, wall: false, wallApart: 0.7, labels: true },
  controls: [
    { key: 'explode', type: 'range', label: 'Take it apart', min: 0, max: 1, step: 0.01, ends: ['together', 'apart'], fmt: (v) => Math.round(v * 100) + '%' },
    { key: 'xray', type: 'toggle', label: 'X-ray: cut the stomach open' },
    { key: 'wall', type: 'toggle', label: 'Wall close-up (magnified)' },
    { key: 'wallApart', type: 'range', label: 'Pull the wall layers apart', min: 0, max: 1, step: 0.01, ends: ['together', 'apart'], fmt: (v) => Math.round(v * 100) + '%' },
    { key: 'labels', type: 'toggle', label: 'Labels' },
  ],
  quiz: [
    { q: 'Which side of the body is most of the stomach on?', options: ['The right, under the liver', 'The left, under the ribs', 'Right in the middle, behind the belly button', 'Low down, near the hips'], answer: 1, why: 'The stomach sits in the upper left of the belly, under the left dome of the diaphragm. The liver fills most of the upper right.' },
    { q: 'What is special about the stomach’s muscle?', options: ['It has no muscle', 'It has three layers running in different directions', 'It only has circular muscle', 'It is bone'], answer: 1, why: 'Oblique, circular and longitudinal layers let it squeeze, twist and churn. Most of the gut has just two layers.' },
    { q: 'What does the pyloric sphincter do?', options: ['Lets food into the stomach', 'Controls food leaving the stomach for the duodenum', 'Makes acid', 'Stops you choking'], answer: 1, why: 'It is the ring of muscle at the stomach’s exit. It opens a little at a time so only well-mashed food leaves.' },
  ],
  reel: [
    { ms: 5200, caption: 'Food travels a 25 cm tube, the oesophagus, down into a J-shaped bag under your left ribs.', set: { explode: 0, xray: false, wall: false, labels: false }, view: { pos: [0.5, 6.2, 13.8], target: [0.3, 5.4, 0] }, spin: 0.35 },
    { ms: 5200, caption: 'Cut open, the stomach’s lining is folded into ridges called rugae, wrapped in three layers of muscle.', set: { explode: 0, xray: true, wall: true, wallApart: 0.2, labels: false }, anim: { wallApart: [0.1, 0.9] }, view: { pos: [1.4, 5.3, 14], target: [1.0, 4.3, 0] }, spin: 0 },
  ],

  build({ stage }) {
    stage.renderer.localClippingEnabled = true;
    const root = new THREE.Group(); root.position.set(0, 2.7, 0); stage.root.add(root);
    const gi = makeUpperGI(stage); root.add(gi.root);
    const plane = cutPlane(0.05);
    const wall = makeWallBlock(stage); wall.group.position.set(3.1, -2.6, 0.4); wall.group.rotation.y = -0.2; root.add(wall.group);
    const wallT = tint(stage.label('Stomach wall, magnified (really 3 to 5 mm thick)', [0.1, -0.4, 0.75], wall.group), 'side');
    const sides = sideLabels(stage, root, -3.3, 2.6, 0.8);
    const front = tint(stage.label('You are facing the patient', [0, -3.8, 0.8], root), 'side');
    let xr = 0, wallWas = false;
    const WALLVIEW = { pos: [1.4, 5.3, 14], target: [1.0, 4.3, 0] };
    const fit = fitNarrow(stage, { pos: [0.3, 7.6, 24], target: [0.3, 7.2, 0] });
    return compactReadout(stage, {
      home: { pos: [-2.6, 7.4, 19.5], target: [-2.9, 6.3, 0] },
      update(dt, s) {
        dt = Math.max(0, dt);
        xr += ((s.xray ? 1 : 0) - xr) * Math.min(1, dt * 6);
        gi.setXray(xr, plane);
        gi.setExplode(s.explode);
        wall.group.visible = s.wall; wall.explode(s.wallApart);
        if (s.wall !== wallWas) { wallWas = s.wall; if (!document.body.classList.contains('gb-reel')) { const v = s.wall ? WALLVIEW : this.home; stage.setView(v.pos, v.target, 0.9); } }
        const narrow = fit();
        gi.showLabels(s.labels, narrow);
        if (s.wall) gi.labels.forEach((l) => { if (!l.userData.stomach || /Body|Cardia/.test(l.element.textContent)) l.visible = false; });
        const wl = s.labels && s.wall && !narrow;
        wall.labs.forEach((l) => { l.visible = wl; }); wall.inside.visible = wallT.visible = wl; wall.outside.visible = false;
        [...sides, front].forEach((l) => { l.visible = s.labels && !s.wall && !narrow; });
      },
      readout: (s) => `<div class="big">A 25 cm tube and a J-shaped bag</div>
        <div class="row"><span>Oesophagus</span><b>about 25 cm long</b></div>
        <div class="row"><span>Stomach: empty, after a meal</span><b>about 75 mL, 1 to 1.5 L</b></div>
        <div class="row"><span>Gastric juice made a day</span><b>about 1.5 L</b></div>
        <div class="row"><span>Acidity (pH) inside</span><b>about 1.5 to 3.5</b></div>
        <small>${s.xray ? 'Cut open from the front: the folds are the rugae. They flatten as the stomach fills.' : 'Front view: the patient’s right is on your left.'}</small>`,
    });
  },
};

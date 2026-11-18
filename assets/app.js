/* DexMimicAnything project page. Static, no dependencies. All numbers come from the paper (main_ral.tex). */
'use strict';
DMAMedia.navigate(location.hash.slice(1));
const $ = (s, r = document) => r.querySelector(s);
const NS = 'http://www.w3.org/2000/svg';
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

const pendingPosters = new Map();
const posterObserver = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    const video = entry.target;
    video.poster = pendingPosters.get(video);
    pendingPosters.delete(video);
    posterObserver.unobserve(video);
  }
}, {rootMargin: '240px'});
function queuePoster(video, url) {
  pendingPosters.set(video, url);
  posterObserver.observe(video);
}
document.querySelectorAll('[data-deferred-poster]').forEach(v => queuePoster(v, v.dataset.deferredPoster));
function h(tag, attrs = {}, ...kids) {
  const svg = ['svg', 'g', 'rect', 'circle', 'line', 'path', 'text', 'polygon', 'polyline', 'tspan'].includes(tag);
  const el = svg ? document.createElementNS(NS, tag) : document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k.startsWith('aria-')) { el.setAttribute(k, String(v)); continue; }
    if (v == null || v === false) continue;
    if (k === 'poster' && tag === 'video') queuePoster(el,v);
    else if (k === 'src' && tag === 'video') DMAMedia.set(el,v);
    else if (k === 'class') el.setAttribute('class', v);
    else if (k === 'text') el.textContent = v;
    else if (k === 'css') for (const [p, val] of Object.entries(v)) el.style.setProperty(p, val);
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()) if (kid != null) el.append(kid);
  return el;
}

/* ───────── data ───────── */
// Hero reel: the six motion-tracking takes in full, from pick to place.
// [clip, label, horizontal focus: where the hand and tool sit in the frame on average (0–1), chip label]
// The picture stops above a bottom strip that holds the reel controls, so they never cover the hand or the tool.
const REEL = [
  ['hammer_drive_nail', 'Hammer: drive nail', .54, 'Drive nail'], ['hammer_pull_nail', 'Hammer: pull nail', .54, 'Pull nail'], ['screwdriver_tighten', 'Screwdriver: tighten', .60, 'Screwdriver'],
  ['lightbulb_install', 'Light bulb: install', .60, 'Light bulb'], ['spray_bottle_water', 'Spray bottle: water', .56, 'Spray bottle'], ['t_wrench_tighten', 'T-handle wrench: tighten', .60, 'T-handle wrench'],
];
const WHY = [
  { name: 'Hammer', a: 'media/tele/direct_hammer', aAt: 5.2, aTag: 'Hammer dropped', b: 'media/tele/hammer', bAt: 9, bTag: 'Nail driven' },
  { name: 'Light bulb', a: 'media/tele/direct_bulb', aAt: 6.2, aTag: 'Bulb dropped', b: 'media/tele/lightbulb_large', bAt: 20, bTag: 'Bulb screwed in and lit' },
];
const PRIMS = [
  { f: 'rotation_cylindrical_rod', name: 'Rotation', sub: 'Cylindrical rod' },
  { f: 'rotation_rectangular_rod', name: 'Rotation', sub: 'Rectangular rod' },
  { f: 'translation_cylindrical_rod', name: 'In-palm rotation', sub: 'Cylinder' },
  { f: 'translation_rectangular_rod', name: 'Translation', sub: 'Rectangular rod' },
  { f: 'reorientation_cuboid', name: 'Reorientation', sub: 'Pentagonal prism' },
  { f: 'face_turn_cube', name: 'Reorientation', sub: 'Rectangular block' },
];
const S = (...a) => a; // [label, start seconds]
const TRACK = [
  { id: 'drive', f: 'hammer_drive_nail', name: 'Hammer', sub: 'Drive a nail', stages: [S('Grasp', 0), S('Reorient', 2.6), S('Strike', 6.6), S('Place', 12.8)] },
  { id: 'pull', f: 'hammer_pull_nail', name: 'Hammer', sub: 'Pull a nail', stages: [S('Grasp', 0), S('Reorient', 3), S('Translate', 8.3), S('Rotate', 10.9), S('Pull', 14.8), S('Place', 20.5)] },
  { id: 'screw', f: 'screwdriver_tighten', name: 'Screwdriver', sub: 'Tighten a screw', stages: [S('Grasp', 0), S('In-hand rotation', 2.1), S('Tighten', 5.2), S('Place', 30.5)] },
  { id: 'bulb', f: 'lightbulb_install', name: 'Light bulb', sub: 'Install', stages: [S('Grasp', 0), S('In-hand rotation', 4.2), S('Screw in', 8.2), S('Unscrew', 28.7), S('Place', 44.2)] },
  { id: 'spray', f: 'spray_bottle_water', name: 'Spray bottle', sub: 'Water a plant', stages: [S('Grasp', 0), S('Translate', 3.7), S('Rotate', 8.2), S('Press trigger', 12.7), S('Place', 32.2)] },
  { id: 'wrench', f: 't_wrench_tighten', name: 'T-handle wrench', sub: 'Tighten a bolt', stages: [S('Grasp', 0), S('Adjust', 3.5), S('Turn', 10.2), S('Place', 28.5)] },
];
const TELE = [
  { id: 'drive', f: 'hammer', name: 'Hammer', sub: 'Drive a nail', stages: [S('Grasp', 0), S('Reorient', 3.2), S('Strike', 5.5), S('Place', 19)] },
  { id: 'screw', f: 'screwdriver', name: 'Screwdriver', sub: 'Tighten a screw', stages: [S('Grasp', 0), S('In-hand rotation', 2.8), S('Tighten', 6), S('Place', 32)] },
  { id: 'bulb', f: 'lightbulb_large', name: 'Light bulb', sub: 'Install, large bulb', stages: [S('Grasp', 0), S('In-hand rotation', 3), S('Screw in', 6), S('Unscrew', 24.5), S('Place', 39.5)] },
  { id: 'bulb', f: 'lightbulb_small', name: 'Light bulb', sub: 'Install, small bulb', stages: [S('Grasp', 0), S('In-hand rotation', 3.5), S('Screw in', 6.5), S('Unscrew', 22), S('Place', 32.5)] },
  { id: 'spray', f: 'spray_bottle', name: 'Spray bottle', sub: 'Water a plant', stages: [S('Grasp', 0), S('Translate', 3), S('Rotate', 8.5), S('Press trigger', 14.5), S('Place', 24.5)] },
  { id: 'wrench', f: 't_wrench', name: 'T-handle wrench', sub: 'Tighten a bolt', stages: [S('Grasp', 0), S('Adjust', 3.2), S('Turn', 7.5), S('Place', 35)] },
];
const MULTI = [
  { f: 'screwdriver_bulb', title: 'Screwdriver, then light bulb', segs: [S('Screwdriver: tighten', 0), S('Light bulb: install', 46)] },
  { f: 'twrench_hammer', title: 'T-handle wrench, then hammer', segs: [S('T-handle wrench: tighten', 0), S('Hammer: drive nail', 28)] },
];
const SIM = [
  [0, "Cylinder", "Rotation", "Ø50 × 90 mm"],
  [1, "Light bulb", "Rotation", "Ø55 × 99 mm"],
  [0, "Square block", "Combination", "42 × 42 × 70 mm"],
  [1, "Light bulb", "Rotation", "Ø66 × 128 mm"],
  [0, "Pentagonal prism", "Rotation", "57 × 54 × 42 mm"],
  [1, "Light bulb", "Rotation", "Ø48 × 138 mm"],
  [0, "Cube", "Rotation", "54 mm"],
  [1, "Light bulb", "Rotation", "Ø50 × 90 mm"],
  [0, "Cylinder", "Rotation", "Ø60 × 42 mm"],
  [1, "Spray bottle", "Translation", ""],
  [0, "Square block", "Rotation", "54 × 54 × 70 mm"],
  [1, "Hammer", "Combination", "Small"],
  [0, "Cube", "Rotation", "42 mm"],
  [1, "Screwdriver", "Combination", ""],
  [0, "Cylinder", "Combination", "Ø60 × 70 mm"],
  [1, "Hammer", "Combination", "Large"],
  [0, "Frustum", "Rotation", ""],
  [1, "T-handle wrench", "Rotation", ""],
  [0, "Cylinder", "Combination", "Ø50 × 42 mm"],
  [1, "Light bulb", "Combination", "Ø66 × 128 mm"],
  [0, "Triangular prism", "Rotation", "52 × 45 × 42 mm"],
  [1, "Light bulb", "Rotation", "Ø48 × 138 mm"],
  [0, "Pentagonal prism", "Combination", "47 × 45 × 200 mm"],
  [1, "Light bulb", "Rotation", "Ø48 × 138 mm"],
  [0, "Cylindrical bar", "Combination", "Ø40 × 200 mm"],
  [0, "Cylinder", "Combination", "Ø45 × 70 mm"],
  [0, "Cylindrical bar", "Combination", "Ø45 × 200 mm"],
  [1, "Light bulb", "Rotation", "Ø55 × 99 mm"],
  [0, "Rectangular bar", "Combination", "20 × 35 × 200 mm"],
  [0, "Elliptical bar", "Combination", "50 × 12 × 200 mm"],
  [0, "Cylindrical bar", "Combination", "Ø35 × 200 mm"],
  [1, "Light bulb", "Combination", "Ø66 × 128 mm"],
  [0, "Elliptical frustum", "Combination", ""],
  [0, "Pentagonal prism", "Combination", "20 × 50 × 200 mm"],
  [0, "Rectangular bar", "Combination", "30 × 45 × 200 mm"],
  [0, "Rectangular bar", "Combination", "49 × 12 × 200 mm"],
  [0, "Cylindrical bar", "Translation", "Ø40 × 250 mm"],
  [0, "Sphere", "Rotation", "Ø70 mm"],
  [0, "Elliptical bar", "Translation", "50 × 30 × 200 mm"],
  [0, "Cylindrical bar", "Combination", "Ø30 × 200 mm"],
  [0, "Pentagonal prism", "Combination", "57 × 54 × 70 mm"],
  [0, "Cylinder", "Combination", "Ø50 × 70 mm"],
  [0, "Sphere", "Rotation", "Ø60 mm"],
  [0, "Cylindrical bar", "Translation", "Ø30 × 250 mm"],
  [0, "Rectangular bar", "Translation", "28 × 28 × 250 mm"],
  [0, "Rectangular bar", "Translation", "21 × 21 × 250 mm"],
  [0, "Triangular prism", "Combination", "43 × 37 × 200 mm"],
  [0, "Rectangular bar", "Translation", "35 × 35 × 200 mm"],
];
const SKILLS = [
  ['fingertip_rotation', 'Fingertip rotation'], ['in_palm_rotation', 'In-palm rotation'], ['pivoting', 'Pivoting'], ['rod_rotation', 'Rod rotation'], ['translation', 'Translation'],
];
const SIMRES = [ // [SR seen, sd, SR unseen, sd, Epos seen, unseen, Erot seen, unseen]
  ['Retarget replay', 'Open-loop joint playback', 0, null, 0, null, 20.44, 17.23, 14.81, 14.69],
  ['SPIDER', 'Per-reference trajectory optimization', 9.7, .5, .5, .5, 21.97, 18.31, 6.38, 5.94],
  ['DexTrack', 'Generalist tracker, retrained on DexEmpla', 10.3, .6, 0, 0, 15.17, 14.65, 18.81, 15.81],
  ['SimToolReal', 'Object-centric, no hand reference', 32.6, 1.3, 9.5, 1.4, 20.70, 20.85, 24.66, 23.34],
  ['ConTrack specialist', 'One policy trained per test reference', 51.2, .7, 35.3, 1.3, 17.47, 16.17, 10.59, 9.85],
  ['DMA', 'One policy for all references', 80.4, .9, 69.7, 2.1, 9.14, 9.02, 8.30, 8.41],
];
const REAL = [ // [task, id, track SR, track TP, tele SR, tele TP]
  ['Hammer: drive nail', 'drive', 86.7, 93.3, 93.3, 98.3], ['Hammer: pull nail', 'pull', 66.7, 82.2, 73.3, 85.6],
  ['Screwdriver: tighten', 'screw', 86.7, 90.0, 93.3, 96.7], ['Light bulb: install', 'bulb', 73.3, 84.0, 73.3, 86.7],
  ['Spray bottle: water', 'spray', 60.0, 80.0, 80.0, 90.7], ['T-handle wrench: tighten', 'wrench', 53.3, 71.7, 66.7, 83.3],
  ['Mean', null, 71.1, 83.5, 80.0, 90.2],
];
const ABL = {
  rep: { name: 'Object representation',
    rows: [['Axis keypoints', 'Six keypoints on the object axes', 72.7, 1.3, 52.6, 3.9], ['Global64', '64 paired points over the whole mesh', 77.7, 1.0, 41.4, .8], ['Pose + BPS', 'Pose, size, basis point set', 74.2, 1.8, 26.9, .8], ['Pose + vectors', 'Hand-to-surface vectors and normals', 78.6, .9, 59.2, 6.4], ['Hand-guided local points', 'Ours', 80.4, .9, 69.7, 2.1]] },
  samp: { name: 'Reset sampling',
    rows: [['Uniform RSI', 'Every segment equally likely', 75.7, .2, 61.1, 6.6], ['Return-based', 'Low-return segments first', 78.3, .9, 65.1, 2.5], ['Return-based + exclusion', 'Ours', 80.4, .9, 69.7, 2.1]] },
  gate: { name: 'Reward gate',
    rows: [['Contact only', 'Object reward whenever two fingers touch', 74.2, .6, 60.6, 7.8], ['Always on', 'Object reward at every frame', 78.6, 1.5, 66.8, 6.0], ['Support label × contact', 'Ours', 80.4, .9, 69.7, 2.1]] },
  size: { name: 'Dataset size',
    pts: [[1, 18.3, 1.5, 11.4, 1.7], [2.5, 22.7, 2.6, 17.6, 1.4], [5, 32.0, 1.9, 20.2, 4.4], [10, 53.6, 2.4, 34.3, 2.9], [20, 65.1, 1.6, 51.2, 7.5], [40.1, 80.4, .9, 69.7, 2.1]] },
};

/* ───────── shared behaviour ───────── */
const fmtT = t => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
const ICON = { play: 'M8 5.5v13l11-6.5z', pause: 'M7 5h4v14H7zM13 5h4v14h-4z', full: 'M4 9V4h5v2H6v3zm11-5h5v5h-2V6h-3zM4 15h2v3h3v2H4zm14 0h2v5h-5v-2h3z' };
const icon = d => h('svg', { viewBox: '0 0 24 24', 'aria-hidden': 'true' }, h('path', { d }));

// Videos marked data-auto play only while on screen; a manual pause is respected until the clip changes.
const autoIO = new IntersectionObserver(es => es.forEach(e => {
  const v = e.target; v._vis = e.isIntersecting;
  if (v._vis && !v._userPaused && !reduced) DMAMedia.play(v).catch(() => {}); else v.pause();
}), { threshold: .35 });
const auto = v => { v.dataset.auto = ''; autoIO.observe(v); return v; };
document.addEventListener('visibilitychange', () => document.querySelectorAll('video').forEach(v => {
  if (document.hidden) v.pause(); else if (v._vis && !v._userPaused && !reduced) DMAMedia.play(v).catch(() => {});
}));

function player({ tag } = {}) {
  const video = auto(h('video', { muted: true, loop: true, playsinline: true, preload: 'none' }));
  video.muted = true;
  const fill = h('b'), time = h('span', { class: 'pl-time' });
  const btn = h('button', { class: 'pl-btn', type: 'button', 'aria-label': 'Pause' }, icon(ICON.pause));
  const track = h('div', { class: 'pl-track' }, h('i', {}, fill));
  const full = h('button', { class: 'pl-btn', type: 'button', 'aria-label': 'Full screen' }, icon(ICON.full));
  const tagEl = tag ? h('span', { class: 'vtag', text: tag }) : null;
  const el = h('div', { class: 'vframe' }, video, tagEl, h('div', { class: 'pl-bar' }, btn, track, time, full));
  const sync = () => {
    const p = video.paused; el.classList.toggle('paused', p);
    btn.replaceChildren(icon(p ? ICON.play : ICON.pause)); btn.setAttribute('aria-label', p ? 'Play' : 'Pause');
  };
  const toggle = () => { if (video.paused) { video._userPaused = false; DMAMedia.play(video).catch(() => {}); } else { video._userPaused = true; video.pause(); } };
  btn.onclick = toggle; video.onclick = toggle;
  video.addEventListener('play', sync); video.addEventListener('pause', sync);
  const listeners = [];
  video.addEventListener('timeupdate', () => {
    const d = video.duration || 1; fill.style.width = `${100 * video.currentTime / d}%`;
    time.textContent = `${fmtT(video.currentTime)} / ${fmtT(d)}`;
    listeners.forEach(f => f(video.currentTime, d));
  });
  track.onclick = e => { const r = track.getBoundingClientRect(); video.currentTime = (video.duration || 0) * Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)); };
  full.onclick = () => (document.fullscreenElement ? document.exitFullscreen() : el.requestFullscreen?.());
  return {
    el, video, onTime: f => listeners.push(f),
    setTag: t => { if (tagEl) tagEl.textContent = t; },
    load(src, poster) {
      video._userPaused = false; queuePoster(video, poster); DMAMedia.set(video, src);
      el.classList.remove('swap'); void el.offsetWidth; el.classList.add('swap');
      if (video._vis && !reduced) DMAMedia.play(video).catch(() => {});
    },
    seek(t) { DMAMedia.seek(video, t); video._userPaused = false; DMAMedia.play(video).catch(() => {}); },
  };
}

function seg(host, items, onPick, { small, label } = {}) {
  host.classList.add('seg'); if (small) host.classList.add('small');
  host.setAttribute('role', 'tablist'); if (label) host.setAttribute('aria-label', label);
  const btns = items.map((it, i) => h('button', { type: 'button', role: 'tab', text: it, 'aria-selected': i === 0, onclick: () => pick(i) }));
  function pick(i, silent) { btns.forEach((b, j) => b.setAttribute('aria-selected', i === j)); if (!silent) onPick(i); }
  host.replaceChildren(...btns);
  return { pick, btns };
}

// Stage strip: highlights the stage containing the playhead; clicking a stage seeks to its start.
function stageStrip(cls, pl) {
  const el = h('div', { class: cls });
  let stages = [], btns = [];
  pl.onTime((t, d) => btns.forEach((b, i) => {
    const a = stages[i][1], z = i + 1 < stages.length ? stages[i + 1][1] : d;
    b.classList.toggle('on', t >= a && t < z); b.classList.toggle('done', t >= z);
    b.style.setProperty('--p', Math.min(1, Math.max(0, (t - a) / (z - a))));
  }));
  return {
    el, set(list, total) {
      stages = list || [];
      btns = stages.map(([name, start], i) => {
        const b = h('button', { type: 'button', onclick: () => pl.seek(start + .05) }, cls === 'stages' ? h('i', { text: i + 1 }) : null, name);
        if (total) { const z = i + 1 < stages.length ? stages[i + 1][1] : total; b.style.flex = `${z - start} 1 0`; }
        return b;
      });
      el.replaceChildren(...btns); el.hidden = !stages.length;
    },
  };
}

/* ───────── hero: large demo reel ───────── */
(function hero() {
  const hero = $('#top'), stage = $('#hero-stage'), vid = $('#hero-video'), name = $('#reel-name'), chipsHost = $('#reel-chips'), pause = $('#hero-pause');
  let cur = -1, userPaused = reduced, visible = !location.hash || location.hash === '#top';
  vid.muted = true;
  const chips = REEL.map(([, label, , short], i) => h('button', { type: 'button', role: 'tab', title: label, text: short, onclick: () => show(i) }));
  chipsHost.append(...chips);
  const play = () => { if (visible && !userPaused) DMAMedia.play(vid).catch(() => {}); };
  // Frame the clip so the hand and tool sit at the centre of the free area left of the title, not the page centre.
  const copy = $('.hero-copy'), stacked = matchMedia('(max-width:900px),(max-aspect-ratio:1/1)');
  function frame() {
    const st = stage.style;
    if (stacked.matches || cur < 0) { ['--vx', '--vy', '--vw', '--vh'].forEach(p => st.removeProperty(p)); hero.style.removeProperty('--free'); return; }
    const H = hero.clientHeight - 104, free = copy.getBoundingClientRect().left - hero.getBoundingClientRect().left, fx = REEL[cur][2], fy = .5;
    // Never enlarge the frame beyond what is needed to reach the left edge, so the hand and tool are not cropped.
    // The video fades out on its own right side, so its edge is never a hard line wherever it falls.
    const w0 = H * 16 / 9, scale = Math.max(1, (free / 2) / (fx * w0)), w = w0 * scale, hh = H * scale;
    st.setProperty('--vw', `${w}px`); st.setProperty('--vh', `${hh}px`);
    st.setProperty('--vx', `${Math.min(0, free / 2 - fx * w)}px`); st.setProperty('--vy', `${fy * H * (1 - scale)}px`);
    hero.style.setProperty('--free', `${free}px`);
  }
  new ResizeObserver(frame).observe(hero); stacked.addEventListener('change', frame);
  function show(i) {
    cur = (i + REEL.length) % REEL.length; const [f, label] = REEL[cur];
    chips.forEach((c, j) => { c.setAttribute('aria-selected', j === cur); c.classList.toggle('done', j < cur); c.style.setProperty('--p', 0); });
    name.textContent = label;
    if (vid.dataset.clipPath === `media/reel/${f}.mp4`) { frame(); play(); return; }
    vid.poster = `media/reel/${f}.webp`;
    DMAMedia.set(vid, `media/reel/${f}.mp4`);
    frame(); play();

  }
  vid.addEventListener('timeupdate', () => chips[cur]?.style.setProperty('--p', vid.currentTime / (vid.duration || 1)));
  vid.addEventListener('ended', () => show(cur + 1));
  const syncPause = () => { pause.querySelector('span').textContent = userPaused ? 'Play' : 'Pause'; pause.querySelector('path').setAttribute('d', userPaused ? ICON.play : ICON.pause); };
  pause.onclick = () => { userPaused = !userPaused; syncPause(); userPaused ? vid.pause() : play(); };
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? play() : vid.pause(); }, { threshold: .1 }).observe(hero);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) play(); });
  syncPause(); show(0);
})();

/* ───────── why: direct teleoperation vs DMA ───────── */
(function why() {
  const a = $('#why-a'), b = $('#why-b'), ta = $('#why-a-tag'), tb = $('#why-b-tag');
  let cur = WHY[0];
  [a, b].forEach(v => { v.muted = true; auto(v); });
  // The failed attempt holds on its last frame until the DMA clip finishes, then both restart together.
  a.addEventListener('timeupdate', () => ta.classList.toggle('show', a.currentTime >= cur.aAt));
  b.addEventListener('timeupdate', () => tb.classList.toggle('show', b.currentTime >= cur.bAt));
  b.addEventListener('ended', () => { a.currentTime = 0; b.currentTime = 0; if (b._vis) { DMAMedia.play(a).catch(() => {}); DMAMedia.play(b).catch(() => {}); } });
  function load(i) {
    cur = WHY[i]; ta.textContent = cur.aTag; tb.textContent = cur.bTag; ta.classList.remove('show'); tb.classList.remove('show');
    queuePoster(a,cur.a+'.jpg'); DMAMedia.set(a, cur.a + '.mp4'); queuePoster(b,cur.b+'.jpg'); DMAMedia.set(b, cur.b + '.mp4?v=900p1');
    if (a._vis && !reduced) { DMAMedia.play(a).catch(() => {}); DMAMedia.play(b).catch(() => {}); }
  }
  seg($('#why-tabs'), WHY.map(w => w.name), load, { label: 'Tool' });
  load(0);
})();

/* ───────── level 1 and 2 decks ───────── */
function deck(host, { modes, onReady }) {
  const pl = player({ tag: modes[0].tag });
  const strip = stageStrip('stages', pl);
  const rail = h('div', { class: 'rail', role: 'tablist', 'aria-orientation': 'vertical' });
  const modeHost = h('div');
  const aside = h('aside', { class: 'deck-aside' }, modes.length > 1 ? modeHost : null, rail);
  const main = h('div', { class: 'deck-main' }, pl.el, strip.el);
  host.append(main, aside);
  let mode = 0;
  function show(i) {
    const m = modes[mode], it = m.items[i];
    const tabs = rail.querySelectorAll('[role=tab]');
    tabs.forEach((b, j) => b.setAttribute('aria-selected', i === j));
    pl.setTag(it.tag || m.tag); pl.load(`${m.dir}/${it.f}.mp4${m.dir === 'media/prim' ? '' : '?v=900p1'}`, `${m.dir}/${it.f}.jpg`);
    strip.set(it.stages);
  }
  function setMode(k, keepId) {
    mode = k; const m = modes[k];
    rail.replaceChildren(...m.items.map((it, i) => h('button', { type: 'button', role: 'tab', onclick: () => show(i) },
      h('i', { text: String(i + 1).padStart(2, '0') }), h('img', { src: `${m.dir}/${it.f}.t.jpg`, alt: '', loading: 'lazy' }), h('span', {}, h('b', { text: it.name }), h('small', { text: it.sub })))));
    const idx = keepId ? m.items.findIndex(it => it.id === keepId) : 0;
    show(Math.max(0, idx));
  }
  const modeSeg = modes.length > 1 ? seg(modeHost, modes.map(m => m.label), k => setMode(k), { small: true, label: 'Reference source' }) : null;
  setMode(0);
  onReady?.({ open(k, id) { modeSeg?.pick(k, true); setMode(k, id); } });
}
deck($('#deck-prim'), { modes: [{ tag: 'Motion tracking · 1.0×', dir: 'media/prim', items: PRIMS }] });
let toolsDeck;
deck($('#deck-tools'), {
  modes: [
    { label: 'Motion tracking', tag: 'Motion tracking · 1.0×', dir: 'media/real', items: TRACK },
    { label: 'Teleoperation', tag: 'Teleoperation · 1.0×', dir: 'media/tele', items: TELE },
  ], onReady: api => {
    toolsDeck = api;
    const task = new URLSearchParams(location.search).get('task');
    if (task && TRACK.some(item => item.id === task)) api.open(0, task);
  },
});

/* ───────── level 3: two equal long runs ───────── */
$('#duo').append(...MULTI.map(m => {
  const pl = player({ tag: 'Teleoperation · 1.0×' }), tl = stageStrip('tline', pl);
  pl.load(`media/multi/${m.f}.mp4`, `media/multi/${m.f}.jpg`);
  pl.video.addEventListener('loadedmetadata', () => tl.set(m.segs, pl.video.duration), { once: true });
  tl.set(m.segs, 60);
  return h('div', { class: 'duo-item' }, pl.el, h('h3', { text: m.title }), tl.el);
}));

// Data columns use 0 for training objects and 1 for unseen objects.
const objectSplitOrder = [1, 0];

/* Simulation references in the same row-major order as the overview film. */
(function simulation() {
  const media = file => 'media/sim/references/' + file + (file.endsWith('.mp4') ? '?v=reel3' : '?v=soft1');
  const root = $('#sim-root');
  const files = SIM.map((_, i) => String(i + 1).padStart(2, '0'));
  const label = i => [files[i], SIM[i][1], SIM[i][3], SIM[i][2]].filter(Boolean).join(' · ');
  const overview = h('video', { muted: true, playsinline: true, loop: true, preload: 'none',
    poster: media('overview.jpg'), src: media('overview.mp4') });
  overview.muted = true;
  const grid = h('div', { class: 'sim-cells' });
  const stage = h('div', { class: 'sim-stage' }, overview, grid);
  const tabs = h('div'), rail = h('div', { class: 'rail', 'aria-label': 'Objects' });
  const aside = h('aside', { class: 'deck-aside' }, tabs, rail);
  const back = h('button', { type: 'button', text: '← All references', hidden: true, onclick: reset });
  const name = h('span', { text: '48 references' });
  const play = h('button', { type: 'button', class: 'sim-play' });
  const seek = h('input', { type: 'range', min: 0, max: 10, step: .01, value: 0, 'aria-label': 'Playback position' });
  const controls = h('div', { class: 'sim-controls' }, play, seek, name, back);
  root.append(h('div', { class: 'deck simdeck' }, h('div', { class: 'deck-main' }, stage, controls), aside));

  const objectName = i => SIM[i][1];
  const groupNames = ['Training objects', 'Unseen tools'];
  const layers = new Map();
  let group = objectSplitOrder[0], shown = -1, pinned = -1, timer, visible = false, paused = reduced;
  const activeVideo = () => {
    const layer = layers.get(shown);
    return layer && !layer.video.error ? layer.video : overview;
  };
  function playback() {
    const active = activeVideo();
    for (const v of [overview, ...Array.from(layers.values(), layer => layer.video)]) {
      if ((v === active || (v === overview && layers.get(shown)?.previewing)) && visible && !paused && !document.hidden) DMAMedia.play(v).catch(() => {});
      else v.pause();
    }
    cancelAnimationFrame(previewFrame);
    paintPreview();
    updatePlay();
  }
  function track(v) {
    v.ontimeupdate = () => { if (v === activeVideo()) seek.value = v.currentTime; };
  }
  track(overview);
  let cached = -1;
  let previewFrame;
  function paintPreview() {
    previewFrame = 0;
    const layer = layers.get(shown);
    if (!layer?.previewing) return;
    layer.paint();
    if (visible && !paused && !document.hidden) previewFrame = requestAnimationFrame(paintPreview);
  }
  function updatePlay() {
    play.replaceChildren(icon(paused ? ICON.play : ICON.pause));
    play.setAttribute('aria-label', paused ? 'Play' : 'Pause');
  }
  play.onclick = () => { paused = !paused; playback(); };
  seek.oninput = () => {
    const v = activeVideo();
    v.currentTime = Number(seek.value);
  };
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (!visible && cached >= 0) discard(cached); playback(); }, { threshold: .1 }).observe(stage);
  document.addEventListener('visibilitychange', playback);

  // Enlarge the playing grid cell until its standalone clip presents a decoded frame.
  function makeLayer(i, phase) {
    const col = i % 8, row = Math.floor(i / 8);
    const video = h('video', { muted: true, playsinline: true, loop: true, preload: 'auto', poster: overview.readyState >= 2 ? null : media(files[i] + '.jpg') });
    video.muted = true;
    const snapshot = h('canvas', { width: 240, height: 135 });
    const ctx = snapshot.getContext('2d');
    let lastTime = -1;
    snapshot.hidden = true;
    function paint() {
      if (!ctx || overview.readyState < 2 || overview.currentTime === lastTime) return;
      lastTime = overview.currentTime;
      const w = overview.videoWidth / 8, h = overview.videoHeight / 6, crop = w * 9 / 16;
      ctx.drawImage(overview, col * w, row * h + (h - crop) / 2, w, crop, 0, 0, 240, 135);
      snapshot.hidden = false;
    }
    const el = h('div', { class: 'sim-detail', 'aria-hidden': 'true', css: {
      '--tx': (col * 12.5) + '%', '--ty': ((row + .125) * 100 / 6) + '%'
    } }, video, snapshot);
    const layer = { el, video, paint, previewing: true, cleanup: null };
    track(video);
    // Match the overview when that frame is already available. A cold clip starts
    // sequentially, so the decoder can show a frame before another range request.
    video.onloadedmetadata = () => {
      if (paused || (video.buffered.length && video.buffered.start(0) <= phase && phase < video.buffered.end(0))) {
        video.currentTime = phase;
      }
    };
    const reveal = () => {
      layer.previewing = false;
      snapshot.classList.add('decoded');
      if (shown === i) playback();
    };
    if (video.requestVideoFrameCallback) video.requestVideoFrameCallback(reveal);
    else video.onloadeddata = reveal;
    video.onerror = () => {
      layer.previewing = true;
      snapshot.classList.remove('decoded');
      if (shown === i) playback();
    };
    layers.set(i, layer); stage.append(el);
    DMAMedia.set(video, media(files[i] + '.mp4'));
    el.getBoundingClientRect(); // Commit the cell geometry before the expansion.
    return layer;
  }
  function discard(i) {
    const layer = layers.get(i);
    if (!layer) return;
    if (cached === i) cached = -1;
    layers.delete(i);
    pendingPosters.delete(layer.video);
    posterObserver.unobserve(layer.video);
    layer.el.remove();
    layer.video.onerror = null;
    DMAMedia.dispose(layer.video);
    layer.video.removeAttribute('src');
    layer.video.load();
  }
  function retire(i) {
    const layer = layers.get(i);
    if (!layer) return;
    layer.el.classList.remove('expanded');
    layer.cleanup = setTimeout(() => {
      if (shown === i) return;
      const v = layer.video;
      const full = v.buffered.length === 1 && v.buffered.start(0) <= .05 && v.buffered.end(0) >= v.duration - .05;
      if (visible && full && !v.error && new URLSearchParams(location.search).get('cache') !== 'off') {
        if (cached >= 0 && cached !== i) discard(cached);
        cached = i;
        layer.el.hidden = true;
      } else discard(i);
    }, reduced ? 0 : 440);
  }
  function mark() {
    for (const row of rail.querySelectorAll('[data-object]')) {
      const matches = shown >= 0 && row.dataset.object === objectName(shown)
        && (!row.hasAttribute('data-variant') || row.dataset.variant === SIM[shown][3]);
      row.classList.toggle('preview', matches);
      row.setAttribute('aria-pressed', matches && pinned >= 0);
    }
    for (const [i,cell] of Array.from(grid.children).entries()) {
      cell.setAttribute('aria-pressed', pinned === i);
    }
    back.hidden = pinned < 0;
    stage.classList.toggle('pinned', pinned >= 0);
  }
  function show(i) {
    if (i !== shown) {
      const previous = activeVideo();
      const phase = previous.readyState >= 2 ? previous.currentTime : overview.currentTime;
      retire(shown); shown = i;
      name.textContent = i < 0 ? '48 references' : label(i);
      if (i >= 0) {
        const layer = layers.get(i) || makeLayer(i, phase);
        clearTimeout(layer.cleanup);
        if (cached === i) {
          cached = -1;
          layer.el.hidden = false;
          if (Math.abs(layer.video.currentTime - phase) > .12) layer.video.currentTime = phase;
          layer.el.getBoundingClientRect();
        }
        layer.el.classList.add('expanded');
      } else if (overview.readyState >= 1 && Math.abs(overview.currentTime - phase) > .12) {
        overview.currentTime = phase;
      }
      stage.classList.toggle('zooming', i >= 0);
      playback();
    }
    mark();
  }
  function reset() { clearTimeout(timer); pinned = -1; show(-1); }
  function toggle(i) {
    clearTimeout(timer);
    if (pinned === i) { reset(); return; }
    pinned = i;
    if (SIM[i][0] !== group) {
      group = SIM[i][0]; groups.pick(objectSplitOrder.indexOf(group), true); buildRail();
    }
    show(i);
  }
  function bind(button, index) {
    button.onpointerenter = e => {
      if (e.pointerType === 'touch' || pinned >= 0) return;
      clearTimeout(timer); timer = setTimeout(() => show(index), 95);
    };
    button.onpointerleave = e => {
      if (e.pointerType === 'touch' || pinned >= 0) return;
      clearTimeout(timer); timer = setTimeout(() => show(-1), 105);
    };
  }
  function buildRail() {
    const families = new Map(), rows = [];
    SIM.forEach(([g, object, , variant], i) => {
      if (g !== group) return;
      if (!families.has(object)) families.set(object, new Map());
      const sizes = families.get(object);
      if (!sizes.has(variant)) sizes.set(variant, i);
    });
    for (const [object, sizes] of families) {
      const i = sizes.values().next().value;
      const row = h('button', { type:'button', 'data-object':object, 'aria-pressed':false,
        onclick:() => toggle(pinned >= 0 && objectName(pinned) === object ? pinned : i) },
        h('img', { src:media(files[i] + '.thumb.jpg'), loading:'lazy', alt:'' }), h('b', { text:object }));
      bind(row, i);
      const family = h('div', { class:'sim-family' }, row);
      if (sizes.size > 1) {
        const options = h('div', { class:'sim-size-list' });
        const panel = h('div', { class:'sim-variants', id:'sim-variants-'+i }, h('div', { class:'sim-clip' }, options));
        panel.inert = true;
        let delay;
        function disclose(open) {
          clearTimeout(delay);
          family.classList.toggle('open', open);
          expand.setAttribute('aria-expanded', String(open));
          panel.inert = !open;
        }
        const expand = h('button', { type:'button', class:'sim-expand', 'aria-expanded':false,
          'aria-controls':panel.id, 'aria-label':object+' variants', onclick:() => disclose(panel.inert)
        }, h('i', { 'aria-hidden':true }));
        family.onpointerenter = e => {
          if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
          clearTimeout(delay); delay = setTimeout(() => disclose(true), 135);
        };
        family.onpointerleave = e => {
          if (e.pointerType === 'touch') return;
          clearTimeout(delay);
          if (!family.querySelector(':focus-visible')) delay = setTimeout(() => disclose(false), 190);
        };
        family.onfocusout = e => {
          if (!family.contains(e.relatedTarget) && !family.matches(':hover')) disclose(false);
        };
        family.onkeydown = e => {
          if (e.key === 'Escape' && !panel.inert) { expand.focus({preventScroll:true}); disclose(false); }
        };
        for (const [variant,j] of sizes) {
          const option = h('button', { type:'button', 'data-object':object, 'data-variant':variant,
            'aria-label':object+' '+variant, 'aria-pressed':false, text:variant, onclick:() => {
              const same = pinned >= 0 && objectName(pinned) === object && SIM[pinned][3] === variant;
              toggle(same ? pinned : j);
            } });
          bind(option,j); options.append(option);
        }
        family.append(expand,panel);
      }
      rows.push(family);
    }
    rail.replaceChildren(...rows); rail.scrollTop = rail.scrollLeft = 0;
  }
  const groups = seg(tabs, objectSplitOrder.map(g => groupNames[g]), index => {
    const g = objectSplitOrder[index];
    if (group !== g) { reset(); group = g; buildRail(); }
  }, { small: true, label: 'Object split' });
  grid.append(...SIM.map((_,i) => {
    const cell = h('button', { type:'button', 'aria-label':label(i), 'aria-pressed':false,
      onclick: e => toggle(pinned >= 0 && e.detail > 0 ? pinned : i) });
    bind(cell, i); return cell;
  }));
  root.addEventListener('keydown', e => { if (e.key === 'Escape') reset(); });
  buildRail(); updatePlay();
})();

/* ───────── dataset ───────── */
(function data() {
  const lab = $('#datalab');
  const img = h('img', { loading:'lazy', alt:'Human demonstration with a data glove' });
  const vid = auto(h('video', { muted:true, loop:true, playsinline:true, preload:'none' })); vid.muted = true;
  const rail = h('div', { class:'rail', role:'tablist', 'aria-label':'In-hand skills' });
  const hand = h('figure', {class:'data-human'}, img, h('figcaption', {text:'Human demonstration'}));
  const robot = h('figure', {class:'data-robot'}, vid, h('figcaption', {text:'Robot-hand reference'}));
  const arrow = h('div', { class:'arrow' }, h('svg', { viewBox:'0 0 48 24', 'aria-hidden':true },
    h('path', { d:'M2 12h40M34 5l8 7-8 7' })), 'Retarget');
  const pair = h('div', { class:'datapair' }, hand, arrow, robot);
  let selected = -1;
  function show(i) {
    if (i === selected) return;
    selected = i;
    const [f,name] = SKILLS[i];
    [...rail.children].forEach((b,j) => {
      b.setAttribute('aria-selected',i === j); b.tabIndex = i === j ? 0 : -1;
    });
    lab.dataset.skill = f;
    img.src = 'media/data/human_'+f+'.svg';
    img.alt = name+' demonstrated with a data glove';
    vid.setAttribute('aria-label', name+' retargeted to the robot hand');
    queuePoster(vid,'media/data/'+f+'.jpg'); DMAMedia.set(vid, 'media/data/'+f+'.mp4');
    if (vid._vis && !vid._userPaused && !reduced) DMAMedia.play(vid).catch(() => {});
    if (!reduced) for (const el of [img,vid]) {
      el.getAnimations().forEach(anim => anim.cancel());
      el.animate([{opacity:.45,transform:'translateY(6px)'},{opacity:1,transform:'none'}],{duration:270,easing:'ease-out'});
    }
    lab.dispatchEvent(new Event('skillchange'));
  }
  SKILLS.forEach(([f,name],i) => {
    const button = h('button', { type:'button', role:'tab', onclick:() => show(i),
      onpointerenter:e => { if (e.pointerType === 'mouse') show(i); },
      onkeydown:e => {
        const step = {ArrowDown:1,ArrowRight:1,ArrowUp:-1,ArrowLeft:-1}[e.key];
        if (!step) return;
        e.preventDefault();const j=(i+step+SKILLS.length)%SKILLS.length;
        show(j);rail.children[j].focus();
      }
    }, h('img',{src:'media/data/human_'+f+'.svg',alt:'',loading:'lazy'}),h('b',{text:name}));
    rail.append(button);
  });
  lab.append(h('aside', { class:'deck-aside', 'data-level':'1' }, rail), pair);
  show(0);

  const stats = $('#datastats');
  const num = (v, dec, label) => h('div', { class: 'stat' }, h('b', { 'data-count': v, 'data-dec': dec, text: '0' }), h('span', { text: label }));
  // DexEmpla statistics, tab:data, Train / Hours. The manuscript reports hours to one decimal.
  const MIX = [['Rotation', 12.1, '#7ea99d'], ['Translation', 3.7, '#d1ab92'], ['Combination', 24.3, '#a8a2bc']];
  const totalHours = MIX.reduce((sum, [, hours]) => sum + hours, 0);
  const heading = h('h3', {text:'Training hours by skill'});
  const card = h('div', {class:'stat mix'});
  const bar = h('div', {class:'mixbar', role:'group', 'aria-label':'Share of training hours by skill'});
  const key = h('div', {class:'mixkey'});
  let pinned = -1;
  function highlight(index) {
    [...bar.children, ...key.children].forEach(el => {
      el.classList.toggle('active', Number(el.dataset.index) === index);
      el.setAttribute('aria-pressed', Number(el.dataset.index) === pinned);
    });
    heading.textContent = index < 0 ? 'Training hours by skill' : bar.children[index].getAttribute('aria-label');
  }
  MIX.forEach(([name, hours, color], i) => {
    const pct = 100 * hours / totalHours;
    const label = name+' · '+hours+' h · '+pct.toFixed(1)+'%';
    const attrs = {type:'button', 'data-index':i, 'aria-label':label, 'aria-pressed':false,
      onpointerenter:e => { if (e.pointerType !== 'touch') highlight(i); },
      onpointerleave:() => highlight(pinned),
      onfocus:() => highlight(i), onblur:() => highlight(pinned),
      onclick:() => { pinned = pinned === i ? -1 : i; highlight(pinned); },
      onkeydown:e => { if (e.key === 'Escape') { pinned = -1; highlight(-1); } }
    };
    bar.append(h('button', {...attrs, tabindex:-1, css:{'--tone':color,'--share':hours}}));
    key.append(h('button', attrs, h('span', {text:name+' '+hours+' h', css:{'--c':color}})));
  });
  card.append(heading,bar,key);
  stats.append(num(34, 0, 'training objects, all geometric primitives'), num(5041, 0, 'training reference trajectories'), num(totalHours, 1, 'hours of demonstrations'), card);
  new IntersectionObserver(([e], io) => {
    if (!e.isIntersecting) return; io.disconnect();
    stats.querySelectorAll('[data-count]').forEach(b => {
      const to = +b.dataset.count, dec = +b.dataset.dec, t0 = performance.now(), fmt = x => x.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
      if (reduced) { b.textContent = fmt(to); return; }
      (function step(t) { const k = Math.min(1, (t - t0) / 1100), e2 = 1 - (1 - k) ** 3; b.textContent = fmt(to * e2); if (k < 1) requestAnimationFrame(step); })(t0);
    });
  }, { threshold: .01 }).observe(stats);
})();

/* Reassemble the paper overview from its native poses, marks and network diagrams. */
(function method() {
  const host = $('#methodfig');
  const asset = (name, alt='', ext='webp') => h('img',{src:'media/method/'+name+'.'+ext,alt,loading:'lazy',decoding:'async'});
  const label = text => h('span',{class:'md-label',text});
  const board = h('div',{class:'md-board'});
  const heading = h('strong'), copy = h('span');
  const details = h('div',{class:'md-details'},heading,copy);
  const pause = h('button',{class:'md-motion',type:'button'});
  const notes = {
    data:['DexEmpla','The glove records 21 hand keypoints, and motion capture tracks the wrist and object. The robot-hand references run at 50 Hz and mark when the hand must support the object.'],
    sampling:['Sampling with exclusion','Low-return one-second segments are sampled more often. Persistently failing segments are excluded as starting points, though a rollout can still pass through them.'],
    reward:['Interaction reward','Hand tracking stays active. Object tracking earns reward when the reference calls for support and at least two simulated fingers touch the object.'],
    points:['Hand-guided local surface points','The current and reference hands each guide the choice of 32 distinct surface points. PointNet encodes their paired current and target positions for the policy.'],
    sim:['Simulator','Parallel rollouts collect transitions under the current policy. Their returns update the distribution over starting segments.'],
    buffer:['Replay buffer','The world model is fitted to simulated transitions. The buffer also supplies initial states for imagined policy rollouts.'],
    world:['World model','Given the state, finger targets and reference wrist motion, the model predicts the next state, contact and tracking failure.'],
    policy:['Policy','Gradients through imagined rollouts update the policy. It outputs residual targets for the 20 finger joints while the wrist follows the reference directly.'],
    frozen:['Frozen policy','The same trained policy runs on the robot without further optimization.'],
    tracking:['Unseen-object tracking','The frozen policy follows held-out hand–object references, including tool motions on objects absent from training.'],
    tele:['Teleoperation','A live operator supplies the reference. The policy produces the robot’s finger commands.']
  };
  const nodes=new Map();
  let pinned=null, active=null;
  function display(id) {
    active=id;
    for(const [key,el] of nodes) {
      el.classList.toggle('md-active',key===id);
      el.setAttribute('aria-pressed',String(key===pinned));
    }
    for(const el of board.querySelectorAll('[data-route]')) el.classList.toggle('md-hot',el.dataset.route.split(' ').includes(id));
    const note=notes[id] || ['Model-based training','Simulated transitions train the world model. The policy improves by differentiating through rollouts in that model, then runs unchanged on the robot.'];
    heading.textContent=note[0];copy.textContent=note[1];
  }
  function module(id,...contents) {
    const el=h('button',{type:'button',class:'md-module md-'+id,'aria-label':notes[id][0],'aria-pressed':false,
      onpointerenter:e=>{if(e.pointerType==='mouse')display(id);},onpointerleave:()=>display(pinned),
      onfocus:()=>display(id),onblur:()=>display(pinned),
      onclick:()=>{pinned=pinned===id?null:id;display(pinned);}
    },...contents,h('span',{class:'md-inline-copy',text:notes[id][1]}));
    nodes.set(id,el);return el;
  }
  const column=(name,cls,...content)=>h('section',{class:'md-column '+cls},h('h3',{text:name}),...content);
  const title=text=>h('strong',{class:'md-title',text});
  // Layers retain the relative positions of the editable artwork in the overview slide.
  const artwork = {
    "rotate-z": [1.56454,[["rotate-z.webp",0.994,1.555,98.012,96.89,""],["rotate-z-marks.svg",0.0,0.0,100.0,100.0,"md-marks"]]],
    "rotate-y": [0.77282,[["rotate-y.webp",1.421,3.627,97.159,95.275,""],["rotate-y-marks.svg",0.0,0.0,100.0,100.0,"md-marks"]]],
    "rotate-x": [1.63722,[["rotate-x.webp",1.012,1.657,97.976,96.686,""],["rotate-x-marks.svg",0.0,0.0,100.0,100.0,"md-marks"]]],
    "spin": [0.94437,[["spin.webp",0.914,0.863,98.173,98.274,""],["spin-marks.svg",0.0,0.0,100.0,100.0,"md-marks"]]],
    "translate": [0.86275,[["translate.webp",0.961,0.829,98.078,98.342,""],["translate-marks.svg",0.0,0.0,100.0,100.0,"md-marks"]]],
    "pick-place": [0.77838,[["pick-place.webp",1.088,0.847,97.824,98.306,""],["pick-place-marks.svg",0.0,0.0,100.0,100.0,"md-marks"]]],
    "sample0": [1.16709,[["start-1.webp",1.613,1.882,96.774,96.235,""],["sample0-marks.svg",0.0,0.0,100.0,100.0,"md-marks"]]],
    "sample1": [1.16709,[["start-2.webp",1.613,1.882,96.774,96.235,""],["sample1-marks.svg",0.0,0.0,100.0,100.0,"md-marks"]]],
    "sample2": [1.16709,[["failure.webp",1.613,1.882,96.774,96.235,""],["sample2-marks.svg",0.0,0.0,100.0,100.0,"md-marks"]]],
    "sample3": [1.16709,[["start-4.webp",1.613,1.882,96.774,96.235,""],["sample3-marks.svg",0.0,0.0,100.0,100.0,"md-marks"]]],
    "sample4": [1.16709,[["start-5.webp",1.613,1.882,96.774,96.235,""],["sample4-marks.svg",0.0,0.0,100.0,100.0,"md-marks"]]],
    "sample5": [1.16709,[["start-6.webp",1.613,1.882,96.774,96.235,""],["sample5-marks.svg",0.0,0.0,100.0,100.0,"md-marks"]]],
    "sequence": [1.97287,[["sequence-marks.svg",0.0,0.0,100.0,100.0,"md-marks"],["tracking-1.webp",0.414,14.272,23.594,25.383,"md-keypose"],["tracking-2.webp",25.516,12.908,24.831,28.111,"md-keypose"],["tracking-3.webp",55.888,3.731,15.527,46.466,"md-keypose"],["tracking-4.webp",79.156,0.816,20.43,52.295,"md-keypose"],["tracking-5.webp",67.103,58.96,18.817,40.224,"md-keypose"],["tracking-6.webp",43.95,61.585,13.683,34.973,"md-keypose"],["tracking-7.webp",14.688,63.136,20.765,31.873,"md-keypose"]]],
    "states": [1.29146,[["next-state.webp",27.022,2.175,71.294,95.65,"md-state-0"],["state-mid.webp",14.353,2.175,71.294,95.65,"md-state-1"],["contact.webp",1.684,2.175,71.294,95.65,"md-state-2"],["states-marks.svg",0.0,0.0,100.0,100.0,"md-marks"]]],
    "failed": [0.95626,[["dropped-object.webp",9.629,15.01,71.595,78.726,""],["failed-marks.svg",0.0,0.0,100.0,100.0,"md-marks"]]],
    "contact-head": [0.96408,[["contact.webp",2.049,1.976,95.901,96.048,""],["contact-head-marks.svg",0.0,0.0,100.0,100.0,"md-marks"]]]
  };
  function scene(key) {
    const [aspect,layers]=artwork[key];
    return h('span',{class:'md-scene md-art-'+key,css:{'--aspect':aspect}},layers.map(([file,left,top,width,height,cls],index)=>
      h('img',{src:'media/method/'+file,alt:'',loading:'lazy',decoding:'async',class:cls,
        css:{left:left+'%',top:top+'%',width:width+'%',height:height+'%','--pose':index-1}})));
  }
  const skills=['rotate-z','rotate-y','rotate-x','spin','translate','pick-place'];
  const can=h('span',{class:'md-dataset-can'},h('span',{class:'md-count'},h('b',{text:'34'}),' objects',h('i'),h('b',{text:'40.1'}),' h'),label('Human demonstrations'));
  const data=module('data',title('Primitive in-hand skills'),h('span',{class:'md-skills'},skills.map(key=>h('span',{class:'md-skill-slot'},scene(key)))),
    h('span',{class:'md-data-arrow','aria-hidden':true}),can);
  const sampling=module('sampling',title('Sampling with exclusion'),h('span',{class:'md-starts'},
    [45,70,0,100,55,25].map((prob,i)=>h('span',{class:i===2?'md-excluded':''},
      h('span',{class:'md-sample-pose'},scene('sample'+i)),h('i',{},h('b',{css:{width:prob+'%'}})),i===2?h('em',{text:'×'}):null))),label('Sampling probability'));
  const reward=module('reward',title('Interaction reward'),h('span',{class:'md-phases'},['approach','hold','release'].map((name,i)=>
    h('span',{class:'md-phase',css:{'--i':i}},asset(name,name),h('b',{text:i===1?'On':'Off'})))),label('Object-tracking reward'));
  function pointLens() {
    // Left and right use the same source frames and point correspondences as the paper.
    const frame=h('svg',{viewBox:'0 0 230 138',class:'md-lens-lines','aria-hidden':true},
      h('path',{d:'M74 28 L136 2 M74 126 L136 136',class:'md-lens-leaders'}),
      h('rect',{x:7,y:28,width:67,height:98,rx:7,class:'md-lens-source'}));
    const source=h('span',{class:'md-lens-hand'},asset('local-hand'),asset('local64-projection','','svg'));
    // Current and reference projections of the same 64 surface points in the paper figure.
    const pairs=[
      [18.35, 109.86, 34.37, 122.73], [29.90, 94.73, 43.99, 107.60], [38.32, 89.45, 51.62, 102.02],
      [53.69, 73.97, 64.78, 86.51], [67.37, 62.12, 76.74, 74.68], [49.71, 63.37, 60.00, 76.91],
      [51.96, 54.00, 61.55, 68.15], [61.74, 35.60, 69.59, 50.71], [74.55, 14.16, 80.45, 30.64],
      [39.85, 65.92, 51.28, 80.07], [39.85, 62.19, 51.20, 76.67], [45.57, 45.24, 56.27, 60.94],
      [50.01, 36.19, 61.78, 53.10], [25.43, 79.46, 38.96, 93.80], [27.39, 74.35, 40.58, 88.93],
      [29.48, 60.93, 42.77, 76.65], [37.00, 51.55, 51.55, 68.24], [11.99, 91.26, 27.35, 105.96],
      [12.48, 86.76, 27.80, 101.77], [15.77, 71.95, 31.67, 88.16], [24.12, 63.76, 40.42, 80.37],
      [18.86, 109.65, 34.86, 122.50], [30.64, 91.65, 44.41, 104.65], [34.90, 90.06, 48.34, 102.84],
      [52.71, 74.71, 63.92, 87.26], [69.66, 60.77, 78.86, 73.33], [48.63, 65.62, 59.15, 79.07],
      [56.06, 54.28, 65.20, 68.08], [62.74, 33.44, 70.42, 48.69], [73.06, 13.34, 79.50, 30.19],
      [37.94, 66.09, 49.62, 80.40], [38.05, 63.30, 49.67, 77.84], [14.09, 107.88, 30.07, 121.24],
      [54.10, 76.10, 65.53, 88.50], [67.06, 32.56, 74.04, 47.50], [45.20, 58.51, 55.77, 72.84],
      [46.78, 43.18, 57.34, 59.00], [26.67, 76.32, 39.99, 90.80], [28.97, 69.74, 41.94, 84.58],
      [32.68, 55.63, 45.73, 71.63], [16.48, 85.96, 31.23, 100.63], [13.68, 82.14, 28.93, 97.44],
      [20.77, 67.18, 35.83, 83.30], [28.29, 96.95, 42.66, 109.80], [34.88, 94.36, 48.84, 106.88],
      [50.37, 64.37, 60.66, 77.79], [56.78, 54.67, 65.87, 68.38], [45.55, 57.34, 56.05, 71.75],
      [48.32, 41.61, 58.63, 57.44], [49.14, 37.08, 61.05, 53.97], [26.74, 76.75, 40.05, 91.18],
      [29.33, 71.72, 42.24, 86.34], [32.82, 57.30, 45.62, 73.05], [35.18, 54.16, 50.22, 70.82],
      [13.31, 81.78, 28.64, 97.15], [20.36, 67.26, 35.57, 83.44], [22.94, 64.43, 39.19, 81.03],
      [13.08, 106.86, 29.00, 120.37], [28.21, 95.64, 42.47, 108.58], [67.14, 63.84, 76.83, 76.34],
      [74.34, 11.99, 80.56, 28.89], [37.51, 65.51, 49.24, 79.91], [46.08, 59.23, 56.55, 73.42],
      [46.91, 44.24, 57.37, 59.91]
    ];
    const links=h('g',{class:'md-pair-links'}), starts=h('g',{class:'md-pair-starts'});
    const targets=h('g',{class:'md-pair-targets'}), tracers=h('g',{class:'md-pair-tracers'});
    for(const [x,y,rx,ry] of pairs) {
      links.append(h('line',{x1:x,y1:y,x2:rx,y2:ry,pathLength:1}));
      starts.append(h('circle',{cx:x,cy:y,r:1.7}));
      targets.append(h('circle',{cx:rx,cy:ry,r:1.7}));
      tracers.append(h('circle',{cx:x,cy:y,r:1.2,css:{'--dx':(rx-x)+'px','--dy':(ry-y)+'px'}}));
    }
    const highlights=h('svg',{viewBox:'0 0 92.546 134.722',preserveAspectRatio:'none',class:'md-pair-highlights','aria-hidden':true},links,starts,targets,tracers);
    const detail=h('span',{class:'md-lens-window'},h('span',{class:'md-lens-content'},
      asset('target'),asset('current'),highlights));
    return h('span',{class:'md-lens'},source,frame,detail);
  }
  const points=module('points',title('Local surface points'),h('span',{class:'md-points-art'},pointLens()),
    h('span',{class:'md-point-key'},h('span',{text:'Current'}),h('span',{text:'Reference'})));
  const simulator=module('sim',title('Simulator'),h('span',{class:'md-parallel'},asset('sim-grid','Parallel hand–object simulations')));
  const buffer=module('buffer',h('span',{class:'md-buffer-glyph','aria-hidden':true},h('i'),h('i'),h('i')),title('Replay buffer'));
  const heads=[['states','State'],['contact-head','Contact'],['failed','Failure']];
  // Both network glyphs share a node scale, hidden-layer heights and straight edges.
  function network(isWorld) {
    const kind=isWorld?'world':'policy', input=[26,50,74], hidden=isWorld?input:[35,65];
    const outputs=isWorld?[100/6,50,500/6]:hidden;
    const svg=h('svg',{class:'md-network',width:'100%',height:'100%','aria-hidden':true});
    const defs=document.createElementNS(NS,'defs');
    const tip=document.createElementNS(NS,'marker');
    for(const [key,value] of Object.entries({id:'md-net-tip-'+kind,viewBox:'0 0 6 8',refX:5,refY:4,markerWidth:4,markerHeight:5,orient:'auto'})) tip.setAttribute(key,value);
    tip.append(h('path',{d:'M1 1 L5 4 L1 7',fill:'none',stroke:'#76938d','stroke-linecap':'round','stroke-linejoin':'round'}));
    defs.append(tip);svg.append(defs);
    function edge(x1,y1,x2,y2,tip=false) {
      svg.append(h('line',{x1:x1+'%',y1:y1+'%',x2:x2+'%',y2:y2+'%',
        'marker-end':tip?'url(#md-net-tip-'+kind+')':null}));
    }
    for(const y of input) {
      edge(3,50,26,y);
      for(const next of hidden) edge(26,y,65,next);
    }
    hidden.forEach((y,i)=>edge(65,y,97,outputs[i],true));
    for(const [x,rows,cls] of [[26,input,'md-input-node'],[65,hidden,'md-hidden-node']]) {
      rows.forEach(y=>svg.append(h('circle',{cx:x+'%',cy:y+'%',r:4.8,class:cls})));
    }
    return svg;
  }
  const world=module('world',title('World model'),h('span',{class:'md-world-body'},network(true),
    h('span',{class:'md-output-list'},heads.map(([key,text])=>h('span',{},scene(key),label(text))))));
  const policyTitle=text=>h('span',{class:'md-policy-name'},asset('policy-mark','','svg'),title(text));
  const policy=module('policy',policyTitle('Policy'),network(false));
  const tracking=module('tracking',title('Unseen-object tracking'),scene('sequence'),h('span',{class:'md-tools'},
    [['screwdriver','Screwdriver'],['wrench','Wrench'],['spray','Spray bottle'],['bulb','Light bulb']].map(([key,name])=>asset('unseen-'+key,name))));
  const teleClip=h('video',{muted:true,loop:true,playsinline:true,preload:'none',poster:'media/method/teleop-bulb-masked.jpg',
    'aria-label':'A human turns a light bulb and the robot follows in the same recording.'});
  teleClip.muted=true;
  const tele=module('tele',title('Teleoperation'),h('span',{class:'md-tele-film'},teleClip,
    h('span',{class:'md-film-divider','aria-hidden':true},h('i',{text:'→'}))),
    h('span',{class:'md-film-labels'},label('Human'),label('Robot')));
  const frozen=module('frozen',policyTitle('Frozen policy'),asset('snowflake',''));
  for(const [el,text] of [[sampling,'↓ sample · ↑ return'],[reward,'rₜ → World model'],[points,'PointNet → Policy']]) {
    el.insertBefore(h('span',{class:'md-mobile-route',text}),el.lastChild);
  }
  const mechanisms=h('div',{class:'md-mechanisms'},sampling,reward,points);
  const core=h('div',{class:'md-core'},simulator,buffer,world,policy);
  const training=column('Model-based RL','md-training-col',mechanisms,core,h('span',{class:'md-mobile-feedback',text:'aₜ → Simulator'}));
  const deployment=column('Deployment','md-deploy-col',tracking,frozen,tele);
  board.append(column('DexEmpla','md-data-col',data),training,deployment);
  const paths=h('svg',{class:'md-wires','aria-hidden':true});
  board.prepend(paths);
  const footer=h('div',{class:'md-footer'},details,pause);
  host.append(board,footer);
  let flows=[], frameId=0, lastFrame=null, elapsed=0;
  let paused=reduced, filmVisible=false;
  let playRequest=0;
  function updateFilm() {
    if(!filmVisible || paused || document.hidden) { playRequest++;teleClip.pause();return; }
    if(!teleClip.hasAttribute('src')) DMAMedia.set(teleClip, 'media/method/teleop-bulb-masked.mp4');
    const request=++playRequest;
    DMAMedia.play(teleClip).catch(()=>{ if(request===playRequest) teleClip.pause(); });
  }
  function playback() {
    host.classList.toggle('md-paused',paused);
    pause.textContent=paused?'Play animation':'Pause animation';
    scheduleFlow();
    updateFilm();
  }
  pause.onclick=()=>{paused=!paused;playback();};playback();
  host.onkeydown=e=>{if(e.key==='Escape'){pinned=null;display(null);}};
  new IntersectionObserver(([entry])=>{
    host.classList.toggle('md-visible',entry.isIntersecting);
    playback();
  }).observe(host);
  new IntersectionObserver(([entry])=>{filmVisible=entry.isIntersecting;updateFilm();}).observe(tele);
  document.addEventListener('visibilitychange',playback);
  // Keep arrows tangent to each turn, including narrow gutters where a full radius cannot fit.
  function connectionPath(vertices) {
    const points=vertices.filter(([x,y],i)=>i===0 || x!==vertices[i-1][0] || y!==vertices[i-1][1]);
    let path='M'+points[0].join(' ');
    for(let i=1;i<points.length-1;i++) {
      const [x,y]=points[i], [prevX,prevY]=points[i-1], [nextX,nextY]=points[i+1];
      const before=Math.hypot(prevX-x,prevY-y), after=Math.hypot(nextX-x,nextY-y);
      const radius=Math.min(8,before/2,after/2);
      path+=' L'+(x+radius*(prevX-x)/before)+' '+(y+radius*(prevY-y)/before);
      path+=' Q'+x+' '+y+' '+(x+radius*(nextX-x)/after)+' '+(y+radius*(nextY-y)/after);
    }
    return path+' L'+points[points.length-1].join(' ');
  }
  // Sample each route once when it is laid out. Its moving stroke owns its arrowhead.
  function prepareFlow(path,ink,period,offset) {
    const length=path.getTotalLength(), steps=Math.max(1,Math.ceil(length/3));
    const samples=Array.from({length:steps+1},(_,i)=>path.getPointAtLength(length*i/steps));
    return {ink,length,steps,samples,period,offset};
  }
  function paintFlow(flow,time) {
    const {ink,length,steps,samples,period,offset}=flow;
    const progress=((time+offset)%period)/period;
    const head=progress*steps, tail=Math.max(0,head-Math.min(length*.28,28)*steps/length);
    function position(at) {
      const i=Math.min(steps-1,Math.floor(at)), f=at-i, a=samples[i], b=samples[i+1];
      return (a.x+(b.x-a.x)*f).toFixed(2)+' '+(a.y+(b.y-a.y)*f).toFixed(2);
    }
    let d='M'+position(tail);
    for(let i=Math.floor(tail)+1;i<head;i++) d+=' L'+samples[i].x.toFixed(2)+' '+samples[i].y.toFixed(2);
    ink.setAttribute('d',d+' L'+position(head));
    ink.style.opacity=Math.min(1,progress/.08,(1-progress)/.08);
  }
  function animateFlows(now) {
    if(lastFrame!==null) elapsed+=now-lastFrame;
    lastFrame=now;
    flows.forEach(flow=>paintFlow(flow,elapsed));
    frameId=requestAnimationFrame(animateFlows);
  }
  function scheduleFlow() {
    if(!paused && !document.hidden && host.classList.contains('md-visible') && flows.length) {
      if(!frameId) frameId=requestAnimationFrame(animateFlows);
    } else {
      cancelAnimationFrame(frameId);frameId=0;lastFrame=null;
    }
  }
  // Connect actual element edges after layout; reroute on a narrow screen.
  function draw() {
    const bounds=board.getBoundingClientRect();
    if(!bounds.width) return;
    const tip=document.createElementNS(NS,'marker');
    for(const [key,value] of Object.entries({id:'md-flow-tip',viewBox:'0 0 8 8',refX:7,refY:4,markerWidth:7,markerHeight:7,markerUnits:'userSpaceOnUse',orient:'auto'})) tip.setAttribute(key,value);
    tip.append(h('path',{d:'M2 1 L7 4 L2 7',fill:'none',stroke:'#288476','stroke-width':1.7,'stroke-linecap':'round','stroke-linejoin':'round'}));
    const defs=document.createElementNS(NS,'defs');defs.append(tip);
    const svgNodes=[defs], routes=[];
    const box=id=>{
      const r=nodes.get(id).getBoundingClientRect();
      return {l:r.left-bounds.left,r:r.right-bounds.left,t:r.top-bounds.top,b:r.bottom-bounds.top,x:r.left+r.width/2-bounds.left,y:r.top+r.height/2-bounds.top,w:r.width};
    };
    function route(from,to,vertices,word,pos) {
      const routeKey=from+' '+to;
      const [end,prev]=vertices.slice(-2).reverse();
      const angle=Math.atan2(end[1]-prev[1],end[0]-prev[0])*180/Math.PI;
      const d=connectionPath(vertices);
      const track=h('path',{d,class:'md-track'});
      const ink=h('path',{class:'md-flow-ink','marker-end':'url(#md-flow-tip)'});
      const g=h('g',{'data-route':routeKey},track,
        h('path',{d:'M-4 -2.3L0 0L-4 2.3',class:'md-tip',transform:'translate('+end.join(' ')+') rotate('+angle+')'}),ink);
      routes.push([track,ink,from==='policy'&&to==='sim'?6500:4750,routes.length*485]);
      if(word==='PointNet') {
        g.append(h('rect',{x:pos[0]-30,y:pos[1]-10,width:60,height:20,rx:7,class:'md-pointnet-frame'}),h('text',{x:pos[0],y:pos[1]+3.5,'text-anchor':'middle',text:word}));
      } else if(word==='rₜ') {
        const gate=h('g',{transform:'translate('+pos.join(' ')+')'},h('rect',{x:-9,y:-11,width:18,height:22,fill:'#f3f7f8'}),
          h('path',{class:'md-gate-lever',d:'M0 7 L-7 -7'}),h('circle',{class:'md-terminal',cx:0,cy:-7,r:2}),h('circle',{class:'md-terminal',cx:0,cy:7,r:2}),
          h('text',{x:10,y:3,text:word}));
        g.append(gate);
      } else if(word)g.append(h('text',{x:pos[0],y:pos[1],'text-anchor':'middle',text:word}));
      svgNodes.push(g);
    }
    function across(a,b,word) {
      const start=box(a),end=box(b),mid=(start.r+end.l)/2;
      route(a,b,[[start.r+1,start.y],[mid,start.y],[mid,end.y],[end.l-2,end.y]],word,[mid,(start.y+end.y)/2-8]);
    }
    function down(a,b,label,shift=0,reverse=false) {
      const u=box(a),v=box(b),sx=u.x+shift,ex=v.x+shift,m=(u.b+v.t)/2+(a==='sampling'?(reverse?7:-7):0);
      let pts=[[sx,u.b+2],[sx,m],[ex,m],[ex,v.t-2]];
      if(label==='PointNet'||label==='rₜ') {
        pts=[[sx,u.b+2],[sx,u.b+6],[ex,u.b+6],[ex,v.t-2]];
        route(a,b,pts,label,[ex,m+1]);return;
      }
      if(reverse)pts=pts.reverse();
      route(a,b,pts,label,[(sx+ex)/2,m-4]);
    }
    if(window.matchMedia('(min-width: 801px)').matches) {
      down('sampling','sim','sample',-22);down('sampling','sim','return',22,true);
      down('reward','world','rₜ');down('points','policy','PointNet');
      across('sim','buffer');across('buffer','world');across('world','policy','∇θ');
      const s=box('sim'),p=box('policy'),bottom=Math.max(s.b,p.b)+15;
      route('policy','sim',[[p.x,p.b+2],[p.x,bottom],[s.x,bottom],[s.x,s.b+2]],'aₜ · finger actions',[(s.x+p.x)/2,bottom+4]);
      if(window.matchMedia('(min-width: 1101px)').matches) {
        const input=can.getBoundingClientRect(),outer=training.getBoundingClientRect(),bend=outer.left-bounds.left-7,y=input.top+input.height/2-bounds.top;
        route('data','sim',[[input.right-bounds.left+1,y],[bend,y],[bend,s.y],[s.l-2,s.y]]);
        across('policy','frozen');
      } else {
        const inset=4,canRect=can.getBoundingClientRect();
        const inputX=canRect.right-bounds.left,inputY=canRect.top+canRect.height/2-bounds.top;
        const top=training.getBoundingClientRect().top-bounds.top-6;
        route('data','sim',[[inputX+1,inputY],[bounds.width-inset,inputY],[bounds.width-inset,top],[inset,top],[inset,s.y],[s.l-2,s.y]]);
        const f=box('frozen'),col=deployment.getBoundingClientRect().top-bounds.top;
        route('policy','frozen',[[p.r+1,p.y],[bounds.width-inset,p.y],[bounds.width-inset,col-5],[f.x,col-5],[f.x,f.t-2]]);
        const tr=box('tracking'),te=box('tele');
        route('frozen','tracking',[[f.l-1,f.y],[tr.r+2,f.y]]);
        route('frozen','tele',[[f.r+1,f.y],[te.l-2,f.y]]);
      }
    }
    if(window.matchMedia('(min-width: 1101px)').matches) {
      down('tracking','frozen',null,0,true);down('frozen','tele',null);
    }
    paths.replaceChildren(...svgNodes);
    flows=routes.map(route=>prepareFlow(...route)).filter(flow=>flow.length>.1);
    flows.forEach(flow=>paintFlow(flow,elapsed));scheduleFlow();
    const latest=active;display(latest);
  }
  new ResizeObserver(draw).observe(board);document.fonts.ready.then(draw);
  display(null);draw();
})();

/* ───────── results explorer ───────── */
(function results() {
  const host = $('#rx');
  const studies = ['Simulation', 'Real world', 'Ablations'];
  const metrics = ['Success rate', 'Position error', 'Orientation error'];
  const ablations = Object.values(ABL);
  const simRows = [...SIMRES].sort((a, b) => b[2] - a[2]);
  const errorSD = { // Position (seen, unseen), then orientation (seen, unseen).
    DMA: [.20, .42, .22, .59], 'ConTrack specialist': [.05, .18, .11, .07],
    SimToolReal: [.44, .43, .33, .31], DexTrack: [.06, .05, .04, .09],
    SPIDER: [.14, .17, .08, .05], 'Retarget replay': [.07, .05, .06, .04],
  };
  const settings = studies.map((_, i) => ({ metric: 0, split: i === 1 ? 0 : objectSplitOrder[0] }));
  let study = 0, hour = ABL.size.pts.length - 1;
  let trendObserver;
  const dashboard = h('div', { class: 'rx-content' });

  function buttons(labels, current, label, cls, choose) {
    return h('div', { class: cls, role: 'group', 'aria-label': label }, labels.map((name, i) =>
      h('button', { type: 'button', 'aria-pressed': i === current, text: name, onclick: () => choose(i) })));
  }

  function ablationIntro(ab, split) {
    const group = split ? 'unseen tools' : 'seen objects';
    const col = 2 + 2 * split;
    if (ab.pts) {
      const first = ab.pts[0], last = ab.pts.at(-1);
      return `With the same 34 training objects, increasing demonstrations from ${first[0]} to ${last[0]} hours raises tracking success on unseen tools from ${first[3]}% to ${last[3]}% and on seen objects from ${first[1]}% to ${last[1]}%.`;
    }
    const result = ab.rows.at(-1)[col].toFixed(1) + '%';
    if (ab === ABL.rep) {
      const global = ab.rows.find(r => r[0] === 'Global64')[col].toFixed(1) + '%';
      return `On ${group}, hand-guided surface points reach ${result} tracking success, compared with ${global} for points sampled across the whole object.`;
    }
    if (ab === ABL.samp) {
      const baseline = ab.rows.find(r => r[0] === 'Return-based')[col].toFixed(1) + '%';
      return `Excluding repeatedly failing starts from return-based reset sampling raises tracking success on ${group} from ${baseline} to ${result}.`;
    }
    const contact = ab.rows.find(r => r[0] === 'Contact only')[col].toFixed(1) + '%';
    return `On ${group}, tracking success rises from ${contact} to ${result} when the object reward requires both fingertip contact and a reference frame in which the hand supports the object.`;
  }

  function draw(focus) {
    trendObserver?.disconnect();
    const { metric, split } = settings[study];
    const sim = study === 0, real = study === 1, ab = ablations[metric];
    const scale = study === 2 && !!ab.pts;
    const isError = sim && metric > 0;
    const unit = isError ? (metric === 1 ? 'mm' : '°') : '%';
    const decimals = isError ? 2 : 1;
    const options = sim ? metrics : real ? ['Success rate', 'Task progress'] : ablations.map(a => a.name);
    const metricName = study === 2 ? 'Success rate' : options[metric];
    const title = ['Comparison with baselines', 'Zero-shot tool use', 'Ablation study'][study];
    const labels = real ? ['Motion tracking', 'Teleoperation'] : ['Seen objects', 'Unseen objects'];
    const sims = r => isError ? [r[4 + metric * 2 + split], errorSD[r[0]][(metric - 1) * 2 + split]] : [r[2 + split * 2], r[3 + split * 2]];
    const reference = sim ? simRows[0] : real ? REAL.at(-1) : scale ? ab.pts[hour] : ab.rows.at(-1);
    const intro = sim
      ? 'A single DMA policy tracks held-out motions on 34 training objects and nine unseen tools. It achieves the highest success rate and the lowest position error on both sets.'
      : real ? 'One policy performs six tasks with unseen tools. The robot completes every stage in 71.1% of trials when following recorded motions and 80.0% under live teleoperation.'
      : ablationIntro(ab, split);
    const header = h('div', { class: 'rx-head' }, h('h3', { text: title }), h('p', { text: intro }));
    const optionsBar = buttons(options, metric, study === 2 ? 'Ablation' : 'Metric', 'rx-options', i => {
      settings[study].metric = i; draw('.rx-options button[aria-pressed=true]');
    });
    const order = real ? [0, 1] : objectSplitOrder;
    const cards = scale ? h('div', { class: 'rx-legend', role: 'group', 'aria-label': 'Chart legend' },
      order.map(i => h('span', { class: 's'+i, text: labels[i] }))) : h('div', { class: 'rx-cards', role: 'group', 'aria-label': real ? 'Deployment mode' : 'Evaluation split' }, order.map(i =>
      h('button', { type: 'button', class: 'rx-card', 'data-tone': i, 'aria-pressed': i === split, 'aria-controls': 'rx-chart', onclick: () => {
        settings[study].split = i; draw('.rx-card[aria-pressed=true]');
      } }, labels[i], real ? h('b', { title: 'Mean ' + metricName.toLowerCase(), text: reference[2+i*2+metric].toFixed(1)+'%' }) : sim ? h('b', { title: 'DMA ' + metricName.toLowerCase(), text: reference[isError ? 4+metric*2+i : 2+i*2].toFixed(decimals) + (unit === 'mm' ? ' mm' : unit) }) : null)));
    const toolbar = h('div', { class: 'rx-toolbar' }, cards, optionsBar);
    const chart = h('div', { id: 'rx-chart', class: 'rx-chart', 'data-tone': split, role: 'group',
      'aria-label': (scale ? order.map(i => labels[i]).join(' and ') : labels[split]) + ' · ' + metricName });
    if (scale) {
      chart.append(trend(ab.pts));
    } else {
      const rows = sim ? simRows.map(r => ({ name: r[0], desc: r[1], own: r === reference, pair: sims(r) }))
        : real ? REAL.map(r => ({ name: r[0], own: r === reference, pair: [r[2+split*2+metric]],
            play: (split ? TELE : TRACK).some(clip => clip.id === r[1]) ? () => toolsDeck.open(split,r[1]) : null }))
        : [...ab.rows].reverse().map(r => ({ name: r[0], desc: r === reference ? 'DMA' : r[1], own: r === reference, pair: r.slice(2 + split * 2, 4 + split * 2) }));
      chart.append(bars(rows, isError ? 25 : 100, decimals, unit));
    }
    const standard = real ? (metric === 0 ? 'A trial succeeds if every stage is completed without dropping the tool (15 trials per task and mode).' : 'Task progress is the fraction of stages completed, averaged over 15 trials per task and mode.') : isError
      ? 'Mean errors are measured over interaction frames before the first failure.'
      : 'A rollout succeeds if the object stays within 50 mm and 45° of its reference pose at every frame of the motion.';
    chart.append(h('p', { class: 'rx-standard', text: standard }));
    dashboard.replaceChildren(header, toolbar, chart);
    if (focus) dashboard.querySelector(focus)?.focus({ preventScroll: true });
  }

  function bars(rows, max, decimals, unit) {
    const ticks = max === 25 ? [0,5,10,15,20,25] : [0,25,50,75,100];
    const axis = h('div', { class: 'rx-axis', 'aria-hidden': 'true' }, ticks.map(n =>
      h('span', { css: { left: (100*n/max) + '%' }, text: n })));
    return h('div', { class: 'rx-bars' }, h('div', { class: 'rx-axisrow' }, axis),
      rows.map(({ name, desc, own, play, pair: [value, sd] }) => {
        const label = play ? h('a', { href: '#level-2', onclick: play, title: 'Play ' + name }, name, h('span', { 'aria-hidden': true, text: ' ↗' })) : h('b', { text: name });
        return h('div', { class: 'rx-row' + (own ? ' ours' : '') },
          h('div', { class: 'rx-method', title: desc }, label),
          h('div', { class: 'rx-track', 'aria-hidden': 'true' }, h('i', { css: { width: (100*value/max) + '%' } })),
          h('div', { class: 'rx-reading' }, h('b', { text: value.toFixed(decimals) + (unit === 'mm' ? ' mm' : unit) }),
            sd == null ? null : h('small', { text: '± ' + sd.toFixed(decimals) })));
      }));
  }

  function trend(pts) {
    const svg = h('svg', { class: 'rx-trend', role: 'slider', tabindex: 0, 'aria-label': 'Training hours',
      'aria-valuemin': 1, 'aria-valuemax': 40.1 });
    let width = 700;
    const left = 38, right = 32;
    const x = t => left + Math.log(t)/Math.log(40.1)*(width-left-right);
    function paint() {
      const height = Math.max(224, Math.round(width*.44));
      const y = v => height-46 - v/100*(height-82);
      svg.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
      const p = pts[hour];
      svg.setAttribute('aria-valuenow', p[0]);
      svg.setAttribute('aria-valuetext', p[0]+' training hours, seen objects '+p[1]+' percent, unseen objects '+p[3]+' percent');
      svg.replaceChildren(h('text', { x: left, y: 16, text: 'Success rate (%)' }),
        h('text', { x: (width+left-right)/2, y: height-4, 'text-anchor': 'middle', text: 'Training hours (log scale)' }));
      [0,25,50,75,100].forEach(v => svg.append(h('line', { class: 'rx-grid', x1: left, x2: width-right, y1: y(v), y2: y(v) }),
        h('text', { x: left-8, y: y(v)+4, 'text-anchor': 'end', text: v })));
      pts.forEach(r => svg.append(h('text', { x: x(r[0]), y: height-27, 'text-anchor': 'middle', text: r[0] })));
      svg.append(h('line', { class: 'rx-guide', x1: x(p[0]), x2: x(p[0]), y1: y(100), y2: y(0) }));
      objectSplitOrder.forEach(s => {
        const col = 1+2*s, coord = (r,k) => x(r[0])+','+y(r[col]+k*r[col+1]);
        const group = h('g', { class: 'rx-series s'+s });
        group.append(h('polygon', { points: [...pts.map(r => coord(r,1)), ...[...pts].reverse().map(r => coord(r,-1))].join(' ') }),
          h('polyline', { points: pts.map(r => coord(r,0)).join(' ') }),
          ...pts.map((r,i) => h('circle', { cx: x(r[0]), cy: y(r[col]), r: i === hour ? 5 : 3.4 })));
        svg.append(group);
      });
      [0,1].forEach(s => svg.append(h('text', { class: 'rx-point-label s'+s, x: x(p[0]), y: y(p[1+2*s])+(s ? 19 : -11),
        'text-anchor': hour === 0 ? 'start' : hour === pts.length-1 ? 'end' : 'middle', text: p[1+2*s].toFixed(1)+'%' })));
    }
    function select(i) {
      if (i !== hour) { hour = i; paint(); }
    }
    function inspect(e) {
      const pos = e.clientX-svg.getBoundingClientRect().left;
      select(pts.reduce((best,p,i) => Math.abs(x(p[0])-pos)<Math.abs(x(pts[best][0])-pos) ? i : best,0));
    }
    svg.onpointermove = e => { if (e.pointerType === 'mouse') inspect(e); };
    svg.onclick = inspect;
    svg.onkeydown = e => {
      const next = { ArrowLeft: hour-1, ArrowRight: hour+1, ArrowDown: hour-1, ArrowUp: hour+1, Home: 0, End: pts.length-1 }[e.key];
      if (next !== undefined) { e.preventDefault(); select(Math.max(0, Math.min(pts.length-1,next))); }
    };
    trendObserver = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width > 0 && entry.contentRect.width !== width) { width = entry.contentRect.width; paint(); }
    });
    paint();
    trendObserver.observe(svg);
    return svg;
  }
  const tabs = buttons(studies, 0, 'Study', 'rx-studies', i => {
    study = i;
    [...tabs.children].forEach((b,j) => b.setAttribute('aria-pressed', i === j));
    draw();
  });
  host.append(h('div', { class: 'rx-dashboard' }, tabs, dashboard)); draw();
})();

/* ───────── page chrome ───────── */
(function chrome() {
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12 });
  document.querySelectorAll('.reveal').forEach(n => io.observe(n));
  const links = [...document.querySelectorAll('.site-header nav a')], ids = links.map(a => a.getAttribute('href').slice(1));
  const group = id => (id.startsWith('level-') ? 'demos' : id);
  const nav = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { const g = group(e.target.id); links.forEach((a, i) => a.classList.toggle('on', ids[i] === g)); } }), { rootMargin: '-45% 0px -50% 0px' });
  document.querySelectorAll('main section[id]').forEach(s => nav.observe(s));
  const onScroll = () => document.body.classList.toggle('scrolled', scrollY > innerHeight * .6);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  const copy = $('#copy-bib');
  if (copy) copy.onclick = async () => { try { await navigator.clipboard.writeText($('#bibtex').textContent); copy.textContent = 'Copied'; } catch { copy.textContent = 'Select and copy'; } setTimeout(() => copy.textContent = 'Copy', 1600); };
})();


// Only warm the section the reader is actually viewing. In particular, anchor
// navigation must not download all the videos between the current and target sections.
(() => {
  // Arm native controls without fetching any film bytes before Play.
  const film=document.querySelector('#video video');
  if (!film.paused) DMAMedia.play(film).catch(()=>{}); else DMAMedia.start(film);
  film.addEventListener('play',()=>DMAMedia.start(film));
  const groups = {top:['hero'], why:['why','l2'], demos:['l1'], 'level-1':['l1'], 'level-2':['l2'], 'level-3':['l3'], simulation:['sim'], dataset:['data'], method:['method'], video:['main']};
  const warm = id => {
    if (!DMAMedia.permits(id)) return;
    const hero=document.querySelector('#hero-video');
    if (!location.hash && scrollY<innerHeight*.25 && (id==='top' || id==='why') &&
        !hero.paused && (!hero.buffered.length || hero.buffered.end(hero.buffered.length-1)-hero.currentTime<2.5)) {
      if (!hero.dataset.warmPending) {
        hero.dataset.warmPending='1';
        setTimeout(()=>{delete hero.dataset.warmPending;if(scrollY<innerHeight*.25)warm('top');},1200);
      }
      return;
    }
    for (const group of groups[id] || []) {
      DMAMedia.warm(group);

    }
  };
  function leavingHero() {
    if (scrollY<innerHeight*.25) return;
    removeEventListener('scroll',leavingHero);
    const why=document.getElementById('why').getBoundingClientRect();
    if(why.bottom>0 && why.top<innerHeight*1.65) warm('why');
  }
  addEventListener('scroll',leavingHero,{passive:true});
  const timers=new Map();
  const observer = new IntersectionObserver(entries=>{
    for(const {target,isIntersecting} of entries) {
      clearTimeout(timers.get(target));
      if(isIntersecting) {
        const rect=target.getBoundingClientRect(), visible=rect.top<innerHeight && rect.bottom>0;
        const delay=target.id==='top'?1400:visible?120:800;
        timers.set(target,setTimeout(()=>warm(target.id),delay));
      }
    }
  }, {rootMargin:'65% 0px'});
  for(const id of Object.keys(groups)) observer.observe(document.getElementById(id));
  for(const a of document.querySelectorAll('a[href^="#"]')) {
    const id=a.hash.slice(1);
    a.addEventListener('click',()=>{DMAMedia.navigate(id);warm(id);});
    a.addEventListener('focus',()=>warm(id));
    let intent;
    a.addEventListener('pointerenter',()=>{intent=setTimeout(()=>warm(id),90);});
    a.addEventListener('pointerleave',()=>clearTimeout(intent));
  }
  if(location.hash) {
    const target=document.getElementById(location.hash.slice(1));
    target?.scrollIntoView({behavior:'instant'});
    warm(target?.id);
  }
})();

// Generates the animated SVG assets for the profile README.
// Run: node tools/gen.mjs
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'assets');
mkdirSync(out, { recursive: true });

const C = {
  bg: '#0d0b14', bg2: '#1a1030', panel: '#120d1f', line: '#2e2347',
  red: '#ff2e63', red2: '#e0245a', red3: '#c41d4d', red4: '#8f0f33',
  pink: '#ff8fab', cyan: '#08d9d6', white: '#f4f2fa', grey: '#a79fbf',
};
// brown wolf fur
const W_ = { light: '#9a6238', fur: '#7b4b2a', mid: '#6a3f23', dark: '#4e2e1a', cream: '#e9d5b8', cream2: '#cdb594' };
const MONO =`'JetBrains Mono','Fira Code','Cascadia Code',Consolas,'DejaVu Sans Mono',monospace`;
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const pts = (a) => a.map((p) => p.join(',')).join(' ');
const poly = (a, fill, extra = '') => `<polygon points="${pts(a)}" fill="${fill}" ${extra}/>`;

// deterministic pseudo-random so regenerating gives the same picture
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

function paw(x, y, s = 1, rot = 0, fill = C.red) {
  return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})" fill="${fill}">
    <ellipse cx="0" cy="6" rx="9" ry="7.5"/>
    <ellipse cx="-10" cy="-5" rx="3.6" ry="4.6" transform="rotate(-20 -10 -5)"/>
    <ellipse cx="-3.6" cy="-10" rx="3.6" ry="4.8"/>
    <ellipse cx="3.6" cy="-10" rx="3.6" ry="4.8"/>
    <ellipse cx="10" cy="-5" rx="3.6" ry="4.6" transform="rotate(20 10 -5)"/>
  </g>`;
}

/* ───────────────────────── banner ───────────────────────── */
function banner() {
  const W = 1200, H = 400, cx = 930;
  const mir = (a) => a.map(([x, y]) => [2 * cx - x, y]);

  // brown protogen, left half; right half is mirrored with darker shades
  const earOuter = [[835, 70], [905, 150], [845, 197]];
  const earInner = [[846, 102], [888, 150], [854, 180]];
  const earSide = [[835, 70], [845, 197], [828, 160]];
  const headL = [[838, 200], [905, 148], [930, 148], [930, 322], [865, 322], [824, 262]];
  const fluff = [[826, 250], [796, 268], [822, 274], [804, 296], [846, 296], [868, 318], [862, 268]];
  const neck = [[868, 312], [900, 332], [930, 350], [960, 332], [992, 312], [978, 345], [952, 368], [930, 376], [908, 368], [882, 345]];
  const VISOR = 'M852 192 Q930 158 1008 192 Q1012 240 998 268 Q984 300 950 322 Q930 334 910 322 Q876 300 862 268 Q848 240 852 192 Z';

  // LED matrix on the visor: '#' is a lit pixel
  const led = (rows, x0, y0, step = 5) => rows.flatMap((r, y) => [...r].map((ch, x) =>
    ch === '#' ? `<rect x="${x0 + x * step}" y="${y0 + y * step}" width="${step - 1}" height="${step - 1}" rx="1"/>` : '')).join('');
  const flip = (rows) => rows.map((r) => [...r].reverse().join(''));
  const EYE = ['.#####..', '########', '.#######', '...#####', '.....##.'];
  const BLINK = ['........', '........', '########', '........', '........'];
  const HEART = ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...'];
  const MOUTH = ['#...#...#...#', '.#.#.#.#.#.#.', '..#...#...#..'];
  const eyes = (bmp, y = 212) => led(bmp, 866, y) + led(flip(bmp), 954, y);
  // one 8s cycle: look, blink, look, ♥ hearts ♥, look
  const state = (values, keyTimes) => `<animate attributeName="opacity" dur="8s" repeatCount="indefinite" calcMode="discrete" values="${values}" keyTimes="${keyTimes}"/>`;
  const protoFace = `<g fill="${C.cyan}" filter="url(#glow)">
      <g>${state('1;0;1;0;1', '0;0.45;0.48;0.7;0.88')}${eyes(EYE)}</g>
      <g opacity="0">${state('0;1;0', '0;0.45;0.48')}${eyes(BLINK)}</g>
      <g opacity="0" fill="${C.red}">${state('0;1;0', '0;0.7;0.88')}${led(HEART, 870, 209)}${led(HEART, 960, 209)}</g>
      ${led(MOUTH, 897.5, 279)}
    </g>`;

  const ear = (side) => {
    const f = side === 'L' ? (a) => a : mir;
    const pivot = side === 'L' ? '875 185' : `${2 * cx - 875} 185`;
    const sign = side === 'L' ? -1 : 1;
    return `<g>
      <animateTransform attributeName="transform" type="rotate" dur="${side === 'L' ? 6 : 7.5}s" repeatCount="indefinite"
        values="0 ${pivot};0 ${pivot};${sign * 9} ${pivot};${sign * -3} ${pivot};0 ${pivot}" keyTimes="0;0.78;0.83;0.88;1"/>
      ${poly(f(earSide), W_.dark)}
      ${poly(f(earOuter), side === 'L' ? W_.light : W_.mid)}
      ${poly(f(earInner), '#1e120c')}
      ${poly(f([[856, 120], [882, 150], [860, 168]]), C.cyan, 'opacity="0.35"')}
    </g>`;
  };

  // floating code glyphs rising behind everything
  const glyphs = ['0', '1', '{ }', '&lt;/&gt;', '0x', 'λ', '::', '=&gt;', '#', '01', 'fn', '[]', '~$', '*'];
  const parts = glyphs.map((g, i) => {
    const x = Math.round(40 + rnd() * (W - 80));
    const d = (7 + rnd() * 7).toFixed(1);
    const b = (-rnd() * 14).toFixed(1);
    const sz = Math.round(12 + rnd() * 10);
    const col = i % 3 === 0 ? C.cyan : C.red;
    return `<text x="${x}" y="${H + 20}" font-size="${sz}" fill="${col}" opacity="0">${g}
      <animate attributeName="y" from="${H + 20}" to="-20" dur="${d}s" begin="${b}s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0;0.35;0.35;0" keyTimes="0;0.15;0.8;1" dur="${d}s" begin="${b}s" repeatCount="indefinite"/>
    </text>`;
  }).join('\n');

  // terminal that types itself out, then loops
  const lines = [
    [['~$ ', C.cyan], ['whoami', C.white]],
    [['&gt; ', C.red], ['a wolf who writes code and breaks it', C.pink]],
    [['~$ ', C.cyan], ['cat ./stack', C.white]],
    [['&gt; ', C.red], ['electron · c++ · godot · next.js', C.pink]],
  ];
  const lens = [9, 39, 14, 34];
  const win = [[0.04, 0.11], [0.16, 0.32], [0.38, 0.45], [0.5, 0.66]];
  const term = lines.map((segs, i) => {
    const y = 262 + i * 27;
    const w = Math.ceil(lens[i] * 10.4) + 12;
    const [a, b] = win[i];
    return `<clipPath id="tl${i}"><rect x="80" y="${y - 18}" height="26" width="0">
        <animate attributeName="width" dur="10s" repeatCount="indefinite"
          values="0;0;${w};${w};0" keyTimes="0;${a};${b};0.95;1"/>
      </rect></clipPath>
      <text x="84" y="${y}" font-size="17" clip-path="url(#tl${i})">${segs.map(([t, c]) => `<tspan fill="${c}">${t}</tspan>`).join('')}</text>`;
  }).join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="${MONO}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${C.bg}"/><stop offset="0.55" stop-color="${C.bg2}"/><stop offset="1" stop-color="${C.bg}"/>
    </linearGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M40 0H0V40" fill="none" stroke="#2a2040" stroke-width="1"/>
    </pattern>
    <pattern id="scan" width="4" height="4" patternUnits="userSpaceOnUse">
      <rect width="4" height="1" fill="#000" opacity="0.18"/>
    </pattern>
    <radialGradient id="halo"><stop offset="0" stop-color="${C.red}" stop-opacity="0.35"/><stop offset="1" stop-color="${C.red}" stop-opacity="0"/></radialGradient>
    <radialGradient id="fade" cx="0.5" cy="0.5" r="0.75"><stop offset="0.4" stop-color="#fff"/><stop offset="1" stop-color="#000"/></radialGradient>
    <mask id="gridmask"><rect width="${W}" height="${H}" fill="url(#fade)"/></mask>
    <linearGradient id="title" x1="0" y1="0" x2="420" y2="0" gradientUnits="userSpaceOnUse" spreadMethod="reflect">
      <stop offset="0" stop-color="${C.red}"/><stop offset="0.5" stop-color="${C.pink}"/><stop offset="1" stop-color="${C.cyan}"/>
      <animateTransform attributeName="gradientTransform" type="translate" values="0 0;420 0;0 0" dur="8s" repeatCount="indefinite"/>
    </linearGradient>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="3.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <linearGradient id="visor" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1c1832"/><stop offset="1" stop-color="#05040a"/>
    </linearGradient>
    <clipPath id="visorClip"><path d="${VISOR}"/></clipPath>
    <clipPath id="frame"><rect width="${W}" height="${H}" rx="22"/></clipPath>
  </defs>

  <g clip-path="url(#frame)">
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#grid)" mask="url(#gridmask)" opacity="0.7"/>
  ${parts}

  <!-- title -->
  <text x="66" y="128" font-size="76" font-weight="800" fill="url(#title)" filter="url(#glow)" letter-spacing="2">AbreFoe</text>
  <text x="72" y="166" font-size="20" fill="${C.cyan}" opacity="0.85">// omen is dead · long live the wolf</text>

  <!-- terminal -->
  <rect x="60" y="196" width="570" height="176" rx="12" fill="${C.panel}" stroke="${C.line}" opacity="0.92"/>
  <circle cx="82" cy="216" r="5" fill="#ff5f57"/><circle cx="100" cy="216" r="5" fill="#febc2e"/><circle cx="118" cy="216" r="5" fill="#28c840"/>
  <text x="345" y="221" font-size="13" fill="${C.grey}" text-anchor="middle">abrefoe@omen: ~</text>
  ${term}
  <g opacity="0">
    <animate attributeName="opacity" dur="10s" repeatCount="indefinite" values="0;0;1;1;0" keyTimes="0;0.68;0.69;0.95;1"/>
    <text x="84" y="370" font-size="17" fill="${C.cyan}" dy="-0">~$</text>
  </g>
  <rect x="114" y="354" width="10" height="19" fill="${C.cyan}">
    <animate attributeName="opacity" values="1;1;0;0" keyTimes="0;0.5;0.5;1" dur="1s" repeatCount="indefinite"/>
  </rect>

  <!-- halo + rings -->
  <circle cx="${cx}" cy="215" r="210" fill="url(#halo)"/>
  <g fill="none" stroke-linecap="round">
    <circle cx="${cx}" cy="215" r="160" stroke="${C.cyan}" stroke-width="2" stroke-dasharray="4 14" opacity="0.45">
      <animateTransform attributeName="transform" type="rotate" from="0 ${cx} 215" to="360 ${cx} 215" dur="40s" repeatCount="indefinite"/>
    </circle>
    <circle cx="${cx}" cy="215" r="182" stroke="${C.red}" stroke-width="2" stroke-dasharray="60 30 8 30" opacity="0.4">
      <animateTransform attributeName="transform" type="rotate" from="360 ${cx} 215" to="0 ${cx} 215" dur="60s" repeatCount="indefinite"/>
    </circle>
  </g>

  <!-- floating tag -->
  <g font-size="22" font-weight="700" fill="${C.cyan}" filter="url(#glow)">
    <text x="1085" y="112">&lt;/&gt;<animateTransform attributeName="transform" type="translate" values="0 0;0 -8;0 0" dur="3s" repeatCount="indefinite"/></text>
    <text x="745" y="96" fill="${C.red}" font-size="18">{ }<animateTransform attributeName="transform" type="translate" values="0 -6;0 4;0 -6" dur="4s" repeatCount="indefinite"/></text>
  </g>

  <!-- protogen -->
  <g>
    <animateTransform attributeName="transform" type="translate" values="0 0;0 -4;0 0" dur="4s" repeatCount="indefinite"/>
    <!-- hoodie -->
    ${poly([[860, 310], [1000, 310], [1085, 410], [775, 410]], '#231a3a', `stroke="${C.line}" stroke-width="2"`)}
    ${poly([[860, 310], [930, 330], [1000, 310], [985, 345], [930, 360], [875, 345]], '#2e2350')}
    ${poly([[898, 300], [962, 300], [930, 372]], W_.cream)}
    <g stroke="${C.cyan}" stroke-width="3"><line x1="906" y1="342" x2="900" y2="392"/><line x1="954" y1="342" x2="960" y2="392"/></g>
    <circle cx="900" cy="394" r="4" fill="${C.cyan}"/><circle cx="960" cy="394" r="4" fill="${C.cyan}"/>
    <!-- headphone band (behind ears) -->
    <path d="M822 222 C815 40 1045 40 1038 222" fill="none" stroke="#2b2244" stroke-width="12" stroke-linecap="round"/>
    <path d="M822 222 C815 40 1045 40 1038 222" fill="none" stroke="${C.cyan}" stroke-width="3" stroke-linecap="round" opacity="0.8"/>
    ${ear('L')}${ear('R')}
    ${poly(headL, W_.fur)}${poly(mir(headL), W_.mid)}
    ${poly([[905, 150], [955, 150], [930, 172]], C.red)}
    ${poly(fluff, W_.cream)}${poly(mir(fluff), W_.cream2)}
    ${poly(neck, W_.cream)}
    <!-- visor -->
    <path d="${VISOR}" fill="url(#visor)" stroke="#2a2440" stroke-width="2"/>
    <path d="M872 196 Q930 176 988 196 L984 204 Q930 188 876 204 Z" fill="#fff" opacity="0.13"/>
    <g clip-path="url(#visorClip)">
      <rect x="840" y="160" width="180" height="3" fill="${C.cyan}" opacity="0.25">
        <animate attributeName="y" values="160;335" dur="3.5s" repeatCount="indefinite"/></rect>
    </g>
    ${protoFace}
    <!-- ear cups -->
    <g>
      <rect x="796" y="196" width="34" height="62" rx="12" fill="#2b2244" stroke="${C.cyan}" stroke-width="2"/>
      <rect x="1030" y="196" width="34" height="62" rx="12" fill="#2b2244" stroke="${C.cyan}" stroke-width="2"/>
      <rect x="808" y="212" width="10" height="30" rx="5" fill="${C.cyan}" filter="url(#glow)">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="1.6s" repeatCount="indefinite"/></rect>
      <rect x="1042" y="212" width="10" height="30" rx="5" fill="${C.red}" filter="url(#glow)">
        <animate attributeName="opacity" values="1;0.3;1" dur="1.6s" repeatCount="indefinite"/></rect>
    </g>
  </g>

  <!-- equalizer under the title: music for Orpheus -->
  <g transform="translate(470 92)">
    ${Array.from({ length: 9 }, (_, i) => {
      const d = (0.8 + rnd() * 0.9).toFixed(2);
      return `<rect x="${i * 9}" y="0" width="5" height="30" rx="2" fill="${i % 2 ? C.cyan : C.red}" opacity="0.8">
        <animate attributeName="height" values="6;30;12;24;6" dur="${d}s" repeatCount="indefinite"/>
        <animate attributeName="y" values="24;0;18;6;24" dur="${d}s" repeatCount="indefinite"/></rect>`;
    }).join('')}
  </g>

  <rect width="${W}" height="${H}" fill="url(#scan)"/>
  </g>
  <rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="22" fill="none" stroke="${C.line}" stroke-width="2"/>
</svg>`;
}

/* ───────────────────────── pixel wolf ───────────────────────── */
const SPRITE = [
  '.DD..........DD.',
  '.DPD........DPD.',
  '.DPPD......DPPD.',
  '.BPPBBBBBBBBPPB.',
  'BBBBBBDDDDBBBBBB',
  'BBBBBBBDDBBBBBBB',
  'BBW##BBBBBB##WBB',
  'BBW#$BBLLBB$#WBB',
  'WBBWWBLLLLBWWBBW',
  'WWBBBLLLLLLBBBWW',
  '.WWWLLLLLLLLWWW.',
  '..WWWLLKKLLWWW..',
  '...WWWWWWWWWW...',
  '....WWWWWWWW....',
  '......WWWW......',
];
const SPAL = { B: W_.fur, D: W_.dark, P: '#2a1810', L: '#b07a4c', W: W_.cream, K: C.bg, '#': C.cyan, $: C.bg };

function pixelWolf(x0, y0, px) {
  let body = '', eyes = '';
  SPRITE.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch === '.') return;
    const r = `<rect x="${x0 + x * px}" y="${y0 + y * px}" width="${px}" height="${px}" fill="${SPAL[ch]}"/>`;
    if (ch === '#' || ch === '$') eyes += r; else body += r;
  }));
  // closed eyes: fur covers the open ones for a beat
  const lid = [[3, 4], [11, 12]].map(([a, b]) =>
    `<rect x="${x0 + a * px}" y="${y0 + 6 * px}" width="${(b - a + 1) * px}" height="${px * 2}" fill="${W_.fur}"/>` +
    `<rect x="${x0 + a * px}" y="${y0 + 7 * px}" width="${(b - a + 1) * px}" height="${px / 2}" fill="${C.bg}"/>`).join('');
  return `<g shape-rendering="crispEdges">${body}<g filter="url(#glow)">${eyes}</g>
    <g opacity="0"><animate attributeName="opacity" values="0;0;1;0;0" keyTimes="0;0.9;0.92;0.96;1" dur="4.5s" repeatCount="indefinite"/>${lid}</g></g>`;
}

/* ───────────────────────── neofetch card ───────────────────────── */
function neofetch() {
  const W = 900, H = 420;
  const info = [
    ['OS', 'Windows 11 · PowerShell · bash'],
    ['Species', 'Brown wolf (Canis lupus digitalis)'],
    ['Host', 'Skarlet White'],
    ['Kernel', 'omen-is-dead'],
    ['Uptime', 'since first spawn'],
    ['Langs', 'JavaScript · TypeScript · C++ · GDScript'],
    ['Builds', 'Electron · Godot · Next.js · VST3'],
    ['Motto', '"not good in anything, bad at everything"'],
  ];
  const X = 330, Y0 = 96, LH = 30;
  const fade = (i) => `opacity="0"><animate attributeName="opacity" from="0" to="1" begin="${(0.3 + i * 0.18).toFixed(2)}s" dur="0.35s" fill="freeze"/`;
  const rows = info.map(([k, v], i) => `<text x="${X}" y="${Y0 + (i + 2) * LH}" font-size="17" ${fade(i + 2)}>
      <tspan fill="${C.red}" font-weight="700">${k}</tspan><tspan x="${X + 100}" fill="${C.white}">${esc(v)}</tspan></text>`).join('\n');
  const swatches = [C.bg, C.red4, C.red3, C.red, C.pink, C.cyan, '#5ee7e4', C.white]
    .map((c, i) => `<rect x="${X + i * 34}" y="${Y0 + 10 * LH + 2}" width="34" height="20" fill="${c}"/>`).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="${MONO}">
  <defs>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <radialGradient id="halo"><stop offset="0" stop-color="${C.red}" stop-opacity="0.28"/><stop offset="1" stop-color="${C.red}" stop-opacity="0"/></radialGradient>
  </defs>
  <rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="16" fill="${C.panel}" stroke="${C.line}" stroke-width="2"/>
  <path d="M1 40 V17 a16 16 0 0 1 16 -16 H${W - 17} a16 16 0 0 1 16 16 V40 Z" fill="#1a1330"/>
  <circle cx="26" cy="21" r="6" fill="#ff5f57"/><circle cx="46" cy="21" r="6" fill="#febc2e"/><circle cx="66" cy="21" r="6" fill="#28c840"/>
  <text x="${W / 2}" y="26" font-size="14" fill="${C.grey}" text-anchor="middle">abrefoe@omen: ~/neofetch</text>

  <circle cx="160" cy="215" r="150" fill="url(#halo)"/>
  <g>
    <animateTransform attributeName="transform" type="translate" values="0 0;0 -5;0 0" dur="3s" repeatCount="indefinite"/>
    ${pixelWolf(48, 100, 14)}
  </g>
  <text x="160" y="345" font-size="13" fill="${C.grey}" text-anchor="middle">[ sprite: wolf.png 16×15 ]</text>

  <text x="${X}" y="${Y0}" font-size="20" font-weight="700" ${fade(0)}><tspan fill="${C.red}">abrefoe</tspan><tspan fill="${C.white}">@</tspan><tspan fill="${C.cyan}">omen</tspan></text>
  <text x="${X}" y="${Y0 + LH}" font-size="17" fill="${C.line}" ${fade(1)}>────────────────────────────────────</text>
  ${rows}
  <g ${fade(info.length + 2)}>${swatches}</g>
  <g transform="translate(${W - 30} ${H - 22})" opacity="0.5">${paw(0, 0, 0.7, 20)}</g>
</svg>`;
}

/* ───────────────────────── paw divider ───────────────────────── */
function divider() {
  const W = 1200, H = 56, N = 14, dur = 5;
  const paws = Array.from({ length: N }, (_, i) => {
    const x = 60 + i * ((W - 120) / (N - 1));
    const y = i % 2 ? 36 : 20;
    const col = i % 2 ? C.cyan : C.red;
    const a = (i / N) * 0.6;
    return `<g opacity="0"><animate attributeName="opacity" dur="${dur}s" repeatCount="indefinite"
        values="0;0;1;1;0" keyTimes="0;${a.toFixed(3)};${(a + 0.04).toFixed(3)};0.85;1"/>${paw(x, y, 0.8, 90, col)}</g>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <line x1="20" y1="28" x2="${W - 20}" y2="28" stroke="${C.line}" stroke-width="1.5" stroke-dasharray="2 8"/>
  ${paws}
</svg>`;
}

/* ───────────────────────── project cards ───────────────────────── */
const LANG = { JavaScript: '#f1e05a', 'C++': '#f34b7d', TypeScript: '#3178c6', GDScript: '#355570' };
const ICON = {
  // tiny line icons drawn in a 32×32 box
  broom: '<path d="M22 4 L13 17 M9 16 l9 6 l-5 8 l-11 -7 z M6 25 l-3 5 M10 27 l-2 4" />',
  wave: '<path d="M2 16 h4 l3 -9 l4 18 l4 -14 l3 10 l3 -5 h7" />',
  web: '<circle cx="16" cy="16" r="12"/><path d="M4 16 h24 M16 4 c-6 7 -6 17 0 24 M16 4 c6 7 6 17 0 24" />',
  dice: '<path d="M16 3 l12 7 v12 l-12 7 l-12 -7 v-12 z M4 10 l12 7 l12 -7 M16 17 v12" />',
  crosshair: '<circle cx="16" cy="16" r="10"/><path d="M16 2 v8 M16 22 v8 M2 16 h8 M22 16 h8" />',
  snake: '<circle cx="16" cy="16" r="11"/><path d="M27 16 l3 -3 M27 16 l3 3" /><circle cx="20" cy="10" r="1.2" fill="currentColor"/>',
};
function card({ name, desc, lang, icon, tag }) {
  const W = 420, H = 150;
  const lines = desc.map((l, i) => `<text x="24" y="${78 + i * 22}" font-size="14" fill="${C.grey}">${esc(l)}</text>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="${MONO}">
  <defs>
    <linearGradient id="edge" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${C.red}"/><stop offset="1" stop-color="${C.cyan}"/>
    </linearGradient>
    <linearGradient id="sweep" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.06"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <clipPath id="c"><rect width="${W}" height="${H}" rx="14"/></clipPath>
  </defs>
  <g clip-path="url(#c)">
    <rect width="${W}" height="${H}" fill="${C.panel}"/>
    <rect x="-200" width="160" height="${H}" fill="url(#sweep)" transform="skewX(-20)">
      <animate attributeName="x" values="-200;-200;${W + 100}" keyTimes="0;0.6;1" dur="6s" repeatCount="indefinite"/></rect>
    <rect width="${W}" height="3" fill="url(#edge)"/>
  </g>
  <rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="14" fill="none" stroke="${C.line}" stroke-width="1.5"/>
  <g transform="translate(${W - 52} 20)" fill="none" stroke="${C.cyan}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" color="${C.cyan}" opacity="0.9">${ICON[icon]}</g>
  <text x="24" y="44" font-size="22" font-weight="700" fill="${C.red}">${esc(name)}</text>
  ${tag ? `<text x="${24 + name.length * 13.5 + 10}" y="43" font-size="12" fill="${C.cyan}">${esc(tag)}</text>` : ''}
  ${lines}
  <circle cx="30" cy="130" r="6" fill="${LANG[lang]}"/>
  <text x="44" y="135" font-size="13" fill="${C.white}">${esc(lang)}</text>
  <g transform="translate(${W - 26} ${H - 24})" opacity="0.35">${paw(0, 0, 0.55, 25)}</g>
</svg>`;
}

const projects = [
  { file: 'OmenCleaner', name: 'OmenCleaner', lang: 'JavaScript', icon: 'broom', tag: 'v1.7',
    desc: ['Чистильщик диска и деинсталлятор', 'для Windows на Electron. RU / EN.'] },
];

const write = (name, svg) => writeFileSync(join(out, name), svg.replace(/\n\s*\n/g, '\n'));
write('banner.svg', banner());
write('neofetch.svg', neofetch());
write('divider.svg', divider());
for (const p of projects) write(`card-${p.file}.svg`, card(p));
console.log('assets written to', out);

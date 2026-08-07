'use strict';

const ATTENUATION = 0.19;

const NAMED_COLORS = {
  red: [255, 0, 0],
  green: [0, 128, 0],
  blue: [0, 0, 255],
  yellow: [255, 255, 0],
  cyan: [0, 255, 255],
  aqua: [0, 255, 255],
  magenta: [255, 0, 255],
  purple: [128, 0, 128],
  orange: [255, 165, 0],
  pink: [255, 105, 180],
  brown: [139, 69, 19],
  teal: [0, 128, 128],
  navy: [0, 0, 128],
  maroon: [128, 0, 0],
  olive: [128, 128, 0],
  lime: [0, 255, 0],
  gold: [255, 215, 0],
  silver: [192, 192, 192],
  gray: [128, 128, 128],
  grey: [128, 128, 128],
  white: [255, 255, 255],
  black: [0, 0, 0]
};

const DEFAULT_BG = [11, 11, 11];

const AUTO_PALETTE = [
  'red',
  'green',
  'blue',
  'yellow',
  'magenta',
  'cyan',
  'orange',
  'purple'
];

const CONSOLE_COLORS = [
  { name: 'Black', cmd: '0', rgb: [0, 0, 0] },
  { name: 'DarkBlue', cmd: '1', rgb: [0, 0, 128] },
  { name: 'DarkGreen', cmd: '2', rgb: [0, 128, 0] },
  { name: 'DarkCyan', cmd: '3', rgb: [0, 128, 128] },
  { name: 'DarkRed', cmd: '4', rgb: [128, 0, 0] },
  { name: 'DarkMagenta', cmd: '5', rgb: [128, 0, 128] },
  { name: 'DarkYellow', cmd: '6', rgb: [128, 128, 0] },
  { name: 'Gray', cmd: '7', rgb: [192, 192, 192] },
  { name: 'DarkGray', cmd: '8', rgb: [128, 128, 128] },
  { name: 'Blue', cmd: '9', rgb: [0, 0, 255] },
  { name: 'Green', cmd: 'A', rgb: [0, 255, 0] },
  { name: 'Cyan', cmd: 'B', rgb: [0, 255, 255] },
  { name: 'Red', cmd: 'C', rgb: [255, 0, 0] },
  { name: 'Magenta', cmd: 'D', rgb: [255, 0, 255] },
  { name: 'Yellow', cmd: 'E', rgb: [255, 255, 0] },
  { name: 'White', cmd: 'F', rgb: [255, 255, 255] }
];

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function parseHex(hex) {
  let h = hex.replace(/^#/, '');
  if (h.length === 3) {
    h = h.split('').map((c) => c + c).join('');
  }
  if (!/^[0-9a-f]{6}$/i.test(h)) return null;
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16)
  ];
}

function parseRgb(str) {
  let m = str.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/);
  if (!m) m = str.match(/^(\d+)\s*,\s*(\d+)\s*,\s*(\d+)$/);
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3])].map((n) => clamp(n, 0, 255));
}

function attenuate(rgb) {
  
  return rgb.map((v) => Math.floor(v * ATTENUATION));
}

function parseColor(raw, { filterFunc = null } = {}) {
  if (typeof raw !== 'string') return null;
  const str = raw.trim();
  if (!str) return null;

  let rgb = null;
  let explicit = false;

  if (str[0] === '#') {
    rgb = parseHex(str);
    explicit = true;
  } else if (/^rgb\(/i.test(str) || /^[0-9]{1,3},[0-9]{1,3},[0-9]{1,3}$/.test(str)) {
    rgb = parseRgb(str);
    explicit = true;
  } else {
    const base = NAMED_COLORS[str.toLowerCase()];
    if (base) rgb = base.slice();
    explicit = true; 
  }

  if (!rgb) return null;

  rgb = filterFunc? filterFunc(rgb) : rgb;

  return { rgb, explicit, source: str };
}

function luminance(rgb) {
  const lin = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

function contrastText(rgb) {
  return luminance(rgb) > 0.5 ? [0, 0, 0] : [255, 255, 255];
}

function nearestConsoleColor(rgb, { excludeBlack = false } = {}) {
  let best = null;
  let bestDist = Infinity;
  for (const c of CONSOLE_COLORS) {
    if (excludeBlack && c.name === 'Black') continue;
    const d = (rgb[0] - c.rgb[0]) ** 2 + (rgb[1] - c.rgb[1]) ** 2 + (rgb[2] - c.rgb[2]) ** 2;
    if (d < bestDist) {
      bestDist = d;
      best = c;
    }
  }
  return best;
}

const DARK_CONSOLE_COLORS = [
  { name: 'Black', cmd: '0', rgb: [0, 0, 0] },
  { name: 'DarkBlue', cmd: '1', rgb: [0, 0, 128] },
  { name: 'DarkGreen', cmd: '2', rgb: [0, 128, 0] },
  { name: 'DarkCyan', cmd: '3', rgb: [0, 128, 128] },
  { name: 'DarkRed', cmd: '4', rgb: [128, 0, 0] },
  { name: 'DarkMagenta', cmd: '5', rgb: [128, 0, 128] },
  { name: 'DarkYellow', cmd: '6', rgb: [128, 128, 0] },
  { name: 'DarkGray', cmd: '8', rgb: [128, 128, 128] }
];

function hueOf(rgb) {
  const max = Math.max(...rgb);
  const min = Math.min(...rgb);
  const sat = max === 0 ? 0 : (max - min) / max;
  if (sat < 0.1) return null;
  const d = max - min;
  let h;
  if (max === rgb[0]) h = ((rgb[1] - rgb[2]) / d) % 6;
  else if (max === rgb[1]) h = (rgb[2] - rgb[0]) / d + 2;
  else h = (rgb[0] - rgb[1]) / d + 4;
  return (((h * 60) % 360) + 360) % 360;
}

function hueDistance(a, b) {
  let d = Math.abs(a - b);
  if (d > 180) d = 360 - d;
  return d;
}

function euclid(a, b) {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);
}

function legacyColorFor(rgb, { explicit = false } = {}) {
  if (explicit) return nearestConsoleColor(rgb);
  const targetHue = hueOf(rgb);
  let best = null;
  let bestScore = Infinity;
  for (const c of DARK_CONSOLE_COLORS) {
    let score;
    if (targetHue === null) {
      score = euclid(rgb, c.rgb);
    } else {
      const cHue = hueOf(c.rgb);
      const hd = cHue === null ? 180 : hueDistance(targetHue, cHue);
      score = hd + 0.12 * euclid(rgb, c.rgb);
    }
    if (score < bestScore) {
      bestScore = score;
      best = c;
    }
  }
  return best;
}

function rgbToHex(rgb) {
  return '#' + rgb.map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');
}

module.exports = {
  attenuate,
  parseColor,
  luminance,
  contrastText,
  nearestConsoleColor,
  legacyColorFor,
  rgbToHex,
  DEFAULT_BG,
  AUTO_PALETTE
};

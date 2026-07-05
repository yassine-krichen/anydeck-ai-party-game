// Generates all app icons + splash glyph as PNGs. No dependencies —
// shapes are rendered with signed-distance functions and encoded by hand.
// Run once: node scripts/generate-icons.js
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const OUT = path.join(__dirname, '..', 'assets', 'images');

const INK = [16, 16, 20];
const INK_RAISED = [42, 42, 51];
const AMBER = [232, 145, 45];
const WHITE = [255, 255, 255];

// ---- PNG encoding -----------------------------------------------------

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4);
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type), data])), 8 + data.length);
  return out;
}

function encodePng(size, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // filter: none
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---- Shape rendering --------------------------------------------------

// Distance to a rounded rectangle rotated by `angle` around (cx, cy).
function roundedRectSdf(px, py, cx, cy, w, h, radius, angle) {
  const cos = Math.cos(-angle);
  const sin = Math.sin(-angle);
  const dx0 = px - cx;
  const dy0 = py - cy;
  const x = dx0 * cos - dy0 * sin;
  const y = dx0 * sin + dy0 * cos;
  const qx = Math.abs(x) - (w / 2 - radius);
  const qy = Math.abs(y) - (h / 2 - radius);
  const ox = Math.max(qx, 0);
  const oy = Math.max(qy, 0);
  return Math.hypot(ox, oy) + Math.min(Math.max(qx, qy), 0) - radius;
}

function circleSdf(px, py, cx, cy, r) {
  return Math.hypot(px - cx, py - cy) - r;
}

function coverage(dist) {
  return Math.min(1, Math.max(0, 0.5 - dist));
}

function blend(dst, src, alpha) {
  dst[0] = src[0] * alpha + dst[0] * (1 - alpha);
  dst[1] = src[1] * alpha + dst[1] * (1 - alpha);
  dst[2] = src[2] * alpha + dst[2] * (1 - alpha);
  dst[3] = Math.min(255, 255 * alpha + dst[3] * (1 - alpha));
}

/**
 * The mark: two stacked game cards, back card in raised ink, front card in
 * amber tilted the other way, with a "correct tilt" notch cut as a pip.
 * mode: 'full' (ink bg), 'glyph' (transparent bg), 'mono' (white on clear)
 */
function render(size, mode, glyphScale = 1) {
  const rgba = Buffer.alloc(size * size * 4);
  const s = (v) => (v / 1024) * size * glyphScale;
  const c = size / 2;
  const SS = 2; // 2x2 supersampling

  const backColor = mode === 'mono' ? WHITE : INK_RAISED;
  const frontColor = mode === 'mono' ? WHITE : AMBER;
  const pipColor = mode === 'mono' ? [0, 0, 0] : INK;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const px = [0, 0, 0, 0];
      if (mode === 'full') {
        px[0] = INK[0];
        px[1] = INK[1];
        px[2] = INK[2];
        px[3] = 255;
      }
      let backA = 0;
      let frontA = 0;
      let pipA = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const fx = x + (sx + 0.5) / SS;
          const fy = y + (sy + 0.5) / SS;
          backA += coverage(
            roundedRectSdf(fx, fy, c + s(52), c - s(40), s(430), s(590), s(64), 0.16)
          );
          frontA += coverage(
            roundedRectSdf(fx, fy, c - s(40), c + s(20), s(430), s(590), s(64), -0.14)
          );
          pipA += coverage(circleSdf(fx, fy, c - s(150), c - s(160), s(58)));
        }
      }
      backA /= SS * SS;
      frontA /= SS * SS;
      pipA /= SS * SS;

      if (mode === 'mono') {
        // Union of both cards as one white glyph, pip punched out.
        const union = Math.max(backA, frontA);
        const a = Math.max(0, union - pipA * frontA);
        blend(px, WHITE, 0);
        px[0] = 255;
        px[1] = 255;
        px[2] = 255;
        px[3] = Math.round(255 * a);
      } else {
        blend(px, backColor, backA);
        blend(px, frontColor, frontA);
        blend(px, pipColor, pipA * frontA);
      }

      const i = (y * size + x) * 4;
      rgba[i] = Math.round(px[0]);
      rgba[i + 1] = Math.round(px[1]);
      rgba[i + 2] = Math.round(px[2]);
      rgba[i + 3] = Math.round(px[3]);
    }
  }
  return encodePng(size, rgba);
}

function solid(size, color) {
  const rgba = Buffer.alloc(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    rgba[i * 4] = color[0];
    rgba[i * 4 + 1] = color[1];
    rgba[i * 4 + 2] = color[2];
    rgba[i * 4 + 3] = 255;
  }
  return encodePng(size, rgba);
}

fs.mkdirSync(OUT, { recursive: true });
const files = {
  'icon.png': render(1024, 'full'),
  'android-icon-foreground.png': render(1024, 'glyph', 0.62),
  'android-icon-background.png': solid(1024, INK),
  'android-icon-monochrome.png': render(1024, 'mono', 0.62),
  'splash-icon.png': render(512, 'glyph'),
  'favicon.png': render(48, 'full'),
};
for (const [name, buf] of Object.entries(files)) {
  fs.writeFileSync(path.join(OUT, name), buf);
  console.log('wrote', name, `${(buf.length / 1024).toFixed(1)} KB`);
}

// Generates the game's sound effects as small mono 16-bit WAV files.
// Run once: node scripts/generate-sounds.js
// No dependencies — writes PCM + WAV header by hand.
const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 22050;
const OUT_DIR = path.join(__dirname, '..', 'assets', 'sounds');

function wavFile(samples) {
  const dataSize = samples.length * 2;
  const buf = Buffer.alloc(44 + dataSize);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + dataSize, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(1, 22); // mono
  buf.writeUInt32LE(SAMPLE_RATE, 24);
  buf.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(dataSize, 40);
  samples.forEach((s, i) => {
    buf.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(s * 32767))), 44 + i * 2);
  });
  return buf;
}

// tone segments: [{ freq | freqTo (slide), seconds, gain, decay }]
function render(segments) {
  const samples = [];
  for (const seg of segments) {
    const n = Math.floor(seg.seconds * SAMPLE_RATE);
    const from = seg.freq;
    const to = seg.freqTo ?? seg.freq;
    let phase = 0;
    for (let i = 0; i < n; i++) {
      const t = i / n;
      const freq = from + (to - from) * t;
      phase += (2 * Math.PI * freq) / SAMPLE_RATE;
      const attack = Math.min(1, i / (0.005 * SAMPLE_RATE));
      const env = attack * Math.pow(1 - t, seg.decay ?? 1.5);
      let value = Math.sin(phase);
      if (seg.overtone) value = value * 0.7 + Math.sin(phase * 2) * 0.3;
      samples.push(value * (seg.gain ?? 0.5) * env);
    }
  }
  return samples;
}

const sounds = {
  'tick.wav': render([{ freq: 1250, seconds: 0.05, gain: 0.4, decay: 3 }]),
  'countdown.wav': render([{ freq: 660, seconds: 0.12, gain: 0.45, decay: 2 }]),
  'correct.wav': render([
    { freq: 523, seconds: 0.09, gain: 0.5, decay: 1, overtone: true },
    { freq: 784, seconds: 0.16, gain: 0.5, decay: 1.8, overtone: true },
  ]),
  'skip.wav': render([{ freq: 320, freqTo: 170, seconds: 0.22, gain: 0.45, decay: 1.2 }]),
  'round-end.wav': render([
    { freq: 523, seconds: 0.14, gain: 0.5, decay: 1, overtone: true },
    { freq: 659, seconds: 0.14, gain: 0.5, decay: 1, overtone: true },
    { freq: 784, seconds: 0.4, gain: 0.55, decay: 1.6, overtone: true },
  ]),
};

fs.mkdirSync(OUT_DIR, { recursive: true });
for (const [name, samples] of Object.entries(sounds)) {
  fs.writeFileSync(path.join(OUT_DIR, name), wavFile(samples));
  console.log('wrote', name);
}

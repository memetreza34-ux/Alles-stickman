import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFileAsync } from './pipeline.js';
import { findMetaLeaks } from './image-prompts.js';

// OCR-Prüfung der fertigen Bilder vor dem Render. Kalibriert an den echten Fehlern der
// bisherigen Videos: „Geplanter Hold 6.47s“ (Wasser) und „Bild 05“ (GPS).

// Wortmuster sind so spezifisch, dass schon unsichere OCR-Treffer zählen.
const META_WORDS = [
  [/^\[?bild\b/i, 'Dateiname/Bildnummer'],
  [/^hold\W*$/i, 'Haltezeit'],
  [/^gepl/i, 'Planungsnotiz'],
  [/^\d+[.,]\d+s?$|^\d{2,4}s$/i, 'Zeitangabe'],
  [/\.(png|jpe?g)$/i, 'Dateiendung'],
  [/^scene/i, 'Szenenkennung']
];
const META_MIN_CONFIDENCE = 40;
const TEXT_MIN_CONFIDENCE = 75;

export function parseTesseractTsv(tsv) {
  const lines = new Map();
  for (const row of String(tsv).split('\n').slice(1)) {
    const cols = row.split('\t');
    if (cols.length < 12) continue;
    const [level, page, block, par, line, , , , , , conf, ...rest] = cols;
    const text = rest.join('\t').trim();
    if (Number(level) !== 5 || !text) continue;
    const key = `${page}-${block}-${par}-${line}`;
    if (!lines.has(key)) lines.set(key, []);
    lines.get(key).push({ text, conf: Number(conf) });
  }
  return [...lines.values()];
}

const letters = (text) => text.replace(/[^A-Za-zÄÖÜäöüß]/g, '');

export function classifyOcrLines(lines, { allowed = [] } = {}) {
  const allowedWords = new Set(allowed.flatMap((label) => String(label).toLowerCase().split(/\s+/)).map(letters));
  const meta = [];
  const text = [];
  for (const words of lines) {
    const reasons = new Set();
    for (const word of words.filter((w) => w.conf >= META_MIN_CONFIDENCE)) {
      for (const [pattern, label] of META_WORDS) if (pattern.test(word.text)) reasons.add(label);
    }
    const confident = words.filter((w) => w.conf >= TEXT_MIN_CONFIDENCE && letters(w.text).length >= 4);
    for (const leak of findMetaLeaks(confident.map((w) => w.text).join(' '))) reasons.add(leak.label);
    if (reasons.size) {
      meta.push({ text: words.filter((w) => w.conf >= META_MIN_CONFIDENCE).map((w) => w.text).join(' '), reasons: [...reasons] });
      continue;
    }
    const unexpected = confident.filter((w) => !allowedWords.has(letters(w.text).toLowerCase()));
    if (unexpected.length) text.push(unexpected.map((w) => w.text).join(' '));
  }
  return { meta, text };
}

// Doppelte Größe in Graustufen: findet handgezeichnete Überschriften, die im Original übersehen werden.
export async function ocrImage(file) {
  const dir = await mkdtemp(path.join(tmpdir(), 'stickman-ocr-'));
  try {
    const scaled = path.join(dir, 'scaled.png');
    await execFileAsync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', file, '-vf', 'scale=iw*2:-1,format=gray', scaled]);
    const { stdout } = await execFileAsync('tesseract', [scaled, 'stdout', '--psm', '11', 'tsv'], { maxBuffer: 16 * 1024 * 1024 });
    return parseTesseractTsv(stdout);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

export async function tesseractAvailable() {
  try {
    await execFileAsync('tesseract', ['--version']);
    return true;
  } catch {
    return false;
  }
}

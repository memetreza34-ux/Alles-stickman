import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFileAsync, exists } from './pipeline.js';

// Erfolgsformat im Genre (Ink Explainer): 2–4 Wörter, Gelb, dicke schwarze Kontur, oben.
// Die KI zeichnet das Cover ohne Text; die Headline kommt hier exakt und fehlerfrei dazu.
const FONTS = [
  '/System/Library/Fonts/Supplemental/Arial Black.ttf',
  '/System/Library/Fonts/Supplemental/Impact.ttf',
  '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
];

export function headlineFontSize(text, width = 1920, height = 1080) {
  const chars = Math.max(String(text).length, 1);
  return Math.floor(Math.min(height * 0.17, (width * 0.9) / (chars * 0.72)));
}

export async function renderThumbnail(cover, output, headline) {
  const font = (await Promise.all(FONTS.map(async (f) => ((await exists(f)) ? f : null)))).find(Boolean);
  if (!font) throw new Error('Keine fette Schrift für die Thumbnail-Headline gefunden.');
  const text = String(headline).trim().toUpperCase();
  const dir = await mkdtemp(path.join(tmpdir(), 'stickman-thumb-'));
  try {
    const textFile = path.join(dir, 'headline.txt');
    await writeFile(textFile, text, 'utf8');
    const size = headlineFontSize(text);
    const draw = [
      `fontfile='${font}'`, `textfile='${textFile}'`, `fontsize=${size}`,
      'fontcolor=#FFD400', `borderw=${Math.round(size * 0.09)}`, 'bordercolor=black',
      'x=(w-text_w)/2', 'y=h*0.06'
    ].join(':');
    await execFileAsync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', cover,
      '-vf', `scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,drawtext=${draw}`, '-frames:v', '1', output]);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

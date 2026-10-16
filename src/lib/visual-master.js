import { readFile } from 'node:fs/promises';
import path from 'node:path';

export const CANONICAL_STYLE_PATH = 'channel/MASTER_VISUAL_STYLE_EN.txt';
export const CANONICAL_STYLE_TOKEN = '{{CANONICAL_VISUAL_STYLE}}';

export async function loadCanonicalVisualStyle(root = process.cwd()) {
  const text = (await readFile(path.resolve(root, CANONICAL_STYLE_PATH), 'utf8')).trim();
  if (!text.includes('VISUAL_STYLE_EDITION: premium-illustrated-explainer-v14')) {
    throw new Error('Canonical visual master is missing v14 edition.');
  }
  return text;
}

export function embedCanonicalVisualStyle(text, style) {
  if (!text.includes(CANONICAL_STYLE_TOKEN)) {
    throw new Error('Expected canonical visual style placeholder in Google Flow template.');
  }
  return text.replaceAll(CANONICAL_STYLE_TOKEN, style);
}

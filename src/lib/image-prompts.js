import { readFile } from 'node:fs/promises';
import path from 'node:path';

// Pipeline v8: Bildprompts werden aus SCENE_VISUALS_EN.json erzeugt, nicht von Hand geschrieben.
// Grund (Wasser- und GPS-Video): Metazeilen wie "OUTPUT FILE: Bild 14.png" oder
// "Geplanter Hold 4.57s" im Prompt wurden vom Bildmodell als sichtbarer Text gerendert.

export const STYLE_BLOCK_PATH = 'channel/STYLE_BLOCK_EN.txt';
export const CHARACTER_BIBLE_PATH = 'channel/CHARACTER_BIBLE_EN.txt';
export const SHOT_TYPES = ['close-up', 'medium', 'wide', 'top-down', 'cutaway', 'split'];
export const PROMPT_START = '▼▼▼ PROMPT START ▼▼▼';
export const PROMPT_END = '▲▲▲ PROMPT ENDE ▲▲▲';

const SHOT_TEXT = {
  'close-up': 'Close-up shot: the main subject fills most of the frame, emotion or detail is unmistakable.',
  medium: 'Medium shot: characters from head to knees with the key object clearly visible.',
  wide: 'Wide shot: the setting is readable, the main subject stays large and clear in the foreground.',
  'top-down': 'Top-down bird\'s-eye view: shapes and paths are simple, bold and easy to follow.',
  cutaway: 'Clean cutaway view that reveals the hidden inner mechanism with bold, simple parts.',
  split: 'Two clearly separated side-by-side moments that compare one single difference.'
};

const NO_TEXT_RULE = 'No text, letters, numbers, labels, signs, captions, logos or watermarks anywhere in the image.';

// Alles, was ein Bildmodell als Schrift ins Bild übernehmen könnte, aber nur Produktionsinfo ist.
const META_PATTERNS = [
  [/\bBild[\s_-]*\d+/i, 'Dateiname/Bildnummer'],
  [/\bSCENE[\s_-]*(KEY|ID|NUMBER)\b/i, 'Szenenkennung'],
  [/\bOUTPUT\s+FILE\b/i, 'Dateiangabe'],
  [/\.(png|jpe?g|webp)\b/i, 'Dateiendung'],
  [/\bplanned\s+hold\b|\bhold\s*[:=]?\s*\d/i, 'Haltezeit'],
  [/\bgeplant/i, 'Planungsnotiz'],
  [/\b\d+[.,]\d+\s?s\b|\b\d+\s?(sek|sekunden|sec|seconds)\b/i, 'Zeitangabe'],
  [/\b(audio|start|end)[\s_-]?anchor\b/i, 'Audioanker'],
  [/\btiming\s+(note|metadata|info)/i, 'Timing-Notiz'],
  [/\b(replace the previous|previously weak|previous version|instead of the old)\b/i, 'Revisionsnotiz'],
  [/VISUAL_STYLE_EDITION|PROMPT_LANGUAGE|ACTIVE_STYLE_ID/i, 'Steuerzeile'],
  [/\bv\d{1,2}\b/i, 'Versionskennung'],
  [/\b\d{3,4}\s?x\s?\d{3,4}\b/i, 'Auflösung']
];

export function findMetaLeaks(text) {
  const leaks = [];
  for (const [pattern, label] of META_PATTERNS) {
    const match = String(text ?? '').match(pattern);
    if (match) leaks.push({ label, match: match[0] });
  }
  return leaks;
}

export async function loadPromptKit(root = process.cwd(), visualPolicy = null) {
  const [style, characters] = await Promise.all([
    readFile(path.resolve(root, STYLE_BLOCK_PATH), 'utf8'),
    readFile(path.resolve(root, CHARACTER_BIBLE_PATH), 'utf8')
  ]);
  const visual = visualPolicy ?? JSON.parse(await readFile(path.resolve(root, 'config/visual-policy.json'), 'utf8'));
  return { style: style.trim(), characters: characters.trim(), protagonist: visual.protagonist ?? null };
}

function protagonistLine(kit, scene) {
  if (!scene.protagonist || !kit.protagonist?.descriptionEn) return '';
  return `MAIN CHARACTER: ${kit.protagonist.descriptionEn}`;
}

export function buildScenePrompt(kit, scene) {
  const shot = SHOT_TEXT[scene.shot] ?? SHOT_TEXT.medium;
  return [
    `STYLE: ${kit.style}`,
    `PEOPLE: ${kit.characters}`,
    protagonistLine(kit, scene),
    `SCENE: ${String(scene.brief).trim()}`,
    `CAMERA: ${shot}`,
    scene.palette ? `COLORS: ${String(scene.palette).trim()}` : '',
    `TEXT: ${NO_TEXT_RULE}`
  ].filter(Boolean).join('\n\n');
}

export function buildCoverPrompt(kit, cover) {
  return [
    `STYLE: ${kit.style} Bright, saturated colors and very high contrast for a YouTube thumbnail.`,
    `PEOPLE: ${kit.characters}`,
    kit.protagonist?.descriptionEn ? `MAIN CHARACTER: ${kit.protagonist.descriptionEn}` : '',
    `SCENE: ${String(cover.brief).trim()}`,
    'CAMERA: One big stick-figure face with a strong, instantly readable emotion fills about 40 percent of the frame, plus one clear story object. Simple background. Keep the top third calm and empty for a headline that is added later.',
    `TEXT: ${NO_TEXT_RULE}`
  ].filter(Boolean).join('\n\n');
}

export function validateScenePlan(plan, { plannedImageCount } = {}) {
  const errors = [];
  const warnings = [];
  if (Number(plan?.schemaVersion) !== 2) errors.push('SCENE_VISUALS_EN.json braucht schemaVersion 2 (Pipeline v8).');
  if (plan?.status !== 'READY') errors.push('SCENE_VISUALS_EN.json muss auf READY stehen.');
  const scenes = Array.isArray(plan?.scenes) ? plan.scenes : [];
  if (Number.isInteger(plannedImageCount) && scenes.length !== plannedImageCount) {
    errors.push(`SCENE_VISUALS_EN.json hat ${scenes.length} Szenen, erwartet ${plannedImageCount}.`);
  }
  scenes.forEach((scene, index) => {
    const n = index + 1;
    if (Number(scene.sceneNumber) !== n) errors.push(`Szenennummern müssen lückenlos sein: erwartet ${n}.`);
    const brief = String(scene.brief ?? '').trim();
    if (brief.split(/\s+/).filter(Boolean).length < 15) errors.push(`Szene ${n}: brief ist zu kurz (mind. 15 Wörter, konkrete Handlung).`);
    for (const leak of findMetaLeaks(brief)) errors.push(`Szene ${n}: Produktionsinfo im Bildtext (${leak.label}: "${leak.match}").`);
    if (!SHOT_TYPES.includes(scene.shot)) errors.push(`Szene ${n}: shot muss einer von ${SHOT_TYPES.join(', ')} sein.`);
  });
  const covers = Array.isArray(plan?.covers) ? plan.covers : [];
  for (const id of ['A', 'B', 'C']) {
    const cover = covers.find((item) => item.id === id);
    if (!cover || String(cover.brief ?? '').trim().split(/\s+/).length < 15) errors.push(`Cover ${id}: brief fehlt oder ist zu kurz.`);
    else for (const leak of findMetaLeaks(cover.brief)) errors.push(`Cover ${id}: Produktionsinfo im Bildtext (${leak.label}).`);
  }
  if (scenes.length >= 10) {
    const closeUps = scenes.filter((scene) => scene.shot === 'close-up').length;
    const shotKinds = new Set(scenes.map((scene) => scene.shot)).size;
    if (closeUps / scenes.length < 0.15) warnings.push(`Nur ${closeUps} Close-ups – Erfolgskanäle nutzen viele Nahaufnahmen für Emotion (Ziel ≥ 15 %).`);
    if (shotKinds < 3) warnings.push('Weniger als 3 Kameraeinstellungen – Bildfolge wirkt monoton.');
    const protagonist = scenes.filter((scene) => scene.protagonist).length;
    if (protagonist / scenes.length < 0.25) warnings.push(`Hauptfigur nur in ${protagonist} Szenen – eine wiederkehrende Figur hält Zuschauer (Ziel ≥ 25 %).`);
  }
  return { errors, warnings };
}

const pad = (n) => String(n).padStart(2, '0');

export function renderPromptFiles(kit, plan, meta) {
  const separateThumbnail = meta.coverPolicy?.separateThumbnailFromFirstScene === true;
  const files = new Map();
  const scenes = plan.scenes ?? [];
  for (const cover of plan.covers ?? []) files.set(`prompts/COVER_${cover.id}.txt`, `${buildCoverPrompt(kit, cover)}\n`);
  for (const scene of scenes) files.set(`prompts/Bild_${pad(scene.sceneNumber)}.txt`, `${buildScenePrompt(kit, scene)}\n`);

  const block = (fileName, prompt) => `Datei: ${fileName}\n${PROMPT_START}\n${prompt}\n${PROMPT_END}\n`;
  for (let first = separateThumbnail ? 1 : 2; first <= scenes.length; first += 5) {
    const last = Math.min(scenes.length, first + 4);
    const body = scenes.slice(first - 1, last)
      .map((scene) => block(`Bild ${pad(scene.sceneNumber)}.png`, buildScenePrompt(kit, scene)))
      .join('\n');
    files.set(`batches/BLOCK_${pad(first)}_${pad(last)}.txt`,
      `GOOGLE FLOW – BLOCK Bild ${pad(first)}–${pad(last)} · ${meta.title}\n\n` +
      `Für jedes Bild NUR den Text zwischen „${PROMPT_START}“ und „${PROMPT_END}“ in Google Flow einfügen.\n` +
      'Den Dateinamen nie in den Prompt schreiben. Bild speichern unter dem angegebenen Dateinamen.\n\n' + body);
  }

  const coverBlocks = (plan.covers ?? []).map((cover) => block(`TEMP_COVER_${cover.id}.png`, buildCoverPrompt(kit, cover))).join('\n');
  files.set('google-flow-prompt.txt', renderFlowMaster(meta, scenes.length) + '\n' + coverBlocks);
  return files;
}

function renderFlowMaster(meta, count) {
  const separateThumbnail = meta.coverPolicy?.separateThumbnailFromFirstScene === true;
  return `GOOGLE FLOW ABLAUF (Pipeline v8) · ${meta.title}

Bilder gesamt: ${count} (${separateThumbnail ? 'Bild 01 = erste Videoszene; Cover bleibt separat' : 'Bild 01 = gewähltes Cover (Altmodus)'})

1. Fehlt channel/style-sheet/hauptfigur.png: zuerst das Figurenblatt nach channel/style-sheet/FIGURENBLATT_PROMPT.txt erzeugen und selbst prüfen (ohne Rückfrage).
   Danach hauptfigur.png bei JEDEM Bild als Referenz anhängen. Niemals das Cover oder ein vorheriges Szenenbild als Referenz nutzen.
2. Die drei Cover-Prompts unten erzeugen (TEMP_COVER_A/B/C.png). Danach STOPP: Nutzer wählt A, B oder C. Vor der Wahl keine Videoszenen erzeugen.
3. ${separateThumbnail ? 'Gewähltes Cover als „00-bildprompts/thumbnail-source.png“ separat speichern, die zwei anderen löschen. Cover darf nie als Bild 01 der Videotimeline verwendet werden.' : 'Gewähltes Cover als „Bild 01.png“ speichern, die zwei anderen löschen.'}
4. Danach automatisch die Blöcke in batches/ abarbeiten (je max. 5 Bilder), ohne Rückfragen zwischen den Blöcken. ${separateThumbnail ? 'Bild 01.png bis Bild ' + pad(count) + '.png werden anhand ihrer EIGENEN Szenenprompts generiert.' : ''}
5. Pro Bild NUR den Text zwischen den Markierungen einfügen. Dateinamen, Nummern oder Zeiten gehören nie in den Prompt.
6. Nach jedem Block prüfen und nur durchgefallene Bilder neu erzeugen:
   – Alle Menschen sind Strichfiguren nach PEOPLE-Regel (auch Hände, auch jede Kultur)?
   – Wo MAIN CHARACTER im Prompt steht: gleicht die Figur hauptfigur.png (Kopf, Augen, Strichstärke, roter Schal)?
   – Kein Text, keine Zahlen, keine Wasserzeichen im Bild?
   – Epoche, Ort und Objekte passen zur Szene?
   – Hauptmotiv auf dem Handy in 2 Sekunden erkennbar?
7. Am Ende: alle Bilder Bild 01.png bis Bild ${pad(count)}.png flach in 00-bildprompts/images/ und
   npm run check:youtube-images -- --dir "youtube/${meta.weekFolder}/${meta.topicSlug}" ausführen.
   Jedes Bild mit gefundenem Text neu erzeugen.${separateThumbnail ? '\n   Außerdem separate Datei 00-bildprompts/thumbnail-source.png auf Existenz, Konsistenz und Textfreiheit prüfen.' : ''}

COVER-PROMPTS
`;
}

import { readFile } from 'node:fs/promises';
import path from 'node:path';

// Pipeline v8: Bildprompts werden aus SCENE_VISUALS_EN.json erzeugt, nicht von Hand geschrieben.
// Grund (Wasser- und GPS-Video): Metazeilen wie "OUTPUT FILE: Bild 14.png" oder
// "Geplanter Hold 4.57s" im Prompt wurden vom Bildmodell als sichtbarer Text gerendert.

export const STYLE_BLOCK_PATH = 'channel/STYLE_BLOCK_EN.txt';
export const CHARACTER_BIBLE_PATH = 'channel/CHARACTER_BIBLE_EN.txt';
export const CHARACTER_SHEET_PATH = 'channel/style-sheet/FIGURENBLATT_PROMPT.txt';
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
  const [style, characters, sheet] = await Promise.all([
    readFile(path.resolve(root, STYLE_BLOCK_PATH), 'utf8'),
    readFile(path.resolve(root, CHARACTER_BIBLE_PATH), 'utf8'),
    readFile(path.resolve(root, CHARACTER_SHEET_PATH), 'utf8')
  ]);
  const characterSheet = sheet.split(PROMPT_START)[1]?.split(PROMPT_END)[0]?.trim();
  if (!characterSheet) throw new Error('Figurenblatt-Prompt fehlt zwischen den Prompt-Markierungen.');
  const visual = visualPolicy ?? JSON.parse(await readFile(path.resolve(root, 'config/visual-policy.json'), 'utf8'));
  return { style: style.trim(), characters: characters.trim(), characterSheet, protagonist: visual.protagonist ?? null };
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
  const files = new Map();
  const scenes = plan.scenes ?? [];
  for (const cover of plan.covers ?? []) files.set(`prompts/COVER_${cover.id}.txt`, `${buildCoverPrompt(kit, cover)}\n`);
  for (const scene of scenes) files.set(`prompts/Bild_${pad(scene.sceneNumber)}.txt`, `${buildScenePrompt(kit, scene)}\n`);

  const block = (fileName, prompt) => `Datei: ${fileName}\n${PROMPT_START}\n${prompt}\n${PROMPT_END}\n`;
  for (let first = 2; first <= scenes.length; first += 5) {
    const last = Math.min(scenes.length, first + 4);
    const body = scenes.slice(first - 1, last)
      .map((scene) => block(`Bild ${pad(scene.sceneNumber)}.png`, buildScenePrompt(kit, scene)))
      .join('\n');
    files.set(`batches/BLOCK_${pad(first)}_${pad(last)}.txt`,
      `GOOGLE FLOW – BLOCK Bild ${pad(first)}–${pad(last)} · ${meta.title}\n\n` +
      `Für jedes Bild NUR den Text zwischen „${PROMPT_START}“ und „${PROMPT_END}“ in Google Flow einfügen.\n` +
      'Den Dateinamen nie in den Prompt schreiben. Bild speichern unter dem angegebenen Dateinamen.\n\n' + body);
  }

  files.set('google-flow-prompt.txt', renderFlowMaster(kit, plan, meta));
  return files;
}

function renderFlowMaster(kit, plan, meta) {
  const scenes = plan.scenes ?? [];
  const count = scenes.length;
  const continuity = meta.visualContinuityProfile ?? {};
  const batches = [];
  for (let first = 2; first <= count; first += 5) {
    batches.push(`Bild ${pad(first)}–Bild ${pad(Math.min(count, first + 4))}`);
  }
  const covers = (plan.covers ?? []).map((cover) =>
    `COVER OPTION ${cover.id} | save temporarily as TEMP_COVER_${cover.id}.png\n${PROMPT_START}\n${buildCoverPrompt(kit, cover)}\n${PROMPT_END}`
  ).join('\n\n');
  const register = scenes.map((scene, index) => {
    const name = `Bild ${pad(scene.sceneNumber)}.png`;
    if (index === 0) return `01 / ${name} | The user-selected cover becomes this first video image. Do NOT generate an additional opening image. Opening story context only: ${scene.brief}`;
    return [
      `${pad(scene.sceneNumber)} / ${name} | SCENE: ${String(scene.brief).trim()}`,
      `CAMERA: ${SHOT_TEXT[scene.shot] ?? SHOT_TEXT.medium}`,
      protagonistLine(kit, scene),
      scene.palette ? `COLORS: ${String(scene.palette).trim()}` : '',
      'NO VISIBLE TEXT.'
    ].filter(Boolean).join('\n');
  }).join('\n\n');

  return `ALLES STICKMAN | ${meta.title} | SINGLE COMPLETE GOOGLE FLOW IMAGE AGENT PROMPT

German educational history / humanity YouTube video. Generate separate still images only, each in 16:9.
FINAL VIDEO IMAGE COUNT: ${count}, named Bild 01.png through Bild ${pad(count)}.png. The selected cover IS Bild 01.png, followed by ${Math.max(0, count - 1)} new scene images.

SELF-CONTAINED INPUT: Everything needed is written below: visual style, people, character-sheet request, three cover requests, historical continuity and the complete scene register. Do not ask for repository access, uploads, ZIPs, other prompt files, the voice script or permission to start. Do not open external files or request that the user paste the next batch.

INTERNAL METADATA: Scene numbers, file names, batch ranges, headings and this workflow are for the agent only. NEVER send them to the image generator or visibly draw them. For each normal image send only STYLE BLOCK + PEOPLE BLOCK + its MAIN CHARACTER line when present + SCENE + CAMERA + COLORS when present + TEXT RULE. Apply the relevant historical context below without including its administrative headings. Every request must contain the full style and people blocks; never rely on the generator remembering previous requests.

STYLE BLOCK (send verbatim with EVERY cover and scene request):
${kit.style}

PEOPLE BLOCK (send verbatim with EVERY cover and scene request):
${kit.characters}

MAIN CHARACTER (include only when the scene requests this character; all covers use this guide):
${kit.protagonist?.descriptionEn ?? 'a curious, expressive stick figure who always wears a small red scarf'}
Keep the same head shape, dot eyes, line weight, proportions and scarf color throughout. Historical supporting characters remain stick figures and wear era-appropriate clothing. A historical person is recognizable through simple props and costume, never a realistic face or hands.

TEXT RULE (send verbatim with EVERY image request):
${NO_TEXT_RULE}
This applies to covers too. German words, dates, quantities and the thumbnail headline are added later in editing; do not draw them now. No quotation marks, fake writing or decorative lettering.

ILLUSTRATION DIRECTION:
One visible action and one instantly readable idea per image. Vary camera distance, composition and scale between neighbouring images. Use close-ups for objects and emotion; use maps, cutaways and comparisons only when they explain the scene. Keep objects large enough to understand on a phone in two seconds. Preserve the hand-drawn editorial style in mines, kitchens, ships and every historical culture. No photorealism, glossy 3D, detailed anatomy or realistic hands. Separate images, never a contact sheet or multi-scene montage (except an explicitly requested split composition or the character sheet).

WORLD AND ERA CONTINUITY (agent context, not visible text):
Locations: ${continuity.environmentAnchor ?? 'Use the location described in each scene.'}
Climate and season: ${continuity.climateSeasonAnchor ?? 'Use climate and season appropriate to each scene.'}
Eras: ${continuity.eraAnchor ?? 'Match clothing, tools and architecture to each scene.'}
Palette and mood: ${continuity.paletteMoodAnchor ?? 'Choose natural colors appropriate to the scene.'}
Intentional transitions: ${(continuity.allowedIntentionalChanges ?? []).join(' | ') || 'Only the transitions explicitly described in the scene register.'}
Forbidden mismatches: ${(continuity.forbiddenUnmotivatedChanges ?? []).join(' | ') || 'No modern objects in historical scenes or unexplained changes of climate and era.'}
The register may deliberately move across centuries and locations. Follow those changes; do not lock the whole video to one era. Maintain continuity between adjacent scenes in the same setting.

CHARACTER SHEET — PREPARATION, NOT A VIDEO IMAGE:
If a character sheet is already available in this session, use it. Otherwise generate it now from the complete request below, without asking for an upload. Check all five poses: same stick-figure construction, head, eyes, proportions, red scarf, simple round hand ends and no text. Retry failed sheets up to five times. If none passes, report the failure and stop honestly. Keep the accepted sheet as hauptfigur.png, outside the final video image set.
Attach ONLY this character sheet as the character reference for each cover and scene, if reference attachment is supported. Never use a cover or previous scene as reference. If attachment is unavailable, repeat the full people and character instructions in each applicable request and report that limitation.

CHARACTER SHEET IMAGE REQUEST:
${PROMPT_START}
${kit.characterSheet}
${PROMPT_END}

COVERS — EXACTLY THREE DISTINCT, SEPARATE IMAGES:
Create A, B and C using the full requests below. Large expressive stick-figure face, one clear story object, high contrast, top third calm and empty for a headline added later. No text inside any cover. Never create a montage of the three options.

${covers}

AFTER THREE REAL COVER IMAGES: show all three and ask ONLY: „Welches Cover wählst du – A, B oder C?“ Then HARD STOP and WAIT. Never generate Bild 02 before the user's choice. Never claim an image exists before it has actually been generated.

AFTER THE USER'S CHOICE: save the selected cover as Bild 01.png. It is the first video image and the source for the later thumbnail. Do not create a separate extra scene for image 01. Exclude the two losing covers and the character sheet from the final video image set.

AUTOMATIC FIVE-IMAGE BATCHES:
Immediately generate the remaining scenes from the register below in this exact order, at most five images at a time:
${batches.join(', ') || 'No additional scene images.'}
Each numbered scene is one separate image request and one separate output. After the cover choice, continue automatically through every batch without another permission question, without waiting for WEITER and without asking for additional prompts. A batch is not a five-panel image.

QUALITY CHECK AFTER EVERY BATCH:
Check the actual outputs before continuing: every expected image exists, its action and object match the register, all people and hands are stick figures, the main character matches hauptfigur.png where requested, no text or file-name leaks, correct era / objects / climate, readable main subject, varied composition and consistent illustration style. Regenerate only failed or missing image numbers, then recheck them. If a real provider limit or policy refusal prevents continuing, name the exact batch and next missing image; do not bypass policies or claim completion. Resume from the first missing or failed image when generation becomes available, retaining accepted images and the user's cover choice.

COMPLETE VIDEO IMAGE REGISTER (${count} final images; image 01 is the selected cover):

${register}

FINAL IMAGE INTEGRITY CHECK:
Exactly ${count} accepted images: Bild 01.png through Bild ${pad(count)}.png, with no gaps or duplicates. Each is a separate 16:9 image. Reuse the selected cover only for Bild 01.png. Regenerate missing or failed images; never fill gaps by copying another scene. Only those ${count} images belong in the final flat image set: no character sheet, losing covers, prompts, reports or subfolders.
If ZIP export is available, create ONE downloadable ZIP containing exactly these ${count} images at its root. If ZIP export is unavailable, provide the actual downloadable images and state that no ZIP was created. Never invent a download link or claim a ZIP exists without creating it. These images will later be placed in the video's image folder by the production pipeline. Do not require terminal commands or repository access to finish this image task.
Do not create an MP4, voice recording, subtitles or additional prompts. Report actual accepted image count, any unresolved image numbers and the real download location.
`;
}

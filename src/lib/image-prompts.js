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
  const visual = visualPolicy ?? JSON.parse(await readFile(path.resolve(root, 'config/visual-policy.json'), 'utf8'));
  const characterSheet = sheet.split(PROMPT_START)[1]?.split(PROMPT_END)[0]?.trim();
  if (!characterSheet) throw new Error('Figurenblatt-Prompt fehlt zwischen den Markierungen.');
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

  files.set('google-flow-prompt.txt', renderFlowMaster(kit, plan, meta));
  return files;
}

function renderFlowMaster(kit,plan,meta) {
 const scenes=plan.scenes??[];
 const separate=meta.coverPolicy?.separateThumbnailFromFirstScene===true;
 const world=meta.visualContinuityProfile??{};
 const count=scenes.length;
 const covers=(plan.covers??[]).map(c=>`COVER ${c.id} — temporarily save as TEMP_COVER_${c.id}.png\n${PROMPT_START}\n${buildCoverPrompt(kit,c)}\n${PROMPT_END}`).join('\n\n');
 const register=scenes.map(s=>`SCENE ${pad(s.sceneNumber)} — output Bild ${pad(s.sceneNumber)}.png\nSCENE: ${String(s.brief).trim()}\nCAMERA: ${s.shot}\n${s.protagonist?`MAIN CHARACTER: ${kit.protagonist?.descriptionEn??'a stick figure with a small red scarf'}\n`:''}${s.palette?`COLORS: ${s.palette}\n`:''}`).join('\n');
 const first=separate?1:2;const groups=[];
 for(let n=first;n<=count;n+=5)groups.push(`Bild ${pad(n)}–${pad(Math.min(count,n+4))}`);
 return `ALLES STICKMAN — ONE COMPLETE GOOGLE FLOW PROMPT
Topic: ${meta.title}
Output: ${count} separate 16:9 editorial illustrations. DO NOT start until instructions are understood.

THIS PROMPT IS SELF-CONTAINED. The full illustrator style, character model sheet image request, historical context, 3 cover prompts, ALL ${count} scene briefs and quality instructions are directly included here. Do not ask for GitHub, other files, batches, an additional prompt, the voice script or any further uploads. Do not invent images, ZIPs or attachments.

PRODUCTION VS. PICTURE: Scene identifiers, numbering, filenames, internal metadata and all headings below are ONLY workflow instructions. Never put any of them into generated image pixels or send them as image content. To make EACH image, pass the entire STYLE BLOCK, PEOPLE BLOCK, optional MAIN CHARACTER line, the individual SCENE description, the CAMERA direction and the TEXT RULE. Repeat the complete style/people rules on every request. Every numbered scene must be a SEPARATE PNG, not a contact sheet.

STYLE BLOCK (include with EVERY scene):
${kit.style}

PEOPLE BLOCK (include with EVERY scene):
${kit.characters}

MAIN CHARACTER (include only in scenes calling for the guide):
${kit.protagonist?.descriptionEn??'a curious stick figure wearing a red scarf'}
All people, regardless of culture or century, use exactly the same simple stick construction. Historical figures only differ via clothing, hair or props. No realistic faces or hands.

TEXT RULE:
${NO_TEXT_RULE}
No pseudo-letters, English captions, production file numbers, or tiny labels. The video editor will add any exact German labels and figures afterwards.

WORLD CONTINUITY:
Locations and environments: ${world.environmentAnchor??'see scene register'}
Climate and seasons: ${world.climateSeasonAnchor??'see scene register'}
Historical periods: ${world.eraAnchor??'see scene register'}
Colors and mood: ${world.paletteMoodAnchor??'follow the content'}
Allowed intentional changes: ${(world.allowedIntentionalChanges??[]).join(' | ')||'only explicit ones'}
Avoid: ${(world.forbiddenUnmotivatedChanges??[]).join(' | ')||'anachronisms and unrelated props'}
Match local continuity between adjacent frames; historical changes between chapters are intentional. Each image should communicate ONE useful idea instantly at phone size. Vary close-ups, cutaways, maps, comparisons and scale; no formulaic repeated character poses or decorative crowds.

CHARACTER MODEL SHEET: channel/style-sheet/FIGURENBLATT_PROMPT.txt is fully embedded below, NOT an external dependency. Unless an approved matching sheet is available in this conversation, produce it first. Check its five poses, small red scarf, stick hands and no writing. Repeat failed attempts only up to five times. Keep the accepted sheet as hauptfigur.png OUTSIDE the video image set. Attach it as character reference only if provider supports this feature; never attach a cover or previous scene as reference. If attachment is unavailable, repeat the PEOPLE description per image and explain this limit truthfully.
${PROMPT_START}
${kit.characterSheet}
${PROMPT_END}

COVER CANDIDATES — GENERATE EXACTLY THREE DISTINCT IMAGES:
One big expressive stick-figure face and one important story object, readable on a phone. Bright contrast, top area quiet for later headline. Do not place text into the image.
${covers}

STOP AFTER THREE COVER IMAGES: Show A/B/C, ask the user to choose, then HARD STOP. Never assume their choice, never generate scene images before selection and never claim an image was generated if tools are not available.

AFTER COVER SELECTION:
${separate
?'Save the selected image separately as 00-bildprompts/thumbnail-source.png. This is thumbnail-only, NOT Bild 01. Generate Bild 01.png independently from SCENE 01 (it must match the spoken opening). Discard losing covers from final set.'
:'LEGACY MODE: Save the selected cover as Bild 01.png, the first video image, and do not regenerate scene 01.'}

AUTOMATIC 5-IMAGE SEQUENCE, AFTER COVER CHOICE:
Generate precisely ${count} numbered video images in order; images to CREATE after choice start at ${pad(first)} and end at ${pad(count)}. The batches are ${groups.join(', ')||'none'}. No new questions, no need for WEITER, no external files. One image per scene. Interpret camera instructions: close-up = large detail, medium = character and prop, wide = useful environment, top-down = spatial geometry, cutaway = inner mechanism, split = intentional two-part comparison. Any given scene is a content guide, not a caption to draw.

ALL ${count} SCENE BRIEFS (COMPLETE):
${register}

MANDATORY VISUAL QUALITY CHECK after EACH batch: visually examine actual output files for adherence to the narrative, stick people/hands, historical location/era, legibility at mobile size, missing text/garbled writing, consistent scarves, visual diversity and no production annotations. Repair only failed or missing specific scene images and reinspect. Do not claim to have reviewed actual pixels if you only have written descriptions.

FINAL INTEGRITY: ${count} actual, unique, sequential video frames named Bild 01.png–Bild ${pad(count)}.png, 16:9, no gaps; ${separate?'plus one separately named thumbnail-source.png':'first frame itself doubles as cover'}. Character sheet and losing cover candidates are not video frames. If ZIP export really works, create one genuine downloadable ZIP with correct files; otherwise provide actual per-image downloads. Never pretend to have created files or URLs. Do not generate the MP4 or audio. Report actual completion and first missing scene if generation is interrupted.
`;
}

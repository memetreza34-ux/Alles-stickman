import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { copyDirectory } from '../src/lib/pipeline.js';
import { buildScenePrompt, findMetaLeaks, loadPromptKit, PROMPT_END, PROMPT_START, renderPromptFiles, validateScenePlan } from '../src/lib/image-prompts.js';
import { classifyOcrLines, parseTesseractTsv } from '../src/lib/image-text-check.js';
import { analyzeScript, evaluateScriptMetrics, splitSentences } from '../src/lib/script-quality.js';
import { buildPrompts } from '../src/cli/build-youtube-prompts.js';
import { validatePhase1 } from '../src/cli/validate-youtube-phase1.js';
import { motionFor } from '../src/cli/build-youtube-timeline.js';
import { headlineFontSize } from '../src/lib/thumbnail.js';
import { assertReviewGateOpen } from '../src/lib/quality-loop.js';

const GPS = 'youtube/2026-KW42_12-10_bis_18-10/wie-fanden-menschen-ohne-gps-ihren-weg';
const FIXTURE_SCRIPT = 'test/fixtures/v8-laengengrad/voice-script.txt';

const BRIEFS = [
  'A curious stick figure sailor with a small red scarf leans over the wooden rail and stares at an endless grey sea with no coast in sight.',
  'Close view of a worried captain stick figure holding a brass instrument up to the bright midday sun while waves splash against the hull.',
  'A wide stormy night scene where dark jagged rocks rise from foaming water in front of a tall wooden warship with torn sails.',
  'Top-down view of a simple sea chart on a table with a dotted route that drifts away from the true coastline toward hidden rocks.',
  'A village carpenter stick figure in a dusty workshop carefully fits tiny brass gears into a wooden clock while shavings cover the floor.',
  'Two stick figure scholars in powdered wigs cross their arms and frown at a large ticking sea clock placed on a velvet cushion.'
];
const SHOTS = ['close-up', 'medium', 'wide', 'top-down', 'medium', 'close-up'];

async function buildV8Fixture() {
  const root = await mkdtemp(path.join(tmpdir(), 'stickman-v8-'));
  const dir = path.join(root, 'youtube', '2026-KW99_test', 'laengengrad');
  // Gleicher Weg wie npm run create:youtube (deckt den Node-24-EEXIST-Fehler ab).
  await copyDirectory(path.resolve('youtube/templates/video-template'), dir);
  const tech = path.join(dir, '99-technik');
  const script = (await readFile(FIXTURE_SCRIPT, 'utf8')).trim();
  const sentences = splitSentences(script);
  const anchor = (sentence) => sentence.split(/\s+/).slice(0, 4).join(' ');

  const meta = JSON.parse(await readFile(path.join(tech, 'video.json'), 'utf8'));
  Object.assign(meta, {
    videoId: '2026-KW99_test_laengengrad', weekFolder: '2026-KW99_test', topicSlug: 'laengengrad',
    title: 'Wie fanden Seeleute den Längengrad?', topic: 'Längengrad auf See',
    visualStyleId: 'alles-stickman-editorial-v1', targetDurationSeconds: 120, targetDurationRangeSeconds: [105, 135],
    plannedImageCount: sentences.length,
    uploadMetadata: { title: 'Wie fanden Seeleute den Längengrad?', description: 'Testbeschreibung.', tags: ['Seefahrt'], hashtags: ['#AllesStickman'], thumbnailText: 'Wo sind wir?' },
    visualContinuityProfile: {
      ...meta.visualContinuityProfile,
      environmentAnchor: 'Segelschiffe und Werkstätten des 18. Jahrhunderts', climateSeasonAnchor: 'Nordatlantik, wechselhaft',
      eraAnchor: '1707–1761', paletteMoodAnchor: 'Meerblau, Holzbraun, Messing',
      allowedIntentionalChanges: ['Werkstatt an Land'], forbiddenUnmotivatedChanges: ['moderne Schiffe']
    }
  });
  await writeFile(path.join(tech, 'video.json'), JSON.stringify(meta, null, 2));
  await writeFile(path.join(dir, '01-voice-script', 'voice-script.txt'), `${script}\n`);

  const sources = ['https://example.org/scilly-1707', 'https://example.org/longitude-act-1714', 'https://example.org/harrison-h4-1761'];
  await writeFile(path.join(tech, 'RECHERCHE.md'), `# Recherche (Testdaten)\n\n${sources.map((s) => `- ${s}`).join('\n')}\n`);

  const plan = JSON.parse(await readFile(path.join(tech, 'SCRIPT_PLAN.json'), 'utf8'));
  plan.status = 'READY';
  const sectionAnchors = { hook: 'Dein Handy zeigt dir', setup: 'Die Breite war lösbar.', main: 'Das Problem war die Zeit.', resolution: 'So fanden Seeleute ihre Position', closing: 'Dein Handy macht heute dasselbe' };
  plan.sections = plan.sections.map((s) => ({ ...s, startAnchor: sectionAnchors[s.id] }));
  Object.assign(plan.sections[0], { hookType: 'contrast', curiosityGap: 'Wie ohne Satellit?', titleConnection: 'Position auf See', payoffPromise: 'Sonne plus Uhr' });
  plan.storyEngine = {
    openingContrast: { today: 'Handy zeigt Position', past: 'Kriegsschiffe 1707 ohne Position', anchor: 'Im Oktober 1707 wusste' },
    stakes: 'Schiffbruch und Tod',
    escalation: [
      { problem: 'Ost-West unbekannt', solution: 'Zeitvergleich', anchor: 'Das Problem war die Zeit.' },
      { problem: 'Pendeluhren versagen', solution: 'Preisgeld', anchor: 'Aber Pendeluhren versagten' },
      { problem: 'Niemand baut so eine Uhr', solution: 'Harrison', anchor: 'Er baute Uhren, die Hitze' },
      { problem: 'Experten misstrauen', solution: 'Test auf See', anchor: 'Wir wissen, wie gut sie war' }
    ],
    evidence: [
      { claim: 'Scilly 1707', anchor: 'Vor den Scilly-Inseln', source: sources[0] },
      { claim: 'Longitude Act 1714', anchor: '1714 setzte das britische Parlament', source: sources[1] },
      { claim: 'H4-Test 1761', anchor: 'Wir wissen, wie gut sie war', source: sources[2] }
    ],
    callback: { anchor: 'Dein Handy macht heute dasselbe', callsBackTo: 'Dein Handy zeigt dir' }
  };
  await writeFile(path.join(tech, 'SCRIPT_PLAN.json'), JSON.stringify(plan, null, 2));

  const hold = Number((120 / sentences.length).toFixed(2));
  const images = sentences.map((sentence, i) => ({
    imageNumber: i + 1, imageFile: `Bild ${String(i + 1).padStart(2, '0')}.png`, startAnchor: anchor(sentence), endAnchor: null,
    visualPurpose: 'Satz bebildern', topicAnchor: 'Längengrad', visualForm: 'Szene', plannedHoldSeconds: hold,
    overlay: /\d{4}/.test(sentence) ? { text: sentence.match(/\d{4}/)[0], style: 'caption', position: 'top' } : null, motion: null
  }));
  await writeFile(path.join(tech, 'BILD_AUDIO_ZUORDNUNG.json'), JSON.stringify({ schemaVersion: 1, videoLastImageNumber: images.length, images }, null, 2));

  await writeFile(path.join(tech, 'SCENE_VISUALS_EN.json'), JSON.stringify({
    schemaVersion: 2, status: 'READY',
    covers: ['A', 'B', 'C'].map((id, i) => ({ id, brief: BRIEFS[i] })),
    scenes: sentences.map((_, i) => ({ sceneNumber: i + 1, brief: BRIEFS[i % BRIEFS.length], shot: SHOTS[i % SHOTS.length], protagonist: i % 3 === 0 }))
  }, null, 2));
  return { root, dir };
}

test('v8: Bildprompts enthalten nie Dateinamen, Zeiten oder Steuerzeilen', async () => {
  const kit = await loadPromptKit();
  const plan = {
    covers: ['A', 'B', 'C'].map((id, i) => ({ id, brief: BRIEFS[i] })),
    scenes: BRIEFS.map((brief, i) => ({ sceneNumber: i + 1, brief, shot: SHOTS[i], protagonist: i === 0 }))
  };
  const files = renderPromptFiles(kit, plan, { title: 'Test', weekFolder: 'w', topicSlug: 's' });
  const prompts = [...files.entries()].flatMap(([name, content]) => {
    if (name.startsWith('prompts/')) return [content];
    return [...content.matchAll(new RegExp(`${PROMPT_START}\\n([\\s\\S]*?)\\n${PROMPT_END}`, 'g'))].map((m) => m[1]);
  });
  assert.equal(prompts.length, 3 + 6 + 5 + 3, 'Einzel-, Block- und Cover-Prompts');
  for (const prompt of prompts) {
    assert.deepEqual(findMetaLeaks(prompt), [], prompt.slice(0, 80));
    assert.match(prompt, /No text, letters, numbers/);
    assert.match(prompt, /stick figure/);
    assert.ok(prompt.split(/\s+/).length < 260, 'Prompt bleibt kurz');
  }
  const master = files.get('google-flow-prompt.txt');
  assert.match(master, /FIGURENBLATT_PROMPT\.txt/, 'Flow erzeugt das Figurenblatt selbst, wenn es fehlt');
  assert.match(master, /gleicht die Figur hauptfigur\.png/, 'Flow prüft die Hauptfigur nach jedem Block');
  const sheet = await readFile('channel/style-sheet/FIGURENBLATT_PROMPT.txt', 'utf8');
  const sheetPrompt = sheet.split(PROMPT_START)[1].split(PROMPT_END)[0];
  assert.deepEqual(findMetaLeaks(sheetPrompt), []);
  assert.match(sheetPrompt, /red scarf/);
  assert.match(buildScenePrompt(kit, plan.scenes[0]), /red scarf/, 'Hauptfigur nur, wenn protagonist=true');
  assert.doesNotMatch(buildScenePrompt(kit, plan.scenes[1]), /red scarf/);
});

test('v8: Leak-Erkennung findet die echten Fehler aus Wasser- und GPS-Video', () => {
  for (const bad of ['OUTPUT FILE: Bild 14.png', 'Geplanter Hold 4.57s', 'SCENE_KEY: 05', 'Replace the previously weak tiny sepia-globe', 'VISUAL_STYLE_EDITION: premium-illustrated-explainer-v14']) {
    assert.ok(findMetaLeaks(bad).length, bad);
  }
  for (const ok of ['A sailor drops anchor in the 1700s harbor.', 'Two hands hold up a lantern.', 'Three moments in one day.']) {
    assert.deepEqual(findMetaLeaks(ok), [], ok);
  }
  const { errors } = validateScenePlan({ schemaVersion: 2, status: 'READY', covers: [], scenes: [{ sceneNumber: 1, brief: 'Bild 05 shows a sailor on deck with a compass in hand under a stormy grey sky at night', shot: 'wide' }] });
  assert.ok(errors.some((e) => e.includes('Produktionsinfo')));
});

test('v8: OCR-Auswertung trennt Produktionsinfo von erlaubtem Text', () => {
  const row = (line, text, conf) => `5\t1\t1\t1\t${line}\t1\t0\t0\t10\t10\t${conf}\t${text}`;
  const tsv = ['level\tpage_num\tblock_num\tpar_num\tline_num\tword_num\tleft\ttop\twidth\theight\tconf\ttext',
    row(1, 'Bild', 62), row(1, '0S', 30), row(2, 'Hold', 96), row(2, '647s', 81), row(3, 'OSTEN', 90), row(4, 'ae', 20)].join('\n');
  const { meta, text } = classifyOcrLines(parseTesseractTsv(tsv), { allowed: ['OSTEN'] });
  assert.equal(meta.length, 2);
  assert.deepEqual(text, []);
  const strict = classifyOcrLines(parseTesseractTsv(tsv), { allowed: [] });
  assert.deepEqual(strict.text, ['OSTEN']);
});

test('v8: Skript-Kennzahlen hätten das GPS-Skript zur Überarbeitung geschickt', async () => {
  const policy = JSON.parse(await readFile('config/script-policy.json', 'utf8'));
  const gps = analyzeScript(await readFile(path.join(GPS, '01-voice-script/voice-script.txt'), 'utf8'), 366);
  const gpsResult = evaluateScriptMetrics(gps, policy.scriptMetrics);
  assert.ok(gpsResult.errors.some((e) => e.includes('Zu wenig Konkretes')));
  const example = analyzeScript(await readFile(FIXTURE_SCRIPT, 'utf8'), 120);
  assert.deepEqual(evaluateScriptMetrics(example, policy.scriptMetrics).errors, []);
});

test('v8: Beispielprojekt besteht Phase 1; Handänderung oder Leak blockiert', async () => {
  const { root, dir } = await buildV8Fixture();
  try {
    const built = await buildPrompts(dir);
    assert.deepEqual(built.errors, []);
    const result = await validatePhase1(dir);
    assert.deepEqual(result.errors, []);
    assert.equal(result.passed, true);

    const single = path.join(dir, '00-bildprompts', 'prompts', 'Bild_03.txt');
    await writeFile(single, `${await readFile(single, 'utf8')}\nOUTPUT FILE: Bild 03.png\n`);
    const tampered = await validatePhase1(dir);
    assert.ok(tampered.errors.some((e) => e.includes('Bild_03.txt')));

    const planFile = path.join(dir, '99-technik', 'SCRIPT_PLAN.json');
    const plan = JSON.parse(await readFile(planFile, 'utf8'));
    plan.storyEngine.evidence[0].source = 'https://example.org/nicht-in-recherche';
    await writeFile(planFile, JSON.stringify(plan));
    const unsourced = await validatePhase1(dir);
    assert.ok(unsourced.errors.some((e) => e.includes('fehlt in RECHERCHE.md')));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('Review-Sperre: nur ausdrücklich begründete Testvideos sind ausgenommen', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'stickman-gate-'));
  const dir = path.join(root, 'youtube', '2026-KW41', 'testvideo');
  try {
    await mkdir(path.join(dir, '99-technik'), { recursive: true });
    await mkdir(path.join(dir, '03-export'), { recursive: true });
    await writeFile(path.join(dir, '03-export', 'FINAL_VIDEO.mp4'), 'fake');
    const metaFile = path.join(dir, '99-technik', 'video.json');
    await writeFile(metaFile, JSON.stringify({ videoId: 't', title: 'T', reviewExempt: 'Test' }));
    await assert.rejects(assertReviewGateOpen(path.join(root, 'youtube')), /reviewen/, 'zu kurze Begründung zählt nicht');
    await writeFile(metaFile, JSON.stringify({ videoId: 't', title: 'T', reviewExempt: 'Testvideo der 2-Minuten-Testphase, Nutzerentscheidung.' }));
    await assertReviewGateOpen(path.join(root, 'youtube'));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('v8: Kamerafahrten sind sichtbar und gezielt steuerbar', () => {
  const zooms = [0, 1, 2, 3, 4].map((i) => motionFor(i)).map((m) => Math.abs(m.scaleTo - m.scaleFrom) + Math.abs(m.xTo - m.xFrom) / 1000);
  assert.ok(zooms.every((z) => z >= 0.06), 'jede Fahrt deutlich sichtbar');
  const focused = motionFor(0, { zoomFrom: 1, zoomTo: 1.2, focusX: 30, focusY: 60 });
  assert.equal(focused.scaleTo, 1.2);
  assert.equal(focused.originX, 30);
  assert.ok(headlineFontSize('WO BIN ICH?') <= 1080 * 0.17);
});

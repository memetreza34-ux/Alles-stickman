import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { evaluateTopic } from '../src/cli/check-youtube-topic.js';
import { normalizeText, similarity } from '../src/lib/pipeline.js';

test('Repo besitzt die aktive Alles-Stickman-Bildwelt und leeren Themenbestand', async () => {
  const visual = JSON.parse(await readFile('config/visual-policy.json', 'utf8'));
  const registry = JSON.parse(await readFile('config/topic-registry.json', 'utf8'));
  assert.equal(visual.status, 'READY');
  assert.equal(visual.styleId, 'alles-stickman-editorial-v1');
  assert.equal(visual.referenceConsistency.coverWinnerIsSoleReference, true);
  assert.equal(visual.referenceConsistency.usePreviousGeneratedSceneAsReference, false);
  assert.deepEqual(registry.entries, []);
});

test('Pipeline behält die verbindlichen Produktions- und Coverregeln', async () => {
  const policy = JSON.parse(await readFile('config/pipeline.json', 'utf8'));
  assert.equal(policy.coverPolicy.firstSceneIsCover, true);
  assert.equal(policy.coverPolicy.coverCandidateCount, 3);
  assert.equal(policy.coverPolicy.autoSelectWinner, true);
  assert.equal(policy.coverPolicy.winnerBecomesSoleReference, true);
  assert.equal(policy.coverPolicy.deleteLosingCandidates, true);
  assert.equal(policy.imagePolicy.fixedImageCountForbidden, true);
  assert.equal(policy.imagePolicy.nonCoverGenerationCount, 1);
  assert.equal(policy.imagePolicy.generationBatchSize, 5);
  assert.equal(policy.imagePolicy.maxConcurrentGenerations, 5);
  assert.equal(policy.imagePolicy.useOnlyCoverWinnerAsReference, true);
  assert.equal(policy.imagePolicy.usePreviousSceneAsReference, false);
  assert.equal(policy.imagePolicy.finalFolderMustBeFlat, true);
  assert.deepEqual(policy.imagePolicy.targetAverageHoldSeconds, [4.5, 7.5]);
  assert.equal(policy.audioPolicy.playbackRate, 1.1);
  assert.equal(policy.audioPolicy.loudnessTargetLufs, -16);
  assert.equal(policy.audioPolicy.truePeakDbtp, -1.5);
  assert.equal(policy.endHoldPolicy.targetSeconds, 1.3);
});

test('Projekt-Template enthält den Alles-Stickman-Flow-Ablauf', async () => {
  const meta = JSON.parse(await readFile('youtube/templates/video-template/99-technik/video.json', 'utf8'));
  const prompt = await readFile('youtube/templates/video-template/00-bildprompts/google-flow-prompt.txt', 'utf8');
  assert.equal(meta.visualStyleId, 'UNSET');
  assert.equal(meta.topic, '');
  assert.equal(meta.title, '');
  assert.match(prompt, /ACTIVE_STYLE_ID: UNSET/);
  assert.match(prompt, /ALLES STICKMAN/i);
  assert.match(prompt, /GENAU 3 COVER/i);
  assert.match(prompt, /EINZIGE visuelle Referenz/i);
  assert.match(prompt, /5ER-BLÖCKEN/i);
  assert.match(prompt, /Keine feste Zielbildzahl/i);
  assert.match(prompt, /Bild 01\.png.*Bild NN\.png/is);
});

test('Textnormalisierung und Ähnlichkeit funktionieren', () => {
  assert.equal(normalizeText('Über Größe!'), 'uber grosse');
  assert.ok(similarity('Warum gibt es Grenzen?', 'Wieso gibt es Grenzen?') > 0.5);
});

test('Themeneditor arbeitet nur mit Daten des aktuellen Repositories', async () => {
  const temp = await mkdtemp(path.join(tmpdir(), 'clean-youtube-pipeline-'));
  try {
    await mkdir(path.join(temp, 'config'), { recursive: true });
    await mkdir(path.join(temp, 'youtube'), { recursive: true });
    await writeFile(path.join(temp, 'config', 'topic-registry.json'), JSON.stringify({ version: 1, entries: [] }));
    const result = await evaluateTopic('Völlig neues Testthema 987654321', temp);
    assert.equal(result.decision, 'APPROVED_NEW');
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});

test('Keine Alt-Themen oder fremde Alt-Bildwelt wurden in die zentrale Konfiguration übernommen', async () => {
  const files = [
    'README.md',
    'config/pipeline.json',
    'config/visual-policy.json',
    'config/topic-registry.json',
    'youtube/WORKFLOW.md',
    'youtube/templates/video-template/00-bildprompts/google-flow-prompt.txt'
  ];
  const text = (await Promise.all(files.map((file) => readFile(file, 'utf8')))).join('\n').toLowerCase();
  const forbidden = [
    'serious-minimal-countryball',
    'nationalismus',
    'liberalismus',
    'konservatismus',
    'anarchismus',
    'kaliningrad',
    'zwei koreas',
    'römische reich'
  ];
  for (const value of forbidden) assert.equal(text.includes(value), false, `Altspur gefunden: ${value}`);
});

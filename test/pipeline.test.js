import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { evaluateTopic } from '../src/cli/check-youtube-topic.js';
import { buildSrtFromWhisper, buildTimedScriptFromWhisper, buildUploadText, buildDescriptionWithHashtags, formatSrtTimestamp } from '../src/cli/finalize-youtube-export.js';
import { validatePhase1 } from '../src/cli/validate-youtube-phase1.js';
import { phase1Links, phase1ChatLinks, renderPhase1Handoff } from '../src/lib/phase1-handoff.js';
import { validatePacing } from '../src/cli/validate-youtube-pacing.js';
import { normalizeText, similarity } from '../src/lib/pipeline.js';

const TEST_PROJECT = 'youtube/2026-KW41_05-10_bis_11-10/wie-machten-menschen-feuer-ohne-streichhoelzer';
const SECOND_TEST_PROJECT = 'youtube/2026-KW41_05-10_bis_11-10/wie-machten-menschen-essen-ohne-kuehlschrank-haltbar';
const THIRD_TEST_PROJECT = 'youtube/2026-KW41_05-10_bis_11-10/wie-ueberlebten-menschen-eisige-winter-ohne-heizung';
const FOURTH_TEST_PROJECT = 'youtube/2026-KW41_05-10_bis_11-10/wie-wuschen-menschen-ihre-kleidung-ohne-waschmaschine';
const LONGFORM_PROJECT = 'youtube/2026-KW41_05-10_bis_11-10/wie-bekamen-menschen-trinkwasser-ohne-wasserhahn';

test('Phase-1-Handoff stellt beide direkten, mobil erreichbaren Videodateilinks bereit', async () => {
  const dir = 'youtube/2026-KW41_05-10_bis_11-10/wie-bekamen-menschen-trinkwasser-ohne-wasserhahn';
  const meta = JSON.parse(await readFile(path.join(dir, '99-technik', 'video.json'), 'utf8'));
  const links = phase1Links(meta);
  const base = 'https://github.com/memetreza34-ux/Alles-stickman/blob/main/youtube/';
  assert.ok(links.flowPrompt.startsWith(base));
  assert.ok(links.voiceScript.startsWith(base));
  assert.ok(links.flowPrompt.endsWith('/00-bildprompts/google-flow-prompt.txt'));
  assert.ok(links.voiceScript.endsWith('/01-voice-script/voice-script.txt'));
  assert.notEqual(links.flowPrompt, links.voiceScript);
  assert.match(phase1ChatLinks(meta), /Google-Flow-Prompt öffnen/);
  assert.match(phase1ChatLinks(meta), /Voice-over-Skript öffnen/);
  const handoff = renderPhase1Handoff(meta, { phase1Validated: true });
  assert.match(handoff, /Phase 1 validiert/);
  assert.ok(handoff.includes(links.flowPrompt));
  assert.ok(handoff.includes(links.voiceScript));
  assert.throws(() => phase1Links({ weekFolder: '..', topicSlug: 'video' }), /Ungültiges/);
});

test('Repo besitzt die aktive Alles-Stickman-Bildwelt ohne Bildreferenz-Zwang', async () => {
  const visual = JSON.parse(await readFile('config/visual-policy.json', 'utf8'));
  const registry = JSON.parse(await readFile('config/topic-registry.json', 'utf8'));
  assert.equal(visual.status, 'READY');
  assert.equal(visual.styleId, 'alles-stickman-editorial-v1');
  assert.equal(visual.referenceConsistency.referenceMode, 'none');
  assert.equal(visual.referenceConsistency.useImageReferences, false);
  assert.equal(visual.referenceConsistency.generatedImageReferenceForbidden, true);
  assert.equal(visual.multiPanelPolicy.allowed, true);
  assert.equal(visual.informationDesign.sameWorldRequired, true);
  assert.equal(visual.visualPolicyVersion, 11);
  assert.equal(visual.visualFormPriority.default, 'illustrative-scene-first');
  assert.ok(visual.visualFormPriority.preferred.includes('reichhaltige Stickman-Handlungsszene'));
  assert.ok(visual.visualFormPriority.useOnlyWhenClearer.includes('reine Infografik'));
  assert.equal(visual.textPolicy.labelsAllowed, true);
  assert.equal(visual.textPolicy.numbersAllowed, true);
  assert.equal(visual.environmentContinuity.noUnmotivatedEnvironmentShift, true);
  assert.equal(visual.visualSelfReview.runAfterEveryBatch, true);
  assert.equal(visual.visualSelfReview.silentRepairBeforeContinue, true);
  assert.equal(visual.sceneEnergy.textReadability.normalMaximumLabelsPerImage, 3);
  assert.ok(visual.visualForms.includes('Diagramm oder Zahlenvergleich'));
  assert.ok(visual.visualForms.includes('2er- oder 3er-Multi-Panel'));
  assert.ok(visual.visualForms.includes('Text-/Zahlenfokus mit unterstützender Illustration'));
  assert.ok(registry.entries.some((entry) => entry.id === '2026-KW41_05-10_bis_11-10_wie-machten-menschen-feuer-ohne-streichhoelzer'));
});

test('Skript-Policy erzwingt die kanaltypische Grundstruktur', async () => {
  const policy = JSON.parse(await readFile('config/script-policy.json', 'utf8'));
  const templatePlan = JSON.parse(await readFile('youtube/templates/video-template/99-technik/SCRIPT_PLAN.json', 'utf8'));
  assert.equal(policy.status, 'READY');
  assert.deepEqual(policy.structure, ['hook', 'setup', 'main', 'resolution', 'closing']);
  assert.equal(policy.openingRules.greetingForbidden, true);
  assert.equal(policy.openingRules.genericMetaIntroForbidden, true);
  assert.equal(policy.languageRules.hardMaxWordsPerSentence, 32);
  assert.deepEqual(policy.pacingRules.targetWordsPerMinute, [115, 180]);
  assert.equal(policy.version, 2);
  assert.deepEqual(policy.durationQuality.allowedEffectiveWordsPerMinute, [150, 170]);
  assert.equal(policy.hookQuality.sceneSettingOnlyForbidden ?? true, true);
  assert.equal(policy.hookQuality.hardMaxFirstSentenceWords, 24);
  assert.equal(templatePlan.status, 'PLANNED');
  assert.deepEqual(templatePlan.structure, ['hook', 'setup', 'main', 'resolution', 'closing']);
  const hook = templatePlan.sections.find((section) => section.id === 'hook');
  assert.equal(hook.sceneSettingOnly, false);
  assert.ok(String(hook.hookType).startsWith('['));
  assert.ok(String(hook.curiosityGap).startsWith('['));
  assert.ok(String(hook.titleConnection).startsWith('['));
  assert.ok(String(hook.payoffPromise).startsWith('['));
});

test('Pipeline v7 behält Cover-Gate, automatische 5er-Blöcke und neue Qualitätsgates', async () => {
  const policy = JSON.parse(await readFile('config/pipeline.json', 'utf8'));
  assert.equal(policy.coverPolicy.firstSceneIsCover, true);
  assert.equal(policy.coverPolicy.coverCandidateCount, 3);
  assert.equal(policy.pipelineVersion, 7);
  assert.equal(policy.coverPolicy.autoSelectWinner, false);
  assert.equal(policy.coverPolicy.selectionAuthority, 'user');
  assert.equal(policy.coverPolicy.userSelectionRequired, true);
  assert.equal(policy.coverPolicy.hardStopAfterCoverCandidates, true);
  assert.equal(policy.coverPolicy.continueBeforeUserSelectionForbidden, true);
  assert.equal(policy.coverPolicy.winnerBecomesFirstSceneAndThumbnail, true);
  assert.equal(policy.coverPolicy.deleteLosingCandidates, true);
  assert.equal(policy.imagePolicy.fixedImageCountForbidden, true);
  assert.equal(policy.imagePolicy.nonCoverGenerationCount, 1);
  assert.equal(policy.imagePolicy.generationBatchSize, 5);
  assert.equal(policy.imagePolicy.maxConcurrentGenerations, 5);
  assert.equal(policy.imagePolicy.batchExecutionMode, 'automatic-sequential');
  assert.equal(policy.imagePolicy.automaticBatchContinuation, true);
  assert.equal(policy.imagePolicy.hardStopAfterEachBatch, false);
  assert.equal(policy.imagePolicy.userContinueRequiredBetweenBatches, false);
  assert.equal(policy.imagePolicy.batchContinuationAuthority, 'agent');
  assert.equal(policy.imagePolicy.explicitContinueRequired, false);
  assert.equal(policy.imagePolicy.continueUntilImageNN, true);
  assert.equal(policy.imagePolicy.finalIntegrityCheckRequired, true);
  assert.equal(policy.imagePolicy.finalCountMustMatchPlannedImageCount, true);
  assert.equal(policy.imagePolicy.missingImageRepairRequired, true);
  assert.equal(policy.imagePolicy.repairOnlyMissingOrBroken, true);
  assert.equal(policy.imagePolicy.finalImageDirectory, '00-bildprompts/images');
  assert.equal(policy.imagePolicy.finalFolderMustBeFlat, true);
  assert.equal(policy.imagePolicy.finalFolderOnlyNumberedImages, true);
  assert.equal(policy.imagePolicy.referenceMode, 'none');
  assert.equal(policy.imagePolicy.useImageReferences, false);
  assert.equal(policy.imagePolicy.generatedImageReferenceForbidden, true);
  assert.equal(policy.imagePolicy.finalFolderMustBeFlat, true);
  assert.deepEqual(policy.imagePolicy.targetAverageHoldSeconds, [4.5, 7.5]);
  assert.equal(policy.audioPolicy.playbackRate, 1.1);
  assert.equal(policy.audioPolicy.loudnessTargetLufs, -16);
  assert.equal(policy.audioPolicy.truePeakDbtp, -1.5);
  assert.equal(policy.endHoldPolicy.targetSeconds, 1.3);
  assert.equal(policy.qualityGates.strongHookRequiredFromVersion, 7);
  assert.equal(policy.qualityGates.visualContinuityProfileRequiredFromVersion, 7);
  assert.equal(policy.qualityGates.visualSelfReviewRequiredFromVersion, 7);
  assert.equal(policy.qualityGates.targetDurationHardGate, true);
});

test('Projekt-Template enthält Flow-Coverwahl, keine Bildreferenz, flexible Visual Forms und Upload-Metadaten', async () => {
  const meta = JSON.parse(await readFile('youtube/templates/video-template/99-technik/video.json', 'utf8'));
  const prompt = await readFile('youtube/templates/video-template/00-bildprompts/google-flow-prompt.txt', 'utf8');
  assert.equal(meta.visualStyleId, 'UNSET');
  assert.equal(meta.topic, '');
  assert.equal(meta.title, '');
  assert.deepEqual(meta.uploadMetadata, { title: '', description: '', tags: [] });
  assert.equal(meta.pipelineVersion, 7);
  assert.equal(meta.coverPolicy.autoSelectWinner, false);
  assert.equal(meta.coverPolicy.selectionAuthority, 'user');
  assert.equal(meta.coverPolicy.userSelectionRequired, true);
  assert.equal(meta.coverPolicy.hardStopAfterCoverCandidates, true);
  assert.equal(meta.coverPolicy.winnerBecomesFirstSceneAndThumbnail, true);
  assert.equal(meta.imageDensityPolicy.referenceMode, 'none');
  assert.equal(meta.imageDensityPolicy.useImageReferences, false);
  assert.equal(meta.imageDensityPolicy.generatedImageReferenceForbidden, true);
  assert.equal(meta.imageDensityPolicy.finalImageDirectory, '00-bildprompts/images');
  assert.equal(meta.imageDensityPolicy.finalFolderMustBeFlat, true);
  assert.equal(meta.imageDensityPolicy.finalFolderOnlyNumberedImages, true);
  assert.equal(meta.visualContinuityProfile.adjacentSceneContinuityRequired, true);
  assert.ok(String(meta.visualContinuityProfile.environmentAnchor).startsWith('['));
  assert.match(prompt, /ACTIVE_STYLE_ID: UNSET/);
  assert.match(prompt, /ALLES STICKMAN/i);
  assert.match(prompt, /GENAU 3 COVER/i);
  assert.match(prompt, /HARD STOP/i);
  assert.match(prompt, /COVER-WAHL ERFORDERLICH/i);
  assert.match(prompt, /A, B oder C/i);
  assert.match(prompt, /automatisch/i);
  assert.match(prompt, /OHNE Rückfrage|KEIN .*WEITER|nicht auf .*WEITER.*warten/is);
  assert.doesNotMatch(prompt, /antworte WEITER|nur nach .*WEITER/i);
  assert.match(prompt, /Soll-Ist|Vollständigkeits/i);
  assert.match(prompt, /fehl.*neu erzeug/is);
  assert.match(prompt, /KEINE Bildreferenz/i);
  assert.match(prompt, /5ER-(BLÖCKEN|SCHRITTEN)/i);
  assert.match(prompt, /Keine feste Zielbildzahl/i);
  assert.match(prompt, /Bild 01\.png.*Bild NN\.png/is);
  assert.match(prompt, /2er- oder 3er-Multi-Panel/i);
  assert.match(prompt, /Diagramm/i);
  assert.match(prompt, /GLEICHE WELT/i);
  assert.match(prompt, /ILLUSTRATION ZUERST/i);
  assert.match(prompt, /Reine Infografik.*nur.*klarer/is);
  assert.match(prompt, /visualContinuityProfile/i);
  assert.match(prompt, /WELT- UND UMGEBUNGSKONTINUITÄT/i);
  assert.match(prompt, /STILLE BILD-QC NACH JEDEM 5ER-BLOCK/i);
  assert.match(prompt, /durchfällt.*neu erzeug/is);
});

test('Legacy-Testprojekt v4 bleibt reproduzierbar und nutzt keine Bildreferenz', async () => {
  const meta = JSON.parse(await readFile(path.join(TEST_PROJECT, '99-technik', 'video.json'), 'utf8'));
  const mapping = JSON.parse(await readFile(path.join(TEST_PROJECT, '99-technik', 'BILD_AUDIO_ZUORDNUNG.json'), 'utf8'));
  const scriptPlan = JSON.parse(await readFile(path.join(TEST_PROJECT, '99-technik', 'SCRIPT_PLAN.json'), 'utf8'));
  const script = await readFile(path.join(TEST_PROJECT, '01-voice-script', 'voice-script.txt'), 'utf8');
  const prompt = await readFile(path.join(TEST_PROJECT, '00-bildprompts', 'google-flow-prompt.txt'), 'utf8');
  assert.equal(meta.plannedImageCount, 18);
  assert.ok(meta.targetDurationSeconds <= 120);
  assert.equal(meta.coverPolicy.autoSelectWinner, true);
  assert.equal(meta.coverPolicy.selectionAuthority, 'google-flow');
  assert.equal(meta.coverPolicy.userSelectionRequired, false);
  assert.equal(meta.coverPolicy.winnerBecomesFirstSceneAndThumbnail, true);
  assert.equal(meta.imageDensityPolicy.referenceMode, 'none');
  assert.equal(meta.imageDensityPolicy.useImageReferences, false);
  assert.equal(meta.imageDensityPolicy.generatedImageReferenceForbidden, true);
  assert.equal(mapping.images.length, 18);
  assert.equal(scriptPlan.status, 'READY');
  assert.deepEqual(scriptPlan.sections.map((section) => section.id), ['hook', 'setup', 'main', 'resolution', 'closing']);
  assert.equal(script.indexOf(scriptPlan.sections[0].startAnchor), 0);
  assert.ok(script.trim().split(/\s+/).length >= 200);
  assert.ok(script.trim().split(/\s+/).length <= 260);
  assert.match(prompt, /Google Flow.*selbst/i);
  assert.match(prompt, /KEINE Bildreferenz/i);
  const result = await validatePhase1(TEST_PROJECT);
  assert.equal(result.passed, true, result.errors.join('\n'));
});

test('Zweites 2-Minuten-Testprojekt besteht das neue Skript- und Phase-1-Gate', async () => {
  const meta = JSON.parse(await readFile(path.join(SECOND_TEST_PROJECT, '99-technik', 'video.json'), 'utf8'));
  const mapping = JSON.parse(await readFile(path.join(SECOND_TEST_PROJECT, '99-technik', 'BILD_AUDIO_ZUORDNUNG.json'), 'utf8'));
  const scriptPlan = JSON.parse(await readFile(path.join(SECOND_TEST_PROJECT, '99-technik', 'SCRIPT_PLAN.json'), 'utf8'));
  const script = await readFile(path.join(SECOND_TEST_PROJECT, '01-voice-script', 'voice-script.txt'), 'utf8');
  assert.equal(meta.plannedImageCount, 17);
  assert.ok(meta.targetDurationSeconds <= 120);
  assert.equal(mapping.images.length, 17);
  const pureInfoForms = mapping.images.filter((image) => /Infografik|Diagramm|Text-\/Zahlenfokus/i.test(String(image.visualForm)));
  assert.equal(pureInfoForms.length, 0, 'Video 2 soll nach der Überarbeitung von Illustrationen/Szenen getragen werden.');
  assert.ok(mapping.images.some((image) => /Handlungsszene|Umgebungsszene|illustriert|Zusammenführungsszene/i.test(String(image.visualForm))));
  assert.equal(scriptPlan.status, 'READY');
  assert.deepEqual(scriptPlan.sections.map((section) => section.id), ['hook', 'setup', 'main', 'resolution', 'closing']);
  assert.equal(script.indexOf(scriptPlan.sections[0].startAnchor), 0);
  assert.ok(script.trim().split(/\s+/).length >= 210);
  assert.ok(script.trim().split(/\s+/).length <= 300);
  const result = await validatePhase1(SECOND_TEST_PROJECT);
  assert.equal(result.passed, true, result.errors.join('\n'));
});

test('Drittes Testprojekt nutzt Illustration-zuerst und besteht Phase 1', async () => {
  const meta = JSON.parse(await readFile(path.join(THIRD_TEST_PROJECT, '99-technik', 'video.json'), 'utf8'));
  const mapping = JSON.parse(await readFile(path.join(THIRD_TEST_PROJECT, '99-technik', 'BILD_AUDIO_ZUORDNUNG.json'), 'utf8'));
  const scriptPlan = JSON.parse(await readFile(path.join(THIRD_TEST_PROJECT, '99-technik', 'SCRIPT_PLAN.json'), 'utf8'));
  const script = await readFile(path.join(THIRD_TEST_PROJECT, '01-voice-script', 'voice-script.txt'), 'utf8');
  const prompt = await readFile(path.join(THIRD_TEST_PROJECT, '00-bildprompts', 'google-flow-prompt.txt'), 'utf8');
  assert.equal(meta.pipelineVersion, 6);
  assert.equal(meta.plannedImageCount, 16);
  assert.ok(meta.targetDurationSeconds <= 120);
  assert.equal(meta.coverPolicy.autoSelectWinner, false);
  assert.equal(meta.coverPolicy.selectionAuthority, 'user');
  assert.equal(meta.coverPolicy.userSelectionRequired, true);
  assert.equal(meta.coverPolicy.hardStopAfterCoverCandidates, true);
  assert.equal(meta.imageDensityPolicy.batchExecutionMode, 'automatic-sequential');
  assert.equal(meta.imageDensityPolicy.automaticBatchContinuation, true);
  assert.equal(meta.imageDensityPolicy.hardStopAfterEachBatch, false);
  assert.equal(meta.imageDensityPolicy.userContinueRequiredBetweenBatches, false);
  assert.equal(meta.imageDensityPolicy.batchContinuationAuthority, 'agent');
  assert.equal(meta.imageDensityPolicy.continueUntilImageNN, true);
  assert.equal(meta.imageDensityPolicy.finalIntegrityCheckRequired, true);
  assert.equal(meta.imageDensityPolicy.missingImageRepairRequired, true);
  assert.equal(meta.imageDensityPolicy.finalImageDirectory, '00-bildprompts/images');
  assert.equal(meta.imageDensityPolicy.finalFolderMustBeFlat, true);
  assert.equal(meta.imageDensityPolicy.finalFolderOnlyNumberedImages, true);
  assert.equal(mapping.images.length, 16);
  assert.equal(scriptPlan.status, 'READY');
  assert.equal(script.indexOf(scriptPlan.sections[0].startAnchor), 0);
  assert.ok(script.trim().split(/\s+/).length >= 220);
  assert.ok(script.trim().split(/\s+/).length <= 280);
  assert.match(prompt, /ILLUSTRATION ZUERST/i);
  assert.match(prompt, /HARD STOP/i);
  assert.match(prompt, /Nutzerwahl A, B oder C|A, B oder C/i);
  assert.match(prompt, /automatisch/i);
  assert.match(prompt, /keine Rückfrage|kein `WEITER`|nicht.*WEITER/is);
  assert.doesNotMatch(prompt, /nur nach .*WEITER|antworte WEITER/i);
  assert.match(prompt, /Soll-Ist|vollständig.*prüf/is);
  assert.match(prompt, /fehl.*neu erzeug/is);
  assert.match(prompt, /keine Bildreferenz/i);
  const illustrativeForms = mapping.images.filter((image) => /Szene|illustr|Bauszene|Vergleich|Mini-Sequenz|Nahaufnahme|Zusammenführung/i.test(String(image.visualForm)));
  assert.ok(illustrativeForms.length >= 12, `Zu wenige illustrative Visual Forms: ${illustrativeForms.length}/16`);
  const result = await validatePhase1(THIRD_TEST_PROJECT);
  assert.equal(result.passed, true, result.errors.join('\n'));
});

test('Viertes Testprojekt nutzt Pipeline v7 mit starkem Hook und stabiler Story-Welt', async () => {
  const meta = JSON.parse(await readFile(path.join(FOURTH_TEST_PROJECT, '99-technik', 'video.json'), 'utf8'));
  const mapping = JSON.parse(await readFile(path.join(FOURTH_TEST_PROJECT, '99-technik', 'BILD_AUDIO_ZUORDNUNG.json'), 'utf8'));
  const scriptPlan = JSON.parse(await readFile(path.join(FOURTH_TEST_PROJECT, '99-technik', 'SCRIPT_PLAN.json'), 'utf8'));
  const script = await readFile(path.join(FOURTH_TEST_PROJECT, '01-voice-script', 'voice-script.txt'), 'utf8');
  const prompt = await readFile(path.join(FOURTH_TEST_PROJECT, '00-bildprompts', 'google-flow-prompt.txt'), 'utf8');
  assert.equal(meta.pipelineVersion, 7);
  assert.equal(meta.plannedImageCount, 20);
  assert.deepEqual(meta.targetDurationRangeSeconds, [100, 120]);
  assert.equal(meta.visualContinuityProfile.adjacentSceneContinuityRequired, true);
  assert.match(meta.visualContinuityProfile.environmentAnchor, /19\. Jahrhundert/i);
  assert.equal(mapping.images.length, 20);
  assert.equal(scriptPlan.status, 'READY');
  const hook = scriptPlan.sections.find((section) => section.id === 'hook');
  assert.equal(hook.hookType, 'contrast');
  assert.equal(hook.sceneSettingOnly, false);
  assert.ok(hook.curiosityGap.length > 20);
  assert.ok(hook.titleConnection.length > 20);
  assert.ok(hook.payoffPromise.length > 20);
  assert.equal(script.indexOf(hook.startAnchor), 0);
  const wordCount = script.trim().split(/\s+/).length;
  assert.ok(wordCount >= 275 && wordCount <= 312, `Unerwartete Wortzahl: ${wordCount}`);
  assert.match(prompt, /STILLE BILD-QC NACH JEDEM 5ER-BLOCK/i);
  assert.match(prompt, /WELT- UND UMGEBUNGSKONTINUITÄT/i);
  assert.match(prompt, /Bild 20/i);
  const result = await validatePhase1(FOURTH_TEST_PROJECT);
  assert.equal(result.passed, true, result.errors.join('\n'));
});

test('Erstes 6–7-Minuten-Longform hat recherchiertes Skript und 78 vollständige Szenen', async () => {
  const dir = LONGFORM_PROJECT;
  const meta = JSON.parse(await readFile(path.join(dir, '99-technik', 'video.json'), 'utf8'));
  const script = await readFile(path.join(dir, '01-voice-script', 'voice-script.txt'), 'utf8');
  const map = JSON.parse(await readFile(path.join(dir, '99-technik', 'BILD_AUDIO_ZUORDNUNG.json'), 'utf8'));
  const source = JSON.parse(await readFile(path.join(dir, '99-technik', 'LONGFORM_SOURCE.json'), 'utf8'));
  const plan = JSON.parse(await readFile(path.join(dir, '99-technik', 'LONGFORM_CHAPTER_PLAN.json'), 'utf8'));
  assert.equal(meta.contentMode, 'longform');
  assert.equal(meta.targetDurationSeconds, 400);
  assert.deepEqual(meta.targetDurationRangeSeconds, [365, 420]);
  assert.equal(meta.plannedImageCount, 78);
  assert.deepEqual(meta.uploadMetadata.hashtags, ['#AllesStickman', '#Trinkwasser', '#Geschichte']);
  assert.equal(map.images.length, 78);
  assert.equal(script.trim().split(/\s+/).length, 1048);
  assert.equal(source.scriptWords, 1048);
  assert.equal(source.status, 'READY');
  assert.equal(plan.sections.length, 15);
  assert.ok(meta.longformProfile.retentionBeatAnchors.length >= 5);
  assert.equal(meta.coverPolicy.userSelectionRequired, true);
  assert.equal(meta.imageDensityPolicy.automaticBatchContinuation, true);
  assert.equal(meta.imageDensityPolicy.referenceMode, 'none');
  assert.equal(map.images[0].imageFile, 'Bild 01.png');
  assert.equal(map.images.at(-1).imageFile, 'Bild 78.png');
  const phase1 = await validatePhase1(dir);
  assert.equal(phase1.passed, true, phase1.errors.join('\n'));
});

test('Pacing-QC blockiert echte Videodauer außerhalb des Zielbereichs', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'alles-stickman-duration-'));
  const tech = path.join(dir, '99-technik');
  await mkdir(tech, { recursive: true });
  await writeFile(path.join(tech, 'video.json'), JSON.stringify({
    targetDurationRangeSeconds: [100, 120]
  }), 'utf8');
  const images = Array.from({ length: 6 }, (_, index) => ({
    imageNumber: index + 1,
    startSeconds: index * 15,
    endSeconds: (index + 1) * 15,
    durationSeconds: 15
  }));
  await writeFile(path.join(tech, 'FINAL_TIMELINE.json'), JSON.stringify({
    durationSeconds: 90,
    audioDurationSeconds: 88.7,
    images
  }), 'utf8');
  try {
    const result = await validatePacing(dir);
    assert.equal(result.passed, false);
    assert.match(result.errors.join('\n'), /Videodauer 90\.00s.*100–120s/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('YouTube-Export baut gültige SRT- und Zeitstempeldateien', () => {
  const whisper = {
    segments: [
      { start: 0, end: 4.25, text: 'Hallo und willkommen.' },
      { start: 4.25, end: 10.1, text: 'Heute erklären wir das Thema.' }
    ]
  };
  assert.equal(formatSrtTimestamp(4.25), '00:00:04,250');
  const srt = buildSrtFromWhisper(whisper);
  assert.match(srt, /1\n00:00:00,000 --> 00:00:04,250\nHallo und willkommen\./);
  assert.match(srt, /2\n00:00:04,250 --> 00:00:10,100\nHeute erklären wir das Thema\./);
  const timed = buildTimedScriptFromWhisper(whisper);
  assert.match(timed, /\[00:00 - 00:04\] Hallo und willkommen\./);
  assert.match(timed, /\[00:04 - 00:10\] Heute erklären wir das Thema\./);
  const upload = buildUploadText({ title: 'Testtitel', description: 'Testbeschreibung', tags: ['Menschheit', 'Geschichte'] });
  assert.match(upload, /TITEL\nTesttitel/);
  assert.match(upload, /BESCHREIBUNG\nTestbeschreibung/);
  assert.match(upload, /TAGS\nMenschheit, Geschichte/);
  assert.match(upload, /SUBTITLES\.srt/);
  assert.match(upload, /TIMED_SCRIPT\.txt/);
  assert.match(upload, /BESCHREIBUNG\nTestbeschreibung\n\n#AllesStickman #Menschheit #Geschichte/);
  const custom = buildUploadText({
    title: 'Wasser', description: 'Quellen und Brunnen',
    tags: ['Menschheit', 'Aquädukt'],
    hashtags: ['#AllesStickman', '#Trinkwasser', '#Geschichte']
  });
  assert.match(custom, /BESCHREIBUNG\nQuellen und Brunnen\n\n#AllesStickman #Trinkwasser #Geschichte/);
  assert.equal((custom.match(/#Trinkwasser/g) ?? []).length, 1);
  assert.match(buildDescriptionWithHashtags('Text #Trinkwasser', {
    hashtags: ['#Trinkwasser', '#Geschichte']
  }), /Text #Trinkwasser\n\n#AllesStickman #Geschichte/);

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

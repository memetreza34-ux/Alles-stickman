#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { arg, exists, projectPaths, readJson } from '../lib/pipeline.js';

export async function validatePhase1(projectDirectory) {
  const p = projectPaths(projectDirectory);
  const errors = [];

  for (const required of [p.meta, p.mapping, p.prompt, p.script, p.scriptPlan, p.renderPlan]) {
    if (!(await exists(required))) errors.push(`Pflichtdatei fehlt: ${path.relative(p.projectDir, required)}`);
  }
  if (errors.length) return { passed: false, errors };

  const [meta, mapping, scriptPlan, scriptPolicy, visual, pipeline, prompt, script] = await Promise.all([
    readJson(p.meta),
    readJson(p.mapping),
    readJson(p.scriptPlan),
    readJson(path.resolve('config/script-policy.json')),
    readJson(path.resolve('config/visual-policy.json')),
    readJson(path.resolve('config/pipeline.json')),
    readFile(p.prompt, 'utf8'),
    readFile(p.script, 'utf8')
  ]);

  if (visual.status !== 'READY') errors.push('config/visual-policy.json ist noch nicht READY.');
  if (!visual.styleId || visual.styleId === 'UNSET') errors.push('visual-policy.styleId ist UNSET.');
  if (meta.visualStyleId !== visual.styleId) errors.push('video.json.visualStyleId entspricht nicht der aktiven Bildwelt.');
  if (!meta.title || !meta.topic || !meta.topicSlug) errors.push('Titel, Thema oder Slug fehlen in video.json.');

  const uploadMetadata = meta.uploadMetadata ?? {};
  if (!String(uploadMetadata.title ?? '').trim()) errors.push('YouTube-Uploadtitel fehlt in video.json.uploadMetadata.title.');
  if (!String(uploadMetadata.description ?? '').trim()) errors.push('YouTube-Beschreibung fehlt in video.json.uploadMetadata.description.');
  if (!Array.isArray(uploadMetadata.tags)) errors.push('video.json.uploadMetadata.tags muss ein Array sein.');

  if (!Number.isInteger(meta.plannedImageCount) || meta.plannedImageCount < 1) errors.push('plannedImageCount muss in Phase 1 auf eine inhaltsgetriebene Bildzahl gesetzt werden.');
  if (!Number.isFinite(Number(meta.targetDurationSeconds)) || Number(meta.targetDurationSeconds) <= 0) errors.push('targetDurationSeconds fehlt.');
  if (meta.imageDensityPolicy?.fixedImageCountForbidden !== true) errors.push('Adaptive Bilddichte muss aktiv sein.');

  const pipelineVersion = Number(meta.pipelineVersion ?? 0);
  const humanGatedCoverFlow = pipelineVersion >= 5;
  const automaticBatchFlow = pipelineVersion >= 6;

  if (meta.coverPolicy?.coverCandidateCount !== 3) errors.push('Cover-Workflow muss genau 3 Cover-Kandidaten vorsehen.');
  if (humanGatedCoverFlow) {
    if (meta.coverPolicy?.autoSelectWinner !== false) errors.push('Pipeline v5+: Google Flow darf den Cover-Gewinner nicht automatisch auswählen.');
    if (meta.coverPolicy?.selectionAuthority !== 'user') errors.push('Pipeline v5+: coverPolicy.selectionAuthority muss user sein.');
    if (meta.coverPolicy?.userSelectionRequired !== true) errors.push('Pipeline v5+: Der Nutzer muss A, B oder C auswählen.');
    if (meta.coverPolicy?.hardStopAfterCoverCandidates !== true) errors.push('Pipeline v5+: Nach den drei Cover-Kandidaten ist ein HARD STOP Pflicht.');
    if (meta.coverPolicy?.continueBeforeUserSelectionForbidden !== true) errors.push('Pipeline v5+: Vor der Nutzerwahl dürfen keine Folgebilder erzeugt werden.');
  } else {
    // Legacy-Projekte v4 bleiben reproduzierbar, neue Projekte dürfen diese Logik nicht mehr verwenden.
    if (meta.coverPolicy?.autoSelectWinner !== true) errors.push('Legacy v4: Google Flow muss den Cover-Gewinner automatisch auswählen.');
    if (meta.coverPolicy?.selectionAuthority !== 'google-flow') errors.push('Legacy v4: selectionAuthority muss google-flow sein.');
    if (meta.coverPolicy?.userSelectionRequired !== false) errors.push('Legacy v4: userSelectionRequired muss false sein.');
  }
  if (meta.coverPolicy?.winnerBecomesFirstSceneAndThumbnail !== true) errors.push('Der gewählte Cover-Gewinner muss Bild 01 und Thumbnail werden.');
  if (meta.coverPolicy?.deleteLosingCandidates !== true) errors.push('Die zwei nicht gewählten Cover-Kandidaten müssen gelöscht werden.');
  if (meta.coverPolicy?.separateThumbnailForbidden !== true) errors.push('Bild 01 muss Cover und erste Videoszene bleiben.');

  if (meta.imageDensityPolicy?.generationBatchSize !== 5) errors.push('Folgebilder müssen in 5er-Blöcken geplant werden.');
  if (meta.imageDensityPolicy?.maxConcurrentGenerations !== 5) errors.push('Maximal 5 aktive Bildgenerierungen sind erlaubt.');
  if (automaticBatchFlow) {
    if (meta.imageDensityPolicy?.batchExecutionMode !== 'automatic-sequential') errors.push('Pipeline v6+: batchExecutionMode muss automatic-sequential sein.');
    if (meta.imageDensityPolicy?.automaticBatchContinuation !== true) errors.push('Pipeline v6+: Nach einem 5er-Block muss automatisch der nächste starten.');
    if (meta.imageDensityPolicy?.hardStopAfterEachBatch !== false) errors.push('Pipeline v6+: Zwischen 5er-Blöcken darf kein HARD STOP liegen.');
    if (meta.imageDensityPolicy?.userContinueRequiredBetweenBatches !== false) errors.push('Pipeline v6+: Zwischen 5er-Blöcken darf keine Nutzerfreigabe verlangt werden.');
    if (meta.imageDensityPolicy?.batchContinuationAuthority !== 'agent') errors.push('Pipeline v6+: batchContinuationAuthority muss agent sein.');
    if (meta.imageDensityPolicy?.explicitContinueRequired !== false) errors.push('Pipeline v6+: WEITER darf zwischen 5er-Blöcken nicht erforderlich sein.');
    if (meta.imageDensityPolicy?.continueUntilImageNN !== true) errors.push('Pipeline v6+: Produktion muss automatisch bis Bild NN laufen.');
    if (meta.imageDensityPolicy?.finalIntegrityCheckRequired !== true) errors.push('Pipeline v6+: Finaler Soll-Ist-Bildercheck ist Pflicht.');
    if (meta.imageDensityPolicy?.finalCountMustMatchPlannedImageCount !== true) errors.push('Pipeline v6+: Finale Bildanzahl muss plannedImageCount entsprechen.');
    if (meta.imageDensityPolicy?.missingImageRepairRequired !== true) errors.push('Pipeline v6+: Fehlende Bildnummern müssen automatisch repariert werden.');
    if (meta.imageDensityPolicy?.repairOnlyMissingOrBroken !== true) errors.push('Pipeline v6+: Reparatur darf nur fehlende/kaputte Bildnummern betreffen.');
  } else if (humanGatedCoverFlow) {
    if (meta.imageDensityPolicy?.oneBatchPerAgentTurn !== true) errors.push('Legacy v5: Pro Agenten-Schritt ist genau ein 5er-Block erlaubt.');
    if (meta.imageDensityPolicy?.hardStopAfterEachBatch !== true) errors.push('Legacy v5: Nach jedem 5er-Block ist ein HARD STOP Pflicht.');
    if (meta.imageDensityPolicy?.userContinueRequiredBetweenBatches !== true) errors.push('Legacy v5: Zwischen 5er-Blöcken ist Nutzerfreigabe Pflicht.');
    if (meta.imageDensityPolicy?.batchContinuationAuthority !== 'user') errors.push('Legacy v5: batchContinuationAuthority muss user sein.');
    if (meta.imageDensityPolicy?.explicitContinueRequired !== true) errors.push('Legacy v5: Der nächste Block darf nur nach ausdrücklichem WEITER starten.');
  }
  if (meta.imageDensityPolicy?.nonCoverGenerationCount !== 1) errors.push('Bild 02 bis Bild NN dürfen jeweils nur einmal erzeugt werden.');
  if (meta.imageDensityPolicy?.referenceMode !== 'none') errors.push('imageDensityPolicy.referenceMode muss none sein.');
  if (meta.imageDensityPolicy?.useImageReferences !== false) errors.push('Für Bild 02 bis Bild NN dürfen keine Bildreferenzen verwendet werden.');
  if (meta.imageDensityPolicy?.generatedImageReferenceForbidden !== true) errors.push('Generierte Bilder müssen als Referenzvorlagen ausdrücklich verboten sein.');

  if (visual.referenceConsistency?.referenceMode !== 'none') errors.push('visual-policy.referenceConsistency.referenceMode muss none sein.');
  if (visual.referenceConsistency?.useImageReferences !== false) errors.push('visual-policy muss Bildreferenzen ausdrücklich deaktivieren.');
  if (visual.referenceConsistency?.generatedImageReferenceForbidden !== true) errors.push('visual-policy muss generierte Bildreferenzen ausdrücklich verbieten.');

  const hold = Number(meta.renderPolicy?.endHoldSeconds);
  const minHold = Number(pipeline.endHoldPolicy?.minimumSeconds ?? 1.2);
  const maxHold = Number(pipeline.endHoldPolicy?.maximumSeconds ?? 1.5);
  if (!Number.isFinite(hold) || hold < minHold || hold > maxHold) errors.push(`endHoldSeconds muss zwischen ${minHold} und ${maxHold} liegen.`);

  const cleanScript = script.trim();
  if (!cleanScript || /VOICE-OVER-SKRIPT HIER EINFÜGEN/i.test(cleanScript)) errors.push('Voice-over-Skript ist noch Platzhalter.');

  // Kanaltypisches Skript-Gate
  if (scriptPolicy.status !== 'READY') errors.push('config/script-policy.json ist nicht READY.');
  if (scriptPlan.status !== 'READY') errors.push('SCRIPT_PLAN.json muss vor Phase 1 auf READY stehen.');

  const expectedSections = Array.isArray(scriptPolicy.structure) ? scriptPolicy.structure : ['hook', 'setup', 'main', 'resolution', 'closing'];
  const planSections = Array.isArray(scriptPlan.sections) ? scriptPlan.sections : [];
  const sectionById = new Map(planSections.map((section) => [section.id, section]));
  let lastSectionIndex = -1;

  for (const sectionId of expectedSections) {
    const section = sectionById.get(sectionId);
    if (!section) {
      errors.push(`SCRIPT_PLAN: Pflichtabschnitt fehlt: ${sectionId}.`);
      continue;
    }
    const anchor = String(section.startAnchor ?? '').trim();
    if (!anchor || anchor.startsWith('[')) {
      errors.push(`SCRIPT_PLAN: Startanker für ${sectionId} fehlt/ist Platzhalter.`);
      continue;
    }
    const at = cleanScript.indexOf(anchor);
    if (at < 0) errors.push(`SCRIPT_PLAN: Startanker für ${sectionId} kommt nicht exakt im Skript vor.`);
    else {
      if (at <= lastSectionIndex) errors.push(`SCRIPT_PLAN: Abschnitt ${sectionId} steht nicht in der richtigen Reihenfolge.`);
      lastSectionIndex = at;
      if (sectionId === 'hook' && at !== 0) errors.push('SCRIPT_PLAN: Der Hook muss direkt am Skriptanfang beginnen.');
    }
  }

  const opening = cleanScript.slice(0, 180).toLowerCase();
  for (const pattern of scriptPolicy.openingRules?.forbiddenPatterns ?? []) {
    if (new RegExp(pattern, 'i').test(opening)) {
      errors.push(`Skript beginnt mit verbotener generischer Einleitung: ${pattern}`);
      break;
    }
  }

  const words = cleanScript.split(/\s+/).filter(Boolean);
  const durationMinutes = Number(meta.targetDurationSeconds) / 60;
  const [minWpm, maxWpm] = scriptPolicy.pacingRules?.targetWordsPerMinute ?? [115, 180];
  if (Number.isFinite(durationMinutes) && durationMinutes > 0) {
    const wpm = words.length / durationMinutes;
    if (wpm < minWpm || wpm > maxWpm) {
      errors.push(`Skript-Wortdichte ${wpm.toFixed(1)} WPM liegt außerhalb ${minWpm}–${maxWpm} WPM.`);
    }
  }

  const hardMaxSentenceWords = Number(scriptPolicy.languageRules?.hardMaxWordsPerSentence ?? 32);
  const sentences = cleanScript.split(/(?<=[.!?])\s+/).map((value) => value.trim()).filter(Boolean);
  const seenSentences = new Set();
  for (const sentence of sentences) {
    const sentenceWords = sentence.split(/\s+/).filter(Boolean);
    if (sentenceWords.length > hardMaxSentenceWords) {
      errors.push(`Satz ist mit ${sentenceWords.length} Wörtern zu lang (Hard-Max ${hardMaxSentenceWords}): ${sentence.slice(0, 80)}...`);
    }
    const normalizedSentence = sentence.toLowerCase().replace(/[^a-z0-9äöüß]+/gi, ' ').trim();
    if (sentenceWords.length >= 8 && seenSentences.has(normalizedSentence)) {
      errors.push(`Exakte Satzwiederholung im Skript: ${sentence.slice(0, 80)}`);
    }
    seenSentences.add(normalizedSentence);
  }
  if (!prompt.includes(`ACTIVE_STYLE_ID: ${visual.styleId}`)) errors.push('Flow-Prompt nennt nicht die aktive styleId.');
  if (/ACTIVE_STYLE_ID:\s*UNSET/i.test(prompt)) errors.push('Flow-Prompt enthält noch UNSET.');
  if (!/GENAU 3 COVER/i.test(prompt)) errors.push('Flow-Prompt enthält die 3-Cover-Regel nicht eindeutig.');
  if (humanGatedCoverFlow) {
    if (!/HARD STOP/i.test(prompt)) errors.push('Pipeline v5+: Flow-Prompt muss den HARD STOP nach den Covers eindeutig enthalten.');
    if (!/Nutzer.*(A, B oder C|A\/B\/C|wähl)/i.test(prompt)) errors.push('Pipeline v5+: Flow-Prompt muss die Nutzer-Coverwahl eindeutig verlangen.');
    if (!/(kein|NICHT).*Bild 02/i.test(prompt)) errors.push('Pipeline v5+: Vor der Coverwahl muss Bild 02 ausdrücklich verboten sein.');
  } else {
    if (!/Google Flow.*selbst/i.test(prompt)) errors.push('Legacy v4: Flow-Prompt muss automatische Coverwahl enthalten.');
  }
  if (automaticBatchFlow) {
    if (!/(automatisch|sofort).*5ER-Bl[öo]ck|5ER-Bl[öo]ck.*automatisch/is.test(prompt)) errors.push('Pipeline v6+: Flow-Prompt muss automatische 5er-Block-Fortsetzung eindeutig enthalten.');
    if (!/(ohne Rückfrage|nicht fragen|KEIN.*WEITER|nicht auf .*WEITER.*warten)/is.test(prompt)) errors.push('Pipeline v6+: Zwischen Blöcken darf keine Nutzerfreigabe verlangt werden.');
    if (/(antworte WEITER|nur nach .*WEITER|ausdrückliche[mrns ]+.*WEITER)/i.test(prompt)) errors.push('Pipeline v6+: Flow-Prompt enthält noch ein verbotenes WEITER-Gate zwischen Blöcken.');
    if (!/(Soll-Ist|Vollständigkeits).*(prüf|abgleich)|prüf.*Bild 01.*Bild NN/is.test(prompt)) errors.push('Pipeline v6+: Finaler Vollständigkeitscheck fehlt im Flow-Prompt.');
    if (!/(fehlt|fehlende).*(neu erzeug|erzeug.*neu|repar)/is.test(prompt)) errors.push('Pipeline v6+: Flow-Prompt muss fehlende Bildnummern automatisch neu erzeugen.');
    if (!/gemeinsam.*Ordner|selben Ordner|gemeinsamen finalen Ordner/is.test(prompt)) errors.push('Pipeline v6+: Alle finalen Bilder müssen gemeinsam in einem Ordner liegen.');
  } else if (humanGatedCoverFlow) {
    if (!/WEITER/i.test(prompt)) errors.push('Legacy v5: Flow-Prompt muss WEITER als Batch-Freigabe verlangen.');
  }
  if (!/KEINE Bildreferenz/i.test(prompt)) errors.push('Flow-Prompt enthält die referenzfreie Bildregel nicht eindeutig.');
  if (!/5ER-(BLÖCKEN|SCHRITTEN)/i.test(prompt)) errors.push('Flow-Prompt enthält die 5er-Block-Regel nicht eindeutig.');

  const images = Array.isArray(mapping.images) ? mapping.images : [];
  if (Number.isInteger(meta.plannedImageCount) && images.length !== meta.plannedImageCount) {
    errors.push(`Mapping enthält ${images.length} Bilder, erwartet ${meta.plannedImageCount}.`);
  }
  if (images.length && mapping.videoLastImageNumber !== images.length) errors.push('videoLastImageNumber entspricht nicht der Mapping-Länge.');

  let lastAnchorIndex = -1;
  for (let index = 0; index < images.length; index += 1) {
    const image = images[index];
    const expected = index + 1;
    if (Number(image.imageNumber) !== expected) errors.push(`Bildnummern müssen lückenlos sein: erwartet ${expected}.`);
    if (image.imageFile !== `Bild ${String(expected).padStart(2, '0')}.png`) errors.push(`Falscher Dateiname bei Bild ${expected}.`);
    if (!image.startAnchor || String(image.startAnchor).startsWith('[')) errors.push(`Startanker fehlt/ist Platzhalter bei Bild ${expected}.`);
    if (!image.visualPurpose) errors.push(`visualPurpose fehlt bei Bild ${expected}.`);
    if (!image.topicAnchor) errors.push(`topicAnchor fehlt bei Bild ${expected}.`);
    if (!image.visualForm) errors.push(`visualForm fehlt bei Bild ${expected}.`);
    if (!Number.isFinite(Number(image.plannedHoldSeconds))) errors.push(`plannedHoldSeconds fehlt bei Bild ${expected}.`);

    if (image.startAnchor && !String(image.startAnchor).startsWith('[')) {
      const at = cleanScript.indexOf(image.startAnchor);
      if (at < 0) errors.push(`Startanker von Bild ${expected} kommt nicht exakt im Skript vor.`);
      else if (at <= lastAnchorIndex) errors.push(`Startanker von Bild ${expected} ist nicht monoton.`);
      else lastAnchorIndex = at;
    }

    const marker = `Bild ${String(expected).padStart(2, '0')}`;
    if (!prompt.includes(marker)) errors.push(`${marker} fehlt im Flow-Prompt.`);
  }

  return { passed: errors.length === 0, errors };
}

async function main() {
  const dir = arg('--dir');
  if (!dir) throw new Error('Nutzung: npm run validate:youtube-phase1 -- --dir "youtube/<week>/<slug>"');
  const result = await validatePhase1(dir);
  if (!result.passed) {
    for (const error of result.errors) console.error(`- ${error}`);
    throw new Error(`${result.errors.length} Phase-1-Regel(n) verletzt.`);
  }
  console.log('YouTube Phase 1: BESTANDEN');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(`YouTube Phase 1: FEHLER — ${error.message}`);
    process.exitCode = 1;
  });
}

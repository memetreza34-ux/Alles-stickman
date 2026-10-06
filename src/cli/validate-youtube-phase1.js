#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { arg, exists, projectPaths, readJson } from '../lib/pipeline.js';

export async function validatePhase1(projectDirectory) {
  const p = projectPaths(projectDirectory);
  const errors = [];

  for (const required of [p.meta, p.mapping, p.prompt, p.script, p.renderPlan]) {
    if (!(await exists(required))) errors.push(`Pflichtdatei fehlt: ${path.relative(p.projectDir, required)}`);
  }
  if (errors.length) return { passed: false, errors };

  const [meta, mapping, visual, pipeline, prompt, script] = await Promise.all([
    readJson(p.meta),
    readJson(p.mapping),
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

  if (meta.coverPolicy?.coverCandidateCount !== 3) errors.push('Cover-Workflow muss genau 3 Cover-Kandidaten vorsehen.');
  if (meta.coverPolicy?.autoSelectWinner !== true) errors.push('Google Flow muss den Cover-Gewinner automatisch auswählen.');
  if (meta.coverPolicy?.selectionAuthority !== 'google-flow') errors.push('coverPolicy.selectionAuthority muss google-flow sein.');
  if (meta.coverPolicy?.userSelectionRequired !== false) errors.push('Der Nutzer darf nicht zur Cover-Auswahl aufgefordert werden.');
  if (meta.coverPolicy?.winnerBecomesFirstSceneAndThumbnail !== true) errors.push('Der Flow-Gewinner muss Bild 01 und Thumbnail werden.');
  if (meta.coverPolicy?.deleteLosingCandidates !== true) errors.push('Die zwei nicht gewählten Cover-Kandidaten müssen gelöscht werden.');
  if (meta.coverPolicy?.separateThumbnailForbidden !== true) errors.push('Bild 01 muss Cover und erste Videoszene bleiben.');

  if (meta.imageDensityPolicy?.generationBatchSize !== 5) errors.push('Folgebilder müssen in 5er-Blöcken geplant werden.');
  if (meta.imageDensityPolicy?.maxConcurrentGenerations !== 5) errors.push('Maximal 5 aktive Bildgenerierungen sind erlaubt.');
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
  if (!prompt.includes(`ACTIVE_STYLE_ID: ${visual.styleId}`)) errors.push('Flow-Prompt nennt nicht die aktive styleId.');
  if (/ACTIVE_STYLE_ID:\s*UNSET/i.test(prompt)) errors.push('Flow-Prompt enthält noch UNSET.');
  if (!/GENAU 3 COVER/i.test(prompt)) errors.push('Flow-Prompt enthält die 3-Cover-Regel nicht eindeutig.');
  if (!/Google Flow.*selbst/i.test(prompt)) errors.push('Flow-Prompt macht nicht eindeutig klar, dass Google Flow den Cover-Gewinner selbst auswählt.');
  if (!/Nutzer.*nicht.*(auswähl|gefragt)/i.test(prompt)) errors.push('Flow-Prompt muss ausdrücklich verbieten, den Nutzer nach der Cover-Auswahl zu fragen.');
  if (!/KEINE Bildreferenz/i.test(prompt)) errors.push('Flow-Prompt enthält die referenzfreie Bildregel nicht eindeutig.');
  if (!/5ER-BLÖCKEN/i.test(prompt)) errors.push('Flow-Prompt enthält die 5er-Block-Regel nicht eindeutig.');

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

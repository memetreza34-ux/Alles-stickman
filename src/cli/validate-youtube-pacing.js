#!/usr/bin/env node

import path from 'node:path';
import { arg, projectPaths, readJson } from '../lib/pipeline.js';

export async function validatePacing(projectDirectory) {
  const p = projectPaths(projectDirectory);
  const [timeline, pipeline, meta] = await Promise.all([
    readJson(p.timeline), readJson(path.resolve('config/pipeline.json')), readJson(p.meta)
  ]);
  const policy = pipeline.imagePolicy;
  const errors = [];
  const warnings = [];
  const images = timeline.images ?? [];
  if (!images.length) errors.push('Timeline enthält keine Bilder.');

  for (const image of images) {
    const duration = Number(image.durationSeconds);
    if (!Number.isFinite(duration) || duration <= 0) errors.push(`Ungültige Dauer bei Bild ${image.imageNumber}.`);
    if (duration > Number(policy.hardMaximumSeconds)) errors.push(`Bild ${image.imageNumber} überschreitet Hard-Max ${policy.hardMaximumSeconds}s (${duration}s).`);
    else if (duration > Number(policy.preferSplitAboveSeconds)) warnings.push(`Bild ${image.imageNumber}: ${duration}s — Split stark empfohlen.`);
    else if (duration > Number(policy.reviewAboveSeconds)) warnings.push(`Bild ${image.imageNumber}: ${duration}s — Split prüfen.`);
    if (duration < Number(policy.minimumUsefulHoldSeconds)) warnings.push(`Bild ${image.imageNumber}: sehr kurzer Hold (${duration}s).`);
  }

  for (let i = 0; i < images.length - 1; i += 1) {
    const gap = Number(images[i + 1].startSeconds) - Number(images[i].endSeconds);
    if (Math.abs(gap) > 0.002) errors.push(`Timeline-Lücke/Überlappung zwischen Bild ${images[i].imageNumber} und ${images[i + 1].imageNumber}: ${gap}s.`);
  }

  const actualDuration = Number(timeline.durationSeconds ?? timeline.audioDurationSeconds ?? 0);
  const targetRange = meta.targetDurationRangeSeconds;
  if (Array.isArray(targetRange) && targetRange.length === 2 && targetRange.every((x) => Number.isFinite(Number(x)))) {
    const minTarget = Number(targetRange[0]);
    const maxTarget = Number(targetRange[1]);
    if (actualDuration < minTarget || actualDuration > maxTarget) {
      errors.push(`Videodauer ${actualDuration.toFixed(2)}s liegt außerhalb des geplanten Bereichs ${minTarget}–${maxTarget}s. Skript/Voice muss vor dem Render angepasst werden.`);
    }
  }

  const totalHold = images.reduce((sum, image) => sum + Number(image.durationSeconds || 0), 0);
  const avg = images.length ? totalHold / images.length : 0;
  const [targetMin, targetMax] = policy.targetAverageHoldSeconds;
  if (avg < targetMin - 1 || avg > targetMax + 1) warnings.push(`Durchschnittlicher Hold ${avg.toFixed(2)}s liegt außerhalb des bevorzugten Bereichs ${targetMin}–${targetMax}s.`);

  return { passed: errors.length === 0, errors, warnings, averageHoldSeconds: Number(avg.toFixed(3)), actualDurationSeconds: actualDuration };
}

async function main() {
  const dir = arg('--dir');
  if (!dir) throw new Error('Nutzung: npm run validate:youtube-pacing -- --dir "youtube/<week>/<slug>"');
  const result = await validatePacing(dir);
  for (const warning of result.warnings) console.warn(`WARNUNG: ${warning}`);
  if (!result.passed) {
    for (const error of result.errors) console.error(`- ${error}`);
    throw new Error(`${result.errors.length} Pacing-Regel(n) verletzt.`);
  }
  console.log(`YouTube Pacing: BESTANDEN — Ø ${result.averageHoldSeconds}s/Bild`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(`YouTube Pacing: FEHLER — ${error.message}`);
    process.exitCode = 1;
  });
}

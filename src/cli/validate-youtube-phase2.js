#!/usr/bin/env node

import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { arg, discoverAudioFiles, exists, listFinalImages, projectPaths, readJson } from '../lib/pipeline.js';

export async function validatePhase2(projectDirectory) {
  const p = projectPaths(projectDirectory);
  const errors = [];
  if (!(await exists(p.meta))) return { passed: false, errors: ['video.json fehlt.'] };
  const meta = await readJson(p.meta);
  const count = Number(meta.plannedImageCount);
  if (!Number.isInteger(count) || count < 1) errors.push('plannedImageCount ist ungültig.');

  const images = await listFinalImages(p.imagesDir);
  if (Number.isInteger(count) && images.length !== count) errors.push(`Finale Bildzahl: ${images.length}, erwartet ${count}.`);
  if (Number.isInteger(count)) {
    for (let i = 1; i <= count; i += 1) {
      const expected = `Bild ${String(i).padStart(2, '0')}.png`;
      if (!images.some((item) => item.name === expected)) errors.push(`Bild fehlt: ${expected}`);
    }
  }

  if (await exists(p.imagesDir)) {
    const entries = await readdir(p.imagesDir, { withFileTypes: true });
    const extras = entries.filter((entry) => entry.isFile() && entry.name !== '.gitkeep' && !/^Bild \d{2,3}\.png$/i.test(entry.name));
    if (extras.length) errors.push(`Unerlaubte Zusatzdateien im finalen Bilderordner: ${extras.map((x) => x.name).join(', ')}`);
    const dirs = entries.filter((entry) => entry.isDirectory());
    if (dirs.length) errors.push('Der finale Bilderordner muss flach sein; Unterordner sind nicht erlaubt.');
  }

  const audio = await discoverAudioFiles(p.audioDir);
  if (audio.length !== 1) errors.push(`Unter 02-audio wird genau eine finale Voice-over-Datei erwartet; gefunden: ${audio.length}.`);

  return { passed: errors.length === 0, errors, images, audio };
}

async function main() {
  const dir = arg('--dir');
  if (!dir) throw new Error('Nutzung: npm run validate:youtube-phase2 -- --dir "youtube/<week>/<slug>"');
  const result = await validatePhase2(dir);
  if (!result.passed) {
    for (const error of result.errors) console.error(`- ${error}`);
    throw new Error(`${result.errors.length} Phase-2-Regel(n) verletzt.`);
  }
  console.log('YouTube Phase 2: BESTANDEN');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(`YouTube Phase 2: FEHLER — ${error.message}`);
    process.exitCode = 1;
  });
}

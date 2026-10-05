#!/usr/bin/env node

import path from 'node:path';
import { arg, exists, fileSize, projectPaths, readJson, sha256 } from '../lib/pipeline.js';

export async function validatePhase3(projectDirectory, { postRender = false } = {}) {
  const p = projectPaths(projectDirectory);
  const errors = [];
  const [meta, timeline, pipeline] = await Promise.all([
    readJson(p.meta), readJson(p.timeline), readJson(path.resolve('config/pipeline.json'))
  ]);

  const audioReport = await readJson(path.join(p.techDir, 'YOUTUBE_AUDIO_PACING.json'), null);
  const alignment = await readJson(p.alignmentEvidence, null);
  if (audioReport?.passed !== true) errors.push('Audio-Pacing-Report fehlt oder ist nicht bestanden.');
  if (alignment?.passed !== true) errors.push('Whisper-Alignment fehlt oder ist nicht bestanden.');
  if (!(await exists(p.optimizedAudio))) errors.push('Optimiertes internes Audio fehlt.');
  if (!Array.isArray(timeline.images) || timeline.images.length !== Number(meta.plannedImageCount)) errors.push('Timeline-Bildzahl entspricht nicht plannedImageCount.');
  if (timeline.images?.[0]?.imageNumber !== 1 || Number(timeline.images?.[0]?.startSeconds) !== 0) errors.push('Bild 01 muss bei 0,0 s starten.');

  const hold = Number(timeline.endHoldSeconds);
  if (hold < Number(pipeline.endHoldPolicy.minimumSeconds) || hold > Number(pipeline.endHoldPolicy.maximumSeconds)) errors.push('Schluss-Hold liegt außerhalb der erlaubten Range.');
  const last = timeline.images?.at(-1);
  if (last && Math.abs(Number(last.endSeconds) - Number(timeline.durationSeconds)) > 0.01) errors.push('Letztes Bild endet nicht exakt mit der Komposition.');

  if (postRender) {
    const video = path.join(p.exportDir, 'FINAL_VIDEO.mp4');
    const thumbnail = path.join(p.exportDir, 'THUMBNAIL.png');
    const upload = path.join(p.exportDir, 'YOUTUBE_UPLOAD.txt');
    const subtitles = path.join(p.exportDir, 'SUBTITLES.srt');
    const timedScript = path.join(p.exportDir, 'TIMED_SCRIPT.txt');
    const cover = path.join(p.imagesDir, 'Bild 01.png');

    if (!(await exists(video))) errors.push('FINAL_VIDEO.mp4 fehlt.');
    else if ((await fileSize(video)) < 100_000) errors.push('FINAL_VIDEO.mp4 ist verdächtig klein.');

    if (!(await exists(thumbnail))) errors.push('THUMBNAIL.png fehlt.');
    if (await exists(thumbnail) && await exists(cover) && (await sha256(thumbnail)) !== (await sha256(cover))) errors.push('THUMBNAIL.png ist nicht byte-identisch zu Bild 01.png.');

    for (const [file, label] of [
      [upload, 'YOUTUBE_UPLOAD.txt'],
      [subtitles, 'SUBTITLES.srt'],
      [timedScript, 'TIMED_SCRIPT.txt']
    ]) {
      if (!(await exists(file))) errors.push(`${label} fehlt im Exportordner.`);
      else if ((await fileSize(file)) < 20) errors.push(`${label} ist verdächtig leer.`);
    }
  }

  return { passed: errors.length === 0, errors };
}

async function main() {
  const dir = arg('--dir');
  if (!dir) throw new Error('Nutzung: npm run validate:youtube-phase3 -- --dir "youtube/<week>/<slug>" [--post-render]');
  const result = await validatePhase3(dir, { postRender: process.argv.includes('--post-render') });
  if (!result.passed) {
    for (const error of result.errors) console.error(`- ${error}`);
    throw new Error(`${result.errors.length} Phase-3-Regel(n) verletzt.`);
  }
  console.log(`YouTube Phase 3 ${process.argv.includes('--post-render') ? 'Post-Render' : 'Pre-Render'}: BESTANDEN`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(`YouTube Phase 3: FEHLER — ${error.message}`);
    process.exitCode = 1;
  });
}

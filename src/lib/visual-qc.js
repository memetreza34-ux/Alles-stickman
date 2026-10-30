import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { exists, projectPaths, readJson } from './pipeline.js';

// This gate validates real files + documented visual review, NOT image understanding.
export const VISUAL_CHECKS = Object.freeze([
  'matchesNarration', 'noProductionLabels', 'germanLabelsOnly',
  'noGarbledWriting', 'stickmenConsistent', 'historicallyAndTechnicallyAccurate',
  'readableAtPhoneSize', 'unclutteredComposition', 'distinctPurpose'
]);
export const visualQcPath = dir => path.join(projectPaths(dir).techDir, 'VISUAL_QC.json');

export async function fingerprintPng(filename) {
  const bytes = await readFile(filename);
  if (bytes.length < 24 || bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a' ||
      bytes.toString('ascii', 12, 16) !== 'IHDR') throw new Error('Ungueltige PNG-Datei: ' + filename);
  const width = bytes.readUInt32BE(16), height = bytes.readUInt32BE(20);
  if (width < 1280 || height < 720 || Math.abs(width / height - 16 / 9) > 0.02)
    throw new Error('PNG muss mindestens 1280x720 im 16:9-Format sein: ' + filename);
  return { sha256: createHash('sha256').update(bytes).digest('hex'), width, height };
}

export async function buildVisualQcTemplate(dir) {
  const p = projectPaths(dir), meta = await readJson(p.meta);
  const count = Number(meta.plannedImageCount);
  if (!Number.isInteger(count) || count < 1) throw new Error('plannedImageCount fehlt.');
  const images = [];
  for (let i = 1; i <= count; i++) {
    const file = 'Bild ' + String(i).padStart(2, '0') + '.png';
    if (!(await exists(path.join(p.imagesDir, file)))) throw new Error('PNG fehlt: ' + file);
    images.push({ imageNumber: i, file, ...(await fingerprintPng(path.join(p.imagesDir, file))),
      checks: Object.fromEntries(VISUAL_CHECKS.map(key => [key, false])),
      status: 'PENDING', reviewer: '', reviewedAt: null, notes: '' });
  }
  return { schemaVersion: 1, videoId: meta.videoId,
    instructions: 'Jedes ECHTE PNG bei Handy-Groesse pruefen. Keine Freigabe allein aufgrund von Prompts. Bei neuer Generation Manifest erneuern und erneut sichten.',
    images };
}

export async function writeVisualQcTemplate(dir, { overwrite = false } = {}) {
  const dest = visualQcPath(dir);
  await writeFile(dest, JSON.stringify(await buildVisualQcTemplate(dir), null, 2) + '\n',
    { encoding: 'utf8', flag: overwrite ? 'w' : 'wx' });
  return dest;
}

export async function validateVisualQc(dir) {
  const p = projectPaths(dir), meta = await readJson(p.meta), errors = [];
  const report = await readJson(visualQcPath(dir), null);
  if (!report) return { passed: false, errors: ['VISUAL_QC.json fehlt: erst visual-qc:init, dann alle echten PNGs ansehen.'] };
  if (report.videoId !== meta.videoId) errors.push('VISUAL_QC gehoert zu anderem Video.');
  if (!Array.isArray(report.images) || report.images.length !== Number(meta.plannedImageCount))
    return { passed: false, errors: [...errors, 'VISUAL_QC-Bildanzahl stimmt nicht.'] };
  for (let i = 1; i <= report.images.length; i++) {
    const item = report.images[i - 1], file = 'Bild ' + String(i).padStart(2, '0') + '.png';
    if (item.imageNumber !== i || item.file !== file) { errors.push(file + ': falsche Bildnummer.'); continue; }
    try {
      const fp = await fingerprintPng(path.join(p.imagesDir, file));
      if (item.sha256 !== fp.sha256 || item.width !== fp.width || item.height !== fp.height)
        errors.push(file + ': PNG wurde seit Freigabe veraendert.');
    } catch (error) { errors.push(file + ': ' + error.message); continue; }
    for (const check of VISUAL_CHECKS) if (item.checks?.[check] !== true) errors.push(file + ': offene Kontrolle ' + check);
    if (item.status !== 'APPROVED' || String(item.reviewer ?? '').trim().length < 3 ||
        !Number.isFinite(Date.parse(item.reviewedAt)) || String(item.notes ?? '').trim().length < 20)
      errors.push(file + ': Freigabe braucht Namen, Datum und konkrete Beobachtung.');
  }
  return { passed: errors.length === 0, errors, reviewed: report.images.length };
}

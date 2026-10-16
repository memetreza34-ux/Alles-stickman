#!/usr/bin/env node
import path from 'node:path';
import { writeJson, readJson, exists, arg, projectPaths } from '../lib/pipeline.js';
import { makeReview, reviewPath, findPendingVideoReviews, validatePostVideoReview } from '../lib/quality-loop.js';

export async function initializeVideoReview(dir) {
  const file = reviewPath(dir);
  if (await exists(file)) return { file, created: false };
  const meta = await readJson(projectPaths(dir).meta);
  await writeJson(file, await makeReview(meta));
  return { file, created: true };
}

export async function closeVideoReview(dir, { ledgerFile = path.resolve('channel/IMPROVEMENT_LEDGER.json') } = {}) {
  const file = reviewPath(dir);
  const review = await readJson(file);
  const meta = await readJson(projectPaths(dir).meta);
  if (review.videoId !== meta.videoId) throw new Error('Falsche Videoreview.');
  if (review.status === 'COMPLETE') throw new Error('Review bereits abgeschlossen.');
  const validated = await validatePostVideoReview(review, { projectDir: dir, checkFiles: true });
  if (!validated.passed) throw new Error('Review unvollständig:\n' + validated.errors.join('\n'));
  const ledger = await readJson(ledgerFile);
  if (ledger.reviewedVideos.some(x => x.videoId === meta.videoId)) throw new Error('Video ist bereits im Ledger.');
  const at = new Date().toISOString();
  const lessons = review.lessons.filter(x => x.status === 'APPLIED').map(x => ({ ...x, sourceVideoId: meta.videoId, recordedAt: at }));
  const experiments = review.lessons.filter(x => x.status !== 'APPLIED').map(x => ({ ...x, sourceVideoId: meta.videoId, recordedAt: at }));
  await writeJson(ledgerFile, {
    ...ledger,
    reviewedVideos: [...ledger.reviewedVideos, { videoId: meta.videoId, title: meta.title, reviewedAt: at, findings: review.findings.length, appliedLessons: lessons.length }],
    appliedLessons: [...ledger.appliedLessons, ...lessons],
    experiments: [...(ledger.experiments ?? []), ...experiments]
  });
  await writeJson(file, { ...review, status: 'COMPLETE', closedAt: at });
  return { file, videoId: meta.videoId, newLessons: lessons.length };
}

async function main() {
  const mode = process.argv.includes('--init') ? 'init' : process.argv.includes('--close') ? 'close' : 'status';
  if (mode === 'status') {
    const pending = await findPendingVideoReviews();
    if (pending.length) {
      pending.forEach(p => console.log('OFFEN: ' + p.projectDir + ' — ' + p.reason));
      process.exitCode = 1;
    } else console.log('Kein lokal gerendertes Video mit offenem Review.');
    return;
  }
  const dir = arg('--dir');
  if (!dir) throw new Error('Bitte --dir "youtube/<week>/<slug>" angeben.');
  if (mode === 'init') {
    const result = await initializeVideoReview(dir);
    console.log((result.created ? 'Review erstellt: ' : 'Review vorhanden: ') + result.file);
    console.log('FINAL_VIDEO vollständig ansehen, Notizen/Ursachen/Fixes eintragen, danach quality:close.');
  } else {
    const result = await closeVideoReview(dir);
    console.log('Review abgeschlossen, neue angewendete Lessons: ' + result.newLessons);
  }
}
if (import.meta.url === 'file://' + process.argv[1]) {
  main().catch(e => { console.error('Qualitätskreislauf: FEHLER — ' + e.message); process.exitCode = 1; });
}

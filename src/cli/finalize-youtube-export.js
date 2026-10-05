#!/usr/bin/env node

import { copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { arg, exists, projectPaths, sha256, writeJson } from '../lib/pipeline.js';

async function main() {
  const dir = arg('--dir');
  if (!dir) throw new Error('Nutzung: npm run finalize:youtube-export -- --dir "youtube/<week>/<slug>"');
  const p = projectPaths(dir);
  const video = path.join(p.exportDir, 'FINAL_VIDEO.mp4');
  const cover = path.join(p.imagesDir, 'Bild 01.png');
  const thumbnail = path.join(p.exportDir, 'THUMBNAIL.png');
  if (!(await exists(video))) throw new Error('FINAL_VIDEO.mp4 fehlt.');
  if (!(await exists(cover))) throw new Error('Bild 01.png fehlt.');
  await mkdir(p.exportDir, { recursive: true });
  await copyFile(cover, thumbnail);

  const report = {
    schemaVersion: 1,
    createdAt: new Date().toISOString(),
    videoFile: '03-export/FINAL_VIDEO.mp4',
    thumbnailFile: '03-export/THUMBNAIL.png',
    thumbnailSource: '00-bildprompts/images/Bild 01.png',
    coverSha256: await sha256(cover),
    thumbnailSha256: await sha256(thumbnail)
  };
  report.thumbnailIdenticalToCover = report.coverSha256 === report.thumbnailSha256;
  if (!report.thumbnailIdenticalToCover) throw new Error('Thumbnail ist nicht identisch zu Bild 01.');
  await writeJson(path.join(p.techDir, 'EXPORT_REPORT.json'), report);
  console.log('Export finalisiert: Thumbnail = Bild 01.png');
}

main().catch((error) => {
  console.error(`Export-Finalisierung: FEHLER — ${error.message}`);
  process.exitCode = 1;
});

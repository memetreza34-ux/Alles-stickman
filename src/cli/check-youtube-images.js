#!/usr/bin/env node

import path from 'node:path';
import { arg, exists, listFinalImages, projectPaths, readJson, writeJson } from '../lib/pipeline.js';
import { classifyOcrLines, ocrImage, tesseractAvailable } from '../lib/image-text-check.js';

async function allowedLabels(p) {
  // Projekte bis v7 durften kurze deutsche Labels im Bild haben; ab v8 kommt jeder Text per Overlay.
  const plan = await readJson(path.join(p.techDir, 'SCENE_VISUALS_EN.json'), {});
  return new Map((plan.scenes ?? []).map((scene) => [Number(scene.sceneNumber), scene.visibleGermanLabels ?? []]));
}

async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index]);
    }
  }));
  return results;
}

export async function checkImages(projectDirectory, { concurrency = 4 } = {}) {
  const p = projectPaths(projectDirectory);
  if (!(await tesseractAvailable())) throw new Error('tesseract fehlt (brew install tesseract).');
  const meta = await readJson(p.meta);
  const labels = await allowedLabels(p);
  const images = await listFinalImages(p.imagesDir);
  const results = await mapLimit(images, concurrency, async (image) => {
    const number = Number(image.name.match(/\d+/)?.[0]);
    const { meta: metaText, text } = classifyOcrLines(await ocrImage(image.path), { allowed: labels.get(number) ?? [] });
    return { image: image.name, metaText, unexpectedText: text };
  });
  const report = {
    schemaVersion: 1,
    checkedAt: new Date().toISOString(),
    pipelineVersion: Number(meta.pipelineVersion ?? 0),
    imagesChecked: results.length,
    imagesWithMetaText: results.filter((r) => r.metaText.length).map((r) => r.image),
    imagesWithUnexpectedText: results.filter((r) => r.unexpectedText.length).map((r) => r.image),
    results: results.filter((r) => r.metaText.length || r.unexpectedText.length)
  };
  await writeJson(path.join(p.techDir, 'IMAGE_TEXT_CHECK.json'), report);
  return report;
}

async function main() {
  const dir = arg('--dir');
  if (!dir) throw new Error('Nutzung: npm run check:youtube-images -- --dir "youtube/<week>/<slug>"');
  if (!(await exists(projectPaths(dir).imagesDir))) throw new Error('Bilderordner fehlt.');
  const report = await checkImages(dir);
  for (const r of report.results) {
    if (r.metaText.length) console.error(`✖ ${r.image}: Produktionsinfo im Bild → ${r.metaText.map((m) => `"${m.text}" (${m.reasons.join(', ')})`).join('; ')}`);
    if (r.unexpectedText.length) console.warn(`! ${r.image}: Text im Bild → ${r.unexpectedText.join(' | ')}`);
  }
  console.log(`Bild-Textcheck: ${report.imagesChecked} Bilder · ${report.imagesWithMetaText.length} mit Produktionsinfo · ${report.imagesWithUnexpectedText.length} mit sonstigem Text`);
  if (report.imagesWithMetaText.length) {
    throw new Error(`Diese Bilder neu erzeugen: ${report.imagesWithMetaText.join(', ')}`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(`Bild-Textcheck: FEHLER — ${error.message}`);
    process.exitCode = 1;
  });
}

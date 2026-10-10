#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { arg, copyDirectory, exists, readJson, slugify, writeJson } from '../lib/pipeline.js';
import { evaluateTopic } from './check-youtube-topic.js';
import { renderPhase1Handoff } from '../lib/phase1-handoff.js';

async function main() {
  const topic = arg('--topic');
  const title = arg('--title') ?? topic;
  const week = arg('--week');
  const slug = arg('--slug') ?? slugify(title ?? topic);

  if (!topic || !title || !week || !slug) {
    throw new Error('Nutzung: npm run create:youtube -- --topic "THEMA" --title "TITEL" --week "YYYY-KWNN_DD-MM_bis_DD-MM" [--slug "slug"]');
  }

  const topicCheck = await evaluateTopic(topic);
  if (topicCheck.decision !== 'APPROVED_NEW') {
    throw new Error(`Thema nicht freigegeben: ${topicCheck.decision}${topicCheck.best ? ` (${topicCheck.best.matched})` : ''}`);
  }

  const templateDir = path.resolve('youtube/templates/video-template');
  const destination = path.resolve('youtube', week, slug);
  if (await exists(destination)) throw new Error(`Projekt existiert bereits: ${destination}`);
  await mkdir(path.dirname(destination), { recursive: true });
  await copyDirectory(templateDir, destination);

  const visual = await readJson(path.resolve('config/visual-policy.json'));
  const now = new Date().toISOString();
  const metaPath = path.join(destination, '99-technik', 'video.json');
  const meta = await readJson(metaPath);
  Object.assign(meta, {
    videoId: `${week}_${slug}`,
    weekFolder: week,
    topicSlug: slug,
    title,
    topic,
    visualStyleId: visual.styleId ?? 'UNSET',
    uploadMetadata: {
      ...(meta.uploadMetadata ?? {}),
      title
    },
    createdAt: now,
    updatedAt: now
  });
  await writeJson(metaPath, meta);

  const promptPath = path.join(destination, '00-bildprompts', 'google-flow-prompt.txt');
  const prompt = (await readFile(promptPath, 'utf8'))
    .replace('[VIDEO-TITEL]', title)
    .replace('ACTIVE_STYLE_ID: UNSET', `ACTIVE_STYLE_ID: ${visual.styleId ?? 'UNSET'}`);
  await writeFile(promptPath, prompt, 'utf8');

  // Das Projekt erhält sofort seine zwei direkten GitHub-Zugänge.
  // Erst nach erfolgreicher Phase-1-Validierung werden sie als READY ausgegeben.
  await writeFile(path.join(destination, '99-technik', 'PHASE1_START_HERE.md'),
    renderPhase1Handoff(meta, { phase1Validated: false }), 'utf8');

  const registryPath = path.resolve('config/topic-registry.json');
  const registry = await readJson(registryPath, { version: 1, entries: [] });
  registry.entries.push({ id: meta.videoId, title, aliases: [topic], status: 'reserved' });
  await writeJson(registryPath, registry);

  console.log(`Projekt erstellt: ${path.relative(process.cwd(), destination)}`);
  if (visual.status !== 'READY' || !visual.styleId || visual.styleId === 'UNSET') {
    console.log('Hinweis: Die neue Bildwelt ist noch UNSET. Phase 1 bleibt bis zur Definition in config/visual-policy.json blockiert.');
  }
}

main().catch((error) => {
  console.error(`Projekt-Erstellung: FEHLER — ${error.message}`);
  process.exitCode = 1;
});

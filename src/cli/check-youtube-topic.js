#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { arg, exists, normalizeText, readJson, similarity, walkFiles } from '../lib/pipeline.js';

export async function collectKnownTopics(root = process.cwd()) {
  const registry = await readJson(path.join(root, 'config', 'topic-registry.json'), { entries: [] });
  const known = [];

  for (const entry of registry.entries ?? []) {
    known.push({ source: 'registry', title: entry.title ?? '', aliases: entry.aliases ?? [] });
  }

  const youtubeRoot = path.join(root, 'youtube');
  for (const file of await walkFiles(youtubeRoot)) {
    if (!file.endsWith(path.join('99-technik', 'video.json'))) continue;
    if (file.includes(`${path.sep}templates${path.sep}`)) continue;
    try {
      const meta = JSON.parse(await readFile(file, 'utf8'));
      if (meta.topic || meta.title) known.push({ source: file, title: meta.topic || meta.title, aliases: [meta.title].filter(Boolean) });
    } catch {
      // Ungültige Altdateien werden im eigentlichen Policy-Gate behandelt.
    }
  }
  return known;
}

export async function evaluateTopic(candidate, root = process.cwd()) {
  const normalized = normalizeText(candidate);
  if (!normalized) throw new Error('Thema fehlt.');
  const known = await collectKnownTopics(root);
  let best = null;

  for (const item of known) {
    for (const value of [item.title, ...(item.aliases ?? [])].filter(Boolean)) {
      const score = similarity(candidate, value);
      const exact = normalizeText(value) === normalized;
      if (!best || score > best.score || exact) best = { ...item, matched: value, score, exact };
      if (exact) break;
    }
    if (best?.exact) break;
  }

  if (best?.exact || (best?.score ?? 0) >= 0.82) return { decision: 'BLOCKED_DUPLICATE', candidate, best };
  if ((best?.score ?? 0) >= 0.58) return { decision: 'REVIEW_SIMILAR', candidate, best };
  return { decision: 'APPROVED_NEW', candidate, best };
}

async function main() {
  const topic = arg('--topic') ?? process.argv.slice(2).filter((x) => !x.startsWith('--'))[0];
  if (!topic) throw new Error('Nutzung: npm run topic:youtube -- --topic "THEMA"');
  const result = await evaluateTopic(topic);
  console.log(`THEMEN-EDITOR: ${result.decision}`);
  if (result.best) console.log(`Ähnlichster Treffer: ${result.best.matched} (${result.best.score.toFixed(2)})`);
  if (result.decision !== 'APPROVED_NEW') process.exitCode = 1;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(`THEMEN-EDITOR: FEHLER — ${error.message}`);
    process.exitCode = 1;
  });
}

#!/usr/bin/env node

import path from 'node:path';
import { readFile, writeFile } from 'node:fs/promises';
import { arg, projectPaths, readJson } from '../lib/pipeline.js';
import { phase1ChatLinks, renderPhase1Handoff } from '../lib/phase1-handoff.js';

async function main() {
  const dir = arg('--dir');
  if (!dir) throw new Error('Nutzung: npm run handoff:youtube -- --dir "youtube/<week>/<slug>"');
  const project = projectPaths(dir);
  const meta = await readJson(project.meta);
  const validated = meta.phase1Ready === true;
  await writeFile(path.join(project.techDir, 'PHASE1_START_HERE.md'),
    renderPhase1Handoff(meta, { phase1Validated: validated }), 'utf8');
  console.log(phase1ChatLinks(meta));
}

main().catch((error) => {
  console.error(`Phase-1-Übergabe: FEHLER — ${error.message}`);
  process.exitCode = 1;
});

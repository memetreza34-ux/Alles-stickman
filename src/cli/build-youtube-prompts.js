#!/usr/bin/env node

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { arg, projectPaths, readJson } from '../lib/pipeline.js';
import { loadPromptKit, renderPromptFiles, validateScenePlan } from '../lib/image-prompts.js';

export function scenePlanPath(projectDirectory) {
  return path.join(projectPaths(projectDirectory).techDir, 'SCENE_VISUALS_EN.json');
}

export async function buildPrompts(projectDirectory, { write = true } = {}) {
  const p = projectPaths(projectDirectory);
  const [meta, plan] = await Promise.all([readJson(p.meta), readJson(scenePlanPath(projectDirectory))]);
  const { errors, warnings } = validateScenePlan(plan, { plannedImageCount: meta.plannedImageCount });
  if (errors.length) return { errors, warnings, files: new Map() };
  const kit = await loadPromptKit();
  const files = renderPromptFiles(kit, plan, meta);
  if (write) {
    const root = path.join(p.projectDir, '00-bildprompts');
    for (const [relative, content] of files) {
      const target = path.join(root, relative);
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, content, 'utf8');
    }
  }
  return { errors, warnings, files };
}

async function main() {
  const dir = arg('--dir');
  if (!dir) throw new Error('Nutzung: npm run prompts:youtube -- --dir "youtube/<week>/<slug>"');
  const { errors, warnings, files } = await buildPrompts(dir);
  for (const warning of warnings) console.warn(`Hinweis: ${warning}`);
  if (errors.length) {
    for (const error of errors) console.error(`- ${error}`);
    throw new Error(`${errors.length} Fehler im Szenenplan.`);
  }
  console.log(`Bildprompts erzeugt: ${files.size} Dateien in 00-bildprompts/`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(`Bildprompts: FEHLER — ${error.message}`);
    process.exitCode = 1;
  });
}

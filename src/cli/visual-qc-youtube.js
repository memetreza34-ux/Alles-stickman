#!/usr/bin/env node
import { arg } from '../lib/pipeline.js';
import { validateVisualQc, writeVisualQcTemplate } from '../lib/visual-qc.js';
async function main() {
  const dir = arg('--dir');
  if (!dir) throw new Error('Nutzung: npm run visual-qc:init -- --dir "youtube/<week>/<slug>"');
  if (process.argv.includes('--init')) {
    console.log('Manifest: ' + await writeVisualQcTemplate(dir, { overwrite: process.argv.includes('--force') }));
    console.log('Jede echte PNG visuell pruefen, dann VISUAL_QC.json ausfuellen.');
    return;
  }
  const r = await validateVisualQc(dir);
  if (!r.passed) {
    for (const e of r.errors.slice(0, 30)) console.error('- ' + e);
    throw new Error('VISUAL-QC BLOCKIERT: ' + r.errors.length + ' offene Pruefungen.');
  }
  console.log('VISUAL-QC BESTANDEN: ' + r.reviewed + ' Einzelbilder freigegeben.');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });

#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { arg } from '../lib/pipeline.js';

function run(script, args = []) {
  console.log(`\n=== ${script} ===`);
  const result = spawnSync(process.execPath, [script, ...args], { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${script} fehlgeschlagen (Exit ${result.status}).`);
}

async function main() {
  const dir = arg('--dir');
  if (!dir) throw new Error('Nutzung: npm run phase3:youtube -- --dir "youtube/<week>/<slug>" [--prepare-only] [--model small]');
  const common = ['--dir', dir];
  const model = arg('--model') ?? 'small';

  run('src/cli/preflight-youtube.js');
  run('src/cli/validate-youtube-phase1.js', common);
  run('src/cli/validate-youtube-phase2.js', common);
  run('src/cli/optimize-youtube-audio.js', common);
  run('src/cli/auto-align-youtube.js', [...common, '--model', model]);
  run('src/cli/build-youtube-timeline.js', common);
  run('src/cli/validate-youtube-pacing.js', common);
  run('src/cli/validate-youtube-phase3.js', common);

  if (process.argv.includes('--prepare-only')) {
    console.log('\nYouTube Phase 3 vorbereitet: Gates, Audio, Alignment, Timeline und Pacing bestanden.');
    return;
  }

  run('src/cli/render-youtube.js', common);
  run('src/cli/finalize-youtube-export.js', common);
  run('src/cli/validate-youtube-phase3.js', [...common, '--post-render']);
  console.log('\nYouTube Phase 3: BESTANDEN');
}

main().catch((error) => {
  console.error(`YouTube Phase 3: FEHLER — ${error.message}`);
  process.exitCode = 1;
});

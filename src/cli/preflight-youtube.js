#!/usr/bin/env node

import { spawnSync } from 'node:child_process';

function commandExists(command, args = ['--version']) {
  const result = spawnSync(command, args, { encoding: 'utf8' });
  return !result.error && result.status === 0;
}

async function main() {
  const major = Number(process.versions.node.split('.')[0]);
  const errors = [];
  if (major < 24) errors.push(`Node.js >=24 erforderlich, gefunden: ${process.versions.node}`);
  if (!commandExists('ffmpeg', ['-version'])) errors.push('ffmpeg fehlt im PATH.');
  if (!commandExists('ffprobe', ['-version'])) errors.push('ffprobe fehlt im PATH.');
  if (!commandExists('whisper', ['--help'])) errors.push('Whisper CLI (`whisper`) fehlt im PATH.');

  if (errors.length) {
    for (const error of errors) console.error(`- ${error}`);
    throw new Error('Preflight fehlgeschlagen.');
  }
  console.log('YouTube Preflight: BESTANDEN');
}

main().catch((error) => {
  console.error(`YouTube Preflight: FEHLER — ${error.message}`);
  process.exitCode = 1;
});

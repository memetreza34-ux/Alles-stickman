#!/usr/bin/env node

import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { arg, projectPaths, readJson, writeJson } from '../lib/pipeline.js';
import { loadVoicePolicy, prepareSpeechText, synthesizeVoice } from '../lib/voice-synthesis.js';

export async function generateVoice(projectDirectory, options = {}) {
  const p = projectPaths(projectDirectory);
  const scriptPath = options.script ? path.resolve(options.script) : p.script;

  if (!existsSync(scriptPath)) {
    throw new Error(`Voice-Skript nicht gefunden: ${path.relative(process.cwd(), scriptPath)}`);
  }

  const rawScript = await readFile(scriptPath, 'utf8');
  const basePolicy = options.policy ?? await loadVoicePolicy();
  const policy = structuredClone(basePolicy);

  if (options.boost === false || options.noBoost === true) {
    policy.voiceBoost.enabled = false;
  }

  const profileKey = options.profile || policy.defaultProfile;
  const profile = policy.profiles[profileKey];

  if (!profile) {
    throw new Error(`Ungültiges Profil "${profileKey}". Verfügbare Profile: ${Object.keys(policy.profiles).join(', ')}`);
  }

  if (options.rate) {
    profile.rate = options.rate;
  }
  if (options.tempo != null) {
    profile.tempo = options.tempo;
  }
  if (options.voice) {
    profile.voice = options.voice;
  }

  const targetWav = options.output ? path.resolve(options.output) : path.join(p.audioDir, policy.audioFormat.outputFilename || 'voice.wav');

  if (options.dryRun) {
    const cleaned = prepareSpeechText(rawScript);
    const wordCount = cleaned.split(/\s+/).length;
    console.log(`[DRY-RUN] Profil: ${profileKey} (${profile.provider})`);
    console.log(`[DRY-RUN] Stimme: ${profile.voice} (Tempo: ${profile.tempo}x, Max Pause: ${profile.maxPauseSeconds ?? 0.3}s)`);
    console.log(`[DRY-RUN] Wortanzahl: ${wordCount}`);
    console.log(`[DRY-RUN] Voice Boost: ${policy.voiceBoost.enabled ? 'Aktiviert' : 'Deaktiviert'}`);
    console.log(`[DRY-RUN] Ziel-Audiodatei: ${path.relative(process.cwd(), targetWav)}`);
    return { dryRun: true, wordCount, profileKey, targetWav, voiceBoost: policy.voiceBoost.enabled };
  }

  console.log(`Sprachsynthese startet mit Profil "${profileKey}" (${profile.provider})...`);
  const result = await synthesizeVoice({
    rawText: rawScript,
    outputPath: targetWav,
    profileName: profileKey,
    policy
  });

  let videoMeta = null;
  const videoJsonPath = path.join(p.techDir, 'video.json');
  if (existsSync(videoJsonPath)) {
    try {
      videoMeta = await readJson(videoJsonPath);
    } catch {}
  }

  const durationSec = result.durationSeconds;
  const targetRange = videoMeta?.targetDurationRangeSeconds || [360, 420];
  const targetSec = videoMeta?.targetDurationSeconds || 390;
  const estimatedOptimizedSeconds = Number((durationSec / 1.12).toFixed(1));

  const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    projectDirectory: path.relative(process.cwd(), p.projectDir),
    scriptFile: path.relative(p.projectDir, scriptPath),
    outputAudioFile: path.relative(p.projectDir, targetWav),
    audioFingerprintSha256: result.fingerprintSha256,
    profile: result.profileKey || profileKey,
    provider: result.profile?.provider || profile.provider,
    voice: result.profile?.voice || profile.voice,
    settings: {
      rate: profile.rate,
      tempo: profile.tempo,
      maxPauseSeconds: profile.maxPauseSeconds,
      preStretchMaxPauseSeconds: profile.preStretchMaxPauseSeconds,
      maxWordsPerChunk: profile.maxWordsPerChunk,
      temperature: profile.temperature,
      refAudio: profile.refAudio
    },
    voiceBoostApplied: Boolean(policy.voiceBoost?.enabled),
    durationSeconds: durationSec,
    estimatedOptimizedSeconds,
    wordCount: result.wordCount,
    wordsPerMinute: result.wordsPerMinute,
    targetDurationSeconds: targetSec,
    targetDurationRangeSeconds: targetRange,
    matchesDurationTarget: durationSec >= targetRange[0] * 0.9 && durationSec <= targetRange[1] * 1.3
  };

  await writeJson(path.join(p.techDir, 'VOICE_GENERATION_REPORT.json'), report);

  console.log(`\n✅ Stimme erfolgreich generiert:`);
  console.log(`   Datei:               ${path.relative(process.cwd(), targetWav)}`);
  console.log(`   Dauer (Roh):         ${durationSec.toFixed(1)}s (ca. ${(durationSec / 60).toFixed(1)} Min)`);
  console.log(`   Geschätzt nach Cut:  ~${estimatedOptimizedSeconds}s (Zielkorridor: ${targetRange[0]}–${targetRange[1]}s)`);
  console.log(`   Wörter:              ${result.wordCount} (${result.wordsPerMinute} WpM)`);
  console.log(`   Profil:              ${result.profileKey || profileKey} [${result.profile?.provider || profile.provider}]`);
  console.log(`   Voice Boost:         ${policy.voiceBoost?.enabled ? 'Aktiviert (Presence, Warmth, Compand, Limiter)' : 'Deaktiviert'}\n`);
  console.log(`Nächster Schritt in Pipeline v8:`);
  console.log(`   npm run optimize:youtube-audio -- --dir "${path.relative(process.cwd(), p.projectDir)}"`);
  console.log(`   oder direkt weiter mit: npm run phase3:youtube -- --dir "${path.relative(process.cwd(), p.projectDir)}"\n`);

  return report;
}

async function main() {
  if (process.argv.includes('--list-presets')) {
    const policy = await loadVoicePolicy();
    for (const [id, p] of Object.entries(policy.profiles)) {
      console.log(`${id} (${p.provider}): tempo=${p.tempo}x, maxPause=${p.maxPauseSeconds}s — ${p.description}`);
    }
    return;
  }

  const dir = arg('--dir');
  if (!dir) {
    throw new Error('Nutzung: npm run voice:youtube -- --dir "youtube/<week>/<slug>" [--profile stickman-user-clone] [--rate <rate>] [--tempo <factor>] [--voice <voice>] [--dry-run] [--no-boost] [--output <path>] [--list-presets]');
  }
  const profile = arg('--profile');
  const rate = arg('--rate');
  const tempo = arg('--tempo');
  const voice = arg('--voice');
  const output = arg('--output');
  const dryRun = process.argv.includes('--dry-run');
  const noBoost = process.argv.includes('--no-boost') || process.argv.includes('--boost=false');

  await generateVoice(dir, { profile, rate, tempo, voice, output, dryRun, noBoost });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(`Voice-Generierung: FEHLER — ${error.message}`);
    process.exitCode = 1;
  });
}

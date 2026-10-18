#!/usr/bin/env node

import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { arg, execFileAsync, exists, normalizeText, probeDuration, projectPaths, readJson, sha256, tokens, writeJson } from '../lib/pipeline.js';

function editDistance(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const temp = row[j];
      if (a[i - 1] === b[j - 1]) {
        row[j] = prev;
      } else {
        row[j] = 1 + Math.min(prev, row[j], row[j - 1]);
      }
      prev = temp;
    }
  }
  return row[b.length];
}

function wordsMatch(targetWord, whisperWord) {
  if (targetWord === whisperWord) return true;
  const maxLen = Math.max(targetWord.length, whisperWord.length);
  if (maxLen <= 3) return false;
  const dist = editDistance(targetWord, whisperWord);
  if (maxLen <= 5) return dist <= 1;
  return dist <= 2;
}

function flattenWords(whisperJson) {
  const words = [];
  for (const segment of whisperJson.segments ?? []) {
    if (Array.isArray(segment.words) && segment.words.length) {
      for (const word of segment.words) {
        words.push({ text: String(word.word ?? '').trim(), start: Number(word.start), end: Number(word.end), probability: Number(word.probability ?? 1) });
      }
    } else {
      const text = String(segment.text ?? '').trim();
      const segmentTokens = text.split(/\s+/).filter(Boolean);
      const start = Number(segment.start ?? 0);
      const end = Number(segment.end ?? start);
      const step = segmentTokens.length ? (end - start) / segmentTokens.length : 0;
      segmentTokens.forEach((token, index) => words.push({ text: token, start: start + step * index, end: start + step * (index + 1), probability: 0.7 }));
    }
  }
  return words.filter((word) => Number.isFinite(word.start));
}

function findAnchor(words, anchor, fromIndex = 0) {
  const target = tokens(anchor);
  if (!target.length) return null;
  const normalizedWords = words.map((word) => normalizeText(word.text));
  const minMatch = Math.min(target.length, Math.max(3, Math.ceil(target.length * 0.55)));

  for (let start = Math.max(0, fromIndex); start < normalizedWords.length; start += 1) {
    let tIdx = 0;
    let wIdx = start;
    let matched = 0;

    while (tIdx < target.length && wIdx < normalizedWords.length) {
      const tw = target[tIdx];
      const ww = normalizedWords[wIdx];

      if (wordsMatch(tw, ww)) {
        matched += 1;
        tIdx += 1;
        wIdx += 1;
      } else if (tIdx + 1 < target.length && wordsMatch(tw + target[tIdx + 1], ww)) {
        matched += 2;
        tIdx += 2;
        wIdx += 1;
      } else if (wIdx + 1 < normalizedWords.length && wordsMatch(tw, ww + normalizedWords[wIdx + 1])) {
        matched += 1;
        tIdx += 1;
        wIdx += 2;
      } else {
        break;
      }
    }

    if (matched >= minMatch) {
      const slice = words.slice(start, wIdx);
      const confidence = slice.reduce((sum, word) => sum + (Number.isFinite(word.probability) ? word.probability : 0.8), 0) / (slice.length || 1);
      return { wordIndex: start, startSeconds: words[start].start, confidence: Number(confidence.toFixed(3)), matchedWords: matched };
    }
  }
  return null;
}

export async function alignProject(projectDirectory, { model = 'small', refresh = false } = {}) {
  const p = projectPaths(projectDirectory);
  const mapping = await readJson(p.mapping);
  const audioHash = await sha256(p.optimizedAudio);
  const evidenceExisting = await readJson(p.alignmentEvidence, null);
  if (!refresh && evidenceExisting?.audioFingerprintSha256 === audioHash && evidenceExisting?.passed === true) {
    return { reused: true, mapping, evidence: evidenceExisting };
  }

  const whisperDir = path.join(p.techDir, 'whisper');
  await mkdir(whisperDir, { recursive: true });
  const language = (await readJson(p.meta)).language ?? 'de';

  const basename = path.basename(p.optimizedAudio, path.extname(p.optimizedAudio));
  const whisperPath = path.join(whisperDir, `${basename}.json`);

  let whisperJson;
  if (!refresh && (await exists(whisperPath))) {
    whisperJson = JSON.parse(await readFile(whisperPath, 'utf8'));
  } else {
    await execFileAsync('whisper', [
      p.optimizedAudio,
      '--model', model,
      '--language', language,
      '--word_timestamps', 'True',
      '--output_format', 'json',
      '--output_dir', whisperDir
    ], { timeout: 3_600_000, maxBuffer: 64 * 1024 * 1024 });
    whisperJson = JSON.parse(await readFile(whisperPath, 'utf8'));
  }

  const words = flattenWords(whisperJson);
  if (!words.length) throw new Error('Whisper lieferte keine Wortzeiten.');

  const images = mapping.images ?? [];
  const misses = [];
  let cursor = 0;
  const aligned = images.map((image, index) => {
    if (index === 0) {
      const first = findAnchor(words, image.startAnchor, 0);
      if (!first) misses.push({ imageNumber: image.imageNumber, startAnchor: image.startAnchor });
      else cursor = first.wordIndex;
      return { ...image, actualStartSeconds: 0, alignmentConfidence: first?.confidence ?? 0 };
    }
    const match = findAnchor(words, image.startAnchor, cursor);
    if (!match) {
      misses.push({ imageNumber: image.imageNumber, startAnchor: image.startAnchor });
      return { ...image, actualStartSeconds: null, alignmentConfidence: 0 };
    }
    cursor = match.wordIndex;
    return { ...image, actualStartSeconds: Number(match.startSeconds.toFixed(3)), alignmentConfidence: match.confidence };
  });

  const duration = await probeDuration(p.optimizedAudio);
  for (let i = 0; i < aligned.length; i += 1) {
    const nextStart = aligned[i + 1]?.actualStartSeconds;
    aligned[i].actualEndSeconds = Number((Number.isFinite(nextStart) ? nextStart : duration).toFixed(3));
  }

  const updated = {
    ...mapping,
    sourceVoiceoverFile: mapping.sourceVoiceoverFile,
    audioMasterFile: '99-technik/YOUTUBE_AUDIO_OPTIMIZED.wav',
    alignmentEvidenceFile: '99-technik/WHISPER_ALIGNMENT.json',
    autoAlignment: { matched: aligned.length - misses.length, total: aligned.length, model, refreshed: refresh },
    images: aligned
  };
  await writeJson(p.mapping, updated);

  const evidence = {
    schemaVersion: 1,
    createdAt: new Date().toISOString(),
    model,
    language,
    audioFingerprintSha256: audioHash,
    wordCount: words.length,
    matchedImages: aligned.length - misses.length,
    totalImages: aligned.length,
    misses,
    passed: misses.length === 0
  };
  await writeJson(p.alignmentEvidence, evidence);
  if (misses.length) throw new Error(`Whisper konnte ${misses.length} Bildanker nicht sicher finden.`);
  return { reused: false, mapping: updated, evidence };
}

async function main() {
  const dir = arg('--dir');
  if (!dir) throw new Error('Nutzung: npm run auto-align:youtube -- --dir "youtube/<week>/<slug>" [--model small] [--refresh]');
  const result = await alignProject(dir, { model: arg('--model') ?? 'small', refresh: process.argv.includes('--refresh') });
  console.log(`Audio-Alignment: BESTANDEN (${result.mapping.autoAlignment?.matched ?? result.mapping.images.length}/${result.mapping.images.length})`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(`Audio-Alignment: FEHLER — ${error.message}`);
    process.exitCode = 1;
  });
}

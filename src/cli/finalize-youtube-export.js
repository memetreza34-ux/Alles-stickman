#!/usr/bin/env node

import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { arg, exists, projectPaths, readJson, sha256, writeJson } from '../lib/pipeline.js';

function clampTime(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : 0;
}

export function formatSrtTimestamp(seconds) {
  const totalMs = Math.round(clampTime(seconds) * 1000);
  const hours = Math.floor(totalMs / 3_600_000);
  const minutes = Math.floor((totalMs % 3_600_000) / 60_000);
  const secs = Math.floor((totalMs % 60_000) / 1000);
  const ms = totalMs % 1000;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

export function formatReadableTimestamp(seconds) {
  const total = Math.max(0, Math.floor(clampTime(seconds)));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hours > 0) return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function subtitleSegments(whisperJson) {
  return (whisperJson.segments ?? [])
    .map((segment) => ({
      start: clampTime(segment.start),
      end: Math.max(clampTime(segment.end), clampTime(segment.start) + 0.05),
      text: String(segment.text ?? '').replace(/\s+/g, ' ').trim()
    }))
    .filter((segment) => segment.text);
}

export function buildSrtFromWhisper(whisperJson) {
  return `${subtitleSegments(whisperJson).map((segment, index) => [
    index + 1,
    `${formatSrtTimestamp(segment.start)} --> ${formatSrtTimestamp(segment.end)}`,
    segment.text
  ].join('\n')).join('\n\n')}\n`;
}

export function buildTimedScriptFromWhisper(whisperJson) {
  return `${subtitleSegments(whisperJson)
    .map((segment) => `[${formatReadableTimestamp(segment.start)} - ${formatReadableTimestamp(segment.end)}] ${segment.text}`)
    .join('\n\n')}\n`;
}

export function buildUploadText({ title, description, tags = [] }) {
  const cleanTags = tags.map((tag) => String(tag).trim()).filter(Boolean);
  return [
    'YOUTUBE-UPLOADPAKET',
    '',
    'VIDEO',
    'FINAL_VIDEO.mp4',
    '',
    'THUMBNAIL',
    'THUMBNAIL.png',
    '',
    'TITEL',
    title,
    '',
    'BESCHREIBUNG',
    description,
    '',
    'TAGS',
    cleanTags.join(', '),
    '',
    'UNTERTITEL',
    'SUBTITLES.srt',
    '',
    'SKRIPT MIT ZEITSTEMPELN',
    'TIMED_SCRIPT.txt',
    ''
  ].join('\n');
}

export async function finalizeExport(projectDirectory) {
  const p = projectPaths(projectDirectory);
  const video = path.join(p.exportDir, 'FINAL_VIDEO.mp4');
  const cover = path.join(p.imagesDir, 'Bild 01.png');
  const thumbnail = path.join(p.exportDir, 'THUMBNAIL.png');
  const uploadFile = path.join(p.exportDir, 'YOUTUBE_UPLOAD.txt');
  const subtitlesFile = path.join(p.exportDir, 'SUBTITLES.srt');
  const timedScriptFile = path.join(p.exportDir, 'TIMED_SCRIPT.txt');
  const whisperFile = path.join(p.techDir, 'whisper', 'YOUTUBE_AUDIO_OPTIMIZED.json');

  if (!(await exists(video))) throw new Error('FINAL_VIDEO.mp4 fehlt.');
  if (!(await exists(cover))) throw new Error('Bild 01.png fehlt.');
  if (!(await exists(whisperFile))) throw new Error('Whisper-JSON fehlt. Phase 3 muss vor dem Export erfolgreich gelaufen sein.');

  const meta = await readJson(p.meta);
  const uploadMetadata = meta.uploadMetadata ?? {};
  const title = String(uploadMetadata.title ?? meta.title ?? '').trim();
  const description = String(uploadMetadata.description ?? '').trim();
  const tags = Array.isArray(uploadMetadata.tags) ? uploadMetadata.tags : [];
  if (!title) throw new Error('YouTube-Titel fehlt in video.json.uploadMetadata.title.');
  if (!description) throw new Error('YouTube-Beschreibung fehlt in video.json.uploadMetadata.description.');

  const whisperJson = JSON.parse(await readFile(whisperFile, 'utf8'));
  const segments = subtitleSegments(whisperJson);
  if (!segments.length) throw new Error('Whisper-JSON enthält keine Untertitel-Segmente.');

  await mkdir(p.exportDir, { recursive: true });
  await copyFile(cover, thumbnail);
  await writeFile(uploadFile, buildUploadText({ title, description, tags }), 'utf8');
  await writeFile(subtitlesFile, buildSrtFromWhisper(whisperJson), 'utf8');
  await writeFile(timedScriptFile, buildTimedScriptFromWhisper(whisperJson), 'utf8');

  const report = {
    schemaVersion: 2,
    createdAt: new Date().toISOString(),
    videoFile: '03-export/FINAL_VIDEO.mp4',
    thumbnailFile: '03-export/THUMBNAIL.png',
    uploadMetadataFile: '03-export/YOUTUBE_UPLOAD.txt',
    subtitlesFile: '03-export/SUBTITLES.srt',
    timedScriptFile: '03-export/TIMED_SCRIPT.txt',
    subtitleSource: '99-technik/whisper/YOUTUBE_AUDIO_OPTIMIZED.json',
    subtitleSegments: segments.length,
    youtubeTitle: title,
    youtubeDescriptionPresent: Boolean(description),
    youtubeTagCount: tags.length,
    thumbnailSource: '00-bildprompts/images/Bild 01.png',
    coverSha256: await sha256(cover),
    thumbnailSha256: await sha256(thumbnail)
  };
  report.thumbnailIdenticalToCover = report.coverSha256 === report.thumbnailSha256;
  if (!report.thumbnailIdenticalToCover) throw new Error('Thumbnail ist nicht identisch zu Bild 01.');
  await writeJson(path.join(p.techDir, 'EXPORT_REPORT.json'), report);

  console.log('Export finalisiert: FINAL_VIDEO.mp4 + THUMBNAIL.png + YOUTUBE_UPLOAD.txt + SUBTITLES.srt + TIMED_SCRIPT.txt');
  return report;
}

async function main() {
  const dir = arg('--dir');
  if (!dir) throw new Error('Nutzung: npm run finalize:youtube-export -- --dir "youtube/<week>/<slug>"');
  await finalizeExport(dir);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(`Export-Finalisierung: FEHLER — ${error.message}`);
    process.exitCode = 1;
  });
}

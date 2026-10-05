#!/usr/bin/env node

import path from 'node:path';
import { arg, probeDuration, projectPaths, readJson, writeJson } from '../lib/pipeline.js';

function motionFor(index) {
  const presets = [
    { scaleFrom: 1.01, scaleTo: 1.035, xFrom: 0, xTo: 0, yFrom: 0, yTo: 0 },
    { scaleFrom: 1.035, scaleTo: 1.01, xFrom: -8, xTo: 8, yFrom: 0, yTo: 0 },
    { scaleFrom: 1.015, scaleTo: 1.04, xFrom: 6, xTo: -6, yFrom: 0, yTo: 0 },
    { scaleFrom: 1.02, scaleTo: 1.04, xFrom: 0, xTo: 0, yFrom: 4, yTo: -4 }
  ];
  return presets[index % presets.length];
}

export async function buildTimeline(projectDirectory) {
  const p = projectPaths(projectDirectory);
  const [meta, mapping, renderPlan, pipeline] = await Promise.all([
    readJson(p.meta), readJson(p.mapping), readJson(p.renderPlan), readJson(path.resolve('config/pipeline.json'))
  ]);
  const audioDuration = await probeDuration(p.optimizedAudio);
  const hold = Number(meta.renderPolicy?.endHoldSeconds ?? pipeline.endHoldPolicy?.targetSeconds ?? 1.3);
  const images = mapping.images ?? [];
  if (!images.length) throw new Error('Mapping enthält keine Bilder.');
  if (images.some((image) => !Number.isFinite(Number(image.actualStartSeconds)))) throw new Error('Nicht alle Bilder besitzen gemessene Startzeiten.');

  const timelineImages = images.map((image, index) => {
    const start = index === 0 ? 0 : Number(image.actualStartSeconds);
    const next = images[index + 1];
    const end = next ? Number(next.actualStartSeconds) : audioDuration + hold;
    if (!(end > start)) throw new Error(`Ungültige Dauer bei Bild ${image.imageNumber}: ${start} → ${end}`);
    return {
      imageNumber: image.imageNumber,
      file: `__render/${meta.videoId}/images/${image.imageFile}`,
      startSeconds: Number(start.toFixed(3)),
      endSeconds: Number(end.toFixed(3)),
      durationSeconds: Number((end - start).toFixed(3)),
      visualPurpose: image.visualPurpose ?? '',
      topicAnchor: image.topicAnchor ?? '',
      visualForm: image.visualForm ?? '',
      motion: motionFor(index)
    };
  });

  const sounds = (renderPlan.soundEffects ?? []).map((sound) => ({
    ...sound,
    file: sound.file ?? null
  }));

  const timeline = {
    schemaVersion: 1,
    createdAt: new Date().toISOString(),
    fps: Number(meta.renderPolicy?.fps ?? pipeline.fps ?? 30),
    width: Number(meta.renderPolicy?.width ?? pipeline.resolution.width),
    height: Number(meta.renderPolicy?.height ?? pipeline.resolution.height),
    audioDurationSeconds: audioDuration,
    endHoldSeconds: hold,
    durationSeconds: Number((audioDuration + hold).toFixed(3)),
    audioFile: `__render/${meta.videoId}/audio/YOUTUBE_AUDIO_OPTIMIZED.wav`,
    images: timelineImages,
    sounds
  };
  await writeJson(p.timeline, timeline);
  console.log(`Timeline gebaut: ${timelineImages.length} Bilder, ${timeline.durationSeconds}s`);
  return timeline;
}

async function main() {
  const dir = arg('--dir');
  if (!dir) throw new Error('Nutzung: npm run build:youtube-timeline -- --dir "youtube/<week>/<slug>"');
  await buildTimeline(dir);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(`Timeline: FEHLER — ${error.message}`);
    process.exitCode = 1;
  });
}

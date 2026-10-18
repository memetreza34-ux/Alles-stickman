#!/usr/bin/env node

import path from 'node:path';
import { arg, probeDuration, projectPaths, readJson, writeJson } from '../lib/pipeline.js';

// Bis v7 zoomte jedes Bild nur 1–3,5 % – im fertigen Video wirkte das wie ein Standbild.
// Die Presets wechseln jetzt zwischen Heranfahren, Herausfahren und seitlichen Fahrten.
const MOTION_PRESETS = [
  { scaleFrom: 1.0, scaleTo: 1.08, originX: 50, originY: 45 },
  { scaleFrom: 1.08, scaleTo: 1.0, originX: 50, originY: 50 },
  { scaleFrom: 1.03, scaleTo: 1.1, originX: 32, originY: 45 },
  { scaleFrom: 1.06, scaleTo: 1.06, xFrom: -36, xTo: 36, originX: 50, originY: 50 },
  { scaleFrom: 1.03, scaleTo: 1.1, originX: 68, originY: 45 }
];

export function motionFor(index, override = null) {
  const preset = { xFrom: 0, xTo: 0, yFrom: 0, yTo: 0, ...MOTION_PRESETS[index % MOTION_PRESETS.length] };
  if (!override) return preset;
  // Gezielte Kamerafahrt aus BILD_AUDIO_ZUORDNUNG.json: Zoom auf den wichtigen Bildteil.
  return {
    ...preset,
    scaleFrom: Number(override.zoomFrom ?? preset.scaleFrom),
    scaleTo: Number(override.zoomTo ?? preset.scaleTo),
    originX: Number(override.focusX ?? preset.originX),
    originY: Number(override.focusY ?? preset.originY),
    xFrom: 0,
    xTo: 0
  };
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
      motion: motionFor(index, image.motion),
      overlay: image.overlay?.text ? image.overlay : null
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

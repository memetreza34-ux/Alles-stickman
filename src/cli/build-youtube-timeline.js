#!/usr/bin/env node

import path from 'node:path';
import { arg, probeDuration, projectPaths, readJson, writeJson } from '../lib/pipeline.js';

export function motionFor(image, scene = {}, index = 0) {
  // No more blind rotation through four Ken-Burns presets. Keep explanations readable.
  const form = String(scene.form ?? image.visualForm ?? '').toLowerCase();
  const purpose = String(image.visualPurpose ?? '').toLowerCase();
  const combined = form + ' ' + purpose;
  const technical = /diagram|comparison|cutaway|mechanism|process|versus|angle|coordinate|map|route|technical|infograph|measurement|schematic|grafik|vergleich|schema|karte|polarstern|compass|latitude|longitude|log line/.test(combined);
  const panorama = /panorama|ocean|journey|landscape|cinematic|wide|travel|sea|wald|meer|landschaft|schiff/.test(combined);
  if (technical) return { kind: 'explanation', scaleFrom: 1, scaleTo: 1, xFrom: 0, xTo: 0, yFrom: 0, yTo: 0 };
  if (panorama) {
    const direction = index % 2 ? 1 : -1;
    return { kind: 'panorama', scaleFrom: 1.035, scaleTo: 1.035, xFrom: direction * 15, xTo: -direction * 15, yFrom: 0, yTo: 0 };
  }
  return { kind: 'story', scaleFrom: 1.006, scaleTo: 1.023, xFrom: 0, xTo: 0, yFrom: 0, yTo: 0 };
}

export async function buildTimeline(projectDirectory) {
  const p = projectPaths(projectDirectory);
  const [meta, mapping, renderPlan, pipeline] = await Promise.all([
    readJson(p.meta), readJson(p.mapping), readJson(p.renderPlan), readJson(path.resolve('config/pipeline.json'))
  ]);
  const audioDuration = await probeDuration(p.optimizedAudio);
  const hold = Number(meta.renderPolicy?.endHoldSeconds ?? pipeline.endHoldPolicy?.targetSeconds ?? 1.3);
  const images = mapping.images ?? [];
  const visuals = await readJson(path.join(p.techDir, 'SCENE_VISUALS_EN.json'), null);
  const scenesByNumber = new Map((visuals?.scenes ?? []).map(scene => [Number(scene.sceneNumber), scene]));
  if (!images.length) throw new Error('Mapping enthält keine Bilder.');
  if (images.some((image) => !Number.isFinite(Number(image.actualStartSeconds)))) throw new Error('Nicht alle Bilder besitzen gemessene Startzeiten.');

  const timelineImages = images.map((image, index) => {
    const start = index === 0 ? 0 : Number(image.actualStartSeconds);
    const next = images[index + 1];
    const end = next ? Number(next.actualStartSeconds) : audioDuration + hold;
    if (!(end > start)) throw new Error(`Ungültige Dauer bei Bild ${image.imageNumber}: ${start} → ${end}`);
    const scene = scenesByNumber.get(Number(image.imageNumber)) ?? {};
    return {
      imageNumber: image.imageNumber,
      file: `__render/${meta.videoId}/images/${image.imageFile}`,
      startSeconds: Number(start.toFixed(3)),
      endSeconds: Number(end.toFixed(3)),
      durationSeconds: Number((end - start).toFixed(3)),
      visualPurpose: image.visualPurpose ?? '',
      topicAnchor: image.topicAnchor ?? '',
      visualForm: image.visualForm ?? '',
      motion: motionFor(image, scene, index),
      // Optional image-specific editor-placed highlights; never guess diagram coordinates.
      cues: Array.isArray(scene.motionCues) ? scene.motionCues : []
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

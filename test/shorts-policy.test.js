import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('shorts: shorts-policy.json ist vollständig kalibriert (60s–90s Dauer, 9:16, Phase 1 Voice)', async () => {
  const policy = JSON.parse(await readFile('config/shorts-policy.json', 'utf8'));

  assert.equal(policy.status, 'READY');
  assert.equal(policy.mode, 'shorts');
  assert.equal(policy.aspectRatio, '9:16');
  assert.equal(policy.resolution.width, 1080);
  assert.equal(policy.resolution.height, 1920);
  assert.equal(policy.fps, 30);

  // Dauer: Mindestens 60 Sekunden (1 Minute) bis höchstens 90 Sekunden (1,5 Minuten)
  assert.deepEqual(policy.targetDurationSecondsRange, [60, 90]);
  assert.deepEqual(policy.production.audioSecondsRange, [60, 90]);
  assert.equal(policy.targetDurationSecondsRange[0], 60, 'Mindestens 60 Sekunden (1 Minute)');
  assert.equal(policy.targetDurationSecondsRange[1], 90, 'Höchstens 90 Sekunden (1,5 Minuten)');

  // Stimme: stickman-user-clone im kalibrierten 0.95x Tempo
  assert.equal(policy.voiceProfile, 'stickman-user-clone');
  assert.equal(policy.voiceSettings.tempo, 0.95);
  assert.equal(policy.voiceSettings.maxPauseSeconds, 0.3);
  assert.equal(policy.voiceSettings.maxWordsPerChunk, 32);

  // Workflow: Phase 1 erzeugt Stimme direkt; Phase 2 dient nur den Bildern
  assert.equal(policy.production.voiceGeneratedInPhase1, true);
  assert.equal(policy.production.userGeneratesOnlyImagesInPhase2, true);
});

test('workflow: AGENTS.md und WORKFLOW.md dokumentieren Phase 1 Stimme und Shorts 60s–90s', async () => {
  const [agents, workflow] = await Promise.all([
    readFile('AGENTS.md', 'utf8'),
    readFile('youtube/WORKFLOW.md', 'utf8')
  ]);

  // Prüfung der Shorts-Dauer in beiden Dokumenten
  assert.match(agents, /mindestens 60 Sekunden/i);
  assert.match(agents, /höchstens 90 Sekunden/i);
  assert.match(workflow, /mindestens 60 Sekunden/i);
  assert.match(workflow, /höchstens 90 Sekunden/i);

  // Prüfung des Phase-1-Stimmenablaufs
  assert.match(agents, /Phase 1[\s\S]*Stimme/i);
  assert.match(agents, /Phase 2[\s\S]*Bilder/i);
  assert.match(workflow, /Phase 1[\s\S]*Stimme/i);
  assert.match(workflow, /Phase 2[\s\S]*Bildgenerierung/i);

  // Prüfung der einheitlichen 5-teiligen Ordnerstruktur in beiden Dokumenten
  assert.match(agents, /shorts\/<Woche>\/<Thema-Slug>/i);
  assert.match(agents, /00-bildprompts/);
  assert.match(agents, /01-voice-script/);
  assert.match(agents, /02-audio/);
  assert.match(agents, /03-export/);
  assert.match(agents, /99-technik/);

  assert.match(workflow, /shorts\/<Woche>\/<Thema-Slug>/i);
  assert.match(workflow, /create:short/);
});

test('shorts: shorts-template besitzt die vollständige 5-teilige YouTube-Struktur', async () => {
  const { exists, projectPaths, readJson } = await import('../src/lib/pipeline.js');
  const templateDir = 'shorts/templates/short-template';
  const p = projectPaths(templateDir);

  // Ordnerstruktur
  assert.equal(await exists(p.imagesDir), true, '00-bildprompts/images muss existieren');
  assert.equal(await exists(p.prompt), true, '00-bildprompts/google-flow-prompt.txt muss existieren');
  assert.equal(await exists(p.script), true, '01-voice-script/voice-script.txt muss existieren');
  assert.equal(await exists(p.audioDir), true, '02-audio muss existieren');
  assert.equal(await exists(p.exportDir), true, '03-export muss existieren');
  assert.equal(await exists(p.techDir), true, '99-technik muss existieren');

  // Pflichtdateien im Technik-Ordner
  assert.equal(await exists(p.meta), true, 'video.json muss existieren');
  assert.equal(await exists(p.status), true, 'status.json muss existieren');
  assert.equal(await exists(p.mapping), true, 'BILD_AUDIO_ZUORDNUNG.json muss existieren');
  assert.equal(await exists(p.scriptPlan), true, 'SCRIPT_PLAN.json muss existieren');
  assert.equal(await exists(p.renderPlan), true, 'YOUTUBE_RENDER_PLAN.json muss existieren');

  // Meta-Validierung für Shorts
  const meta = await readJson(p.meta);
  assert.equal(meta.aspectRatio, '9:16');
  assert.equal(meta.format, 'short');
  assert.equal(meta.mode, 'shorts');
  assert.deepEqual(meta.targetDurationRangeSeconds, [60, 90]);
  assert.equal(meta.renderPolicy.width, 1080);
  assert.equal(meta.renderPolicy.height, 1920);
});

test('visual-qc: fingerprintPng validiert 9:16 vertikale Bilder für Shorts', async () => {
  const { fingerprintPng } = await import('../src/lib/visual-qc.js');
  const { mkdtemp, writeFile, rm } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const path = await import('node:path');

  const tmp = await mkdtemp(path.join(tmpdir(), 'shorts-png-test-'));
  try {
    // 9:16 PNG (1080x1920)
    const pngVertical = Buffer.alloc(28);
    Buffer.from('89504e470d0a1a0a', 'hex').copy(pngVertical, 0);
    pngVertical.write('IHDR', 12);
    pngVertical.writeUInt32BE(1080, 16);
    pngVertical.writeUInt32BE(1920, 20);
    const vertPath = path.join(tmp, 'vertical.png');
    await writeFile(vertPath, pngVertical);

    const res = await fingerprintPng(vertPath, '9:16');
    assert.equal(res.width, 1080);
    assert.equal(res.height, 1920);

    // 16:9 PNG gegen 9:16 geprüft muss fehlschlagen
    const pngHorizontal = Buffer.alloc(28);
    Buffer.from('89504e470d0a1a0a', 'hex').copy(pngHorizontal, 0);
    pngHorizontal.write('IHDR', 12);
    pngHorizontal.writeUInt32BE(1920, 16);
    pngHorizontal.writeUInt32BE(1080, 20);
    const horizPath = path.join(tmp, 'horizontal.png');
    await writeFile(horizPath, pngHorizontal);

    await assert.rejects(
      async () => fingerprintPng(horizPath, '9:16'),
      /PNG muss mindestens 720x1280 im 9:16-Format sein/
    );
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
});

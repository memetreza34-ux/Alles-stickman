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
});

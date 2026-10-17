import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { buildVisualQcTemplate, validateVisualQc, writeVisualQcTemplate, VISUAL_CHECKS } from '../src/lib/visual-qc.js';
import { motionFor } from '../src/cli/build-youtube-timeline.js';

test('Every new PNG requires an actual documented approval tied to its file hash', async () => {
  const project = await mkdtemp(path.join(tmpdir(), 'strichkosmos-visual-qc-'));
  const tech = path.join(project, '99-technik'), imageDir = path.join(project, '00-bildprompts/images');
  await mkdir(tech, { recursive: true });
  await mkdir(imageDir, { recursive: true });
  await writeFile(path.join(tech, 'video.json'), JSON.stringify({ videoId: 'qc-demo', plannedImageCount: 1, visualQualityGateRequired: true }));
  // The unit fixture tests PNG header/identity checks, not actual image rendering.
  const png = Buffer.alloc(28);
  Buffer.from('89504e470d0a1a0a', 'hex').copy(png, 0);
  png.write('IHDR', 12);
  png.writeUInt32BE(1920, 16);
  png.writeUInt32BE(1080, 20);
  const imageFile = path.join(imageDir, 'Bild 01.png');
  await writeFile(imageFile, png);
  try {
    const initial = await buildVisualQcTemplate(project);
    assert.equal(initial.images.length, 1);
    assert.equal(initial.images[0].checks.noProductionLabels, false);
    await writeVisualQcTemplate(project);
    let qc = await validateVisualQc(project);
    assert.equal(qc.passed, false);
    const manifestPath = path.join(tech, 'VISUAL_QC.json');
    const report = JSON.parse(await readFile(manifestPath, 'utf8'));
    Object.fromEntries(VISUAL_CHECKS.map(key => [key, true]));
    for (const key of VISUAL_CHECKS) report.images[0].checks[key] = true;
    Object.assign(report.images[0], {
      status: 'APPROVED', reviewer: 'Visual editor', reviewedAt: '2026-10-17T10:00:00Z',
      notes: 'Test fixture: recorded explicit review for all scene criteria.'
    });
    await writeFile(manifestPath, JSON.stringify(report), 'utf8');
    qc = await validateVisualQc(project);
    assert.equal(qc.passed, true, qc.errors.join('; '));
    png[27] = 123;
    await writeFile(imageFile, png);
    qc = await validateVisualQc(project);
    assert.equal(qc.passed, false);
    assert.match(qc.errors.join(' '), /veraendert/);
  } finally { await rm(project, { recursive: true, force: true }); }
});

test('Motion follows scene type, diagrams stay static while landscapes can pan', () => {
  const diagram = motionFor({ visualPurpose: 'Winkel an Polstern' }, { form: 'two-part concept comparison' }, 0);
  const landscape = motionFor({ visualPurpose: 'Meereslandschaft' }, { form: 'cinematic ocean panorama' }, 2);
  const story = motionFor({ visualPurpose: 'Figur schaut nach links' }, { form: 'social action' }, 1);
  assert.equal(diagram.kind, 'explanation');
  assert.equal(diagram.scaleFrom, 1);
  assert.equal(diagram.scaleTo, 1);
  assert.equal(landscape.kind, 'panorama');
  assert.notEqual(landscape.xFrom, landscape.xTo);
  assert.equal(story.kind, 'story');
});

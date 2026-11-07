import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  buildVoiceBoostFilter,
  formatAtempoFilter,
  loadVoicePolicy,
  parseProfileTempo,
  prepareSpeechText,
  resolveRepoPath,
  synthesizeVoice
} from '../src/lib/voice-synthesis.js';
import { generateVoice } from '../src/cli/generate-youtube-voice.js';

test('voice: prepareSpeechText bereinigt typische Skriptformate korrekt', () => {
  const input = `# Überschrift
- Aufzählungspunkt
1. Nummerierter Schritt
> Ein Zitatblock
[Pause: 2s]
[Musik: bedrohlich]
„Du kennst bestimmt die Szene aus Western-Filmen: Der **verletzte** Cowboy trinkt *Whisky*.“
Hier ist ein [Link zum Buch](https://example.com) und etwas \`Code\`.
Die Operation hatte eine 300% Todesrate bei ca. 28 Sek. – ein absoluter Rekord.
z. B. fuhren sie 15 km/h bei 20 °C bzw. d. h. 5 Min. lang.`;

  const output = prepareSpeechText(input);

  assert.ok(!output.includes('# Überschrift'));
  assert.ok(!output.includes('- Aufzählungspunkt'));
  assert.ok(!output.includes('1. Nummerierter Schritt'));
  assert.ok(output.includes('Nummerierter Schritt'));
  assert.ok(!output.includes('> Ein Zitatblock'));
  assert.ok(output.includes('Ein Zitatblock'));
  assert.ok(!output.includes('[Pause: 2s]'));
  assert.ok(!output.includes('[Musik: bedrohlich]'));
  assert.ok(!output.includes('„'));
  assert.ok(!output.includes('“'));
  assert.ok(!output.includes('**'));
  assert.ok(!output.includes('*Whisky*'));
  assert.ok(output.includes('verletzte Cowboy trinkt Whisky'));
  assert.ok(!output.includes('https://example.com'));
  assert.ok(output.includes('Hier ist ein Link zum Buch und etwas Code.'));
  assert.ok(output.includes('300 Prozent'));
  assert.ok(output.includes('circa 28 Sekunden'));
  assert.ok(output.includes('zum Beispiel fuhren sie 15 Kilometer pro Stunde bei 20 Grad Celsius'));
  assert.ok(output.includes('beziehungsweise das heißt 5 Minuten lang'));
});

test('voice: prepareSpeechText wirft bei leerem Input einen Fehler', () => {
  assert.throws(() => prepareSpeechText(''), /Kein Skripttext/);
  assert.throws(() => prepareSpeechText(null), /Kein Skripttext/);
  assert.throws(() => prepareSpeechText(undefined), /Kein Skripttext/);
  assert.throws(() => prepareSpeechText('   \n\n  '), /leer/);
  assert.throws(() => prepareSpeechText('# Nur eine Überschrift\n'), /leer/);
});

test('voice: buildVoiceBoostFilter erzeugt korrekte ffmpeg-Filterkette mit Studio-Humanizer', () => {
  const boost = {
    enabled: true,
    highpassHz: 80,
    deess: { enabled: true, intensity: 0.5, max: 0.6, frequency: 0.5, freqHz: 6600, gainDb: -3.5, q: 2.0 },
    warmth: { freqHz: 200, gainDb: 1.5, q: 1.0 },
    presence: { freqHz: 3200, gainDb: 2.5, q: 1.2 },
    treble: { freqHz: 10000, gainDb: 1.0 },
    aiSheenTame: { enabled: true, freqHz: 11500, gainDb: -2.0, q: 1.0 },
    tubeWarmth: { enabled: true, type: 'tanh', threshold: 0.88, output: 0.98 },
    roomPresence: { enabled: true, inGain: 0.92, outGain: 0.06, delays: '16|26', decays: '0.10|0.05' },
    compand: 'attacks=0.02:decays=0.15:points=-60/-60|-24/-18|-12/-10|0/-3:gain=1',
    limiter: 0.92
  };

  const filter = buildVoiceBoostFilter(boost);
  assert.match(filter, /highpass=f=80/);
  assert.match(filter, /deesser=i=0.5:m=0.6:f=0.5:s=o/);
  assert.match(filter, /equalizer=f=6600:t=q:w=2:g=-3.5/);
  assert.match(filter, /equalizer=f=200:t=q:w=1:g=1.5/);
  assert.match(filter, /equalizer=f=3200:t=q:w=1.2:g=2.5/);
  assert.match(filter, /treble=g=1:f=10000/);
  assert.match(filter, /equalizer=f=11500:t=q:w=1:g=-2/);
  assert.match(filter, /asoftclip=type=tanh:threshold=0.88:output=0.98/);
  assert.match(filter, /aecho=in_gain=0.92:out_gain=0.06:delays=16\|26:decays=0.10\|0.05/);
  assert.match(filter, /compand=/);
  assert.match(filter, /alimiter=limit=0.92:level=false/);

  assert.equal(buildVoiceBoostFilter({ enabled: false }), null);
  assert.equal(buildVoiceBoostFilter(null), null);
});

test('voice: loadVoicePolicy lädt ausschließlich stickman-user-clone (0.95x Tempo, 0.30s Pausen)', async () => {
  const policy = await loadVoicePolicy();
  assert.equal(policy.schemaVersion, 1);
  assert.equal(policy.defaultProfile, 'stickman-user-clone');
  assert.deepEqual(Object.keys(policy.profiles), ['stickman-user-clone']);

  const defaultProf = policy.profiles['stickman-user-clone'];
  assert.ok(defaultProf, 'Standardprofil existiert');
  assert.equal(defaultProf.provider, 'qwen-mlx');
  assert.equal(defaultProf.voice, 'stickman-user-clone');
  assert.equal(defaultProf.tempo, 0.95);
  assert.equal(defaultProf.rate, '-5%');
  assert.equal(defaultProf.maxPauseSeconds, 0.30);
  assert.equal(defaultProf.preStretchMaxPauseSeconds, 0.285);
  assert.equal(defaultProf.maxWordsPerChunk, 32);
  assert.equal(defaultProf.temperature, 0.7);
  assert.equal(defaultProf.refAudio, 'channel/audio/reference/user_voice_reference.wav');
  assert.ok(existsSync(resolveRepoPath(defaultProf.refAudio)), `Referenz-Audiodatei ${defaultProf.refAudio} muss existieren`);
  assert.ok(defaultProf.refText && defaultProf.refText.length > 20, 'refText muss gepflegt sein');

  assert.equal(policy.audioFormat.sampleRateHz, 48000);
  assert.equal(policy.audioFormat.outputFilename, 'voice.wav');
  assert.equal(policy.voiceBoost.enabled, true);
  assert.equal(policy.voiceBoost.deess.enabled, true);
  assert.equal(policy.voiceBoost.tubeWarmth.enabled, true);
  assert.equal(policy.voiceBoost.roomPresence.enabled, true);

  // Veraltete Stimmen, Vergleichsordner und ONNX-Modelle sind vollständig entfernt
  assert.equal(existsSync(resolveRepoPath('channel/audio/models/de_DE-thorsten-high.onnx')), false);
  assert.equal(existsSync(resolveRepoPath('channel/audio/reference/florian_reference.wav')), false);
  assert.equal(existsSync(resolveRepoPath('src/cli/generate-custom-voice.js')), false);
  assert.equal(
    existsSync(resolveRepoPath('youtube/2026-KW44_26-10_bis_01-11/wie-ueberlebte-man-eine-operation-ohne-narkose/02-audio/stimmen-vergleich')),
    false
  );
});

test('voice: synthesizeVoice wirft bei ungültigem Profil verständlichen Fehler', async () => {
  await assert.rejects(
    () => synthesizeVoice({ rawText: 'Hallo', outputPath: '/tmp/out.wav', profileName: 'fantasiestimme' }),
    /Unbekanntes Stimmen-Profil: "fantasiestimme"/
  );
});

test('voice: generateVoice --dry-run funktioniert mit stickman-user-clone und ohne Netzwerk', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'voice-dryrun-'));
  const scriptDir = path.join(root, '01-voice-script');
  const audioDir = path.join(root, '02-audio');
  const techDir = path.join(root, '99-technik');

  await mkdir(scriptDir, { recursive: true });
  await mkdir(audioDir, { recursive: true });
  await mkdir(techDir, { recursive: true });

  await writeFile(path.join(scriptDir, 'voice-script.txt'), 'Hallo Welt. Dies ist ein **wichtiger** Test mit 100% Qualität.\n');
  await writeFile(path.join(techDir, 'video.json'), JSON.stringify({
    videoId: 'test_voice',
    targetDurationSeconds: 120,
    targetDurationRangeSeconds: [100, 140]
  }));

  try {
    const res = await generateVoice(root, { dryRun: true });
    assert.equal(res.dryRun, true);
    assert.equal(res.profileKey, 'stickman-user-clone');
    assert.equal(res.voiceBoost, true);
    assert.ok(res.wordCount >= 8);

    const resExplicit = await generateVoice(root, { dryRun: true, profile: 'stickman-user-clone' });
    assert.equal(resExplicit.profileKey, 'stickman-user-clone');

    const resNoBoost = await generateVoice(root, { dryRun: true, noBoost: true });
    assert.equal(resNoBoost.voiceBoost, false);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('voice: parseProfileTempo erkennt tempo, atempo, speed und relative Rate-Werte präzise', () => {
  assert.equal(parseProfileTempo(null), null);
  assert.equal(parseProfileTempo({}), null);
  assert.equal(parseProfileTempo({ tempo: 1.0 }), null);
  assert.equal(parseProfileTempo({ tempo: 0.95 }), 0.95);
  assert.equal(parseProfileTempo({ tempo: '0.95' }), 0.95);
  assert.equal(parseProfileTempo({ tempo: '0.95x' }), 0.95);
  assert.equal(parseProfileTempo({ tempo: '-5%' }), 0.95);
  assert.equal(parseProfileTempo({ atempo: 1.15 }), 1.15);
  assert.equal(parseProfileTempo({ atempo: '1.15x' }), 1.15);
  assert.equal(parseProfileTempo({ speed: 1.2 }), 1.2);
  assert.equal(parseProfileTempo({ speed: '1.2x' }), 1.2);
  assert.equal(parseProfileTempo({ provider: 'qwen-mlx', rate: '-5%' }), 0.95);
  assert.equal(parseProfileTempo({ provider: 'qwen-mlx', rate: '0.95x' }), 0.95);
  assert.equal(parseProfileTempo({ provider: 'qwen-mlx', rate: '0.95' }), 0.95);
});

test('voice: formatAtempoFilter erzeugt korrekte verkettete ffmpeg-Filter im Wertebereich [0.5, 2.0]', () => {
  assert.equal(formatAtempoFilter(null), null);
  assert.equal(formatAtempoFilter(1.0), null);
  assert.equal(formatAtempoFilter(0.95), 'atempo=0.95');
  assert.equal(formatAtempoFilter(1.5), 'atempo=1.5');
  assert.equal(formatAtempoFilter(2.0), 'atempo=2');
  assert.equal(formatAtempoFilter(2.5), 'atempo=2.0,atempo=1.25');
  assert.equal(formatAtempoFilter(4.0), 'atempo=2.0,atempo=2');
  assert.equal(formatAtempoFilter(0.25), 'atempo=0.5,atempo=0.5');
});

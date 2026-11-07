import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { probeDuration, readJson, sha256 } from './pipeline.js';

const execFileAsync = promisify(execFile);
const REPO_ROOT = fileURLToPath(new URL('../../', import.meta.url));

export function resolveRepoPath(targetPath) {
  if (!targetPath) return '';
  if (path.isAbsolute(targetPath)) return targetPath;
  const fromCwd = path.resolve(targetPath);
  if (existsSync(fromCwd)) return fromCwd;
  return path.resolve(REPO_ROOT, targetPath);
}

export async function loadVoicePolicy(customPath = 'config/voice-policy.json') {
  const policyPath = resolveRepoPath(customPath);
  return readJson(policyPath);
}

export function prepareSpeechText(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('Kein Skripttext zur Sprachsynthese übergeben.');
  }

  let text = rawText
    // Strip HTML comments (e.g. <!-- Regie: schneller sprechen -->)
    .replace(/<!--[\s\S]*?-->/g, '')
    // Remove markdown comments, headers
    .replace(/^#+.*$/gm, '')
    // Strip markdown images before link conversion: ![Alt](url) -> empty
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    // Remove markdown links: [Text](url) -> Text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Convert stage pauses & breath markers to natural narrator pauses
    .replace(/\[(?:Pause|Atemzug|Atmen|Beat|Stille)[^\]]*\]/gi, ' — ')
    .replace(/\((?:Pause|Musik|SFX|Sound|Atmen|Flüstern|Lachen|Beat|Stille)[^)]*\)/gi, ' — ')
    // Remove all remaining stage directions in square brackets
    .replace(/\[[^\]]*\]/g, '')
    // Remove bullet points and numbered list markers
    .replace(/^\s*[-*]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    // Remove blockquotes (> text)
    .replace(/^\s*>\s+/gm, '')
    // Remove inline code ticks
    .replace(/`([^`]+)`/g, '$1')
    // Remove bold and italics formatting (**text**, *text*, __text__, _text_)
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    // Convert numerical ranges to spoken German (e.g. 1830–1840 -> 1830 bis 1840, 75-83% -> 75 bis 83%)
    .replace(/(\d+)\s*[-–—]\s*(\d+)/g, '$1 bis $2')
    // Normalize quotes and typography
    .replace(/[„“”«»"]/g, '')
    .replace(/’/g, "'")
    .replace(/–|—/g, ' - ')
    // Normalize percentages to German spoken word
    .replace(/(\d+)\s*%/g, '$1 Prozent')
    // Expand units & common German abbreviations for natural narration
    .replace(/(\d+)\s*°C\b/gi, '$1 Grad Celsius')
    .replace(/(\d+)\s*km\/h\b/gi, '$1 Kilometer pro Stunde')
    .replace(/(\d+)\s*km\b/gi, '$1 Kilometer')
    .replace(/(\d+)\s*kg\b/gi, '$1 Kilogramm')
    .replace(/(\d+)\s*Std\./gi, '$1 Stunden')
    .replace(/(\d+)\s*Sek\./gi, '$1 Sekunden')
    .replace(/(\d+)\s*Min\./gi, '$1 Minuten')
    .replace(/(\d+(?:,\d+)?)\s*Mio\./gi, '$1 Millionen')
    .replace(/(\d+(?:,\d+)?)\s*Mrd\./gi, '$1 Milliarden')
    .replace(/\bz\.\s*B\./gi, 'zum Beispiel')
    .replace(/\bbzw\./gi, 'beziehungsweise')
    .replace(/\bd\.\s*h\./gi, 'das heißt')
    .replace(/\bu\.\s*a\./gi, 'unter anderem')
    .replace(/\bca\./gi, 'circa')
    .replace(/\busw\./gi, 'und so weiter')
    .replace(/\betc\./gi, 'et cetera')
    .replace(/\bbspw\./gi, 'beispielsweise')
    .replace(/\bevtl\./gi, 'eventuell')
    .replace(/\bggf\./gi, 'gegebenenfalls')
    .replace(/\binkl\./gi, 'inklusive')
    .replace(/\bDr\.\s+/gi, 'Doktor ')
    .replace(/\bProf\.\s+/gi, 'Professor ')
    .replace(/\bNr\.\s*(\d+)/gi, 'Nummer $1')
    // Clean up duplicate dashes and normalize spacing
    .replace(/\s*-\s*(?:-\s*)+/g, ' - ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (!text) {
    throw new Error('Skripttext ist nach Bereinigung leer.');
  }

  return text;
}

export function buildVoiceBoostFilter(boost) {
  if (!boost || !boost.enabled) return null;
  const parts = [];

  // 1. High-pass filter: Beseitigt Trittschall & tieffrequenten Sub-Bass-Mulm (< 75 Hz)
  if (boost.highpassHz) {
    parts.push(`highpass=f=${Number(boost.highpassHz)}`);
  }

  // 2. De-Esser: Beseitigt scharfe digitale Sibilanten (6-7 kHz "S"- und "Z"-Zischen)
  if (boost.deess && boost.deess.enabled !== false) {
    const intensity = boost.deess.intensity ?? 0.45;
    const maxDeess = boost.deess.max ?? 0.55;
    const freq = boost.deess.frequency ?? 0.5;
    parts.push(`deesser=i=${intensity}:m=${maxDeess}:f=${freq}:s=o`);
    if (boost.deess.freqHz && boost.deess.gainDb) {
      const q = boost.deess.q ?? 2.0;
      parts.push(`equalizer=f=${Number(boost.deess.freqHz)}:t=q:w=${Number(q)}:g=${Number(boost.deess.gainDb)}`);
    }
  }

  // 3. Studio-Brustwärme: Nahbesprechungseffekt (180 - 200 Hz für satten, warmen Grundton)
  if (boost.warmth) {
    parts.push(`equalizer=f=${Number(boost.warmth.freqHz)}:t=q:w=${Number(boost.warmth.q)}:g=${Number(boost.warmth.gainDb)}`);
  }

  // 4. Präsenz & Sprachverständlichkeit (3.2 kHz für brillante Artikulation)
  if (boost.presence) {
    parts.push(`equalizer=f=${Number(boost.presence.freqHz)}:t=q:w=${Number(boost.presence.q)}:g=${Number(boost.presence.gainDb)}`);
  }

  // 5. Höhenanhebung & Zähmung des künstlichen KI-Glanzes (High-Frequency AI-Sheen Reduction)
  if (boost.treble) {
    parts.push(`treble=g=${Number(boost.treble.gainDb)}:f=${Number(boost.treble.freqHz)}`);
  }
  if (boost.aiSheenTame && boost.aiSheenTame.enabled !== false) {
    const freqHz = boost.aiSheenTame.freqHz ?? 11500;
    const gainDb = boost.aiSheenTame.gainDb ?? -2.0;
    const q = boost.aiSheenTame.q ?? 1.0;
    parts.push(`equalizer=f=${Number(freqHz)}:t=q:w=${Number(q)}:g=${Number(gainDb)}`);
  }

  // 6. Analoge Röhrenwärme (Soft-Clipping Saturation für musikalische Obertöne statt steriler Digitalität)
  if (boost.tubeWarmth && boost.tubeWarmth.enabled !== false) {
    const type = boost.tubeWarmth.type || 'tanh';
    const thresh = boost.tubeWarmth.threshold || 0.88;
    const out = boost.tubeWarmth.output || 0.98;
    parts.push(`asoftclip=type=${type}:threshold=${thresh}:output=${out}`);
  }

  // 7. Studio-Sprecherkabinen-Präsenz (Subtile frühe Erstreflexionen für akustische Verankerung ohne Kammfilter)
  if (boost.roomPresence && boost.roomPresence.enabled !== false) {
    const inGain = boost.roomPresence.inGain ?? 0.88;
    const outGain = boost.roomPresence.outGain ?? 0.95;
    const delays = boost.roomPresence.delays || '18|28';
    const decays = boost.roomPresence.decays || '0.04|0.02';
    parts.push(`aecho=in_gain=${inGain}:out_gain=${outGain}:delays=${delays}:decays=${decays}`);
  }

  // 8. Dynamischer Broadcast-Compander
  if (boost.compand) {
    parts.push(`compand=${boost.compand}`);
  }

  // 9. Lookahead Peak-Limiter gegen Übersteuerungen
  if (boost.limiter) {
    parts.push(`alimiter=limit=${Number(boost.limiter)}:level=false`);
  }

  return parts.length > 0 ? parts.join(',') : null;
}

function extractNumericTempo(raw) {
  if (raw == null) return null;
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return raw > 0 && Math.abs(raw - 1.0) > 0.001 ? raw : null;
  }
  const str = String(raw).trim();
  if (!str) return null;
  const xMatch = str.match(/^(\d+(?:\.\d+)?)\s*x?$/i);
  if (xMatch) {
    const val = Number(xMatch[1]);
    return val > 0 && Math.abs(val - 1.0) > 0.001 ? val : null;
  }
  const pctMatch = str.match(/^([+-]?\d+(?:\.\d+)?)\s*%$/);
  if (pctMatch) {
    const pct = Number(pctMatch[1]);
    const val = Number((1.0 + pct / 100).toFixed(3));
    return val > 0 && Math.abs(val - 1.0) > 0.001 ? val : null;
  }
  return null;
}

export function parseProfileTempo(profile) {
  if (!profile) return null;
  const fromTempo = extractNumericTempo(profile.tempo);
  if (fromTempo != null) return fromTempo;

  const fromAtempo = extractNumericTempo(profile.atempo);
  if (fromAtempo != null) return fromAtempo;

  const fromSpeed = extractNumericTempo(profile.speed);
  if (fromSpeed != null) return fromSpeed;

  if (profile.provider === 'qwen-mlx' && profile.rate) {
    const fromRate = extractNumericTempo(profile.rate);
    if (fromRate != null) return fromRate;
  }
  return null;
}

export function formatAtempoFilter(tempo) {
  let val = Number(tempo);
  if (!Number.isFinite(val) || val <= 0) return null;
  if (Math.abs(val - 1.0) < 0.001) return null;

  const filters = [];
  while (val > 2.0) {
    filters.push('atempo=2.0');
    val /= 2.0;
  }
  while (val < 0.5) {
    filters.push('atempo=0.5');
    val /= 0.5;
  }
  filters.push(`atempo=${Number(val.toFixed(4))}`);
  return filters.join(',');
}

export async function synthesizeWithQwenMlx(text, profile, outputPath, tempDir) {
  const pythonBin = '/Users/arman/finanzneo-tts/.venv/bin/python';
  const sprecherScript = '/Users/arman/finanzneo-tts/sprecher.py';
  if (!existsSync(pythonBin) || !existsSync(sprecherScript)) {
    throw new Error('Qwen3-TTS MLX Engine nicht gefunden unter /Users/arman/finanzneo-tts/.');
  }

  const refAudioPath = resolveRepoPath(profile.refAudio || 'channel/audio/reference/user_voice_reference.wav');
  if (!existsSync(refAudioPath)) {
    throw new Error(`Referenz-Audiodatei für Voice-Cloning nicht gefunden: ${refAudioPath}`);
  }

  const scriptFile = path.join(tempDir, 'script_qwen.txt');
  await writeFile(scriptFile, text, 'utf8');

  const tempoFactor = parseProfileTempo(profile) || 0.95;
  const basePause = profile.maxPauseSeconds != null
    ? Number(profile.maxPauseSeconds)
    : (profile.maxPause != null ? Number(profile.maxPause) : 0.30);
  const preStretchPause = profile.preStretchMaxPauseSeconds != null
    ? Number(profile.preStretchMaxPauseSeconds)
    : Number((basePause * tempoFactor).toFixed(4));
  const maxWords = profile.maxWordsPerChunk != null ? Number(profile.maxWordsPerChunk) : 32;

  const cmdArgs = [
    sprecherScript,
    '--script', scriptFile,
    '--voice', profile.voice || 'stickman-user-clone',
    '--out', outputPath,
    '--no-master',
    '--ref-audio', refAudioPath,
    '--max-words', String(maxWords),
    '--max-pause', String(preStretchPause)
  ];

  if (profile.seed != null) {
    cmdArgs.push('--seed', String(profile.seed));
  }
  if (profile.instruct) {
    cmdArgs.push('--instruct', profile.instruct);
  }
  if (profile.refText) {
    cmdArgs.push('--ref-text', profile.refText);
  }
  if (profile.temperature != null) {
    cmdArgs.push('--temperature', String(profile.temperature));
  }

  const env = { ...process.env, HF_HOME: '/Users/arman/finanzneo-tts/hf' };
  const { stderr } = await execFileAsync(pythonBin, cmdArgs, { timeout: 1_200_000, env });
  if (!existsSync(outputPath)) {
    throw new Error(`Qwen3-TTS Synthese erzeugte keine Datei: ${stderr}`);
  }
}

export async function synthesizeVoice({
  rawText,
  outputPath,
  profileName,
  policy: customPolicy = null
}) {
  const policy = customPolicy ?? await loadVoicePolicy();
  const profileKey = profileName || policy.defaultProfile;
  const profile = policy.profiles[profileKey];

  if (!profile) {
    const valid = Object.keys(policy.profiles).join(', ');
    throw new Error(`Unbekanntes Stimmen-Profil: "${profileKey}". Verfügbar: ${valid}`);
  }

  if (profile.provider !== 'qwen-mlx') {
    throw new Error(`Nicht unterstützter Voice-Provider: "${profile.provider}". Nur "qwen-mlx" (stickman-user-clone) ist aktiv.`);
  }

  const cleanText = prepareSpeechText(rawText);

  await mkdir(path.dirname(outputPath), { recursive: true });

  const tempDir = await mkdtemp(path.join(tmpdir(), 'stickman-voice-'));
  const rawAudioOut = path.join(tempDir, 'raw.wav');

  try {
    await synthesizeWithQwenMlx(cleanText, profile, rawAudioOut, tempDir);

    const tempo = parseProfileTempo(profile);
    const boostFilter = buildVoiceBoostFilter(policy.voiceBoost);

    const filterParts = [];
    if (tempo) {
      const atempoFilter = formatAtempoFilter(tempo);
      if (atempoFilter) {
        filterParts.push(atempoFilter);
      }
    }
    if (boostFilter) {
      filterParts.push(boostFilter);
    }

    const ffmpegArgs = [
      '-y',
      '-hide_banner',
      '-loglevel', 'error',
      '-i', rawAudioOut
    ];

    if (filterParts.length > 0) {
      ffmpegArgs.push('-af', filterParts.join(','));
    }

    ffmpegArgs.push(
      '-ar', String(policy.audioFormat.sampleRateHz || 48000),
      '-ac', String(policy.audioFormat.channels || 1),
      '-c:a', policy.audioFormat.codec || 'pcm_s16le',
      outputPath
    );

    await execFileAsync('ffmpeg', ffmpegArgs, { timeout: 300_000, maxBuffer: 16 * 1024 * 1024 });

    const duration = await probeDuration(outputPath);
    const audioHash = await sha256(outputPath);
    const wordCount = cleanText.split(/\s+/).length;
    const wordsPerMinute = duration > 0 ? Number(((wordCount / duration) * 60).toFixed(1)) : 0;

    return {
      success: true,
      profileKey,
      profile,
      outputPath,
      durationSeconds: duration,
      fingerprintSha256: audioHash,
      wordCount,
      wordsPerMinute,
      cleanTextPreview: cleanText.slice(0, 160) + (cleanText.length > 160 ? '...' : '')
    };
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

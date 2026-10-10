const REPOSITORY_URL = 'https://github.com/memetreza34-ux/Alles-stickman';
const DEFAULT_BRANCH = 'main';

function safeSegment(value, name) {
  const segment = String(value ?? '').trim();
  if (!/^[a-zA-Z0-9._-]+$/.test(segment) || segment === '.' || segment === '..') {
    throw new Error(`Ungültiges ${name} für Phase-1-Links: ${segment}`);
  }
  return encodeURIComponent(segment);
}

export function phase1Links(meta, { repositoryUrl = REPOSITORY_URL, branch = DEFAULT_BRANCH } = {}) {
  const root = repositoryUrl.replace(/\/$/, '');
  if (!/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+$/.test(root)) {
    throw new Error('Phase-1-Links benötigen eine gültige GitHub-Repository-URL.');
  }
  const base = `${root}/blob/${safeSegment(branch, 'branch')}/youtube/${safeSegment(meta.weekFolder, 'weekFolder')}/${safeSegment(meta.topicSlug, 'topicSlug')}`;
  return {
    project: base.replace('/blob/', '/tree/'),
    flowPrompt: `${base}/00-bildprompts/google-flow-prompt.txt`,
    voiceScript: `${base}/01-voice-script/voice-script.txt`,
    handoff: `${base}/99-technik/PHASE1_START_HERE.md`
  };
}

export function phase1ChatLinks(meta) {
  const links = phase1Links(meta);
  return `**Phase 1 abgeschlossen — ${meta.title}**\n\n[Google-Flow-Prompt öffnen](${links.flowPrompt}) · [Voice-over-Skript öffnen](${links.voiceScript})\n\nDie Links öffnen die Dateien direkt in GitHub, auch mobil. Google Flow und TTS starten dadurch nicht automatisch; Prompt bzw. Skript im jeweiligen Dienst verwenden.`;
}

export function renderPhase1Handoff(meta, { phase1Validated = false } = {}) {
  const links = phase1Links(meta);
  return `# Phase 1: Sofort loslegen — ${meta.title || meta.topic || 'YouTube-Video'}

**Status:** ${phase1Validated ? 'Phase 1 validiert — bereit für Cover und Sprecheraufnahme' : 'Links vorbereitet — Phase-1-Validierung noch ausstehend'}

## 1. Google-Flow-Prompt
[**Google-Flow-Prompt öffnen**](${links.flowPrompt})

Öffnet den vollständigen Bildproduktions-Prompt in GitHub. Zum Starten in Google Flow kopieren oder über den vorgesehenen Agenten-Workflow weitergeben.

## 2. Voice-over-Skript
[**Voice-over-Skript öffnen**](${links.voiceScript})

Öffnet das vollständige Sprecher-Skript in GitHub; für TTS kopieren oder an die Sprecherpipeline übergeben.

## Direktlinks für ChatGPT (nach Phase 1)
${phase1ChatLinks(meta)}

## Projekt
[**Videoprojekt öffnen**](${links.project})

**Verbindliche Übergabe:** Sobald Phase 1 bestanden ist, muss die ChatGPT-Antwort beide anklickbaren Zugänge oben enthalten — nicht nur eine allgemeine Ordnerverlinkung oder Dateinamen.

**Bildablauf:** Genau 3 Cover erzeugen, auf die Nutzerwahl A/B/C warten. Erst danach übrige Bilder in automatischen 5er-Blöcken erstellen; keine weiteren Rückfragen. Die Links allein starten keine externen Generierungen.
`;
}

// Pipeline v8: messbare Skriptqualität. Abgeleitet aus dem Vergleich der eigenen Videos
// (GPS: 0 Zahlen, 17 Vorsichtswörter, 2 Fragen auf 1.014 Wörter) mit Ink Explainer
// (857.000–14,5 Mio. Aufrufe: Zahl/Name/Jahr fast in jedem zweiten Satz, „du“-Perspektive,
// Problem→Lösung→neues Problem, Rückbezug am Schluss).

const NUMBER_WORDS = /\b(zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn|elf|zwölf|zwanzig|dreißig|vierzig|fünfzig|hundert|tausend|million|milliarde)\w*/gi;
const DIGITS = /\b\d[\d.,]*\b/g;
const HEDGES = /\b(ungefähr|etwa|vermutlich|wahrscheinlich|möglicherweise|vielleicht|scheinbar|vergleichsweise|gewissermaßen|eher|grob|relativ|teilweise|konnte|konnten|könnte|könnten)\b/gi;
const DU = /\b(du|dir|dich|dein|deine|deinen|deinem|deiner|deines)\b/gi;
const CONTRAST_START = /^(doch|aber|deshalb|darum|trotzdem|allerdings)\b/i;

const count = (text, re) => (String(text).match(re) ?? []).length;

export function splitSentences(text) {
  return String(text).split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
}

export function analyzeScript(text, durationSeconds) {
  const words = String(text).split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(Number(durationSeconds) / 60, 0.1);
  const sentences = splitSentences(text);
  const concrete = count(text, DIGITS) + count(text, NUMBER_WORDS);
  const hedges = count(text, HEDGES);
  return {
    words,
    sentences: sentences.length,
    concreteDetails: concrete,
    concretePerMinute: concrete / minutes,
    hedges,
    hedgesPer100Words: words ? (hedges / words) * 100 : 0,
    duPerMinute: count(text, DU) / minutes,
    questionsPerMinute: sentences.filter((s) => s.endsWith('?')).length / minutes,
    contrastStartShare: sentences.length ? sentences.filter((s) => CONTRAST_START.test(s)).length / sentences.length : 0
  };
}

export function evaluateScriptMetrics(m, rules) {
  const errors = [];
  const warnings = [];
  const r = rules ?? {};
  const fmt = (x) => x.toFixed(1);
  if (m.concretePerMinute < r.concretePerMinute.error) errors.push(`Zu wenig Konkretes: ${fmt(m.concretePerMinute)} Zahlen/Jahre pro Minute (Minimum ${r.concretePerMinute.error}). Echte Zahlen, Jahre, Orte und Funde aus der Recherche einbauen.`);
  else if (m.concretePerMinute < r.concretePerMinute.warn) warnings.push(`Wenig Konkretes: ${fmt(m.concretePerMinute)} Zahlen/Jahre pro Minute (Ziel ≥ ${r.concretePerMinute.warn}).`);
  if (m.hedgesPer100Words > r.hedgesPer100Words.error) errors.push(`Zu vorsichtig formuliert: ${fmt(m.hedgesPer100Words)} Vorsichtswörter pro 100 Wörter (Maximum ${r.hedgesPer100Words.error}). Unsicherheit einmal klar benennen statt jeden Satz abzuschwächen.`);
  else if (m.hedgesPer100Words > r.hedgesPer100Words.warn) warnings.push(`Viele Vorsichtswörter: ${fmt(m.hedgesPer100Words)} pro 100 Wörter (Ziel ≤ ${r.hedgesPer100Words.warn}).`);
  if (m.duPerMinute < r.duPerMinute.warn) warnings.push(`Wenig „du“-Perspektive: ${fmt(m.duPerMinute)} pro Minute (Ziel ≥ ${r.duPerMinute.warn}). Zuschauer in die Szene setzen.`);
  if (m.questionsPerMinute < r.questionsPerMinute.warn) warnings.push(`Wenig Fragen: ${fmt(m.questionsPerMinute)} pro Minute (Ziel ≥ ${r.questionsPerMinute.warn}). Offene Fragen ziehen weiter.`);
  if (m.contrastStartShare > r.contrastStartShareMax) warnings.push(`${Math.round(m.contrastStartShare * 100)} % der Sätze beginnen mit Doch/Aber/Deshalb – immer gleiches Muster.`);
  return { errors, warnings };
}

function indexOrMinus(script, anchor) {
  const text = String(anchor ?? '').trim();
  if (!text || text.startsWith('[')) return -1;
  return script.indexOf(text);
}

// storyEngine in SCRIPT_PLAN.json: die Dramaturgie, die erfolgreiche Kanäle in diesem Format teilen.
export function validateStoryEngine(plan, script, researchText, rules) {
  const errors = [];
  const engine = plan?.storyEngine;
  if (!engine) return { errors: ['SCRIPT_PLAN.storyEngine fehlt (Pipeline v8).'] };
  const sections = new Map((plan.sections ?? []).map((s) => [s.id, script.indexOf(String(s.startAnchor ?? '').trim())]));
  const setupStart = sections.get('setup') ?? -1;
  const mainStart = sections.get('main') ?? -1;
  const resolutionStart = sections.get('resolution') ?? -1;
  const isPlaceholder = (v) => !String(v ?? '').trim() || String(v).trim().startsWith('[');

  const opening = engine.openingContrast ?? {};
  if (isPlaceholder(opening.today) || isPlaceholder(opening.past)) errors.push('storyEngine.openingContrast braucht today (heutiger Alltag) und past (derselbe Moment früher).');
  const openingAt = indexOrMinus(script, opening.anchor);
  if (openingAt < 0 || (setupStart >= 0 && openingAt >= setupStart)) errors.push('storyEngine.openingContrast.anchor muss exakt im Hook stehen.');

  if (isPlaceholder(engine.stakes)) errors.push('storyEngine.stakes fehlt: Was stand für die Menschen auf dem Spiel?');

  const steps = Array.isArray(engine.escalation) ? engine.escalation : [];
  if (steps.length < rules.minEscalationSteps) errors.push(`storyEngine.escalation braucht mindestens ${rules.minEscalationSteps} Schritte Problem → Lösung → neues Problem (gefunden: ${steps.length}).`);
  let previous = -1;
  steps.forEach((step, i) => {
    const at = indexOrMinus(script, step.anchor);
    if (isPlaceholder(step.problem) || isPlaceholder(step.solution)) errors.push(`storyEngine.escalation[${i}] braucht problem und solution.`);
    if (at < 0) errors.push(`storyEngine.escalation[${i}].anchor kommt nicht exakt im Skript vor.`);
    else if (at <= previous) errors.push(`storyEngine.escalation[${i}] steht nicht in Skript-Reihenfolge.`);
    else if (mainStart >= 0 && at < mainStart) errors.push(`storyEngine.escalation[${i}] muss im Hauptteil liegen.`);
    previous = Math.max(previous, at);
  });

  const evidence = Array.isArray(engine.evidence) ? engine.evidence : [];
  if (evidence.length < rules.minEvidenceMoments) errors.push(`storyEngine.evidence braucht mindestens ${rules.minEvidenceMoments} belegte Fund-/Beweis-Momente (gefunden: ${evidence.length}).`);
  evidence.forEach((item, i) => {
    if (indexOrMinus(script, item.anchor) < 0) errors.push(`storyEngine.evidence[${i}].anchor kommt nicht exakt im Skript vor.`);
    const source = String(item.source ?? '').trim();
    if (!/^https?:\/\//.test(source)) errors.push(`storyEngine.evidence[${i}].source muss eine URL sein.`);
    else if (!String(researchText).includes(source)) errors.push(`storyEngine.evidence[${i}].source fehlt in RECHERCHE.md.`);
  });

  const callback = engine.callback ?? {};
  const callbackAt = indexOrMinus(script, callback.anchor);
  const callsBackAt = indexOrMinus(script, callback.callsBackTo);
  if (callbackAt < 0 || (resolutionStart >= 0 && callbackAt < resolutionStart)) errors.push('storyEngine.callback.anchor muss exakt in Auflösung oder Schluss stehen.');
  if (callsBackAt < 0 || (setupStart >= 0 && callsBackAt >= setupStart)) errors.push('storyEngine.callback.callsBackTo muss exakt auf eine Stelle im Hook zeigen.');

  return { errors };
}

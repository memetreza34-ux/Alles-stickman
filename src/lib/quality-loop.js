import path from 'node:path';
import { readdir } from 'node:fs/promises';
import { ensureInside, exists, projectPaths, readJson } from './pipeline.js';

export const REVIEW_FILENAME = 'POST_VIDEO_REVIEW.json';
const AREAS = ['hook', 'script', 'facts', 'visuals', 'voice', 'editing', 'titleThumbnail', 'export'];
const SEVERITIES = ['CRITICAL', 'MAJOR', 'MINOR'];
const SYSTEM_PATH = /^(?:config\/|channel\/|src\/|youtube\/templates\/|test\/|\.github\/)/;

export function reviewPath(dir) {
  return path.join(projectPaths(dir).techDir, REVIEW_FILENAME);
}

export async function makeReview(meta) {
  const template = await readJson(path.resolve('youtube/templates/video-template/99-technik', REVIEW_FILENAME));
  return { ...template, videoId: meta.videoId, title: meta.title, createdAt: new Date().toISOString() };
}

export async function completedVideoProjects(youtubeDir = path.resolve('youtube')) {
  if (!(await exists(youtubeDir))) return [];
  const result = [];
  for (const week of await readdir(youtubeDir, { withFileTypes: true })) {
    if (!week.isDirectory() || week.name === 'templates') continue;
    const weekDir = path.join(youtubeDir, week.name);
    for (const entry of await readdir(weekDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const dir = path.join(weekDir, entry.name);
      const p = projectPaths(dir);
      if (!(await exists(p.meta))) continue;
      const meta = await readJson(p.meta);
      const status = await readJson(p.status, {});
      if (await exists(path.join(p.exportDir, 'FINAL_VIDEO.mp4')) ||
          meta.renderReady === true || status.renderReady === true) result.push(dir);
    }
  }
  return result.sort();
}

export async function validatePostVideoReview(review, { projectDir, checkFiles = true } = {}) {
  const errors = [];
  if (!review || typeof review !== 'object') return { passed: false, errors: ['Review fehlt.'] };
  if (!review.videoId || !review.title) errors.push('Videoidentität fehlt.');
  if (checkFiles && projectDir && !(await exists(path.join(projectDir, '03-export', 'FINAL_VIDEO.mp4')))) {
    errors.push('Echte FINAL_VIDEO.mp4 fehlt: Keine visuelle Vollprüfung vortäuschen.');
  }
  if (review.evidence?.fullVideoWatched !== true) errors.push('Ganzes Video nicht als vollständig angesehen bestätigt.');
  if (String(review.evidence?.reviewNotes ?? '').trim().length < 40) errors.push('Konkrete Beobachtungsnotizen (mindestens 40 Zeichen) fehlen.');
  if (!Array.isArray(review.evidence?.strengths) ||
      !review.evidence.strengths.some(x => String(x).trim().length >= 10)) errors.push('Mindestens eine echte Stärke fehlt.');
  if (!String(review.reviewer ?? '').trim()) errors.push('Reviewer fehlt.');
  if (String(review.summary ?? '').trim().length < 40) errors.push('Gesamtfazit (mindestens 40 Zeichen) fehlt.');
  for (const area of AREAS) {
    const value = review.scores?.[area];
    if (!Number.isInteger(value) || value < 1 || value > 5) errors.push('Bewertung 1–5 fehlt: ' + area);
  }

  const findings = Array.isArray(review.findings) ? review.findings : null;
  const lessons = Array.isArray(review.lessons) ? review.lessons : null;
  if (!findings) errors.push('findings muss ein Array sein.');
  if (!lessons) errors.push('lessons muss ein Array sein.');
  else if (!lessons.length) errors.push('Jede Video-Review benötigt mindestens eine übertragbare Lesson oder ein überprüfbares Experiment.');
  if (findings && !findings.length && String(review.noIssuesReason ?? '').trim().length < 40) {
    errors.push('Ohne Findings eine überprüfbare Begründung mit mindestens 40 Zeichen eintragen.');
  }
  for (const [i, finding] of (findings ?? []).entries()) {
    const label = 'Finding ' + (i + 1);
    if (!AREAS.includes(finding.area)) errors.push(label + ': Kategorie ungültig.');
    if (!SEVERITIES.includes(finding.severity)) errors.push(label + ': Schweregrad ungültig.');
    if (!Number.isFinite(finding.timecodeSeconds) || finding.timecodeSeconds < 0) errors.push(label + ': Zeitstempel in Sekunden fehlt.');
    for (const field of ['observation', 'rootCause', 'action']) {
      if (String(finding[field] ?? '').trim().length < 15) errors.push(label + ': ' + field + ' zu kurz.');
    }
    if (!['FIXED','BACKLOG'].includes(finding.status)) errors.push(label + ': Status FIXED oder BACKLOG erforderlich.');
    if (finding.status === 'BACKLOG' && String(finding.backlogReason ?? '').trim().length < 20) errors.push(label + ': Backlogbegründung fehlt.');
    if (['CRITICAL','MAJOR'].includes(finding.severity) && finding.status !== 'FIXED') {
      errors.push(label + ': großer Fehler muss vor Reviewabschluss behoben sein.');
    }
    if (finding.status === 'FIXED' &&
        (!Array.isArray(finding.changedFiles) || !finding.changedFiles.length ||
         String(finding.verification ?? '').trim().length < 15)) {
      errors.push(label + ': geänderte Dateien + Nachprüfung fehlen.');
    }
  }
  for (const [i, lesson] of (lessons ?? []).entries()) {
    const label = 'Lesson ' + (i + 1);
    if (!['APPLIED','EXPERIMENT','BACKLOG'].includes(lesson.status)) errors.push(label + ': Status ungültig.');
    if (String(lesson.rule ?? '').trim().length < 20) errors.push(label + ': konkrete Regel fehlt.');
    if (findings?.length) {
      if (!Number.isInteger(lesson.findingIndex) || lesson.findingIndex < 0 ||
          lesson.findingIndex >= findings.length) errors.push(label + ': Finding-Index fehlt.');
    } else if (lesson.findingIndex !== null) errors.push(label + ': Ohne Findings muss findingIndex null sein.');
    if (lesson.status === 'EXPERIMENT' && String(lesson.verificationPlan ?? '').trim().length < 20) errors.push(label + ': Experiment benötigt einen konkreten Prüfplan.');
    if (lesson.status === 'BACKLOG' && String(lesson.backlogReason ?? '').trim().length < 20) errors.push(label + ': Backlog-Begründung fehlt.');
    if (lesson.status === 'APPLIED') {
      if (!Array.isArray(lesson.changedFiles) || !lesson.changedFiles.length) {
        errors.push(label + ': systemweite Änderungen fehlen.');
      } else for (const file of lesson.changedFiles) {
        if (!SYSTEM_PATH.test(file)) {
          errors.push(label + ': keine systemweite Datei: ' + file);
        } else if (checkFiles) {
          const full = ensureInside(process.cwd(), path.resolve(file));
          if (!(await exists(full))) errors.push(label + ': geänderte Datei fehlt: ' + file);
        }
      }
      if (String(lesson.verification ?? '').trim().length < 15) errors.push(label + ': Verifikation fehlt.');
    }
  }
  for (const [i, finding] of (findings ?? []).entries()) {
    if (['CRITICAL','MAJOR'].includes(finding.severity) &&
        !(lessons ?? []).some(x => x.findingIndex === i && x.status === 'APPLIED')) {
      errors.push('Finding ' + (i + 1) + ': übertragbare angewendete Verbesserung fehlt.');
    }
  }
  if (!['NOT_AVAILABLE','OBSERVED'].includes(review.analytics?.status)) errors.push('Analytics-Status ungültig.');
  if (review.analytics?.status === 'OBSERVED' && !review.analytics.capturedAt) {
    errors.push('Beobachtete Analytics brauchen Datum der Messung.');
  }
  if (!['PENDING','COMPLETE'].includes(review.status)) errors.push('Review-Status ungültig.');
  return { passed: errors.length === 0, errors };
}

export async function findPendingVideoReviews(youtubeDir = path.resolve('youtube')) {
  const completed = await completedVideoProjects(youtubeDir);
  const pending = [];
  for (const dir of completed) {
    const review = await readJson(reviewPath(dir), null);
    const checked = review
      ? await validatePostVideoReview(review, { projectDir: dir, checkFiles: true })
      : { passed: false, errors: ['Review fehlt.'] };
    if (review?.status !== 'COMPLETE' || !checked.passed) {
      pending.push({ projectDir: dir, reason: checked.errors.join('; ') || 'Review noch offen.' });
    }
  }
  return pending;
}

export async function assertReviewGateOpen(youtubeDir = path.resolve('youtube')) {
  const pending = await findPendingVideoReviews(youtubeDir);
  if (pending.length) {
    throw new Error('Bevor ein neues Video beginnt, das fertige Video reviewen:\n' +
      pending.map(x => '- ' + x.projectDir + ': ' + x.reason).join('\n') +
      '\nBefehl: npm run quality:init -- --dir "youtube/<week>/<slug>"');
  }
  return true;
}

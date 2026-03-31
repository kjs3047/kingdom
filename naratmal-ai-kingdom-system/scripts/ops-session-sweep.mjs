import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const checkpointPath = path.resolve(process.cwd(), 'ops-checkpoint.json');

function loadCheckpoint() {
  if (!fs.existsSync(checkpointPath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(checkpointPath, 'utf8'));
}

function getSessions() {
  const raw = process.platform === 'win32'
    ? execFileSync('powershell', ['-NoProfile', '-Command', 'openclaw sessions list --json'], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      })
    : execFileSync('openclaw', ['sessions', 'list', '--json'], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : parsed.sessions ?? [];
}

function minutesSince(value) {
  if (!value) return Number.POSITIVE_INFINITY;
  const ts = new Date(value).getTime();
  if (Number.isNaN(ts)) return Number.POSITIVE_INFINITY;
  return (Date.now() - ts) / 60000;
}

function classifySession(session, checkpoint) {
  const key = session.sessionKey || session.key || session.id || 'unknown';
  const ageMinutes = minutesSince(session.updatedAt || session.lastMessageAt || session.createdAt);
  const isMain = String(key).includes('agent:main:telegram:direct');
  const isRecent = ageMinutes <= 30;
  const activeTask = checkpoint?.currentTask?.trim();

  if (isMain) {
    return { key, action: 'keep', reason: 'main-session' };
  }

  if (activeTask && isRecent) {
    return { key, action: 'keep', reason: 'recent-session' };
  }

  if (ageMinutes > 120) {
    return { key, action: 'candidate-cleanup', reason: 'idle-over-120m' };
  }

  return { key, action: 'review', reason: 'non-main-session' };
}

function main() {
  const checkpoint = loadCheckpoint();
  const sessions = getSessions();
  const report = sessions.map((session) => ({
    sessionKey: session.sessionKey || session.key || session.id || null,
    label: session.label || session.title || null,
    model: session.model || null,
    updatedAt: session.updatedAt || session.lastMessageAt || session.createdAt || null,
    classification: classifySession(session, checkpoint),
  }));

  const summary = {
    ok: true,
    total: report.length,
    keep: report.filter((item) => item.classification.action === 'keep').length,
    review: report.filter((item) => item.classification.action === 'review').length,
    candidateCleanup: report.filter((item) => item.classification.action === 'candidate-cleanup').length,
    report,
  };

  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

main();

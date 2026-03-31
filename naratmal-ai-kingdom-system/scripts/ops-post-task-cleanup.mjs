import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const checkpointPath = path.resolve(process.cwd(), 'ops-checkpoint.json');

function loadCheckpoint() {
  if (!fs.existsSync(checkpointPath)) return null;
  return JSON.parse(fs.readFileSync(checkpointPath, 'utf8'));
}

function run(command) {
  if (process.platform === 'win32') {
    return execFileSync('powershell', ['-NoProfile', '-Command', command], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  }
  return execFileSync('bash', ['-lc', command], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function main() {
  const checkpoint = loadCheckpoint();
  const checkpointFresh = checkpoint?.lastUpdatedAt
    ? (Date.now() - new Date(checkpoint.lastUpdatedAt).getTime()) / 60000 <= Number(checkpoint.staleMinutes || 5)
    : false;

  const sessionSweepRaw = run('npm run ops:session-sweep');
  const sessionSweepJsonStart = sessionSweepRaw.indexOf('{');
  const sessionSweep = JSON.parse(sessionSweepRaw.slice(sessionSweepJsonStart));

  const cleanupCandidates = sessionSweep.report.filter((item) => item.classification.action === 'candidate-cleanup');

  if (!checkpointFresh && cleanupCandidates.length === 0) {
    process.stdout.write(JSON.stringify({ ok: true, action: 'noop', reason: 'no-fresh-checkpoint-and-no-cleanup-candidates' }, null, 2) + '\n');
    return;
  }

  run('openclaw sessions cleanup');

  const afterRaw = run('openclaw sessions --json --all-agents');
  const after = JSON.parse(afterRaw);

  process.stdout.write(
    JSON.stringify(
      {
        ok: true,
        action: 'cleanup-applied',
        checkpointFresh,
        cleanedCandidateCount: cleanupCandidates.length,
        remainingCount: after.count,
        remainingSessions: after.sessions.map((session) => session.key),
      },
      null,
      2,
    ) + '\n',
  );
}

main();

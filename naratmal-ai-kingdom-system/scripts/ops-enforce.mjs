import fs from 'node:fs';
import path from 'node:path';

const checkpointPath = path.resolve(process.cwd(), 'ops-checkpoint.json');
const now = new Date().toISOString();

if (!fs.existsSync(checkpointPath)) {
  console.error('missing ops-checkpoint.json');
  process.exit(1);
}

const checkpoint = JSON.parse(fs.readFileSync(checkpointPath, 'utf8'));
const nextAction = checkpoint.nextAction?.trim();
const lastUpdatedAt = checkpoint.lastUpdatedAt;

if (!nextAction) {
  console.error('checkpoint nextAction is empty');
  process.exit(2);
}

if (lastUpdatedAt) {
  const elapsedMs = Date.now() - new Date(lastUpdatedAt).getTime();
  const limitMs = 10 * 60 * 1000;
  if (elapsedMs > limitMs) {
    console.error(`checkpoint stale for ${Math.round(elapsedMs / 60000)} minutes`);
    process.exit(3);
  }
}

console.log(JSON.stringify({ ok: true, now, nextAction, lastUpdatedAt: lastUpdatedAt ?? null }, null, 2));

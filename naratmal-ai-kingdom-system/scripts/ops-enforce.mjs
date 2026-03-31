import fs from 'node:fs';
import path from 'node:path';

const checkpointPath = path.resolve(process.cwd(), 'ops-checkpoint.json');
const now = new Date().toISOString();

if (!fs.existsSync(checkpointPath)) {
  console.error('missing ops-checkpoint.json');
  process.exit(1);
}

const checkpoint = JSON.parse(fs.readFileSync(checkpointPath, 'utf8'));
const currentTask = checkpoint.currentTask?.trim();
const nextTask = checkpoint.nextTask?.trim();
const expectedResult = checkpoint.expectedResult?.trim();
const lastUpdatedAt = checkpoint.lastUpdatedAt;
const staleMinutes = Number(checkpoint.staleMinutes || 5);

if (!currentTask) {
  console.error('checkpoint currentTask is empty');
  process.exit(2);
}

if (!nextTask) {
  console.error('checkpoint nextTask is empty');
  process.exit(3);
}

if (!expectedResult) {
  console.error('checkpoint expectedResult is empty');
  process.exit(4);
}

if (lastUpdatedAt) {
  const elapsedMs = Date.now() - new Date(lastUpdatedAt).getTime();
  const limitMs = staleMinutes * 60 * 1000;
  if (elapsedMs > limitMs) {
    console.error(`checkpoint stale for ${Math.round(elapsedMs / 60000)} minutes`);
    process.exit(5);
  }
}

console.log(
  JSON.stringify(
    {
      ok: true,
      now,
      currentTask,
      nextTask,
      expectedResult,
      lastUpdatedAt: lastUpdatedAt ?? null,
      staleMinutes,
    },
    null,
    2,
  ),
);

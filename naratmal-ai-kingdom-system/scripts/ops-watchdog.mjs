import fs from 'node:fs';
import path from 'node:path';

const checkpointPath = path.resolve(process.cwd(), 'ops-checkpoint.json');

function loadCheckpoint() {
  return JSON.parse(fs.readFileSync(checkpointPath, 'utf8'));
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url} -> ${response.status}`);
  return response.json();
}

async function main() {
  const checkpoint = loadCheckpoint();
  const baseUrl = process.env.KINGDOM_BASE_URL || 'http://127.0.0.1:43110';
  const result = {
    currentGoal: checkpoint.currentGoal,
    nextAction: checkpoint.nextAction,
    checks: {},
  };

  try {
    result.checks.health = await fetchJson(`${baseUrl}/health`);
  } catch (error) {
    result.checks.health = { ok: false, error: error instanceof Error ? error.message : 'health failed' };
  }

  try {
    result.checks.controlPlane = await fetchJson(`${baseUrl}/api/kingdom/control-plane`);
  } catch (error) {
    result.checks.controlPlane = { ok: false, error: error instanceof Error ? error.message : 'control plane failed' };
  }

  const degraded = !result.checks.health?.ok || !result.checks.controlPlane?.ok;
  result.status = degraded ? 'recovery-needed' : 'healthy';
  result.recoveryOrder = checkpoint.recoveryOrder;

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});

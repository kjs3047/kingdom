const baseUrl = process.env.KINGDOM_BASE_URL || 'http://127.0.0.1:43110';

async function getJson(path) {
  const response = await fetch(`${baseUrl}${path}`);
  if (!response.ok) throw new Error(`${path} -> ${response.status}`);
  return response.json();
}

async function main() {
  const control = await getJson('/api/kingdom/control-plane');
  if (!control.ok) throw new Error('control-plane not ok');
  if (!Array.isArray(control.data.recent) || !control.data.recent.length) throw new Error('recent logs missing');

  const latest = control.data.recent[0];
  const detail = await getJson(`/api/kingdom/logs/${latest.id}`);
  if (!detail.ok) throw new Error('latest log detail not ok');

  const leadAgent = detail.data?.response?.routing?.leadAgent;
  const workflowPhase = detail.data?.response?.workflow?.phase;
  if (!leadAgent) throw new Error('leadAgent missing in detail');
  if (!workflowPhase) throw new Error('workflow phase missing in detail');

  process.stdout.write(JSON.stringify({ ok: true, latestId: latest.id, leadAgent, workflowPhase }, null, 2) + '\n');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

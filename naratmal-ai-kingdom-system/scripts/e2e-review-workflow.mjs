import { spawn } from 'node:child_process';
import process from 'node:process';

const PORT = 43111;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const server = spawn(process.platform === 'win32' ? 'cmd' : 'npm', process.platform === 'win32' ? ['/c', 'npm', 'run', 'dev:server'] : ['run', 'dev:server'], {
  cwd: process.cwd(),
  env: { ...process.env, PORT: String(PORT) },
  stdio: ['ignore', 'pipe', 'pipe'],
});

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer() {
  for (let i = 0; i < 30; i += 1) {
    try {
      const response = await fetch(`${BASE_URL}/health`);
      if (response.ok) return;
    } catch {
      // retry
    }
    await wait(500);
  }
  throw new Error('server did not become ready in time');
}

async function run() {
  server.stdout.on('data', (chunk) => process.stdout.write(chunk));
  server.stderr.on('data', (chunk) => process.stderr.write(chunk));

  try {
    await waitForServer();

    const initialResponse = await fetch(`${BASE_URL}/api/kingdom/respond`, {
      method: 'POST',
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        message: '외부 제출용 1페이지 제안 초안을 작성해줘',
        externalDelivery: true,
        requester: '폐하',
      }),
    });
    const initialJson = await initialResponse.json();

    if (!initialJson.ok) throw new Error('initial respond call failed');
    if (initialJson.response.deliveryAllowed !== false) {
      throw new Error('expected deliveryAllowed=false before review approval');
    }
    if (initialJson.response.workflow.phase !== 'review_required') {
      throw new Error('expected workflow.phase=review_required before approval');
    }

    const reviewResponse = await fetch(`${BASE_URL}/api/kingdom/review/decision`, {
      method: 'POST',
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        logId: initialJson.logId,
        status: 'approved',
        reason: '사헌부 승인 완료',
      }),
    });
    const reviewJson = await reviewResponse.json();

    if (!reviewJson.ok) throw new Error('review decision call failed');
    if (reviewJson.response.deliveryAllowed !== true) {
      throw new Error('expected deliveryAllowed=true after review approval');
    }
    if (reviewJson.response.workflow.phase !== 'approved') {
      throw new Error('expected workflow.phase=approved after approval');
    }

    console.log('\n[E2E PASS] review gating workflow verified');
    console.log(JSON.stringify({
      initialLogId: initialJson.logId,
      approvedLogId: reviewJson.logId,
      before: initialJson.response.workflow,
      after: reviewJson.response.workflow,
    }, null, 2));
  } finally {
    server.kill('SIGTERM');
  }
}

run().catch((error) => {
  console.error(`\n[E2E FAIL] ${error.message}`);
  server.kill('SIGTERM');
  process.exitCode = 1;
});

import { ensurePortAvailable, safeKill, spawnDevServer, waitForServer } from './e2e-helpers.mjs';

const PORT = 43111;
const BASE_URL = `http://127.0.0.1:${PORT}`;
let server;

async function run() {
  await ensurePortAvailable(PORT, { autoKill: true });
  server = spawnDevServer({
    cwd: process.cwd(),
    port: PORT,
    env: { KINGDOM_AGENT_MODE: 'mock' },
  });

  try {
    await waitForServer(BASE_URL);

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
    if (!initialJson.response.revisionSummary) {
      throw new Error('expected revisionSummary before approval');
    }
    if (!Array.isArray(initialJson.response.review.actionItems) || initialJson.response.review.actionItems.length < 1) {
      throw new Error('expected review.actionItems before approval');
    }

    const revisedActionItems = [
      {
        code: 'CLAIM_TONE_ADJUST',
        title: '대외 표현 수위 조정',
        detail: '과장 표현을 제거하고 현재 구현 범위를 분명히 적는다.',
        severity: 'high',
      },
      {
        code: 'AUDIT_RECHECK_REQUIRED',
        title: '재검수 메모 반영',
        detail: '수정본에 재검수 메모 반영 여부를 체크리스트로 남긴다.',
        severity: 'medium',
      },
    ];

    const reviewResponse = await fetch(`${BASE_URL}/api/kingdom/review/decision`, {
      method: 'POST',
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        logId: initialJson.logId,
        status: 'revision_requested',
        reason: '사헌부 1차 수정 권고',
        revisionNote: '과장 문구 제거 후 재검수 예정',
        reviewActionItems: revisedActionItems,
      }),
    });
    const revisionJson = await reviewResponse.json();

    if (!revisionJson.ok) throw new Error('revision decision call failed');
    if (revisionJson.response.review.reason.includes('재검수 메모') === false) {
      throw new Error('expected revision note to be appended to review reason');
    }
    if (revisionJson.response.review.actionItems?.length !== revisedActionItems.length) {
      throw new Error('expected overridden review.actionItems length to match');
    }

    const approvalResponse = await fetch(`${BASE_URL}/api/kingdom/review/decision`, {
      method: 'POST',
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        logId: initialJson.logId,
        status: 'approved',
        reason: '사헌부 승인 완료',
      }),
    });
    const approvalJson = await approvalResponse.json();

    if (!approvalJson.ok) throw new Error('review approval call failed');
    if (approvalJson.response.deliveryAllowed !== true) {
      throw new Error('expected deliveryAllowed=true after review approval');
    }
    if (approvalJson.response.workflow.phase !== 'approved') {
      throw new Error('expected workflow.phase=approved after approval');
    }

    console.log('\n[E2E PASS] review gating workflow verified');
    console.log(
      JSON.stringify(
        {
          initialLogId: initialJson.logId,
          revisionLogId: revisionJson.logId,
          approvedLogId: approvalJson.logId,
          before: initialJson.response.workflow,
          revisionSummary: initialJson.response.revisionSummary,
          overriddenActionItems: revisionJson.response.review.actionItems,
          after: approvalJson.response.workflow,
        },
        null,
        2,
      ),
    );
  } finally {
    safeKill(server);
  }
}

run().catch((error) => {
  console.error(`\n[E2E FAIL] ${error.message}`);
  safeKill(server);
  process.exitCode = 1;
});

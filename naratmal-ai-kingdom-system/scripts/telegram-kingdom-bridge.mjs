import fs from 'node:fs';
import process from 'node:process';

const BASE_URL = process.env.KINGDOM_BASE_URL || 'http://127.0.0.1:43110';

function parseArgs(argv) {
  const args = {};

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--message') args.message = argv[++i];
    else if (token === '--sender') args.sender = argv[++i];
    else if (token === '--requester') args.requester = argv[++i];
    else if (token === '--session-key') args.sessionKey = argv[++i];
    else if (token === '--external') args.externalDelivery = true;
    else if (token === '--sensitive') args.sensitive = true;
    else if (token === '--input-file') args.inputFile = argv[++i];
  }

  return args;
}

function classifyRequest(message) {
  if (!message) return { externalDelivery: false, sensitive: false };

  const externalDelivery = /(제안서|소개서|발표|홍보|외부 제출|투자자|보도자료|소개 문구)/i.test(message);
  const sensitive = /(민감|내부 정책|운영 정책|보안|리스크|검토 문서)/i.test(message);
  return { externalDelivery, sensitive };
}

async function readJsonStdin() {
  let input = '';
  for await (const chunk of process.stdin) {
    input += chunk;
  }
  return input.trim() ? JSON.parse(input) : {};
}

async function readPayload() {
  const args = parseArgs(process.argv.slice(2));

  if (args.inputFile) {
    return { ...JSON.parse(fs.readFileSync(args.inputFile, 'utf8')), ...args };
  }

  if (args.message) {
    return args;
  }

  return { ...(await readJsonStdin()), ...args };
}

async function main() {
  const payload = await readPayload();
  const message = payload.message ?? payload.text ?? '';
  if (!message) throw new Error('missing message/text input');

  const inferred = classifyRequest(message);
  const body = {
    message,
    requester: payload.requester ?? payload.sender ?? '폐하',
    sessionKey: payload.sessionKey,
    externalDelivery: payload.externalDelivery ?? inferred.externalDelivery,
    sensitive: payload.sensitive ?? inferred.sensitive,
  };

  const response = await fetch(`${BASE_URL}/api/kingdom/respond`, {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`kingdom bridge failed: ${response.status} ${text}`);
  }

  const json = await response.json();
  const shouldHoldForReview = json.response?.deliveryAllowed === false && (body.externalDelivery || body.sensitive);
  const result = {
    ok: true,
    logId: json.logId,
    deliveryAllowed: json.response?.deliveryAllowed,
    reviewStatus: json.response?.review?.status,
    workflow: json.response?.workflow,
    revisionSummary: json.response?.revisionSummary,
    finalMessage: json.response?.finalMessage,
    shouldHoldForReview,
  };

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});

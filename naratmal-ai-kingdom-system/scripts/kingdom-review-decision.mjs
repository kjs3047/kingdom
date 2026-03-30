import process from 'node:process';

const BASE_URL = process.env.KINGDOM_BASE_URL || 'http://127.0.0.1:43110';

function parseArgs(argv) {
  const args = {};

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--log-id') args.logId = argv[++i];
    else if (token === '--status') args.status = argv[++i];
    else if (token === '--reason') args.reason = argv[++i];
    else if (token === '--revision-note') args.revisionNote = argv[++i];
  }

  if (!args.logId) throw new Error('missing --log-id');
  if (!args.status) throw new Error('missing --status');
  if (!args.reason) throw new Error('missing --reason');

  return args;
}

async function main() {
  const body = parseArgs(process.argv.slice(2));
  const response = await fetch(`${BASE_URL}/api/kingdom/review/decision`, {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`kingdom review decision failed: ${response.status} ${text}`);
  }

  const json = await response.json();
  process.stdout.write(`${JSON.stringify(json, null, 2)}\n`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});

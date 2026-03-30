import process from 'node:process';

const BASE_URL = process.env.KINGDOM_BASE_URL || 'http://127.0.0.1:43110';

function parseArgs(argv) {
  const args = { externalDelivery: false, sensitive: false, requester: '폐하' };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--message') args.message = argv[++i];
    else if (token === '--external') args.externalDelivery = true;
    else if (token === '--sensitive') args.sensitive = true;
    else if (token === '--requester') args.requester = argv[++i];
  }

  if (!args.message) {
    throw new Error('missing --message');
  }

  return args;
}

async function main() {
  const body = parseArgs(process.argv.slice(2));
  const response = await fetch(`${BASE_URL}/api/kingdom/respond`, {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`kingdom respond failed: ${response.status} ${text}`);
  }

  const json = await response.json();
  process.stdout.write(`${JSON.stringify(json, null, 2)}\n`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});

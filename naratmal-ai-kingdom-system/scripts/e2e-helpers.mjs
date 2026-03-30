import { exec as execCallback, spawn } from 'node:child_process';
import process from 'node:process';
import { promisify } from 'node:util';

const execAsync = promisify(execCallback);

export function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getPortOwnerPid(port) {
  if (process.platform !== 'win32') return null;

  try {
    const { stdout } = await execAsync(`powershell -NoProfile -Command "(Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty OwningProcess)"`);
    const trimmed = stdout.trim();
    if (!trimmed) return null;
    const pid = Number(trimmed);
    return Number.isFinite(pid) && pid > 0 ? pid : null;
  } catch {
    return null;
  }
}

export async function ensurePortAvailable(port, { autoKill = false, healthPath = '/health' } = {}) {
  const baseUrl = `http://127.0.0.1:${port}`;

  for (let i = 0; i < 5; i += 1) {
    try {
      const response = await fetch(`${baseUrl}${healthPath}`);
      if (!response.ok) return;

      const pid = await getPortOwnerPid(port);
      if (autoKill && pid) {
        try {
          process.kill(pid, 'SIGTERM');
        } catch {
          // ignore
        }
        await wait(700);
        continue;
      }

      throw new Error(`port ${port} is already occupied${pid ? ` by pid ${pid}` : ''}`);
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('port ')) {
        throw error;
      }
      return;
    }
  }

  const pid = await getPortOwnerPid(port);
  throw new Error(`failed to free port ${port}${pid ? ` (pid ${pid})` : ''}`);
}

export async function waitForServer(baseUrl, { retries = 40, delayMs = 500, healthPath = '/health' } = {}) {
  for (let i = 0; i < retries; i += 1) {
    try {
      const response = await fetch(`${baseUrl}${healthPath}`);
      if (response.ok) return;
    } catch {
      // retry
    }
    await wait(delayMs);
  }

  throw new Error('server did not become ready in time');
}

export function spawnDevServer({ cwd, port, env = {} }) {
  const child = spawn(
    process.platform === 'win32' ? 'cmd' : 'npm',
    process.platform === 'win32' ? ['/c', 'npm', 'run', 'dev:server'] : ['run', 'dev:server'],
    {
      cwd,
      env: { ...process.env, PORT: String(port), ...env },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );

  child.stdout.on('data', (chunk) => process.stdout.write(chunk));
  child.stderr.on('data', (chunk) => process.stderr.write(chunk));

  return child;
}

export function safeKill(child) {
  if (!child) return;
  try {
    child.kill('SIGTERM');
  } catch {
    // ignore
  }
}

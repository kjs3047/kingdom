import fs from 'node:fs';
import path from 'node:path';

const logDir = path.resolve(process.cwd(), 'memory', 'session_logs');
const keep = Number(process.env.KINGDOM_KEEP_LOGS || 20);

if (!fs.existsSync(logDir)) {
  console.log('no session_logs directory');
  process.exit(0);
}

const files = fs
  .readdirSync(logDir)
  .filter((file) => file.endsWith('.json'))
  .map((file) => ({
    file,
    filePath: path.join(logDir, file),
    mtime: fs.statSync(path.join(logDir, file)).mtimeMs,
  }))
  .sort((a, b) => b.mtime - a.mtime);

const removed = files.slice(keep);
for (const item of removed) {
  fs.unlinkSync(item.filePath);
}

console.log(JSON.stringify({ kept: Math.min(files.length, keep), removed: removed.length }, null, 2));

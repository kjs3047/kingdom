import fs from 'node:fs';
import path from 'node:path';
import type { FinalResponse, UserRequest } from './types';

const logDir = path.resolve(process.cwd(), 'memory', 'session_logs');

export function persistSessionLog(request: UserRequest, response: FinalResponse) {
  fs.mkdirSync(logDir, { recursive: true });
  const filePath = path.join(logDir, `${Date.now()}.json`);
  fs.writeFileSync(
    filePath,
    JSON.stringify(
      {
        request,
        response,
      },
      null,
      2,
    ),
    'utf8',
  );
  return filePath;
}

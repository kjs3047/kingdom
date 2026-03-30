import fs from 'node:fs';
import path from 'node:path';
import type { FinalResponse, UserRequest } from './types.js';

const logDir = path.resolve(process.cwd(), 'memory', 'session_logs');

export function persistSessionLog(request: UserRequest, response: FinalResponse) {
  fs.mkdirSync(logDir, { recursive: true });
  const timestamp = Date.now();
  const filePath = path.join(logDir, `${timestamp}.json`);
  fs.writeFileSync(
    filePath,
    JSON.stringify(
      {
        id: String(timestamp),
        request,
        response,
      },
      null,
      2,
    ),
    'utf8',
  );
  return { id: String(timestamp), filePath };
}

export function readSessionLog(logId: string) {
  const filePath = path.join(logDir, `${logId}.json`);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as {
    id: string;
    request: UserRequest;
    response: FinalResponse;
  };
}

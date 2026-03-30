import fs from 'node:fs';
import path from 'node:path';
import type { FinalResponse, ReviewHistoryEntry, SessionLogRecord, UserRequest } from './types.js';

const logDir = path.resolve(process.cwd(), 'memory', 'session_logs');

function ensureLogDir() {
  fs.mkdirSync(logDir, { recursive: true });
}

function buildFilePath(logId: string) {
  return path.join(logDir, `${logId}.json`);
}

function writeLog(record: SessionLogRecord) {
  ensureLogDir();
  fs.writeFileSync(buildFilePath(record.id), JSON.stringify(record, null, 2), 'utf8');
  return { id: record.id, filePath: buildFilePath(record.id) };
}

function buildReviewHistoryEntry(logId: string, response: FinalResponse, reviewRound: number): ReviewHistoryEntry {
  return {
    logId,
    status: response.review.status,
    reason: response.review.reason,
    reviewRound,
    timestamp: response.timestamp,
    actionItems: response.review.actionItems,
  };
}

export function persistSessionLog(
  request: UserRequest,
  response: FinalResponse,
  options?: { parentLog?: SessionLogRecord | null },
) {
  const timestamp = Date.now();
  const id = String(timestamp);
  const parentLog = options?.parentLog ?? null;
  const rootLogId = parentLog?.rootLogId ?? id;
  const reviewRound = parentLog ? parentLog.reviewRound + 1 : 0;
  const reviewHistory = [
    ...(parentLog?.reviewHistory ?? []),
    buildReviewHistoryEntry(id, response, reviewRound),
  ];

  const record: SessionLogRecord = {
    id,
    rootLogId,
    parentLogId: parentLog?.id,
    reviewRound,
    request,
    response,
    createdAt: new Date(timestamp).toISOString(),
    reviewHistory,
  };

  return writeLog(record);
}

export function readSessionLog(logId: string) {
  const filePath = buildFilePath(logId);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as SessionLogRecord;
}

import fs from 'node:fs';
import path from 'node:path';
import type { FinalResponse, MemorySnapshot, ReviewHistoryEntry, SessionLogRecord, UserRequest } from './types.js';

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

export function readAllLogs(): SessionLogRecord[] {
  ensureLogDir();
  return fs
    .readdirSync(logDir)
    .filter((file) => file.endsWith('.json'))
    .map((file) => {
      const parsed = JSON.parse(fs.readFileSync(path.join(logDir, file), 'utf8')) as Partial<SessionLogRecord>;
      const fallbackId = String(parsed.id ?? file.replace(/\.json$/, ''));
      const numericId = Number(fallbackId);
      const fallbackCreatedAt = Number.isFinite(numericId)
        ? new Date(numericId).toISOString()
        : new Date().toISOString();

      return {
        reviewHistory: Array.isArray(parsed.reviewHistory) ? parsed.reviewHistory : [],
        reviewRound: typeof parsed.reviewRound === 'number' ? parsed.reviewRound : 0,
        rootLogId: parsed.rootLogId ?? fallbackId,
        createdAt: typeof parsed.createdAt === 'string' ? parsed.createdAt : fallbackCreatedAt,
        ...parsed,
        id: fallbackId,
      } as SessionLogRecord;
    })
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function buildMemorySnapshot(request: UserRequest, limit = 3): MemorySnapshot {
  const logs = readAllLogs().filter((record) => {
    if (request.sessionKey && record.request.sessionKey) {
      return record.request.sessionKey === request.sessionKey;
    }
    if (request.requester && record.request.requester) {
      return record.request.requester === request.requester;
    }
    return false;
  });

  const recent = logs.slice(-limit);
  return {
    requester: request.requester,
    sessionKey: request.sessionKey,
    recentSummaries: recent.map((record) => {
      const status = record.response?.review?.status ?? 'unknown';
      const nextAction = record.response?.workflow?.nextAction ?? '상태 정보 없음';
      return `[${record.createdAt}] ${record.request?.message ?? '메시지 정보 없음'} -> ${status} / ${nextAction}`;
    }),
    pendingReviewCount: logs.filter((record) => record.response?.review?.status === 'revision_requested').length,
    latestLogId: recent.at(-1)?.id,
  };
}

export function buildControlPlaneSnapshot(limit = 12) {
  const logs = readAllLogs();
  const recent = logs.slice(-limit).reverse();

  return {
    totals: {
      totalLogs: logs.length,
      pendingReview: logs.filter((record) => record.response?.review?.status === 'revision_requested').length,
      approved: logs.filter((record) => record.response?.review?.status === 'approved').length,
      blocked: logs.filter((record) => record.response?.review?.status === 'blocked').length,
    },
    recent: recent.map((record) => ({
      id: record.id,
      rootLogId: record.rootLogId,
      parentLogId: record.parentLogId,
      requester: record.request?.requester,
      sessionKey: record.request?.sessionKey,
      message: record.request?.message ?? '메시지 정보 없음',
      reviewStatus: record.response?.review?.status ?? 'unknown',
      workflowPhase: record.response?.workflow?.phase ?? 'unknown',
      nextAction: record.response?.workflow?.nextAction ?? '상태 정보 없음',
      createdAt: record.createdAt,
      reviewRound: record.reviewRound,
    })),
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

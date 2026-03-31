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
  const agentCodeToLabel: Record<string, string> = {
    chief_agent: '영의정',
    ops_secretariat: '승정원',
    strategy_planner: '집현전',
    design_studio: '도화서',
    product_engineering: '병조',
    content_marketing: '예조',
    audit_guard: '사헌부',
  };

  const rosterMap = new Map<string, {
    id: string;
    name: string;
    responsibility: string;
    availability: 'online' | 'degraded' | 'offline';
    loadPercent: number;
    queueDepth: number;
    currentTask: string;
    updatedAt: string;
  }>();

  for (const record of recent) {
    const participants = [record.response?.routing?.leadAgent, ...(record.response?.routing?.supportAgents ?? [])].filter(Boolean) as string[];
    for (const agentCode of participants) {
      const name = agentCodeToLabel[agentCode] ?? agentCode;
      const existing = rosterMap.get(agentCode);
      const reviewStatus = record.response?.review?.status ?? 'unknown';
      const availability = reviewStatus === 'blocked' ? 'degraded' : 'online';
      if (!existing) {
        rosterMap.set(agentCode, {
          id: agentCode,
          name,
          responsibility: `${name} 담당 업무`,
          availability,
          loadPercent: Math.min(35 + participants.length * 12, 95),
          queueDepth: 1,
          currentTask: record.request?.message ?? '작업 없음',
          updatedAt: record.createdAt,
        });
      } else {
        existing.queueDepth += 1;
        existing.loadPercent = Math.min(existing.loadPercent + 8, 98);
        existing.currentTask = record.request?.message ?? existing.currentTask;
        existing.updatedAt = record.createdAt;
        if (availability === 'degraded') existing.availability = 'degraded';
      }
    }
  }

  return {
    totals: {
      totalLogs: logs.length,
      pendingReview: logs.filter((record) => record.response?.review?.status === 'revision_requested').length,
      approved: logs.filter((record) => record.response?.review?.status === 'approved').length,
      blocked: logs.filter((record) => record.response?.review?.status === 'blocked').length,
    },
    roster: Array.from(rosterMap.values()),
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
      leadAgent: record.response?.routing?.leadAgent,
      supportAgents: record.response?.routing?.supportAgents ?? [],
      executionMode: record.response?.execution?.mode ?? 'unknown',
      resultAgents: (record.response?.results ?? []).map((item) => item.agent),
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

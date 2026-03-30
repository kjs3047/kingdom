import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { z } from 'zod';
import { runChiefAgent } from './chiefAgent.js';
import { buildMemorySnapshot, persistSessionLog, readSessionLog } from './memoryStore.js';
import type { ReviewActionItem, ReviewStatus, UserRequest } from './types.js';

const app = express();
const port = Number(process.env.PORT || 43110);

app.use(cors());
app.use(express.json());

const reviewActionItemSchema = z.object({
  code: z.string().min(1),
  title: z.string().min(1),
  detail: z.string().min(1),
  severity: z.enum(['low', 'medium', 'high']),
  resolved: z.boolean().optional(),
});

const requestSchema = z.object({
  message: z.string().min(1),
  attachments: z.array(z.string()).optional(),
  externalDelivery: z.boolean().optional(),
  sensitive: z.boolean().optional(),
  requester: z.string().optional(),
  sessionKey: z.string().optional(),
  reviewOverrideStatus: z.enum(['not_required', 'approved', 'revision_requested', 'blocked']).optional(),
  reviewOverrideReason: z.string().optional(),
  reviewActionItems: z.array(reviewActionItemSchema).optional(),
});

const approveSchema = z.object({
  logId: z.string().min(1),
  status: z.enum(['approved', 'revision_requested', 'blocked']),
  reason: z.string().min(1),
  reviewActionItems: z.array(reviewActionItemSchema).optional(),
  revisionNote: z.string().optional(),
});

function attachMemory(request: UserRequest): UserRequest {
  const snapshot = buildMemorySnapshot(request);
  return {
    ...request,
    memorySummary: snapshot.recentSummaries,
  };
}

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'telegram_gateway', time: new Date().toISOString() });
});

app.get('/api/kingdom/policies', (_req, res) => {
  res.json({
    ok: true,
    rules: {
      singleFrontDoor: true,
      reviewRequiredForExternalDelivery: true,
      reviewRequiredForSensitive: true,
      leadAgentSingleOwner: true,
      deliveryBlockedUntilApproved: true,
    },
  });
});

app.get('/api/kingdom/logs/:id', (req, res) => {
  const data = readSessionLog(req.params.id);
  if (!data) {
    return res.status(404).json({ ok: false, error: 'log not found' });
  }
  return res.json({ ok: true, data });
});

app.post('/api/kingdom/respond', (req, res) => {
  const parsed = requestSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.flatten() });
  }

  const { reviewOverrideStatus, reviewOverrideReason, reviewActionItems, ...request } = parsed.data;
  const enrichedRequest = attachMemory(request);

  Promise.resolve(runChiefAgent(enrichedRequest, { reviewOverrideStatus, reviewOverrideReason, reviewActionItems }))
    .then((response) => {
      const log = persistSessionLog(enrichedRequest, response);
      return res.json({ ok: true, response, logId: log.id, logPath: log.filePath });
    })
    .catch((error: unknown) => {
      return res.status(500).json({ ok: false, error: error instanceof Error ? error.message : 'unknown error' });
    });
});

app.post('/api/kingdom/review/decision', (req, res) => {
  const parsed = approveSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.flatten() });
  }

  const existing = readSessionLog(parsed.data.logId);
  if (!existing) {
    return res.status(404).json({ ok: false, error: 'log not found' });
  }

  const revisionNote = parsed.data.revisionNote?.trim();
  const reviewReason = revisionNote
    ? `${parsed.data.reason} / 재검수 메모: ${revisionNote}`
    : parsed.data.reason;
  const enrichedRequest = attachMemory(existing.request);

  Promise.resolve(
    runChiefAgent(enrichedRequest, {
      reviewOverrideStatus: parsed.data.status as ReviewStatus,
      reviewOverrideReason: reviewReason,
      reviewActionItems: parsed.data.reviewActionItems as ReviewActionItem[] | undefined,
    }),
  )
    .then((response) => {
      const log = persistSessionLog(enrichedRequest, response, { parentLog: existing });
      return res.json({
        ok: true,
        previousLogId: parsed.data.logId,
        response,
        logId: log.id,
        logPath: log.filePath,
        reviewRound: existing.reviewRound + 1,
        rootLogId: existing.rootLogId,
      });
    })
    .catch((error: unknown) => {
      return res.status(500).json({ ok: false, error: error instanceof Error ? error.message : 'unknown error' });
    });
});

app.listen(port, () => {
  console.log(`[telegram_gateway] listening on http://localhost:${port} mode=${process.env.KINGDOM_AGENT_MODE ?? 'mock'}`);
});

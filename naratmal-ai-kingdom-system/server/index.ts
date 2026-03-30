import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { z } from 'zod';
import { runChiefAgent } from './chiefAgent.js';
import { persistSessionLog, readSessionLog } from './memoryStore.js';
import type { ReviewStatus } from './types.js';

const app = express();
const port = Number(process.env.PORT || 43110);

app.use(cors());
app.use(express.json());

const requestSchema = z.object({
  message: z.string().min(1),
  attachments: z.array(z.string()).optional(),
  externalDelivery: z.boolean().optional(),
  sensitive: z.boolean().optional(),
  requester: z.string().optional(),
  reviewOverrideStatus: z.enum(['not_required', 'approved', 'revision_requested', 'blocked']).optional(),
  reviewOverrideReason: z.string().optional(),
});

const approveSchema = z.object({
  logId: z.string().min(1),
  status: z.enum(['approved', 'revision_requested', 'blocked']),
  reason: z.string().min(1),
});

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

  const { reviewOverrideStatus, reviewOverrideReason, ...request } = parsed.data;
  const response = runChiefAgent(request, { reviewOverrideStatus, reviewOverrideReason });
  const log = persistSessionLog(request, response);

  return res.json({ ok: true, response, logId: log.id, logPath: log.filePath });
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

  const response = runChiefAgent(existing.request, {
    reviewOverrideStatus: parsed.data.status as ReviewStatus,
    reviewOverrideReason: parsed.data.reason,
  });
  const log = persistSessionLog(existing.request, response);

  return res.json({ ok: true, previousLogId: parsed.data.logId, response, logId: log.id, logPath: log.filePath });
});

app.listen(port, () => {
  console.log(`[telegram_gateway] listening on http://localhost:${port}`);
});

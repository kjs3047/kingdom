import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { z } from 'zod';
import { runChiefAgent } from './chiefAgent';
import { persistSessionLog } from './memoryStore';

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
});

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'telegram_gateway', time: new Date().toISOString() });
});

app.post('/api/kingdom/respond', (req, res) => {
  const parsed = requestSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.flatten() });
  }

  const response = runChiefAgent(parsed.data);
  const logPath = persistSessionLog(parsed.data, response);

  return res.json({ ok: true, response, logPath });
});

app.listen(port, () => {
  console.log(`[telegram_gateway] listening on http://localhost:${port}`);
});

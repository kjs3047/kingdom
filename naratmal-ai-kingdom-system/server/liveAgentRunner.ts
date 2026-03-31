import { execFile } from 'node:child_process';
import process from 'node:process';
import { promisify } from 'node:util';
import type { AgentCode, AgentResult, AgentTask, UserRequest } from './types.js';

const execFileAsync = promisify(execFile);

const cliAgentMap: Record<Exclude<AgentCode, 'chief_agent'>, string> = {
  ops_secretariat: 'ops_secretariat',
  strategy_planner: 'strategy_planner',
  design_studio: 'design_studio',
  product_engineering: 'product_engineering',
  content_marketing: 'content_marketing',
  audit_guard: 'audit_guard',
};

function buildPrompt(task: AgentTask, request: UserRequest): string {
  return [
    `너는 ${task.agent} 역할로 동작한다.`,
    `원 요청: ${request.message}`,
    `이번 역할: ${task.reason}`,
    request.externalDelivery ? '외부 제출물 여부: 예' : '외부 제출물 여부: 아니오',
    request.sensitive ? '민감 요청 여부: 예' : '민감 요청 여부: 아니오',
    '반드시 JSON으로만 답하라.',
    '형식: {"summary":"한 줄 요약","output":["항목1","항목2","항목3"]}',
    'output은 2~4개 항목으로 작성하라.',
  ].join('\n');
}

function extractText(payload: unknown): string {
  if (!payload || typeof payload !== 'object') return '';
  const result = payload as { result?: { payloads?: Array<{ text?: string }> } };
  return result.result?.payloads?.map((item) => item.text ?? '').join('\n').trim() ?? '';
}

function parseAgentText(agent: AgentCode, text: string): AgentResult {
  try {
    const parsed = JSON.parse(text) as { summary?: string; output?: string[] };
    return {
      agent,
      summary: parsed.summary ?? '실행 결과를 반환했습니다.',
      output: Array.isArray(parsed.output) && parsed.output.length ? parsed.output : [text],
    };
  } catch {
    return {
      agent,
      summary: '실행 결과를 반환했습니다.',
      output: text ? [text] : ['(no output)'],
    };
  }
}

export async function runLiveAgentTask(task: AgentTask, request: UserRequest): Promise<AgentResult> {
  const agent = task.agent as Exclude<AgentCode, 'chief_agent'>;
  const prompt = buildPrompt(task, request);
  const openclawEntry = process.env.OPENCLAW_ENTRY || 'C:\\Users\\old-notebook-kjs\\AppData\\Roaming\\npm\\node_modules\\openclaw\\openclaw.mjs';
  const timeoutMs = Number(process.env.KINGDOM_LIVE_TIMEOUT_MS || 30000);
  const retries = Number(process.env.KINGDOM_LIVE_RETRY_COUNT || 1);

  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const { stdout } = await execFileAsync(
        'node',
        [openclawEntry, 'agent', '--agent', cliAgentMap[agent], '--message', prompt, '--json'],
        {
          cwd: process.env.KINGDOM_WORKSPACE_DIR || 'C:\\Users\\old-notebook-kjs\\.openclaw\\workspace',
          windowsHide: true,
          timeout: timeoutMs,
          maxBuffer: 1024 * 1024,
        },
      );

      const parsed = JSON.parse(stdout) as unknown;
      const text = extractText(parsed);
      return parseAgentText(task.agent, text);
    } catch (error) {
      lastError = error;
      if (attempt === retries) break;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('live agent execution failed');
}

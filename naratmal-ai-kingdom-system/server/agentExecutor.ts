import { agentRunners } from './agents.js';
import { runLiveAgentTask } from './liveAgentRunner.js';
import type { AgentResult, AgentTask, UserRequest } from './types.js';

function getMode() {
  return process.env.KINGDOM_AGENT_MODE === 'live' ? 'live' : 'mock';
}

export async function executeAgentTasks(tasks: AgentTask[], request: UserRequest): Promise<{ mode: 'mock' | 'live'; results: AgentResult[] }> {
  const mode = getMode();
  const uniqueTasks = tasks.filter((task, index, array) => array.findIndex((item) => item.agent === task.agent) === index);

  if (mode === 'live') {
    const results: AgentResult[] = [];
    for (const task of uniqueTasks) {
      if (task.agent === 'chief_agent') continue;
      try {
        results.push(await runLiveAgentTask(task, request));
      } catch (error) {
        const fallback = agentRunners[task.agent as Exclude<typeof task.agent, 'chief_agent'>](request);
        fallback.summary = `${fallback.summary} (live 호출 실패로 mock 대체)`;
        fallback.output.unshift(error instanceof Error ? `live error: ${error.message}` : 'live error');
        results.push(fallback);
      }
    }
    return { mode, results };
  }

  return {
    mode,
    results: uniqueTasks.filter((task) => task.agent !== 'chief_agent').map((task) => agentRunners[task.agent as Exclude<typeof task.agent, 'chief_agent'>](request)),
  };
}

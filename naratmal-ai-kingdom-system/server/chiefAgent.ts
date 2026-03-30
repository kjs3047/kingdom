import { agentLabels, agentRunners } from './agents';
import { routeRequest } from './router';
import type { FinalResponse, UserRequest } from './types';

export function runChiefAgent(request: UserRequest): FinalResponse {
  const routing = routeRequest(request);
  const uniqueAgents = Array.from(new Set(routing.tasks.map((task) => task.agent))).filter(
    (agent) => agent !== 'chief_agent',
  ) as Array<keyof typeof agentRunners>;

  const results = uniqueAgents.map((agent) => agentRunners[agent](request));

  return {
    briefing: `영의정 브리핑: 요청을 ${routing.category} 범주로 분류하고, 주관 기관을 ${agentLabels[routing.leadAgent]}으로 지정했습니다.`,
    routing,
    results,
    finalMessage: `폐하의 요청은 ${agentLabels[routing.leadAgent]}이(가) 주관하며, 영의정이 결과를 취합해 아뢰는 구조로 처리했습니다.`,
    timestamp: new Date().toISOString(),
  };
}

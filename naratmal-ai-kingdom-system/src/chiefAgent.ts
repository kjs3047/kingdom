import { agentLabels, agentRunners } from './agents';
import { routeRequest } from './router';
import type { FinalResponse, UserRequest } from './types';

export function runChiefAgent(request: UserRequest): FinalResponse {
  const routing = routeRequest(request);

  const uniqueAgents = Array.from(new Set(routing.tasks.map((task) => task.agent))).filter(
    (agent) => agent !== 'chief_agent',
  ) as Array<keyof typeof agentRunners>;

  const results = uniqueAgents.map((agent) => agentRunners[agent](request));

  const finalMessage = [
    `왕의 요청은 ${agentLabels[routing.leadAgent]}이(가) 주관하도록 배치했다.`,
    routing.reviewRequired ? '사헌부 검수 대상이므로 출고 전 검수를 포함했다.' : '현재는 내부 초안 단계로 즉시 실행 가능한 상태다.',
    '영의정은 기관 결과를 통합해 단일 응답으로 보고한다.',
  ].join(' ');

  return {
    briefing: `영의정 브리핑: 요청을 ${routing.category} 범주로 분류하고, 주관 기관을 ${agentLabels[routing.leadAgent]}으로 지정했다.`,
    routing,
    results,
    finalMessage,
  };
}

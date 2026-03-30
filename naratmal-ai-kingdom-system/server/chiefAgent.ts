import { agentLabels, agentRunners, makeReviewDecision } from './agents';
import { routeRequest } from './router';
import type { FinalResponse, UserRequest } from './types';

function composeFinalMessage(request: UserRequest, leadLabel: string, reviewMessage: string) {
  const base = `영의정 판단: 이번 요청은 ${leadLabel}이(가) 주관하고, 필요한 기관 결과를 취합해 하나의 답으로 정리했습니다.`;

  if (request.externalDelivery || request.sensitive) {
    return `${base} 또한 이 결과는 사헌부 검수 대상이므로, 검수 의견 반영 전에는 외부 제출본으로 간주하지 않습니다. ${reviewMessage}`;
  }

  return `${base} 현재 결과는 내부 검토 및 다음 작업 지시용 초안으로 바로 활용할 수 있습니다. ${reviewMessage}`;
}

export function runChiefAgent(request: UserRequest): FinalResponse {
  const routing = routeRequest(request);
  const uniqueAgents = Array.from(new Set(routing.tasks.map((task) => task.agent))).filter(
    (agent) => agent !== 'chief_agent',
  ) as Array<keyof typeof agentRunners>;

  const results = uniqueAgents.map((agent) => agentRunners[agent](request));
  const review = makeReviewDecision(request);
  const deliveryAllowed = review.status === 'not_required' || review.status === 'approved';

  return {
    briefing: `영의정 브리핑: 요청을 ${routing.category} 범주로 분류하고, 주관 기관을 ${agentLabels[routing.leadAgent]}으로 지정했습니다.`,
    routing,
    results,
    review,
    deliveryAllowed,
    finalMessage: composeFinalMessage(request, agentLabels[routing.leadAgent], review.reason),
    timestamp: new Date().toISOString(),
  };
}

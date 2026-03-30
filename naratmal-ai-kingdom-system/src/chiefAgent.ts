import { agentLabels, agentRunners, makeReviewDecision } from './agents';
import { routeRequest } from './router';
import type { FinalResponse, UserRequest } from './types';

function buildWorkflowState(status: ReturnType<typeof makeReviewDecision>['status']) {
  switch (status) {
    case 'approved':
      return { phase: 'approved', nextAction: '출고 또는 최종 전달 가능' } as const;
    case 'blocked':
      return { phase: 'blocked', nextAction: '출고 중단 후 문제 원인 수정 필요' } as const;
    case 'revision_requested':
      return { phase: 'review_required', nextAction: '사헌부 권고 반영 후 재검수 필요' } as const;
    case 'not_required':
    default:
      return { phase: 'draft', nextAction: '내부 검토 또는 다음 작업으로 진행 가능' } as const;
  }
}

export function runChiefAgent(request: UserRequest): FinalResponse {
  const routing = routeRequest(request);

  const uniqueAgents = Array.from(new Set(routing.tasks.map((task) => task.agent))).filter(
    (agent) => agent !== 'chief_agent',
  ) as Array<keyof typeof agentRunners>;

  const results = uniqueAgents.map((agent) => agentRunners[agent](request));
  const review = makeReviewDecision(request);
  const workflow = buildWorkflowState(review.status);
  const leadLabel = agentLabels[routing.leadAgent];
  const revisionSummary =
    review.status === 'revision_requested'
      ? [
          `주관 기관: ${leadLabel}`,
          `검수 상태: ${review.status}`,
          `즉시 조치: ${workflow.nextAction}`,
          ...(review.actionItems?.slice(0, 2).map((item) => `보완: ${item.title}`) ?? []),
        ].join(' | ')
      : undefined;

  const finalMessage = [
    `영의정 판단: 이번 요청은 ${leadLabel}이(가) 주관한다.`,
    routing.reviewRequired
      ? `사헌부 검수 대상이며 다음 조치는 "${workflow.nextAction}"이다.`
      : '현재는 내부 초안 단계로 즉시 실행 가능한 상태다.',
    revisionSummary ? `보완 요약: ${revisionSummary}.` : undefined,
    '영의정은 기관 결과를 통합해 단일 응답으로 보고한다.',
  ]
    .filter(Boolean)
    .join(' ');

  return {
    briefing: `영의정 브리핑: 요청을 ${routing.category} 범주로 분류하고, 주관 기관을 ${leadLabel}으로 지정했다.`,
    routing,
    results,
    review,
    workflow,
    revisionSummary,
    finalMessage,
  };
}

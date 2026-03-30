import { agentLabels, agentRunners, makeReviewDecision } from './agents.js';
import { routeRequest } from './router.js';
import type { FinalResponse, RespondOptions, ReviewDecision, UserRequest, WorkflowState } from './types.js';

function applyReviewOverride(base: ReviewDecision, options?: RespondOptions): ReviewDecision {
  if (!options?.reviewOverrideStatus) return base;

  return {
    ...base,
    status: options.reviewOverrideStatus,
    reason: options.reviewOverrideReason ?? base.reason,
  };
}

function buildWorkflowState(review: ReviewDecision): WorkflowState {
  switch (review.status) {
    case 'approved':
      return {
        phase: 'approved',
        nextAction: '출고 또는 최종 전달 가능',
      };
    case 'blocked':
      return {
        phase: 'blocked',
        nextAction: '출고 중단 후 문제 원인 수정 필요',
      };
    case 'revision_requested':
      return {
        phase: 'review_required',
        nextAction: '사헌부 권고 반영 후 재검수 필요',
      };
    case 'not_required':
    default:
      return {
        phase: 'draft',
        nextAction: '내부 검토 또는 다음 작업으로 진행 가능',
      };
  }
}

function composeFinalMessage(request: UserRequest, leadLabel: string, review: ReviewDecision, workflow: WorkflowState) {
  const base = `영의정 판단: 이번 요청은 ${leadLabel}이(가) 주관하고, 필요한 기관 결과를 취합해 하나의 답으로 정리했습니다.`;

  if (request.externalDelivery || request.sensitive) {
    return `${base} 또한 이 결과는 사헌부 검수 대상입니다. 현재 검수 상태는 ${review.status}이며, 다음 조치는 "${workflow.nextAction}"입니다. ${review.reason}`;
  }

  return `${base} 현재 워크플로 단계는 ${workflow.phase}이며, 다음 조치는 "${workflow.nextAction}"입니다. ${review.reason}`;
}

export function runChiefAgent(request: UserRequest, options?: RespondOptions): FinalResponse {
  const routing = routeRequest(request);
  const uniqueAgents = Array.from(new Set(routing.tasks.map((task) => task.agent))).filter(
    (agent) => agent !== 'chief_agent',
  ) as Array<keyof typeof agentRunners>;

  const results = uniqueAgents.map((agent) => agentRunners[agent](request));
  const review = applyReviewOverride(makeReviewDecision(request), options);
  const workflow = buildWorkflowState(review);
  const deliveryAllowed = review.status === 'not_required' || review.status === 'approved';

  return {
    briefing: `영의정 브리핑: 요청을 ${routing.category} 범주로 분류하고, 주관 기관을 ${agentLabels[routing.leadAgent]}으로 지정했습니다.`,
    routing,
    results,
    review,
    workflow,
    deliveryAllowed,
    finalMessage: composeFinalMessage(request, agentLabels[routing.leadAgent], review, workflow),
    timestamp: new Date().toISOString(),
  };
}

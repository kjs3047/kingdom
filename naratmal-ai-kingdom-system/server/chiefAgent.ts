import { agentLabels, makeReviewDecision } from './agents.js';
import { executeAgentTasks } from './agentExecutor.js';
import { routeRequest } from './router.js';
import type { FinalResponse, RespondOptions, ReviewDecision, UserRequest, WorkflowState } from './types.js';

function applyReviewOverride(base: ReviewDecision, options?: RespondOptions): ReviewDecision {
  if (!options?.reviewOverrideStatus) return base;

  return {
    ...base,
    status: options.reviewOverrideStatus,
    reason: options.reviewOverrideReason ?? base.reason,
    actionItems: options.reviewActionItems ?? base.actionItems,
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

function buildRevisionSummary(review: ReviewDecision, workflow: WorkflowState, leadLabel: string, request: UserRequest) {
  if (review.status !== 'revision_requested') return undefined;

  const deliveryTarget = request.externalDelivery || request.sensitive ? '출고 보류' : '내부 수정 진행';
  const topActions = review.actionItems?.slice(0, 2).map((item) => item.title).join(', ');

  return [
    `주관 기관: ${leadLabel}`,
    `검수 상태: ${review.status}`,
    `처리 기준: ${deliveryTarget}`,
    `즉시 조치: ${workflow.nextAction}`,
    topActions ? `핵심 보완: ${topActions}` : undefined,
    `검수 의견: ${review.reason}`,
  ]
    .filter(Boolean)
    .join(' | ');
}

function composeFinalMessage(request: UserRequest, leadLabel: string, review: ReviewDecision, workflow: WorkflowState, revisionSummary?: string) {
  const base = `영의정 판단: 이번 요청은 ${leadLabel}이(가) 주관하고, 필요한 기관 결과를 취합해 하나의 답으로 정리했습니다.`;

  if (request.externalDelivery || request.sensitive) {
    const revisionLine = revisionSummary ? ` 보완 요약: ${revisionSummary}.` : '';
    return `${base} 또한 이 결과는 사헌부 검수 대상입니다. 현재 검수 상태는 ${review.status}이며, 다음 조치는 "${workflow.nextAction}"입니다.${revisionLine} ${review.reason}`;
  }

  return `${base} 현재 워크플로 단계는 ${workflow.phase}이며, 다음 조치는 "${workflow.nextAction}"입니다. ${review.reason}`;
}

export async function runChiefAgent(request: UserRequest, options?: RespondOptions): Promise<FinalResponse> {
  const routing = routeRequest(request);
  const executed = await executeAgentTasks(routing.tasks, request);
  const review = applyReviewOverride(makeReviewDecision(request), options);
  const workflow = buildWorkflowState(review);
  const deliveryAllowed = review.status === 'not_required' || review.status === 'approved';
  const leadLabel = agentLabels[routing.leadAgent];
  const revisionSummary = buildRevisionSummary(review, workflow, leadLabel, request);

  return {
    briefing: `영의정 브리핑: 요청을 ${routing.category} 범주로 분류하고, 주관 기관을 ${leadLabel}으로 지정했습니다.`,
    routing,
    execution: {
      mode: executed.mode,
      strategy: 'sequential',
    },
    results: executed.results,
    review,
    workflow,
    revisionSummary,
    deliveryAllowed,
    finalMessage: composeFinalMessage(request, leadLabel, review, workflow, revisionSummary),
    timestamp: new Date().toISOString(),
  };
}

import type { AgentCode, AgentResult, ReviewDecision, UserRequest } from './types';

function buildResult(agent: AgentCode, summary: string, output: string[]): AgentResult {
  return { agent, summary, output };
}

export const agentLabels: Record<AgentCode, string> = {
  chief_agent: '영의정',
  ops_secretariat: '승정원',
  strategy_planner: '집현전',
  design_studio: '도화서',
  product_engineering: '병조',
  content_marketing: '예조',
  audit_guard: '사헌부',
};

export const agentRunners: Record<Exclude<AgentCode, 'chief_agent'>, (request: UserRequest) => AgentResult> = {
  ops_secretariat: (request) =>
    buildResult('ops_secretariat', '요청을 실행 가능한 브리프로 정리했습니다.', [
      `요청 요약: ${request.message}`,
      '목표·제약·산출물을 구조화했습니다.',
      '영의정이 바로 기관 지시를 내릴 수 있는 수준으로 정리했습니다.',
    ]),
  strategy_planner: (request) =>
    buildResult('strategy_planner', '기획 방향과 구조를 정리했습니다.', [
      'Why / What / How 구조를 제안했습니다.',
      '도입 순서와 우선순위를 정리했습니다.',
      `전략 기준 요청: ${request.message}`,
    ]),
  design_studio: (request) =>
    buildResult('design_studio', '시각 구조와 UX 흐름을 정리했습니다.', [
      '화면/장표 구조 초안을 제안했습니다.',
      '정보 강조 포인트와 표현 순서를 정리했습니다.',
      `디자인 기준 요청: ${request.message}`,
    ]),
  product_engineering: (request) =>
    buildResult('product_engineering', '구현 가능한 기술 구조를 정리했습니다.', [
      '모듈 구조와 책임 분리를 제안했습니다.',
      '구현 우선순위와 기술 리스크를 정리했습니다.',
      `구현 기준 요청: ${request.message}`,
    ]),
  content_marketing: (request) =>
    buildResult('content_marketing', '대외 전달용 문안 방향을 정리했습니다.', [
      '독자 기준 메시지 구조를 재정리했습니다.',
      '대외 문안 톤과 표현 부담을 점검했습니다.',
      `문안 기준 요청: ${request.message}`,
    ]),
  audit_guard: (request) =>
    buildResult('audit_guard', '검수 의견을 반환했습니다.', [
      request.externalDelivery || request.sensitive
        ? '외부 제출물/민감 결과물로 간주되어 검수 절차를 적용했습니다.'
        : '내부 초안 단계이므로 기본 검수만 수행했습니다.',
      '민감도·평판·정책 리스크를 점검했습니다.',
    ]),
};

export function makeReviewDecision(request: UserRequest): ReviewDecision {
  if (request.sensitive) {
    return {
      status: 'revision_requested',
      reason: '민감 요청이므로 사람 검토 및 수정 보완 후 출고해야 합니다.',
      requiredForExternalDelivery: true,
    };
  }

  if (request.externalDelivery) {
    return {
      status: 'revision_requested',
      reason: '외부 제출물은 사헌부 검수 완료 후에만 출고할 수 있습니다.',
      requiredForExternalDelivery: true,
    };
  }

  return {
    status: 'not_required',
    reason: '내부 초안 단계로 검수 강제가 필요하지 않습니다.',
    requiredForExternalDelivery: false,
  };
}

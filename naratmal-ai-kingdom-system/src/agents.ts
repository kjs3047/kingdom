import type { AgentCode, AgentResult, UserRequest } from './types';

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
    buildResult('ops_secretariat', '요청을 실행 가능한 브리프로 정리했다.', [
      `요청 요약: ${request.message}`,
      '목표/제약/산출물을 분리했다.',
      '후속 기관 호출 순서를 제안했다.',
    ]),
  strategy_planner: (request) =>
    buildResult('strategy_planner', '문제를 구조화하고 기획 방향을 제시했다.', [
      'Why / What / How 구조를 정의했다.',
      'MVP 우선순위와 단계별 확장안을 정리했다.',
      `기획 기준 요청: ${request.message}`,
    ]),
  design_studio: (request) =>
    buildResult('design_studio', '시각 구조와 UX 관점을 정리했다.', [
      '화면 또는 장표 구조를 텍스트 와이어 기준으로 제안했다.',
      '정보 전달 순서와 강조 포인트를 정리했다.',
      `디자인 입력 기준: ${request.message}`,
    ]),
  product_engineering: (request) =>
    buildResult('product_engineering', '구현 가능한 기술 구조를 제안했다.', [
      '모듈 구조와 책임 분리를 정리했다.',
      '구현 우선순위와 기술 리스크를 정리했다.',
      `기술 구현 기준 요청: ${request.message}`,
    ]),
  content_marketing: (request) =>
    buildResult('content_marketing', '전달 중심 문안과 메시지 구조를 정리했다.', [
      '독자 기준 메시지 흐름을 재작성했다.',
      '외부 제출용 문안 톤을 점검했다.',
      `메시지 원문 기준: ${request.message}`,
    ]),
  audit_guard: (request) =>
    buildResult('audit_guard', '출고 전 검수 의견을 반환했다.', [
      request.externalDelivery || request.sensitive
        ? '사헌부 검수: 승인 전 수정 권고 사항을 함께 제시한다.'
        : '사헌부 검수: 내부 초안 수준으로 통과 가능.',
      '민감도/평판/정책 리스크 확인',
    ]),
};

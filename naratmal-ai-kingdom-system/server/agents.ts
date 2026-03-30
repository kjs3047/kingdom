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
    buildResult('ops_secretariat', '요청을 실행 가능한 브리프로 정리했습니다.', [
      `요청 요약: ${request.message}`,
      '목표·제약·산출물을 구조화했습니다.',
      '기관 호출 순서를 정리했습니다.',
    ]),
  strategy_planner: (request) =>
    buildResult('strategy_planner', '기획 방향과 구조를 정리했습니다.', [
      'Why / What / How 구조 정의',
      'MVP 우선순위와 확장 로드맵 정리',
      `기획 기준: ${request.message}`,
    ]),
  design_studio: (request) =>
    buildResult('design_studio', '시각 구조와 UX 흐름을 정리했습니다.', [
      '화면/장표 구조 제안',
      '강조 포인트와 정보 흐름 정리',
      `디자인 기준: ${request.message}`,
    ]),
  product_engineering: (request) =>
    buildResult('product_engineering', '구현 가능한 기술 구조를 정리했습니다.', [
      '모듈 구조와 책임 분리',
      '구현 우선순위 및 기술 리스크 정리',
      `기술 기준: ${request.message}`,
    ]),
  content_marketing: (request) =>
    buildResult('content_marketing', '전달 중심 문안 방향을 정리했습니다.', [
      '독자 기준 메시지 구조 재정리',
      '대외 문안 톤 검토',
      `콘텐츠 기준: ${request.message}`,
    ]),
  audit_guard: (request) =>
    buildResult('audit_guard', '검수 결과를 반환했습니다.', [
      request.externalDelivery || request.sensitive
        ? '외부 제출물/민감 결과물이므로 수정 권고 후 출고 권장'
        : '내부 초안 단계로 즉시 활용 가능',
      '민감도·평판·정책 리스크 확인 완료',
    ]),
};

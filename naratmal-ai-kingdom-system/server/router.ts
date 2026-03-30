import type { AgentCode, RequestCategory, RoutingDecision, UserRequest } from './types';

function categorizeRequest(message: string, sensitive?: boolean): RequestCategory {
  if (sensitive) return 'sensitive';
  if (/(개발|코드|api|자동화|구현|bot|챗봇|서버|백엔드|프론트엔드)/i.test(message)) return 'engineering';
  if (/(ppt|디자인|ui|ux|화면|슬라이드|브랜드|시각|와이어)/i.test(message)) return 'design';
  if (/(기획|전략|로드맵|mvp|구조|설계|아키텍처)/i.test(message)) return 'planning';
  if (/(보고서|문안|카피|소개문|발표|콘텐츠|홍보|제안서|보도자료)/i.test(message)) return 'content';
  return 'operations';
}

function decideLead(category: RequestCategory): { leadAgent: AgentCode; supportAgents: AgentCode[] } {
  switch (category) {
    case 'engineering':
      return { leadAgent: 'product_engineering', supportAgents: ['ops_secretariat'] };
    case 'design':
      return { leadAgent: 'design_studio', supportAgents: ['content_marketing', 'strategy_planner'] };
    case 'planning':
      return { leadAgent: 'strategy_planner', supportAgents: ['ops_secretariat'] };
    case 'content':
      return { leadAgent: 'content_marketing', supportAgents: ['ops_secretariat'] };
    case 'sensitive':
      return { leadAgent: 'audit_guard', supportAgents: ['ops_secretariat'] };
    case 'operations':
    default:
      return { leadAgent: 'ops_secretariat', supportAgents: ['strategy_planner'] };
  }
}

export function routeRequest(request: UserRequest): RoutingDecision {
  const category = categorizeRequest(request.message, request.sensitive);
  const { leadAgent, supportAgents } = decideLead(category);
  const reviewRequired = Boolean(request.externalDelivery || request.sensitive || category === 'content');

  const taskSet: AgentTask[] = [
    {
      agent: 'ops_secretariat',
      reason: '요청 브리프 정리',
      inputSummary: request.message,
    },
    {
      agent: leadAgent,
      reason: '주관 기관 실무 처리',
      inputSummary: request.message,
    },
  ];

  for (const agent of supportAgents) {
    if (!taskSet.some((task) => task.agent === agent)) {
      taskSet.push({
        agent,
        reason: '보조 기관 지원',
        inputSummary: request.message,
      });
    }
  }

  if (reviewRequired && !taskSet.some((task) => task.agent === 'audit_guard')) {
    taskSet.push({
      agent: 'audit_guard',
      reason: '사헌부 출고 전 검수',
      inputSummary: request.message,
    });
  }

  return {
    category,
    leadAgent,
    supportAgents,
    reviewRequired,
    tasks: taskSet,
  };
}

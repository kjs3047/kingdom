export type AgentCode =
  | 'chief_agent'
  | 'ops_secretariat'
  | 'strategy_planner'
  | 'design_studio'
  | 'product_engineering'
  | 'content_marketing'
  | 'audit_guard';

export type RequestCategory =
  | 'planning'
  | 'design'
  | 'engineering'
  | 'content'
  | 'operations'
  | 'sensitive';

export interface AgentDefinition {
  koreanName: string;
  englishCode: AgentCode;
  role: string;
  responsibility: string;
  inputs: string[];
  outputs: string[];
  trigger: string;
  reviewRequired?: boolean;
}

export interface RouteScenario {
  id: string;
  title: string;
  userRequest: string;
  category: RequestCategory;
  lead: AgentCode;
  support: AgentCode[];
  reviewRequired: boolean;
  rationale: string[];
}

export interface PromptTemplate {
  title: string;
  agent: AgentCode;
  content: string;
}

export const architectureLayers = [
  {
    title: '왕 (User / King)',
    description: '최종 의사결정자. 텔레그램 단일 창구로만 영의정과 대화한다.',
  },
  {
    title: '영의정 (chief_agent)',
    description:
      '모든 요청의 단일 진입점. 의도 파악, 기관 지정, 결과 통합, 최종 보고를 담당한다.',
  },
  {
    title: '승정원 (ops_secretariat)',
    description:
      '요청 접수, 브리프 정리, 작업 분해, 상태 기록, 워크플로 오케스트레이션을 맡는다.',
  },
  {
    title: '전문화 기관들',
    description:
      '집현전·도화서·병조·예조가 실무 산출물을 만들고, 사헌부가 검수와 출고 판단을 맡는다.',
  },
];

export const agents: AgentDefinition[] = [
  {
    koreanName: '영의정',
    englishCode: 'chief_agent',
    role: 'Chief Agent / Orchestrator',
    responsibility: '왕의 요청 해석, 기관 선택, 최종 응답 통합',
    inputs: ['사용자 메시지', '첨부파일', '세션 맥락', '기관 결과물'],
    outputs: ['최종 답변', '실행 계획', '기관 호출 지시'],
    trigger: '모든 요청의 1차 진입점',
  },
  {
    koreanName: '승정원',
    englishCode: 'ops_secretariat',
    role: 'Operations Secretariat',
    responsibility: '요청 정리, 작업 분해, 상태 기록, 워크플로 관리',
    inputs: ['원문 요청', '제약조건', '세션 상태'],
    outputs: ['정제된 브리프', '작업 순서', '진행 로그'],
    trigger: '복합 요청, 기록 필요, 실행 흐름 분해 필요 시',
  },
  {
    koreanName: '집현전',
    englishCode: 'strategy_planner',
    role: 'Strategy Planner',
    responsibility: '문제 구조화, 기획안 작성, 우선순위 및 로드맵 수립',
    inputs: ['아이디어', '목표', '비즈니스/업무 맥락'],
    outputs: ['기획안', '전략 문서', '로드맵', '우선순위 표'],
    trigger: '기획·설계·구조화가 필요한 요청',
  },
  {
    koreanName: '도화서',
    englishCode: 'design_studio',
    role: 'Design Studio',
    responsibility: 'UI/UX 구조화, 시각 설계, 발표자료 구조 설계',
    inputs: ['텍스트 요구사항', '브랜드 톤', '화면/자료 목적'],
    outputs: ['와이어 설명', '디자인 가이드', '장표 구조', '시각 콘셉트'],
    trigger: '시각화·디자인·PPT 구조가 필요한 요청',
  },
  {
    koreanName: '병조',
    englishCode: 'product_engineering',
    role: 'Product Engineering',
    responsibility: '코드 작성, 자동화 구현, 기술 설계, 디버깅',
    inputs: ['기술 요구사항', '기존 코드', 'API 제약'],
    outputs: ['코드', '기술 설계서', '자동화 흐름', '구현 체크리스트'],
    trigger: '개발·자동화·시스템 구축 요청',
  },
  {
    koreanName: '예조',
    englishCode: 'content_marketing',
    role: 'Content & Messaging',
    responsibility: '보고서, 문안, 발표 메시지, 대외 커뮤니케이션 작성',
    inputs: ['초안', '사실관계', '대상 독자', '톤앤매너'],
    outputs: ['보고서 문안', '발표 스크립트', '카피', '설명문'],
    trigger: '대외 전달용 글, 발표, 보고, 설명 자료가 필요할 때',
    reviewRequired: true,
  },
  {
    koreanName: '사헌부',
    englishCode: 'audit_guard',
    role: 'Audit & Guard',
    responsibility: '품질 검수, 민감도 심사, 정책/평판 리스크 점검',
    inputs: ['초안 결과물', '검수 기준', '민감 정보 여부'],
    outputs: ['승인/수정요청/보류/반려', '검수 리포트'],
    trigger: '외부 제출물, 민감 결과물, 정책 리스크가 있는 경우',
    reviewRequired: true,
  },
];

export const routeScenarios: RouteScenario[] = [
  {
    id: 'product-mvp',
    title: '서비스 기획 + MVP 정의',
    userRequest: '신규 AI 서비스 구조를 설계하고 MVP 범위를 정의해줘.',
    category: 'planning',
    lead: 'strategy_planner',
    support: ['ops_secretariat', 'content_marketing'],
    reviewRequired: true,
    rationale: [
      '집현전이 문제 구조와 우선순위를 설계한다.',
      '승정원이 요청을 작업 단위로 분해한다.',
      '외부 공유 가능한 문서라면 사헌부 검수가 필요하다.',
    ],
  },
  {
    id: 'ppt-story',
    title: 'PPT 구조화',
    userRequest: '이 보고서를 발표용 10장짜리 PPT 흐름으로 바꿔줘.',
    category: 'design',
    lead: 'design_studio',
    support: ['content_marketing', 'strategy_planner'],
    reviewRequired: true,
    rationale: [
      '도화서가 장표 구조와 시각 흐름을 주도한다.',
      '예조가 발표 문장과 메시지 밀도를 조정한다.',
      '대외 발표자료는 사헌부 검수 대상이다.',
    ],
  },
  {
    id: 'telegram-bot',
    title: '텔레그램 봇 구현',
    userRequest: '텔레그램 챗봇 코드와 기본 자동응답 구조를 만들어줘.',
    category: 'engineering',
    lead: 'product_engineering',
    support: ['ops_secretariat'],
    reviewRequired: false,
    rationale: [
      '병조가 구현과 기술 설계를 담당한다.',
      '승정원이 작업 단계와 상태를 기록한다.',
      '내부 개발 산출물 단계에서는 사헌부 검수가 선택적이다.',
    ],
  },
  {
    id: 'campaign-copy',
    title: '브랜드 메시지 작성',
    userRequest: '제품 소개문과 런칭 공지 문안을 써줘.',
    category: 'content',
    lead: 'content_marketing',
    support: ['design_studio'],
    reviewRequired: true,
    rationale: [
      '예조가 독자 대상 메시지를 설계한다.',
      '도화서가 표현 방향과 시각 톤을 보조한다.',
      '대외 공개 문안이므로 사헌부 검수가 필수다.',
    ],
  },
];

export const routingRules = [
  '모든 요청은 영의정이 먼저 의도와 산출물 유형을 판별한다.',
  '주관 기관은 원칙적으로 1개만 지정하고, 보조 기관은 필요 시에만 붙인다.',
  '복합 요청은 먼저 승정원이 작업 단위로 분해한다.',
  '외부 제출물·민감 결과물·정책 리스크가 있으면 사헌부 검수를 강제한다.',
  '최종 사용자 응답은 영의정 명의의 단일 메시지로 통합한다.',
];

export const promptTemplates: PromptTemplate[] = [
  {
    title: '영의정 시스템 프롬프트',
    agent: 'chief_agent',
    content: `너는 나랏말 AI 왕국의 영의정(chief_agent)이다.\n왕과 직접 대화하는 유일한 창구이며, 모든 요청의 1차 진입점이다.\n핵심 책임: 요청 해석, 주관 기관 지정, 보조 기관 호출, 결과 통합, 최종 보고.\n운영 규칙: 단일 창구 UX 유지, 외부 제출물은 사헌부 검수 필수, 답변은 실행 가능해야 한다.`,
  },
  {
    title: '승정원 시스템 프롬프트',
    agent: 'ops_secretariat',
    content: `너는 승정원(ops_secretariat)이다.\n왕의 요청을 실행 가능한 작업 단위로 분해하고, 입력·산출물·제약·우선순위를 정리한다.\n최종 결론보다 작업 흐름과 상태 관리에 집중한다.`,
  },
  {
    title: '집현전 시스템 프롬프트',
    agent: 'strategy_planner',
    content: `너는 집현전(strategy_planner)이다.\n문제를 구조화하고, 기획안·전략안·로드맵을 만든다.\n모호한 아이디어를 운영 가능한 설계로 바꾼다.`,
  },
  {
    title: '도화서 시스템 프롬프트',
    agent: 'design_studio',
    content: `너는 도화서(design_studio)이다.\n정보를 시각적으로 구조화하고 UI/UX, 시각자료, 장표 흐름을 설계한다.\n이해하기 쉬운 구조를 최우선으로 한다.`,
  },
  {
    title: '병조 시스템 프롬프트',
    agent: 'product_engineering',
    content: `너는 병조(product_engineering)이다.\n기술 요구사항을 코드와 실행 가능한 구현 계획으로 바꾼다.\n추상적 설명보다 동작 가능한 구조를 우선한다.`,
  },
  {
    title: '예조 시스템 프롬프트',
    agent: 'content_marketing',
    content: `너는 예조(content_marketing)이다.\n보고서, 발표, 대외 문안 등 전달 중심 결과물을 작성한다.\n독자와 맥락에 맞는 표현을 설계한다.`,
  },
  {
    title: '사헌부 시스템 프롬프트',
    agent: 'audit_guard',
    content: `너는 사헌부(audit_guard)이다.\n품질, 민감도, 정책/평판 리스크를 검수하고 승인·수정요청·보류·반려를 판정한다.\n위험이 있으면 애매하게 넘기지 않는다.`,
  },
];

export const implementationSteps = [
  '1단계: chief_agent 중심 단일 창구 MVP 구축',
  '2단계: ops_secretariat / strategy_planner / design_studio / product_engineering / content_marketing / audit_guard 분리',
  '3단계: review_required 플래그와 audit_guard 검수 워크플로 도입',
  '4단계: 작업 로그, 세션 메모리, 기관 호출 히스토리 저장',
  '5단계: 독립 세션/비동기 에이전트로 확장 가능한 구조로 승격',
];

export const extensionPlan = [
  '후속 기관은 hr_governance, finance_planning, compliance_legal, infrastructure_architecture 등으로 확장한다.',
  '기관별 I/O 스키마를 고정하면 독립 프로세스 또는 ACP 세션으로 분리할 수 있다.',
  '장기 작업은 접수 → 계획 → 수행 → 검수 → 출고의 비동기 파이프라인으로 전환한다.',
];

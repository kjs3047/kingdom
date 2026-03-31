import type { KingdomDashboardData } from './types';

export const kingdomDashboard: KingdomDashboardData = {
  meta: {
    title: '나랏말 AI 왕국 대시보드',
    subtitle: '실데이터 우선 상황판입니다. 연결 실패 시에도 선택 기준으로 최소 동작 상태를 유지합니다.',
    activeScenario: '최근 작업 불러오는 중',
    ontologyVersion: 'kingdom.workflow.v1',
    lastUpdated: '실시간 대기',
  },
  overview: {
    mission: '최근 상태를 기준으로 현재 워크플로와 다음 조치를 표시합니다.',
    queueSummary: '로그와 기관 상태를 불러오는 중입니다.',
    metrics: [
      { label: '최근 로그', value: '--', delta: '대기', tone: 'watch' },
      { label: '검수 대기', value: '--', delta: '대기', tone: 'watch' },
      { label: '승인 완료', value: '--', delta: '대기', tone: 'healthy' },
      { label: '차단 건수', value: '--', delta: '대기', tone: 'watch' },
    ],
  },
  workflowGraph: {
    nodes: [
      {
        id: 'user',
        label: '명령 대기',
        kind: 'command',
        state: 'waiting',
        lane: '명령 유입',
        owner: 'Telegram',
        detail: '실데이터를 불러오면 최신 명령 기준으로 갱신됩니다.',
        x: 6,
        y: 18,
        duration: '대기',
      },
      {
        id: 'chief',
        label: '영의정',
        kind: 'analysis',
        state: 'idle',
        lane: '조정',
        owner: 'main',
        detail: '선택 명령 기준으로 기관 배분이 표시됩니다.',
        x: 30,
        y: 18,
        duration: '대기',
      },
      {
        id: 'report',
        label: '폐하 보고',
        kind: 'delivery',
        state: 'idle',
        lane: '출고',
        owner: '영의정',
        detail: '현재 결과 없음',
        x: 54,
        y: 18,
        duration: '대기',
      },
    ],
    edges: [
      { id: 'fallback-e1', from: 'user', to: 'chief', condition: 'default', label: '명 하달' },
      { id: 'fallback-e2', from: 'chief', to: 'report', condition: 'handoff', label: '결과 취합' },
    ],
  },
  agencyRoster: [
    {
      id: 'main',
      name: '영의정',
      responsibility: '실데이터 연결 전 기본 조정 상태',
      availability: 'online',
      loadPercent: 0,
      queueDepth: 0,
      currentTask: '최근 로그 대기',
      updatedAt: '--:--',
    },
  ],
  conversations: [],
  commandFlow: [
    {
      id: 'fallback-command',
      title: '최근 명령 대기 중',
      requester: '폐하',
      status: 'executing',
      currentNodeId: 'chief',
      nextAction: '실데이터 연결 확인',
      assignedAgents: ['영의정'],
      targetOutcome: '최근 로그를 불러오면 자동 교체됩니다.',
    },
  ],
  bottlenecks: [
    {
      id: 'fallback-bottleneck',
      title: '실데이터 연결 필요',
      severity: 'medium',
      affectedArea: '상황판',
      summary: '실데이터를 불러오지 못하면 최소 fallback 상태만 표시됩니다.',
      action: 'control-plane과 로그 응답 상태를 확인하십시오.',
    },
  ],
  runtimeHealth: {
    headline: '실데이터 수신 전 기본 상태입니다.',
    signals: [
      {
        id: 'fallback-runtime',
        label: '상태',
        value: '대기',
        tone: 'watch',
        detail: '실데이터 수신 시 최신 상황으로 교체됩니다.',
      },
    ],
  },
  execution: {
    activeNodeId: 'chief',
    blockedNodeIds: [],
    completedNodeIds: [],
  },
};

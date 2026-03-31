import type { KingdomDashboardData, RuntimeTone, WorkflowGraphNode, WorkflowGraphEdge } from './types';

type ControlPlaneItem = {
  id: string;
  requester?: string;
  sessionKey?: string;
  message: string;
  reviewStatus: string;
  workflowPhase: string;
  nextAction: string;
  createdAt: string;
  reviewRound: number;
};

type ControlPlaneResponse = {
  ok: boolean;
  data: {
    totals: {
      totalLogs: number;
      pendingReview: number;
      approved: number;
      blocked: number;
    };
    recent: ControlPlaneItem[];
  };
};

function toneFromCount(value: number, warnAt = 1): RuntimeTone {
  if (value >= warnAt) return value > warnAt ? 'critical' : 'watch';
  return 'healthy';
}

function buildWorkflowGraph(items: ControlPlaneItem[]): { nodes: WorkflowGraphNode[]; edges: WorkflowGraphEdge[] } {
  const active = items[0];
  if (!active) {
    return {
      nodes: [],
      edges: [],
    };
  }

  const reviewRequired = active.reviewStatus === 'revision_requested';
  const nodes: WorkflowGraphNode[] = [
    {
      id: 'user',
      label: active.requester ?? '폐하',
      kind: 'command',
      state: 'complete',
      lane: 'Ingress',
      owner: 'Telegram',
      detail: active.message,
      x: 6,
      y: 18,
      duration: 'received',
    },
    {
      id: 'chief',
      label: '영의정',
      kind: 'analysis',
      state: reviewRequired ? 'running' : 'complete',
      lane: 'Command',
      owner: 'main',
      detail: active.nextAction,
      x: 30,
      y: 18,
      duration: active.workflowPhase,
    },
    {
      id: 'review',
      label: '사헌부',
      kind: 'review',
      state: reviewRequired ? 'blocked' : 'idle',
      lane: 'Guardrail',
      owner: 'audit_guard',
      detail: reviewRequired ? active.nextAction : '검수 불필요',
      x: 54,
      y: 30,
      duration: reviewRequired ? 'review_required' : 'idle',
    },
    {
      id: 'report',
      label: '폐하 보고',
      kind: 'delivery',
      state: reviewRequired ? 'waiting' : 'complete',
      lane: 'Delivery',
      owner: '영의정',
      detail: active.nextAction,
      x: 78,
      y: 18,
      duration: reviewRequired ? 'on hold' : 'delivered',
    },
  ];

  const edges: WorkflowGraphEdge[] = [
    { id: 'e1', from: 'user', to: 'chief', condition: 'default', label: '명 하달' },
    { id: 'e2', from: 'chief', to: 'report', condition: 'handoff', label: '보고 준비' },
  ];

  if (reviewRequired) {
    edges.push({ id: 'e3', from: 'chief', to: 'review', condition: 'guardrail', label: '검수 요청' });
    edges.push({ id: 'e4', from: 'review', to: 'report', condition: 'feedback', label: '승인/보류' });
  }

  return { nodes, edges };
}

export function mapControlPlaneToDashboard(data: ControlPlaneResponse, base: KingdomDashboardData): KingdomDashboardData {
  const recent = data.data.recent;
  const graph = buildWorkflowGraph(recent);
  const active = recent[0];

  return {
    ...base,
    meta: {
      ...base.meta,
      lastUpdated: new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
      activeScenario: active?.message ?? base.meta.activeScenario,
    },
    overview: {
      ...base.overview,
      queueSummary: `${data.data.totals.totalLogs}개 로그, 검수 대기 ${data.data.totals.pendingReview}건, 승인 ${data.data.totals.approved}건`,
      metrics: [
        { label: 'Total Logs', value: String(data.data.totals.totalLogs).padStart(2, '0'), delta: 'control plane', tone: 'healthy' },
        { label: 'Review Pending', value: String(data.data.totals.pendingReview).padStart(2, '0'), delta: 'guardrail', tone: toneFromCount(data.data.totals.pendingReview) },
        { label: 'Approved', value: String(data.data.totals.approved).padStart(2, '0'), delta: 'deliverable', tone: 'healthy' },
        { label: 'Blocked', value: String(data.data.totals.blocked).padStart(2, '0'), delta: 'runtime', tone: toneFromCount(data.data.totals.blocked) },
      ],
    },
    workflowGraph: graph,
    commandFlow: recent.slice(0, 6).map((item) => ({
      id: item.id,
      title: item.message,
      requester: item.requester ?? '폐하',
      status: item.reviewStatus === 'revision_requested' ? 'awaiting_review' : 'completed',
      currentNodeId: item.reviewStatus === 'revision_requested' ? 'review' : 'report',
      nextAction: item.nextAction,
      assignedAgents: item.reviewStatus === 'revision_requested' ? ['영의정', '사헌부'] : ['영의정'],
      targetOutcome: item.workflowPhase,
    })),
    conversations: active
      ? [
          {
            id: `thread-${active.id}`,
            title: active.message,
            participants: ['폐하', '영의정', ...(active.reviewStatus === 'revision_requested' ? ['사헌부'] : [])],
            status: active.reviewStatus === 'revision_requested' ? 'awaiting_review' : 'completed',
            messages: [
              {
                id: `msg-${active.id}-1`,
                role: 'human',
                sender: active.requester ?? '폐하',
                timestamp: active.createdAt,
                summary: active.message,
                nodeId: 'user',
              },
              {
                id: `msg-${active.id}-2`,
                role: 'chief_agent',
                sender: '영의정',
                timestamp: active.createdAt,
                summary: active.nextAction,
                nodeId: 'chief',
              },
            ],
          },
        ]
      : base.conversations,
    bottlenecks:
      data.data.totals.pendingReview > 0
        ? [
            {
              id: 'incident-review',
              title: '검수 대기 업무 존재',
              severity: data.data.totals.pendingReview > 1 ? 'high' : 'medium',
              affectedArea: '사헌부 검수 흐름',
              summary: `현재 검수 대기 ${data.data.totals.pendingReview}건이 남아 있습니다.`,
              action: '검수 대기 건을 우선 확인하고 승인/보류 사유를 점검하십시오.',
            },
          ]
        : base.bottlenecks,
    runtimeHealth: {
      ...base.runtimeHealth,
      headline: '실데이터 control plane 기준으로 대시보드를 구성한 상태입니다.',
      signals: [
        {
          id: 'signal-logs',
          label: 'Control Plane Logs',
          value: String(data.data.totals.totalLogs),
          tone: 'healthy',
          detail: '서버 로그 집계가 대시보드에 반영되었습니다.',
        },
        {
          id: 'signal-review',
          label: 'Pending Review',
          value: String(data.data.totals.pendingReview),
          tone: toneFromCount(data.data.totals.pendingReview),
          detail: '검수 대기 건수 기반 상태입니다.',
        },
      ],
    },
    execution: {
      activeNodeId: active?.reviewStatus === 'revision_requested' ? 'review' : 'chief',
      blockedNodeIds: active?.reviewStatus === 'revision_requested' ? ['review'] : [],
      completedNodeIds: ['user'],
    },
  };
}

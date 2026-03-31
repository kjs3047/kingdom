import type {
  ConversationMessage,
  ConversationThread,
  KingdomDashboardData,
  RuntimeTone,
  WorkflowGraphEdge,
  WorkflowGraphNode,
} from './types';

type ControlPlaneItem = {
  id: string;
  rootLogId?: string;
  parentLogId?: string;
  requester?: string;
  sessionKey?: string;
  message: string;
  reviewStatus: string;
  workflowPhase: string;
  nextAction: string;
  createdAt: string;
  reviewRound: number;
};

type ControlPlaneRosterItem = {
  id: string;
  name: string;
  responsibility: string;
  availability: 'online' | 'degraded' | 'offline';
  loadPercent: number;
  queueDepth: number;
  currentTask: string;
  updatedAt: string;
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
    snapshot?: {
      latestCreatedAt?: string;
      activeLogCount?: number;
      latestMessage?: string;
      latestWorkflowPhase?: string;
      latestNextAction?: string;
    };
    roster?: ControlPlaneRosterItem[];
    recent: ControlPlaneItem[];
  };
};

function toneFromCount(value: number, warnAt = 1): RuntimeTone {
  if (value >= warnAt) return value > warnAt ? 'critical' : 'watch';
  return 'healthy';
}

function mapCommandStatus(reviewStatus: string) {
  if (reviewStatus === 'revision_requested' || reviewStatus === 'blocked') return 'awaiting_review' as const;
  if (reviewStatus === 'approved' || reviewStatus === 'not_required') return 'completed' as const;
  return 'executing' as const;
}

function buildWorkflowGraph(active?: ControlPlaneItem): { nodes: WorkflowGraphNode[]; edges: WorkflowGraphEdge[] } {
  if (!active) {
    return { nodes: [], edges: [] };
  }

  const reviewWaiting = active.reviewStatus === 'revision_requested' || active.reviewStatus === 'blocked';
  const reviewDone = active.reviewStatus === 'approved';

  const nodes: WorkflowGraphNode[] = [
    {
      id: 'user',
      label: active.requester ?? '폐하',
      kind: 'command',
      state: 'complete',
      lane: '명령 유입',
      owner: 'Telegram',
      detail: active.message,
      x: 6,
      y: 18,
      duration: '접수 완료',
    },
    {
      id: 'chief',
      label: '영의정',
      kind: 'analysis',
      state: reviewWaiting ? 'running' : 'complete',
      lane: '조정',
      owner: 'main',
      detail: active.workflowPhase,
      x: 30,
      y: 18,
      duration: active.nextAction,
    },
    {
      id: 'review',
      label: '사헌부 검수',
      kind: 'review',
      state: reviewWaiting ? 'blocked' : reviewDone ? 'complete' : 'idle',
      lane: '검수',
      owner: 'audit_guard',
      detail: reviewWaiting ? active.nextAction : reviewDone ? '검수 승인 완료' : '검수 비대상 또는 대기 없음',
      x: 54,
      y: 30,
      duration: reviewWaiting ? '재검수 필요' : reviewDone ? '승인됨' : '해당 없음',
    },
    {
      id: 'report',
      label: '폐하 보고',
      kind: 'delivery',
      state: reviewWaiting ? 'waiting' : 'complete',
      lane: '출고',
      owner: '영의정',
      detail: active.nextAction,
      x: 78,
      y: 18,
      duration: reviewWaiting ? '보류 중' : '보고 가능',
    },
  ];

  const edges: WorkflowGraphEdge[] = [
    { id: 'e1', from: 'user', to: 'chief', condition: 'default', label: '명 하달' },
    { id: 'e2', from: 'chief', to: 'report', condition: 'handoff', label: reviewWaiting ? '보고 보류' : '보고 정리' },
  ];

  if (reviewWaiting || reviewDone) {
    edges.push({ id: 'e3', from: 'chief', to: 'review', condition: 'guardrail', label: '검수 회부' });
    edges.push({ id: 'e4', from: 'review', to: 'report', condition: 'feedback', label: reviewWaiting ? '보완 요청' : '승인 회신' });
  }

  return { nodes, edges };
}

function buildConversation(selected?: ControlPlaneItem): ConversationThread[] {
  if (!selected) return [];

  const assignedParticipants =
    selected.reviewStatus === 'revision_requested' || selected.reviewStatus === 'blocked' || selected.reviewStatus === 'approved'
      ? ['사헌부']
      : selected.message.includes('기획')
        ? ['집현전']
        : selected.message.includes('구현') || selected.message.includes('버그')
          ? ['병조']
          : selected.message.includes('소개문') || selected.message.includes('외부')
            ? ['예조']
            : ['승정원'];

  const specialistMessages: ConversationMessage[] = assignedParticipants.map((participant, index) => ({
    id: `msg-${selected.id}-specialist-${index}`,
    role: participant === '사헌부' ? 'audit_guard' : 'specialist',
    sender: participant,
    timestamp: selected.createdAt,
    summary: `${participant} 응답 / 현재 단계 ${selected.workflowPhase}`,
    nodeId: participant === '사헌부' ? 'review' : 'lead',
  }));

  const messages: ConversationMessage[] = [
    {
      id: `msg-${selected.id}-request`,
      role: 'human',
      sender: selected.requester ?? '폐하',
      timestamp: selected.createdAt,
      summary: selected.message,
      nodeId: 'user',
    },
    {
      id: `msg-${selected.id}-chief`,
      role: 'chief_agent',
      sender: '영의정',
      timestamp: selected.createdAt,
      summary: `현재 단계: ${selected.workflowPhase} / 다음 조치: ${selected.nextAction}`,
      nodeId: 'chief',
    },
    ...specialistMessages,
  ];

  if (selected.reviewStatus === 'revision_requested' || selected.reviewStatus === 'blocked' || selected.reviewStatus === 'approved') {
    messages.push({
      id: `msg-${selected.id}-review`,
      role: 'audit_guard',
      sender: '사헌부',
      timestamp: selected.createdAt,
      summary:
        selected.reviewStatus === 'approved'
          ? '검수 승인 완료, 출고 가능 상태입니다.'
          : `검수 상태 ${selected.reviewStatus} / ${selected.nextAction}`,
      nodeId: 'review',
    });
  }

  return [
    {
      id: `thread-${selected.id}`,
      title: selected.message,
      participants: ['폐하', '영의정', ...assignedParticipants],
      status: mapCommandStatus(selected.reviewStatus),
      messages,
    },
  ];
}

export function mapControlPlaneToDashboard(
  data: ControlPlaneResponse,
  base: KingdomDashboardData,
  selectedCommandId?: string,
): KingdomDashboardData {
  const recent = data.data.recent;
  const selected = recent.find((item) => item.id === selectedCommandId) ?? recent[0];
  const graph = buildWorkflowGraph(selected);

  const selectedStatus = selected?.reviewStatus ?? 'unknown';
  const selectedTone = selectedStatus === 'approved' || selectedStatus === 'not_required'
    ? 'healthy'
    : selectedStatus === 'revision_requested' || selectedStatus === 'blocked'
      ? 'critical'
      : 'watch';
  const selectedCommand = selected
    ? {
        id: selected.id,
        message: selected.message,
        requester: selected.requester ?? '폐하',
        reviewStatus: selected.reviewStatus,
        nextAction: selected.nextAction,
        reviewHistory: [],
        reviewActionItems: [],
        finalMessage: `${selected.workflowPhase} / ${selected.nextAction}`,
      }
    : undefined;

  const snapshotTime = data.data.snapshot?.latestCreatedAt
    ? new Date(data.data.snapshot.latestCreatedAt).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
    : new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });

  return {
    ...base,
    meta: {
      ...base.meta,
      lastUpdated: snapshotTime,
      activeScenario: selected?.message ?? data.data.snapshot?.latestMessage ?? base.meta.activeScenario,
      subtitle: `최근 상태 기준 상황판 · 최신 작업: ${data.data.snapshot?.latestMessage ?? '정보 없음'}`,
    },
    overview: {
      mission: `현재 최신 워크플로 단계는 ${data.data.snapshot?.latestWorkflowPhase ?? 'unknown'}이며, 다음 조치는 ${data.data.snapshot?.latestNextAction ?? '상태 정보 없음'}입니다.`,
      queueSummary: `최근 활성 로그 ${data.data.snapshot?.activeLogCount ?? recent.length}건 / 검수 대기 ${data.data.totals.pendingReview}건 / 승인 ${data.data.totals.approved}건 / 차단 ${data.data.totals.blocked}건`,
      metrics: [
        { label: '최근 로그', value: String(data.data.totals.totalLogs).padStart(2, '0'), delta: snapshotTime, tone: 'healthy' },
        { label: '검수 대기', value: String(data.data.totals.pendingReview).padStart(2, '0'), delta: '현재 보류', tone: toneFromCount(data.data.totals.pendingReview) },
        { label: '승인 완료', value: String(data.data.totals.approved).padStart(2, '0'), delta: '출고 가능', tone: 'healthy' },
        { label: '차단 건수', value: String(data.data.totals.blocked).padStart(2, '0'), delta: '즉시 확인', tone: toneFromCount(data.data.totals.blocked) },
      ],
    },
    workflowGraph: graph,
    agencyRoster: data.data.roster?.length
      ? data.data.roster.map((item) => ({
          id: item.id,
          name: item.name,
          responsibility: item.responsibility,
          availability: item.availability,
          loadPercent: item.loadPercent,
          queueDepth: item.queueDepth,
          currentTask: item.currentTask,
          updatedAt: new Date(item.updatedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }),
        }))
      : base.agencyRoster,
    commandFlow: recent.slice(0, 6).map((item) => ({
      id: item.id,
      title: item.message,
      requester: item.requester ?? '폐하',
      status: mapCommandStatus(item.reviewStatus),
      currentNodeId:
        item.reviewStatus === 'revision_requested' || item.reviewStatus === 'blocked'
          ? 'review'
          : item.reviewStatus === 'approved' || item.reviewStatus === 'not_required'
            ? 'report'
            : 'chief',
      nextAction: item.nextAction,
      assignedAgents:
        item.reviewStatus === 'revision_requested' || item.reviewStatus === 'blocked' || item.reviewStatus === 'approved'
          ? ['영의정', '사헌부']
          : ['영의정'],
      targetOutcome: item.workflowPhase,
    })),
    selectedCommand,
    conversations: buildConversation(selected),
    bottlenecks:
      data.data.totals.pendingReview > 0
        ? [
            {
              id: 'incident-review',
              title: '검수 대기 업무 존재',
              severity: data.data.totals.pendingReview > 1 ? 'high' : 'medium',
              affectedArea: '사헌부 검수 흐름',
              summary: `현재 검수 대기 ${data.data.totals.pendingReview}건이 남아 있습니다.`,
              action: '검수 대기 건을 우선 확인하고 승인·보류 사유를 로그 기준으로 점검하십시오.',
            },
          ]
        : base.bottlenecks,
    runtimeHealth: {
      ...base.runtimeHealth,
      headline: '실데이터 control plane 기준으로 선택 명령의 상태를 반영한 대시보드입니다.',
      signals: [
        {
          id: 'signal-selected-command',
          label: '선택 명령',
          value: selected?.id ?? '없음',
          tone: selectedTone,
          detail: selected ? `${selected.message} / ${selected.nextAction}` : '선택된 명령이 없습니다.',
        },
        {
          id: 'signal-selected-status',
          label: '선택 검수 상태',
          value: selectedStatus,
          tone: selectedTone,
          detail: selected ? `현재 워크플로 단계: ${selected.workflowPhase}` : '상태 정보 없음',
        },
        {
          id: 'signal-logs',
          label: 'Control Plane 로그',
          value: String(data.data.totals.totalLogs),
          tone: 'healthy',
          detail: '서버 로그 집계가 대시보드에 반영되었습니다.',
        },
        {
          id: 'signal-review',
          label: '검수 대기',
          value: String(data.data.totals.pendingReview),
          tone: toneFromCount(data.data.totals.pendingReview),
          detail: '검수 대기 건수 기반 상태입니다.',
        },
      ],
    },
    execution: {
      activeNodeId:
        selected?.reviewStatus === 'revision_requested' || selected?.reviewStatus === 'blocked'
          ? 'review'
          : selected?.reviewStatus === 'approved' || selected?.reviewStatus === 'not_required'
            ? 'report'
            : 'chief',
      blockedNodeIds:
        selected?.reviewStatus === 'revision_requested' || selected?.reviewStatus === 'blocked' ? ['review'] : [],
      completedNodeIds: selected ? ['user', ...(selected.reviewStatus === 'approved' ? ['chief', 'review'] : ['chief'])] : ['user'],
    },
  };
}

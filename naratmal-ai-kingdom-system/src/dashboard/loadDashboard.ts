import { kingdomDashboard } from './mockData';
import { mapControlPlaneToDashboard } from './adapter';
import { loadSessionSignals } from './loadSessionSignals';
import type { CommandDetail, KingdomDashboardData, ReviewActionItem } from './types';

type RawReviewActionItem = {
  code?: string;
  title?: string;
  detail?: string;
  severity?: string;
  resolved?: boolean;
};

function normalizeActionItem(item: RawReviewActionItem): ReviewActionItem {
  return {
    code: item.code ?? 'UNKNOWN',
    title: item.title ?? '제목 없음',
    detail: item.detail ?? '상세 없음',
    severity: item.severity ?? 'unknown',
    resolved: item.resolved,
  };
}

async function loadCommandDetail(logId: string): Promise<CommandDetail | undefined> {
  try {
    const response = await fetch(`/api/kingdom/logs/${logId}`);
    if (!response.ok) return undefined;
    const json = await response.json();
    if (!json?.ok || !json?.data) return undefined;

    const historyActionItems = (json.data.reviewHistory ?? []).flatMap((item: any) =>
      (item.actionItems ?? []).map((entry: RawReviewActionItem) => normalizeActionItem(entry)),
    );
    const latestActionItems = (json.data.response?.review?.actionItems ?? []).map((item: RawReviewActionItem) =>
      normalizeActionItem(item),
    );
    const mergedActionItems = [...historyActionItems, ...latestActionItems].filter(
      (item, index, list) => list.findIndex((target) => target.code === item.code) === index,
    );

    return {
      id: json.data.id,
      message: json.data.request?.message ?? '메시지 정보 없음',
      requester: json.data.request?.requester ?? '폐하',
      reviewStatus: json.data.response?.review?.status ?? 'unknown',
      nextAction: json.data.response?.workflow?.nextAction ?? '상태 정보 없음',
      reviewHistory: (json.data.reviewHistory ?? []).map((item: any) => ({
        logId: item.logId,
        status: item.status,
        reason: item.reason,
        reviewRound: item.reviewRound,
        timestamp: item.timestamp,
        actionItems: (item.actionItems ?? []).map((entry: RawReviewActionItem) => normalizeActionItem(entry)),
      })),
      reviewActionItems: mergedActionItems,
      finalMessage: json.data.response?.finalMessage ?? '최종 보고 없음',
      executionMode: json.data.response?.execution?.mode,
      leadAgent: json.data.response?.routing?.leadAgent,
      supportAgents: json.data.response?.routing?.supportAgents ?? [],
    };
  } catch {
    return undefined;
  }
}

function buildSelectedMockDashboard(selectedId?: string): KingdomDashboardData {
  const selected = kingdomDashboard.commandFlow.find((item) => item.id === selectedId) ?? kingdomDashboard.commandFlow[0];
  if (!selected) return kingdomDashboard;

  const selectedCommand = {
    id: selected.id,
    message: selected.title,
    requester: selected.requester,
    reviewStatus: selected.status,
    nextAction: selected.nextAction,
    reviewHistory: [],
    reviewActionItems: [],
    finalMessage: selected.targetOutcome,
    leadAgent: selected.assignedAgents[0],
    supportAgents: selected.assignedAgents.slice(1),
  };

  return {
    ...kingdomDashboard,
    meta: {
      ...kingdomDashboard.meta,
      activeScenario: selected.title,
      lastUpdated: new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
    },
    selectedCommand,
    agencyRoster: kingdomDashboard.agencyRoster.map((agent) => ({
      ...agent,
      currentTask: selected.assignedAgents.includes(agent.name) ? `${selected.title} 처리 중` : agent.currentTask,
      loadPercent: selected.assignedAgents.includes(agent.name) ? Math.min(agent.loadPercent + 10, 100) : agent.loadPercent,
    })),
    conversations: [
      {
        id: `mock-thread-${selected.id}`,
        title: selected.title,
        participants: [selected.requester, ...selected.assignedAgents],
        status: selected.status,
        messages: [
          {
            id: `mock-request-${selected.id}`,
            role: 'human',
            sender: selected.requester,
            timestamp: kingdomDashboard.meta.lastUpdated,
            summary: selected.title,
            nodeId: 'user',
          },
          {
            id: `mock-chief-${selected.id}`,
            role: 'chief_agent',
            sender: '영의정',
            timestamp: kingdomDashboard.meta.lastUpdated,
            summary: `다음 조치: ${selected.nextAction}`,
            nodeId: 'chief',
          },
        ],
      },
    ],
    workflowGraph: {
      nodes: [
        {
          id: 'user',
          label: selected.requester,
          kind: 'command',
          state: 'complete',
          lane: '명령 유입',
          owner: 'Telegram',
          detail: selected.title,
          x: 6,
          y: 18,
          duration: 'mock',
        },
        {
          id: 'chief',
          label: '영의정',
          kind: 'analysis',
          state: 'complete',
          lane: '조정',
          owner: 'main',
          detail: selected.nextAction,
          x: 28,
          y: 18,
          duration: 'mock',
        },
        ...selected.assignedAgents.map((agent, index) => ({
          id: `assigned-${index}`,
          label: agent,
          kind: 'analysis' as const,
          state: index === 0 ? 'running' as const : 'queued' as const,
          lane: index === 0 ? '주관 기관' : '보조 기관',
          owner: agent,
          detail: `${selected.title} 처리`,
          x: 52,
          y: 12 + index * 16,
          duration: selected.status,
        })),
        {
          id: 'report',
          label: '폐하 보고',
          kind: 'delivery',
          state: selected.status === 'completed' ? 'complete' : 'waiting',
          lane: '출고',
          owner: '영의정',
          detail: selected.nextAction,
          x: 84,
          y: 18,
          duration: selected.status,
        },
      ],
      edges: [
        { id: 'mock-e1', from: 'user', to: 'chief', condition: 'default', label: '명 하달' },
        ...selected.assignedAgents.map((agent, index) => ({
          id: `mock-e-agent-${index}`,
          from: 'chief',
          to: `assigned-${index}`,
          condition: 'handoff' as const,
          label: `${agent} 배정`,
        })),
        { id: 'mock-e2', from: `assigned-0`, to: 'report', condition: 'feedback', label: '결과 취합' },
      ],
    },
    execution: {
      activeNodeId: selected.status === 'completed' ? 'report' : 'assigned-0',
      blockedNodeIds: selected.status === 'awaiting_review' ? ['assigned-0'] : [],
      completedNodeIds: ['user', 'chief'],
    },
    runtimeHealth: {
      ...kingdomDashboard.runtimeHealth,
      signals: [
        {
          id: 'mock-selected-command',
          label: '선택 명령',
          value: selected.id,
          tone: selected.status === 'awaiting_review' ? 'critical' : selected.status === 'executing' ? 'watch' : 'healthy',
          detail: `${selected.title} / ${selected.nextAction}`,
        },
        ...kingdomDashboard.runtimeHealth.signals,
      ],
    },
  };
}

export async function loadDashboardData(selectedId?: string): Promise<KingdomDashboardData> {
  try {
    const response = await fetch('/api/kingdom/control-plane');
    if (!response.ok) {
      return buildSelectedMockDashboard(selectedId);
    }

    const json = await response.json();
    if (!json?.ok) {
      return buildSelectedMockDashboard(selectedId);
    }

    const mapped = mapControlPlaneToDashboard(json, kingdomDashboard, selectedId);
    const targetId = selectedId ?? mapped.commandFlow[0]?.id;
    const detail = targetId ? await loadCommandDetail(targetId) : undefined;
    const sessionSignals = await loadSessionSignals();

    const selectedCommand = detail ?? mapped.selectedCommand;
    const selectedExecutionMode = selectedCommand?.executionMode ?? 'unknown';
    const selectedLeadAgent = selectedCommand?.leadAgent ?? '영의정';
    const selectedSupportAgents = selectedCommand?.supportAgents ?? [];

    const selectedGraph = selectedCommand
      ? {
          nodes: [
            {
              id: 'user',
              label: selectedCommand.requester,
              kind: 'command' as const,
              state: 'complete' as const,
              lane: '명령 유입',
              owner: 'Telegram',
              detail: selectedCommand.message,
              x: 6,
              y: 18,
              duration: '접수 완료',
            },
            {
              id: 'chief',
              label: '영의정',
              kind: 'analysis' as const,
              state: 'complete' as const,
              lane: '조정',
              owner: 'main',
              detail: `${selectedLeadAgent} 중심 배분`,
              x: 26,
              y: 18,
              duration: selectedExecutionMode,
            },
            {
              id: 'lead',
              label: selectedLeadAgent,
              kind: 'analysis' as const,
              state: selectedCommand.reviewStatus === 'approved' || selectedCommand.reviewStatus === 'not_required' ? 'complete' as const : 'running' as const,
              lane: '주관 기관',
              owner: selectedLeadAgent,
              detail: `주관 처리 / 다음 조치: ${selectedCommand.nextAction}`,
              x: 46,
              y: 10,
              duration: selectedExecutionMode,
            },
            ...selectedSupportAgents.map((agent, index) => ({
              id: `support-${index}`,
              label: agent,
              kind: 'analysis' as const,
              state: 'queued' as const,
              lane: '보조 기관',
              owner: agent,
              detail: `${agent} 보조 참여`,
              x: 46,
              y: 26 + index * 14,
              duration: '보조',
            })),
            {
              id: 'review',
              label: '사헌부 검수',
              kind: 'review' as const,
              state:
                selectedCommand.reviewStatus === 'revision_requested' || selectedCommand.reviewStatus === 'blocked'
                  ? 'blocked' as const
                  : selectedCommand.reviewStatus === 'approved'
                    ? 'complete' as const
                    : 'idle' as const,
              lane: '검수',
              owner: 'audit_guard',
              detail: `검수 상태: ${selectedCommand.reviewStatus}`,
              x: 70,
              y: 18,
              duration: selectedCommand.reviewStatus,
            },
            {
              id: 'report',
              label: '폐하 보고',
              kind: 'delivery' as const,
              state:
                selectedCommand.reviewStatus === 'approved' || selectedCommand.reviewStatus === 'not_required'
                  ? 'complete' as const
                  : 'waiting' as const,
              lane: '출고',
              owner: '영의정',
              detail: selectedCommand.finalMessage,
              x: 90,
              y: 18,
              duration: '보고',
            },
          ],
          edges: [
            { id: 'edge-user-chief', from: 'user', to: 'chief', condition: 'default' as const, label: '명 하달' },
            { id: 'edge-chief-lead', from: 'chief', to: 'lead', condition: 'handoff' as const, label: '주관 배정' },
            ...selectedSupportAgents.map((agent, index) => ({
              id: `edge-lead-support-${index}`,
              from: 'lead',
              to: `support-${index}`,
              condition: 'handoff' as const,
              label: `${agent} 협업`,
            })),
            { id: 'edge-lead-review', from: 'lead', to: 'review', condition: 'guardrail' as const, label: '검수 판단' },
            { id: 'edge-review-report', from: 'review', to: 'report', condition: 'feedback' as const, label: '출고/보류' },
          ],
        }
      : mapped.workflowGraph;

    const highlightedRoster = mapped.agencyRoster.map((agent) => {
      const involved = [selectedLeadAgent, ...selectedSupportAgents].includes(agent.name);
      return {
        ...agent,
        currentTask: involved ? `${selectedCommand?.message ?? agent.currentTask} 처리 중` : agent.currentTask,
        loadPercent: involved ? Math.min(agent.loadPercent + 12, 100) : agent.loadPercent,
      };
    });

    return {
      ...mapped,
      agencyRoster: highlightedRoster,
      workflowGraph: selectedGraph,
      selectedCommand,
      runtimeHealth: {
        ...mapped.runtimeHealth,
        signals: [...mapped.runtimeHealth.signals, ...sessionSignals],
      },
    };
  } catch {
    return buildSelectedMockDashboard(selectedId);
  }
}

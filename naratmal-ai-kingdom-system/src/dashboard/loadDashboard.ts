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

export async function loadDashboardData(selectedId?: string): Promise<KingdomDashboardData> {
  try {
    const response = await fetch('/api/kingdom/control-plane');
    if (!response.ok) {
      return kingdomDashboard;
    }

    const json = await response.json();
    if (!json?.ok) {
      return kingdomDashboard;
    }

    const mapped = mapControlPlaneToDashboard(json, kingdomDashboard, selectedId);
    const targetId = selectedId ?? mapped.commandFlow[0]?.id;
    const detail = targetId ? await loadCommandDetail(targetId) : undefined;
    const sessionSignals = await loadSessionSignals();

    return {
      ...mapped,
      selectedCommand: detail,
      runtimeHealth: {
        ...mapped.runtimeHealth,
        signals: [...mapped.runtimeHealth.signals, ...sessionSignals],
      },
    };
  } catch {
    return kingdomDashboard;
  }
}

import { kingdomDashboard } from './mockData';
import { mapControlPlaneToDashboard } from './adapter';
import type { CommandDetail, KingdomDashboardData } from './types';

async function loadCommandDetail(logId: string): Promise<CommandDetail | undefined> {
  try {
    const response = await fetch(`/api/kingdom/logs/${logId}`);
    if (!response.ok) return undefined;
    const json = await response.json();
    if (!json?.ok || !json?.data) return undefined;

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
      })),
      finalMessage: json.data.response?.finalMessage ?? '최종 보고 없음',
    };
  } catch {
    return undefined;
  }
}

export async function loadDashboardData(): Promise<KingdomDashboardData> {
  try {
    const response = await fetch('/api/kingdom/control-plane');
    if (!response.ok) {
      return kingdomDashboard;
    }

    const json = await response.json();
    if (!json?.ok) {
      return kingdomDashboard;
    }

    const mapped = mapControlPlaneToDashboard(json, kingdomDashboard);
    const selectedId = mapped.commandFlow[0]?.id;
    if (!selectedId) return mapped;

    const detail = await loadCommandDetail(selectedId);
    return {
      ...mapped,
      selectedCommand: detail,
    };
  } catch {
    return kingdomDashboard;
  }
}

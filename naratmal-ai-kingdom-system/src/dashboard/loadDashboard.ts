import { kingdomDashboard } from './mockData';
import { mapControlPlaneToDashboard } from './adapter';
import type { KingdomDashboardData } from './types';

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

    return mapControlPlaneToDashboard(json, kingdomDashboard);
  } catch {
    return kingdomDashboard;
  }
}

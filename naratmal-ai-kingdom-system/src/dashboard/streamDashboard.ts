import { loadDashboardData } from './loadDashboard';
import type { KingdomDashboardData } from './types';

export function subscribeDashboardStream(
  selectedCommandId: () => string | undefined,
  onData: (data: KingdomDashboardData) => void,
  onError?: (error: unknown) => void,
) {
  if (typeof window === 'undefined' || typeof window.EventSource === 'undefined') {
    return () => {};
  }

  let source: EventSource;
  try {
    source = new EventSource('/api/kingdom/control-plane/stream');
  } catch (error) {
    onError?.(error);
    return () => {};
  }

  const refresh = async () => {
    try {
      const data = await loadDashboardData(selectedCommandId());
      onData(data);
    } catch (error) {
      onError?.(error);
    }
  };

  source.addEventListener('dashboard-ready', refresh);
  source.addEventListener('dashboard-update', refresh);
  source.addEventListener('ping', () => {});
  source.onerror = (error) => {
    onError?.(error);
  };

  return () => {
    source.close();
  };
}

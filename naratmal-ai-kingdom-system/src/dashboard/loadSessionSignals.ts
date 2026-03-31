import { mapOpenClawConfigToSignals } from './sessionAdapter';
import type { RuntimeSignal } from './types';

export async function loadSessionSignals(): Promise<RuntimeSignal[]> {
  try {
    const response = await fetch('/api/kingdom/openclaw/status');
    if (!response.ok) return [];
    const json = await response.json();
    if (!json?.ok || !json?.data) return [];
    return mapOpenClawConfigToSignals(json.data);
  } catch {
    return [];
  }
}

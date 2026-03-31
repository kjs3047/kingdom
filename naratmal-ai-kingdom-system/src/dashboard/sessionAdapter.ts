import type { RuntimeSignal } from './types';

type OpenClawConfig = {
  bindings?: Array<{ agentId?: string; match?: { channel?: string } }>;
  session?: { dmScope?: string };
  channels?: { telegram?: { enabled?: boolean; streaming?: string; dmPolicy?: string } };
  agents?: { list?: Array<{ id?: string; name?: string }> };
};

export function mapOpenClawConfigToSignals(config: OpenClawConfig): RuntimeSignal[] {
  const telegram = config.channels?.telegram;
  const session = config.session;
  const bindings = config.bindings ?? [];
  const agentCount = config.agents?.list?.length ?? 0;

  return [
    {
      id: 'signal-openclaw-telegram',
      label: 'Telegram Binding',
      value: telegram?.enabled ? 'enabled' : 'disabled',
      tone: telegram?.enabled ? 'healthy' : 'critical',
      detail: `binding count: ${bindings.filter((item) => item.match?.channel === 'telegram').length}`,
    },
    {
      id: 'signal-openclaw-dmscope',
      label: 'DM Scope',
      value: session?.dmScope ?? 'unknown',
      tone: session?.dmScope === 'per-channel-peer' ? 'healthy' : 'watch',
      detail: `telegram dm policy: ${telegram?.dmPolicy ?? 'unknown'}`,
    },
    {
      id: 'signal-openclaw-streaming',
      label: 'Telegram Streaming',
      value: telegram?.streaming ?? 'unknown',
      tone: telegram?.streaming ? 'healthy' : 'watch',
      detail: `registered agents: ${agentCount}`,
    },
  ];
}

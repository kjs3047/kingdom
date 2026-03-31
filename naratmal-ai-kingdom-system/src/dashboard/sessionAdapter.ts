import type { RuntimeSignal } from './types';

type OpenClawRuntimeData = {
  config?: {
    bindings?: Array<{ agentId?: string; match?: { channel?: string } }>;
    session?: { dmScope?: string };
    channels?: { telegram?: { enabled?: boolean; streaming?: string; dmPolicy?: string } };
    agents?: { list?: Array<{ id?: string; name?: string }> };
  };
  gateway?: {
    runtime?: string;
    rpcProbe?: string;
    listening?: string;
    dashboard?: string;
    service?: string;
    logPath?: string;
  };
  channel?: {
    telegramEnabled?: boolean;
    telegramState?: string;
    telegramDetail?: string;
  };
  sessions?: {
    count?: number;
    activeCount?: number;
    hottestSession?: string;
    mainSessionTokens?: string;
  };
};

function toneByTruth(value: boolean) {
  return value ? 'healthy' : 'critical';
}

export function mapOpenClawConfigToSignals(data: OpenClawRuntimeData): RuntimeSignal[] {
  const config = data.config ?? {};
  const telegram = config.channels?.telegram;
  const session = config.session;
  const bindings = config.bindings ?? [];
  const agentCount = config.agents?.list?.length ?? 0;
  const gateway = data.gateway;
  const channel = data.channel;
  const sessions = data.sessions;

  return [
    {
      id: 'signal-openclaw-telegram',
      label: '텔레그램 바인딩',
      value: channel?.telegramState ?? (telegram?.enabled ? 'OK' : 'OFF'),
      tone: toneByTruth(channel?.telegramState === 'OK' || telegram?.enabled === true),
      detail: channel?.telegramDetail ?? `telegram binding 수: ${bindings.filter((item) => item.match?.channel === 'telegram').length}`,
    },
    {
      id: 'signal-openclaw-gateway',
      label: '게이트웨이 RPC',
      value: gateway?.rpcProbe ?? gateway?.runtime ?? 'unknown',
      tone: toneByTruth(gateway?.rpcProbe === 'ok' || gateway?.runtime === 'running'),
      detail: gateway?.listening ?? gateway?.dashboard ?? '리스닝 정보 없음',
    },
    {
      id: 'signal-openclaw-dmscope',
      label: 'DM 범위',
      value: session?.dmScope ?? 'unknown',
      tone: session?.dmScope === 'per-channel-peer' ? 'healthy' : 'watch',
      detail: `telegram dm policy: ${telegram?.dmPolicy ?? 'unknown'} / 등록 agent ${agentCount}`,
    },
    {
      id: 'signal-openclaw-sessions',
      label: '저장 세션',
      value: `${sessions?.count ?? 0}개`,
      tone: (sessions?.activeCount ?? 0) > 0 ? 'healthy' : 'watch',
      detail: `최근 활성 ${sessions?.activeCount ?? 0}개 / 주 세션 ${sessions?.hottestSession ?? '없음'} / ${sessions?.mainSessionTokens ?? '토큰 정보 없음'}`,
    },
    {
      id: 'signal-openclaw-streaming',
      label: '텔레그램 스트리밍',
      value: telegram?.streaming ?? 'unknown',
      tone: telegram?.streaming ? 'healthy' : 'watch',
      detail: gateway?.service ?? gateway?.logPath ?? '서비스 정보 없음',
    },
  ];
}

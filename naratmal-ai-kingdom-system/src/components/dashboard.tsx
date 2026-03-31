import type {
  AgentStatus,
  BottleneckIncident,
  CommandDetail,
  CommandFlowItem,
  ConversationThread,
  ExecutionSnapshot,
  OverviewState,
  RuntimeHealthState,
  RuntimeTone,
  WorkflowGraphState,
} from '../dashboard/types';

type HeroProps = {
  title: string;
  subtitle: string;
  activeScenario: string;
  ontologyVersion: string;
  lastUpdated: string;
};

type PanelProps = {
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
  className?: string;
};

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

function Panel({ title, eyebrow, children, className }: PanelProps) {
  return (
    <section className={cn('panel', className)}>
      <div className="panel-header">
        <div>
          {eyebrow ? <p className="panel-eyebrow">{eyebrow}</p> : null}
          <h2>{title}</h2>
        </div>
      </div>
      {children}
    </section>
  );
}

function toneClassName(tone: RuntimeTone) {
  return `tone-pill tone-pill--${tone}`;
}

function formatPercent(value: number) {
  return `${value}%`;
}

function getAvailabilityTone(status: AgentStatus['availability']): RuntimeTone {
  if (status === 'offline') return 'critical';
  if (status === 'degraded') return 'watch';
  return 'healthy';
}

function getNodeById(graph: WorkflowGraphState, nodeId: string) {
  return graph.nodes.find((node) => node.id === nodeId);
}

function formatStatus(status: string) {
  switch (status) {
    case 'completed':
      return '완료';
    case 'awaiting_review':
      return '검수 대기';
    case 'executing':
      return '실행 중';
    case 'approved':
      return '승인';
    case 'revision_requested':
      return '수정 요청';
    case 'not_required':
      return '검수 불필요';
    case 'blocked':
      return '차단';
    case 'online':
      return '정상';
    case 'degraded':
      return '주의';
    case 'offline':
      return '오프라인';
    default:
      return status;
  }
}

export function DashboardHero({
  title,
  subtitle,
  activeScenario,
  ontologyVersion,
  lastUpdated,
}: HeroProps) {
  return (
    <header className="hero">
      <div className="hero-topline">
        <span className="chip">온톨로지 워크플로 대시보드</span>
        <span className="chip chip--ghost">최종 반영 {lastUpdated}</span>
      </div>
      <div className="hero-copy">
        <div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        <div className="hero-meta">
          <div className="hero-meta-card">
            <span>현재 선택 명령</span>
            <strong>{activeScenario}</strong>
          </div>
          <div className="hero-meta-card">
            <span>온톨로지 버전</span>
            <strong>{ontologyVersion}</strong>
          </div>
        </div>
      </div>
    </header>
  );
}

export function OverviewPanel({ overview }: { overview: OverviewState }) {
  return (
    <Panel title="왕국 개요" eyebrow="지휘 현황" className="panel--span-12">
      <div className="overview-intro">
        <p>{overview.mission}</p>
        <p>{overview.queueSummary}</p>
      </div>
      <div className="metric-grid">
        {overview.metrics.map((metric) => (
          <article key={metric.label} className="metric-card">
            <span className="metric-label">{metric.label}</span>
            <strong className="metric-value">{metric.value}</strong>
            <span className={toneClassName(metric.tone)}>{metric.delta}</span>
          </article>
        ))}
      </div>
    </Panel>
  );
}

export function HealthPanel({ health }: { health: RuntimeHealthState }) {
  return (
    <Panel title="런타임 상태" eyebrow="실시간 신호" className="panel--span-4">
      <p className="panel-lead">{health.headline}</p>
      <div className="stack">
        {health.signals.map((signal) => (
          <article key={signal.id} className="info-card">
            <div className="row-between">
              <strong>{signal.label}</strong>
              <span className={toneClassName(signal.tone)}>{signal.value}</span>
            </div>
            <p>{signal.detail}</p>
          </article>
        ))}
      </div>
    </Panel>
  );
}

export function WorkflowGraphPanel({
  graph,
  incidents,
  execution,
  selectedNodeId,
  onSelectNode,
}: {
  graph: WorkflowGraphState;
  incidents: BottleneckIncident[];
  execution: ExecutionSnapshot;
  selectedNodeId?: string;
  onSelectNode?: (id: string) => void;
}) {
  const width = 880;
  const height = 340;
  const activeIncident = incidents[0];

  return (
    <Panel title="동적 워크플로 그래프" eyebrow="선택 명령 경로" className="panel--span-8">
      <div className="graph-shell">
        <svg viewBox={`0 0 ${width} ${height}`} className="graph-canvas" role="img" aria-label="워크플로 그래프">
          {graph.edges.map((edge) => {
            const from = getNodeById(graph, edge.from);
            const to = getNodeById(graph, edge.to);
            if (!from || !to) {
              return null;
            }

            const x1 = from.x * 8 + 84;
            const y1 = from.y * 5 + 42;
            const x2 = to.x * 8 + 84;
            const y2 = to.y * 5 + 42;
            const mx = (x1 + x2) / 2;
            const my = (y1 + y2) / 2 - 10;

            return (
              <g key={edge.id}>
                <path
                  d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`}
                  className={`graph-edge graph-edge--${edge.condition}`}
                />
                <text x={mx} y={my} className="graph-edge-label">
                  {edge.label}
                </text>
              </g>
            );
          })}

          {graph.nodes.map((node) => {
            const isSelected = selectedNodeId === node.id;
            const isActive = (selectedNodeId ? selectedNodeId === node.id : execution.activeNodeId === node.id);
            const isBlocked = execution.blockedNodeIds.includes(node.id);
            const isComplete = execution.completedNodeIds.includes(node.id);
            const x = node.x * 8;
            const y = node.y * 5;

            return (
              <g
                key={node.id}
                transform={`translate(${x}, ${y})`}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
                onClick={() => onSelectNode?.(node.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onSelectNode?.(node.id);
                  }
                }}
              >
                <rect
                  width="168"
                  height="84"
                  rx="18"
                  className={cn(
                    'graph-node',
                    `graph-node--${node.state}`,
                    isActive && 'graph-node--active',
                    isBlocked && 'graph-node--blocked',
                    isComplete && 'graph-node--complete',
                    isSelected && 'info-card--selected',
                  )}
                />
                <text x="16" y="24" className="graph-node-kind">
                  {node.lane}
                </text>
                <text x="16" y="46" className="graph-node-label">
                  {node.label}
                </text>
                <text x="16" y="66" className="graph-node-meta">
                  {node.owner} / {node.duration}
                </text>
              </g>
            );
          })}
        </svg>

        <div className="graph-aside">
          <article className="info-card">
            <span className="info-card-label">현재 선택 노드</span>
            <strong>{getNodeById(graph, selectedNodeId ?? execution.activeNodeId)?.label}</strong>
            <p>{getNodeById(graph, selectedNodeId ?? execution.activeNodeId)?.detail}</p>
          </article>
          <article className="info-card info-card--warning">
            <span className="info-card-label">주요 병목</span>
            <strong>{activeIncident?.title ?? '없음'}</strong>
            <p>{activeIncident?.summary ?? '현재 병목 없음'}</p>
            {activeIncident ? <span className="tone-pill tone-pill--critical">{activeIncident.action}</span> : null}
          </article>
        </div>
      </div>
    </Panel>
  );
}

export function AgencyStatusPanel({ roster }: { roster: AgentStatus[] }) {
  return (
    <Panel title="기관 상태" eyebrow="가동률과 적재량" className="panel--span-4">
      <div className="stack">
        {roster.map((agent) => (
          <article key={agent.id} className="info-card">
            <div className="row-between">
              <div>
                <strong>{agent.name}</strong>
                <p className="muted">{agent.responsibility}</p>
              </div>
              <span className={toneClassName(getAvailabilityTone(agent.availability))}>{formatStatus(agent.availability)}</span>
            </div>
            <div className="progress-meta">
              <span>부하 {formatPercent(agent.loadPercent)}</span>
              <span>대기열 {agent.queueDepth}</span>
              <span>{agent.updatedAt}</span>
            </div>
            <div className="progress-bar">
              <span style={{ width: formatPercent(agent.loadPercent) }} />
            </div>
            <p>{agent.currentTask}</p>
          </article>
        ))}
      </div>
    </Panel>
  );
}

export function CommandFlowPanel({
  commands,
  selectedCommandId,
  onSelect,
}: {
  commands: CommandFlowItem[];
  selectedCommandId?: string;
  onSelect?: (id: string) => void;
}) {
  return (
    <Panel title="명령 흐름" eyebrow="실행 대기열" className="panel--span-4">
      <div className="stack">
        {commands.map((command) => (
          <article
            key={command.id}
            className={cn('info-card clickable-card', selectedCommandId === command.id && 'info-card--selected')}
            onClick={() => onSelect?.(command.id)}
            role="button"
            tabIndex={0}
            aria-pressed={selectedCommandId === command.id}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onSelect?.(command.id);
              }
            }}
          >
            <div className="row-between">
              <div>
                <strong>{command.title}</strong>
                <p className="muted">
                  {command.id} / {command.requester}
                </p>
              </div>
              <span className={`tone-pill tone-pill--${mapStatusTone(command.status)}`}>{formatStatus(command.status)}</span>
            </div>
            <p>{command.targetOutcome}</p>
            <p className="muted">다음 조치: {command.nextAction}</p>
            <div className="tag-row">
              {command.assignedAgents.map((agent) => (
                <span key={agent} className="tag">
                  {agent}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </Panel>
  );
}

export function ConversationLogPanel({ conversations }: { conversations: ConversationThread[] }) {
  return (
    <Panel title="교신 기록" eyebrow="로그 중심 대화흔적" className="panel--span-4">
      <div className="conversation-layout">
        {conversations.map((thread) => (
          <article key={thread.id} className="conversation-thread">
            <div className="row-between conversation-thread__header">
              <div>
                <h3>{thread.title}</h3>
                <p className="muted">{thread.participants.join(' / ')}</p>
              </div>
              <span className={`tone-pill tone-pill--${mapStatusTone(thread.status)}`}>{formatStatus(thread.status)}</span>
            </div>
            <div className="stack">
              {thread.messages.map((message) => (
                <div key={message.id} className={`message message--${message.role}`}>
                  <div className="row-between">
                    <strong>{message.sender}</strong>
                    <span className="muted">{message.timestamp}</span>
                  </div>
                  <p>{message.summary}</p>
                  {message.nodeId ? <span className="message-node">{message.nodeId}</span> : null}
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </Panel>
  );
}

export function CommandDetailPanel({ detail }: { detail?: CommandDetail }) {
  return (
    <Panel title="명령 상세" eyebrow={detail ? `선택 명령 분석 · ${detail.id}` : '선택 명령 분석'} className="panel--span-4">
      {detail ? (
        <div className="stack">
          <article className="info-card">
            <strong>{detail.message}</strong>
            <p className="muted">{detail.id} / {detail.requester}</p>
            <p>검수 상태: {formatStatus(detail.reviewStatus)}</p>
            <p>다음 조치: {detail.nextAction}</p>
            {detail.executionMode ? <p>실행 모드: {detail.executionMode}</p> : null}
            {detail.leadAgent ? <p>주관 기관: {detail.leadAgent}</p> : null}
            {detail.supportAgents?.length ? <p>보조 기관: {detail.supportAgents.join(', ')}</p> : null}
          </article>
          <article className="info-card">
            <strong>검수 이력</strong>
            <div className="stack compact-stack">
              {detail.reviewHistory.map((item) => (
                <div key={item.logId} className="message message--system">
                  <div className="row-between">
                    <strong>{item.reviewRound}차 검수</strong>
                    <span className="muted">{item.timestamp}</span>
                  </div>
                  <p>{formatStatus(item.status)}</p>
                  <p className="muted">{item.reason}</p>
                  {item.actionItems?.length ? (
                    <p className="muted">조치 항목: {item.actionItems.map((action) => action.title).join(', ')}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </article>
          <article className="info-card">
            <strong>검토 조치 항목</strong>
            <div className="stack compact-stack">
              {detail.reviewActionItems.length ? (
                detail.reviewActionItems.map((item) => (
                  <div key={item.code} className="message message--system">
                    <div className="row-between">
                      <strong>{item.title}</strong>
                      <span className="muted">{item.severity}</span>
                    </div>
                    <p>{item.detail}</p>
                    {typeof item.resolved === 'boolean' ? (
                      <p className="muted">해결 여부: {item.resolved ? '해결됨' : '미해결'}</p>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="muted">현재 action item 없음</p>
              )}
            </div>
          </article>
          <article className="info-card">
            <strong>최종 보고문</strong>
            <p>{detail.finalMessage}</p>
          </article>
        </div>
      ) : (
        <article className="info-card">
          <strong>선택된 명령 없음</strong>
          <p>control plane 응답에서 상세 명령을 불러오지 못했사옵니다.</p>
        </article>
      )}
    </Panel>
  );
}

export function BottlenecksPanel({ incidents }: { incidents: BottleneckIncident[] }) {
  return (
    <Panel title="병목 현황" eyebrow="운영 마찰" className="panel--span-12">
      <div className="incident-grid">
        {incidents.map((incident) => (
          <article key={incident.id} className="incident-card">
            <div className="row-between">
              <div>
                <strong>{incident.title}</strong>
                <p className="muted">{incident.affectedArea}</p>
              </div>
              <span className={`tone-pill tone-pill--${mapSeverityTone(incident.severity)}`}>{incident.severity}</span>
            </div>
            <p>{incident.summary}</p>
            <p className="incident-action">{incident.action}</p>
          </article>
        ))}
      </div>
    </Panel>
  );
}

function mapStatusTone(status: CommandFlowItem['status'] | ConversationThread['status']): RuntimeTone {
  switch (status) {
    case 'completed':
      return 'healthy';
    case 'awaiting_review':
      return 'critical';
    case 'executing':
      return 'watch';
    default:
      return 'healthy';
  }
}

function mapSeverityTone(severity: BottleneckIncident['severity']): RuntimeTone {
  if (severity === 'high') return 'critical';
  if (severity === 'medium') return 'watch';
  return 'healthy';
}

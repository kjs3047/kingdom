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
        <span className="chip">Ontology Workflow MVP</span>
        <span className="chip chip--ghost">Updated {lastUpdated}</span>
      </div>
      <div className="hero-copy">
        <div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        <div className="hero-meta">
          <div className="hero-meta-card">
            <span>Active Scenario</span>
            <strong>{activeScenario}</strong>
          </div>
          <div className="hero-meta-card">
            <span>Ontology Version</span>
            <strong>{ontologyVersion}</strong>
          </div>
        </div>
      </div>
    </header>
  );
}

export function OverviewPanel({ overview }: { overview: OverviewState }) {
  return (
    <Panel title="Kingdom Overview" eyebrow="Command Surface" className="panel--span-12">
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
    <Panel title="Runtime Health" eyebrow="System Signals" className="panel--span-4">
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
}: {
  graph: WorkflowGraphState;
  incidents: BottleneckIncident[];
  execution: ExecutionSnapshot;
}) {
  const width = 880;
  const height = 340;
  const activeIncident = incidents[0];

  return (
    <Panel title="Dynamic Workflow Graph" eyebrow="Ontology State Map" className="panel--span-8">
      <div className="graph-shell">
        <svg viewBox={`0 0 ${width} ${height}`} className="graph-canvas" role="img" aria-label="Workflow graph">
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
            const isActive = execution.activeNodeId === node.id;
            const isBlocked = execution.blockedNodeIds.includes(node.id);
            const isComplete = execution.completedNodeIds.includes(node.id);
            const x = node.x * 8;
            const y = node.y * 5;

            return (
              <g key={node.id} transform={`translate(${x}, ${y})`}>
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
            <span className="info-card-label">Active Node</span>
            <strong>{getNodeById(graph, execution.activeNodeId)?.label}</strong>
            <p>{getNodeById(graph, execution.activeNodeId)?.detail}</p>
          </article>
          <article className="info-card info-card--warning">
            <span className="info-card-label">Primary Blocker</span>
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
    <Panel title="Agency Status" eyebrow="Roster and Load" className="panel--span-4">
      <div className="stack">
        {roster.map((agent) => (
          <article key={agent.id} className="info-card">
            <div className="row-between">
              <div>
                <strong>{agent.name}</strong>
                <p className="muted">{agent.responsibility}</p>
              </div>
              <span className={toneClassName(getAvailabilityTone(agent.availability))}>{agent.availability}</span>
            </div>
            <div className="progress-meta">
              <span>Load {formatPercent(agent.loadPercent)}</span>
              <span>Queue {agent.queueDepth}</span>
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

export function CommandFlowPanel({ commands }: { commands: CommandFlowItem[] }) {
  return (
    <Panel title="Command Flow" eyebrow="Execution Queue" className="panel--span-4">
      <div className="stack">
        {commands.map((command) => (
          <article key={command.id} className="info-card">
            <div className="row-between">
              <div>
                <strong>{command.title}</strong>
                <p className="muted">
                  {command.id} / {command.requester}
                </p>
              </div>
              <span className={`tone-pill tone-pill--${mapStatusTone(command.status)}`}>{command.status}</span>
            </div>
            <p>{command.targetOutcome}</p>
            <p className="muted">Next: {command.nextAction}</p>
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
    <Panel title="Conversation Log" eyebrow="Agent Dialogue" className="panel--span-4">
      <div className="conversation-layout">
        {conversations.map((thread) => (
          <article key={thread.id} className="conversation-thread">
            <div className="row-between conversation-thread__header">
              <div>
                <h3>{thread.title}</h3>
                <p className="muted">{thread.participants.join(' / ')}</p>
              </div>
              <span className={`tone-pill tone-pill--${mapStatusTone(thread.status)}`}>{thread.status}</span>
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
    <Panel title="Command Detail" eyebrow="Selected Execution" className="panel--span-4">
      {detail ? (
        <div className="stack">
          <article className="info-card">
            <strong>{detail.message}</strong>
            <p className="muted">{detail.id} / {detail.requester}</p>
            <p>검수 상태: {detail.reviewStatus}</p>
            <p>다음 조치: {detail.nextAction}</p>
          </article>
          <article className="info-card">
            <strong>Review History</strong>
            <div className="stack compact-stack">
              {detail.reviewHistory.map((item) => (
                <div key={item.logId} className="message message--system">
                  <div className="row-between">
                    <strong>Round {item.reviewRound}</strong>
                    <span className="muted">{item.timestamp}</span>
                  </div>
                  <p>{item.status}</p>
                  <p className="muted">{item.reason}</p>
                </div>
              ))}
            </div>
          </article>
          <article className="info-card">
            <strong>Final Message</strong>
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
    <Panel title="Bottlenecks" eyebrow="Operational Friction" className="panel--span-12">
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

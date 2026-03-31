export type GraphNodeState = 'idle' | 'queued' | 'running' | 'waiting' | 'blocked' | 'complete';
export type GraphNodeKind = 'command' | 'analysis' | 'review' | 'delivery' | 'memory';
export type GraphEdgeCondition = 'default' | 'handoff' | 'feedback' | 'guardrail';
export type AgentAvailability = 'online' | 'degraded' | 'offline';
export type RuntimeTone = 'healthy' | 'watch' | 'critical';
export type MessageRole = 'human' | 'chief_agent' | 'specialist' | 'audit_guard' | 'system';
export type CommandStatus = 'received' | 'triaged' | 'executing' | 'awaiting_review' | 'completed';
export type IncidentSeverity = 'low' | 'medium' | 'high';

export interface DashboardMeta {
  title: string;
  subtitle: string;
  activeScenario: string;
  ontologyVersion: string;
  lastUpdated: string;
}

export interface OverviewMetric {
  label: string;
  value: string;
  delta: string;
  tone: RuntimeTone;
}

export interface OverviewState {
  mission: string;
  queueSummary: string;
  metrics: OverviewMetric[];
}

export interface WorkflowGraphNode {
  id: string;
  label: string;
  kind: GraphNodeKind;
  state: GraphNodeState;
  lane: string;
  owner: string;
  detail: string;
  x: number;
  y: number;
  duration: string;
}

export interface WorkflowGraphEdge {
  id: string;
  from: string;
  to: string;
  condition: GraphEdgeCondition;
  label: string;
}

export interface WorkflowGraphState {
  nodes: WorkflowGraphNode[];
  edges: WorkflowGraphEdge[];
}

export interface AgentStatus {
  id: string;
  name: string;
  responsibility: string;
  availability: AgentAvailability;
  loadPercent: number;
  queueDepth: number;
  currentTask: string;
  updatedAt: string;
}

export interface ConversationMessage {
  id: string;
  role: MessageRole;
  sender: string;
  timestamp: string;
  summary: string;
  nodeId?: string;
}

export interface ConversationThread {
  id: string;
  title: string;
  participants: string[];
  status: CommandStatus;
  messages: ConversationMessage[];
}

export interface CommandFlowItem {
  id: string;
  title: string;
  requester: string;
  status: CommandStatus;
  currentNodeId: string;
  nextAction: string;
  assignedAgents: string[];
  targetOutcome: string;
}

export interface BottleneckIncident {
  id: string;
  title: string;
  severity: IncidentSeverity;
  affectedArea: string;
  summary: string;
  action: string;
}

export interface RuntimeSignal {
  id: string;
  label: string;
  value: string;
  tone: RuntimeTone;
  detail: string;
}

export interface RuntimeHealthState {
  headline: string;
  signals: RuntimeSignal[];
}

export interface ExecutionSnapshot {
  activeNodeId: string;
  blockedNodeIds: string[];
  completedNodeIds: string[];
}

export interface ReviewHistoryItem {
  logId: string;
  status: string;
  reason: string;
  reviewRound: number;
  timestamp: string;
}

export interface ReviewActionItem {
  code: string;
  title: string;
  detail: string;
  severity: string;
  resolved?: boolean;
}

export interface CommandDetail {
  id: string;
  message: string;
  requester: string;
  reviewStatus: string;
  nextAction: string;
  reviewHistory: ReviewHistoryItem[];
  reviewActionItems: ReviewActionItem[];
  finalMessage: string;
}

export interface KingdomDashboardData {
  meta: DashboardMeta;
  overview: OverviewState;
  workflowGraph: WorkflowGraphState;
  agencyRoster: AgentStatus[];
  conversations: ConversationThread[];
  commandFlow: CommandFlowItem[];
  bottlenecks: BottleneckIncident[];
  runtimeHealth: RuntimeHealthState;
  execution: ExecutionSnapshot;
  selectedCommand?: CommandDetail;
}

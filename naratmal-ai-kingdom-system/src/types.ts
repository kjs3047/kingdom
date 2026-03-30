export type AgentCode =
  | 'chief_agent'
  | 'ops_secretariat'
  | 'strategy_planner'
  | 'design_studio'
  | 'product_engineering'
  | 'content_marketing'
  | 'audit_guard';

export type RequestCategory =
  | 'planning'
  | 'design'
  | 'engineering'
  | 'content'
  | 'operations'
  | 'sensitive';

export type ReviewStatus = 'not_required' | 'approved' | 'revision_requested' | 'blocked';

export interface UserRequest {
  message: string;
  attachments?: string[];
  externalDelivery?: boolean;
  sensitive?: boolean;
}

export interface AgentTask {
  agent: AgentCode;
  reason: string;
  inputSummary: string;
}

export interface AgentResult {
  agent: AgentCode;
  summary: string;
  output: string[];
}

export interface RoutingDecision {
  category: RequestCategory;
  leadAgent: AgentCode;
  supportAgents: AgentCode[];
  reviewRequired: boolean;
  tasks: AgentTask[];
}

export interface ReviewActionItem {
  code: string;
  title: string;
  detail: string;
  severity: 'low' | 'medium' | 'high';
}

export interface ReviewDecision {
  status: ReviewStatus;
  reason: string;
  requiredForExternalDelivery: boolean;
  actionItems?: ReviewActionItem[];
}

export interface WorkflowState {
  phase: 'draft' | 'review_required' | 'approved' | 'blocked';
  nextAction: string;
}

export interface FinalResponse {
  briefing: string;
  routing: RoutingDecision;
  results: AgentResult[];
  review: ReviewDecision;
  workflow: WorkflowState;
  revisionSummary?: string;
  finalMessage: string;
}

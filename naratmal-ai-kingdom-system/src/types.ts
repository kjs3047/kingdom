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

export interface FinalResponse {
  briefing: string;
  routing: RoutingDecision;
  results: AgentResult[];
  finalMessage: string;
}

export type RequestStatus = 'pending' | 'processing' | 'approved' | 'rejected' | 'manual_review' | 'failed' | 'retrying';

export interface WorkflowRule {
  id: string;
  name: string;
  description: string;
  type: 'mandatory' | 'threshold' | 'conditional';
  field: string;
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=' | 'in' | 'not_in' | 'exists' | 'regex';
  value: unknown;
  onFail: 'reject' | 'manual_review' | 'continue';
  priority: number;
}

export interface WorkflowStage {
  id: string;
  name: string;
  rules: string[]; // rule IDs
  onAllPass: string | 'approve'; // next stage ID or terminal
  onAnyFail: string | 'reject' | 'manual_review';
  retryable: boolean;
  maxRetries: number;
}

export interface WorkflowConfig {
  id: string;
  name: string;
  description: string;
  version: number;
  stages: WorkflowStage[];
  rules: WorkflowRule[];
  schema: Record<string, { type: string; required: boolean; label: string }>;
}

export interface RuleResult {
  ruleId: string;
  ruleName: string;
  passed: boolean;
  field: string;
  actualValue: unknown;
  expectedValue: unknown;
  operator: string;
  reason: string;
}

export interface StageResult {
  stageId: string;
  stageName: string;
  ruleResults: RuleResult[];
  outcome: 'pass' | 'fail' | 'manual_review';
  timestamp: string;
}

export interface AuditEntry {
  id: string;
  requestId: string;
  timestamp: string;
  action: string;
  details: string;
  stageId?: string;
  ruleResults?: RuleResult[];
  previousStatus?: RequestStatus;
  newStatus?: RequestStatus;
}

export interface WorkflowRequest {
  id: string;
  workflowId: string;
  data: Record<string, unknown>;
  status: RequestStatus;
  currentStageIndex: number;
  stageResults: StageResult[];
  auditTrail: AuditEntry[];
  retryCount: number;
  createdAt: string;
  updatedAt: string;
  idempotencyKey: string;
}

export interface ExternalDependency {
  name: string;
  check: (data: Record<string, unknown>) => Promise<{ success: boolean; data?: unknown; error?: string }>;
}

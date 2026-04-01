import { WorkflowConfig, WorkflowRequest, RequestStatus, StageResult, AuditEntry } from './types';
import { evaluateRule } from './rules-engine';
import { v4 } from './utils';

// Simulated external credit check dependency
async function simulateCreditCheck(data: Record<string, unknown>): Promise<{ success: boolean; score?: number; error?: string }> {
  await new Promise(r => setTimeout(r, 500 + Math.random() * 1000));
  // 10% chance of failure to simulate dependency issues
  if (Math.random() < 0.1) {
    return { success: false, error: 'Credit bureau service temporarily unavailable' };
  }
  const income = Number(data.annualIncome) || 0;
  const score = Math.min(850, Math.max(300, 500 + (income / 1000) + Math.floor(Math.random() * 100)));
  return { success: true, score };
}

export class WorkflowExecutor {
  private requests: Map<string, WorkflowRequest> = new Map();
  private idempotencyKeys: Map<string, string> = new Map(); // key -> requestId
  private listeners: Set<() => void> = new Set();

  subscribe(fn: () => void) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  private notify() { this.listeners.forEach(fn => fn()); }

  getRequests(): WorkflowRequest[] {
    return Array.from(this.requests.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  getRequest(id: string): WorkflowRequest | undefined {
    return this.requests.get(id);
  }

  validateSchema(data: Record<string, unknown>, config: WorkflowConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    for (const [field, schema] of Object.entries(config.schema)) {
      if (schema.required && (data[field] === undefined || data[field] === null || data[field] === '')) {
        errors.push(`${schema.label} is required`);
      }
      if (data[field] !== undefined && data[field] !== '') {
        if (schema.type === 'number' && isNaN(Number(data[field]))) {
          errors.push(`${schema.label} must be a number`);
        }
      }
    }
    return { valid: errors.length === 0, errors };
  }

  async submitRequest(data: Record<string, unknown>, config: WorkflowConfig, idempotencyKey: string): Promise<{ request?: WorkflowRequest; error?: string }> {
    // Idempotency check
    if (this.idempotencyKeys.has(idempotencyKey)) {
      const existingId = this.idempotencyKeys.get(idempotencyKey)!;
      return { request: this.requests.get(existingId)!, error: 'Duplicate request detected (idempotency key exists). Returning existing request.' };
    }

    // Schema validation
    const validation = this.validateSchema(data, config);
    if (!validation.valid) {
      return { error: validation.errors.join('; ') };
    }

    const id = v4();
    const now = new Date().toISOString();

    const request: WorkflowRequest = {
      id,
      workflowId: config.id,
      data,
      status: 'pending',
      currentStageIndex: 0,
      stageResults: [],
      auditTrail: [],
      retryCount: 0,
      createdAt: now,
      updatedAt: now,
      idempotencyKey,
    };

    this.addAudit(request, 'REQUEST_SUBMITTED', `Request submitted for workflow: ${config.name}`, undefined, 'pending');
    this.requests.set(id, request);
    this.idempotencyKeys.set(idempotencyKey, id);
    this.notify();

    return { request };
  }

  async processRequest(requestId: string, config: WorkflowConfig): Promise<WorkflowRequest> {
    const request = this.requests.get(requestId);
    if (!request) throw new Error('Request not found');

    this.updateStatus(request, 'processing');
    this.notify();

    // Simulate external credit check
    this.addAudit(request, 'EXTERNAL_CHECK', 'Initiating external credit check...');
    const creditResult = await simulateCreditCheck(request.data);

    if (!creditResult.success) {
      const stage = config.stages[request.currentStageIndex];
      if (stage?.retryable && request.retryCount < stage.maxRetries) {
        request.retryCount++;
        this.updateStatus(request, 'retrying');
        this.addAudit(request, 'DEPENDENCY_FAILURE', `Credit check failed: ${creditResult.error}. Retry ${request.retryCount}/${stage.maxRetries}`, undefined, 'retrying');
        this.notify();
        // Auto-retry after delay
        await new Promise(r => setTimeout(r, 1000));
        return this.processRequest(requestId, config);
      }
      this.updateStatus(request, 'failed');
      this.addAudit(request, 'DEPENDENCY_FAILURE', `Credit check failed after ${request.retryCount} retries: ${creditResult.error}`, undefined, 'failed');
      this.notify();
      return request;
    }

    // Enrich data with credit score
    request.data.creditScore = creditResult.score;
    this.addAudit(request, 'EXTERNAL_CHECK_COMPLETE', `Credit score received: ${creditResult.score}`);

    // Process each stage
    for (let i = request.currentStageIndex; i < config.stages.length; i++) {
      const stage = config.stages[i];
      request.currentStageIndex = i;
      const stageRules = config.rules.filter(r => stage.rules.includes(r.id));
      const ruleResults = stageRules
        .sort((a, b) => a.priority - b.priority)
        .map(rule => evaluateRule(rule, request.data));

      const failedResults = ruleResults.filter(r => !r.passed);
      const hasManualReview = failedResults.some(r => {
        const rule = config.rules.find(rl => rl.id === r.ruleId);
        return rule?.onFail === 'manual_review';
      });
      const hasReject = failedResults.some(r => {
        const rule = config.rules.find(rl => rl.id === r.ruleId);
        return rule?.onFail === 'reject';
      });

      const outcome = failedResults.length === 0 ? 'pass' : hasReject ? 'fail' : hasManualReview ? 'manual_review' : 'pass';

      const stageResult: StageResult = {
        stageId: stage.id,
        stageName: stage.name,
        ruleResults,
        outcome,
        timestamp: new Date().toISOString(),
      };

      request.stageResults.push(stageResult);
      this.addAudit(request, 'STAGE_COMPLETE', `Stage "${stage.name}" completed: ${outcome}`, stage.id, undefined, ruleResults);

      if (outcome === 'fail') {
        this.updateStatus(request, 'rejected');
        this.addAudit(request, 'DECISION', `Request REJECTED at stage "${stage.name}"`, stage.id, 'rejected');
        this.notify();
        return request;
      }

      if (outcome === 'manual_review') {
        this.updateStatus(request, 'manual_review');
        this.addAudit(request, 'DECISION', `Request sent to MANUAL REVIEW at stage "${stage.name}"`, stage.id, 'manual_review');
        this.notify();
        return request;
      }

      this.notify();
      // Small delay between stages for visual effect
      await new Promise(r => setTimeout(r, 300));
    }

    this.updateStatus(request, 'approved');
    this.addAudit(request, 'DECISION', 'Request APPROVED - all stages passed', undefined, 'approved');
    this.notify();
    return request;
  }

  private updateStatus(request: WorkflowRequest, status: RequestStatus) {
    const prev = request.status;
    request.status = status;
    request.updatedAt = new Date().toISOString();
    if (prev !== status) {
      this.addAudit(request, 'STATUS_CHANGE', `Status changed: ${prev} → ${status}`, undefined, status);
    }
  }

  private addAudit(
    request: WorkflowRequest,
    action: string,
    details: string,
    stageId?: string,
    newStatus?: RequestStatus,
    ruleResults?: import('./types').RuleResult[]
  ) {
    request.auditTrail.push({
      id: v4(),
      requestId: request.id,
      timestamp: new Date().toISOString(),
      action,
      details,
      stageId,
      ruleResults,
      previousStatus: request.status,
      newStatus,
    });
  }
}

export const executor = new WorkflowExecutor();

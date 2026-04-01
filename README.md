# Configurable Workflow Decision Platform

A resilient, configurable workflow decision system for processing business requests through automated rule evaluation, state management, and audit-traced decisions. Built with React + TypeScript frontend and a fully configurable rules/workflow engine.

**Live Demo:** https://httpsgithubcomavi2727.lovable.app

---

## Use Case: Loan Application Approval

This platform demonstrates a **loan application approval workflow** where incoming applications are evaluated against configurable business rules, routed through approval stages, and every decision is fully auditable.

---

## Features

- Configurable workflows and rules via JSON — no code changes needed
- Full audit trail with rule trace and decision reasoning
- Idempotent request handling (duplicate submissions are safely rejected)
- Retry logic with exponential backoff for external dependency failures
- State lifecycle tracking (submitted → under_review → approved / rejected / manual_review)
- Simulated external credit check service with failure handling
- Decision explainability — every outcome references which rules fired and why

---

## Project Structure

```
src/
  components/         # React UI components (dashboard, audit log, workflow viewer)
  engine/
    WorkflowEngine.ts     # Core engine: loads config, runs stages
    RulesEvaluator.ts     # Evaluates rules against request data
    StateManager.ts       # Lifecycle and change history
    AuditLogger.ts        # Immutable audit trail
    IdempotencyGuard.ts   # Duplicate request detection
    RetryHandler.ts       # Retry with backoff
  services/
    CreditCheckService.ts # Simulated external dependency
  config/
    workflow.config.json  # Workflow stages definition
    rules.config.json     # Business rules (editable without code changes)
  types/
    index.ts              # Shared TypeScript interfaces
public/
README.md
```

---

## Getting Started

### Prerequisites

- Node.js v18+
- npm or bun

### Install & Run

```bash
git clone https://github.com/Tavi2727/httpsgithubcomavi2727
cd httpsgithubcomavi2727
npm install
npm run dev
```

App runs at `http://localhost:5173`

### Run Tests

```bash
npm run test
```

---

## Configuration

Workflows and rules are defined in `src/config/`. No code changes are needed to modify business logic.

### Changing a Rule

Open `src/config/rules.config.json` and edit the threshold:

```json
{
  "ruleId": "MIN_CREDIT_SCORE",
  "description": "Applicant must have minimum credit score",
  "field": "creditScore",
  "operator": "gte",
  "threshold": 650
}
```

Change `650` to `700` and restart — the engine picks it up automatically.

### Adding a New Workflow Stage

Open `src/config/workflow.config.json` and add a stage object to the `stages` array.

---

## API / Interface

The system is exposed via a browser UI at the live URL. Key screens:

| Screen | Description |
|---|---|
| Submit Application | Form to submit a new loan request |
| Workflow Tracker | Live stage-by-stage status view |
| Audit Log | Full decision trace with rule references |
| Rule Config Viewer | View active rules and thresholds |

---

## Scaling Considerations

- **Horizontal scaling:** The workflow engine is stateless; state is persisted externally, so multiple instances can run in parallel
- **Queue-based intake:** High-volume intake can be fronted by a message queue (e.g. SQS/RabbitMQ) to decouple submission from processing
- **Config versioning:** Rules configs should be versioned so audits can reference the exact rule set active at decision time
- **Database:** Replace in-memory state store with PostgreSQL or DynamoDB for production persistence
- **External services:** CreditCheckService uses a circuit breaker pattern; production would use a real credit bureau API with timeout and fallback

---

## Trade-off Decisions

| Decision | Chosen Approach | Trade-off |
|---|---|---|
| Config format | JSON files | Simple to edit, but no GUI config editor |
| State storage | In-memory (demo) | Fast, but not persistent across restarts |
| Retry strategy | Exponential backoff | Handles transient failures; slow for hard failures |
| Frontend | React SPA | Easy to demo; real system would need backend API |
| Rule engine | Custom evaluator | Full control; a library like `json-rules-engine` could reduce code |

import { WorkflowRule, RuleResult } from './types';

export function evaluateRule(rule: WorkflowRule, data: Record<string, unknown>): RuleResult {
  const actualValue = getNestedValue(data, rule.field);
  let passed = false;
  let reason = '';

  try {
    switch (rule.operator) {
      case '>': passed = Number(actualValue) > Number(rule.value); break;
      case '<': passed = Number(actualValue) < Number(rule.value); break;
      case '>=': passed = Number(actualValue) >= Number(rule.value); break;
      case '<=': passed = Number(actualValue) <= Number(rule.value); break;
      case '==': passed = String(actualValue) === String(rule.value); break;
      case '!=': passed = String(actualValue) !== String(rule.value); break;
      case 'in': passed = Array.isArray(rule.value) && (rule.value as unknown[]).includes(actualValue); break;
      case 'not_in': passed = Array.isArray(rule.value) && !(rule.value as unknown[]).includes(actualValue); break;
      case 'exists': passed = actualValue !== undefined && actualValue !== null && actualValue !== ''; break;
      case 'regex': passed = new RegExp(String(rule.value)).test(String(actualValue)); break;
    }

    reason = passed
      ? `${rule.field} (${actualValue}) ${rule.operator} ${rule.value} → PASS`
      : `${rule.field} (${actualValue}) ${rule.operator} ${rule.value} → FAIL`;
  } catch (e) {
    passed = false;
    reason = `Error evaluating rule: ${(e as Error).message}`;
  }

  return {
    ruleId: rule.id,
    ruleName: rule.name,
    passed,
    field: rule.field,
    actualValue,
    expectedValue: rule.value,
    operator: rule.operator,
    reason,
  };
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((curr: unknown, key) => {
    if (curr && typeof curr === 'object') return (curr as Record<string, unknown>)[key];
    return undefined;
  }, obj);
}

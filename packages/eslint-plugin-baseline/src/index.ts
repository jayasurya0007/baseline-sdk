import type { Rule } from 'eslint';
import ruleNoNonBaseline from './rules/no-non-baseline.js';

export const rules: Record<string, Rule.RuleModule> = {
  'no-non-baseline': ruleNoNonBaseline
};

export default { rules };


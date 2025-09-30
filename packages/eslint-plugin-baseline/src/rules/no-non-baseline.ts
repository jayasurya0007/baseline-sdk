import type { Rule } from 'eslint';
import { createDefaultSdk } from '@baseline-toolkit/baseline-sdk';

const sdk = createDefaultSdk();

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow usage of features below the required Baseline',
      recommended: false
    },
    schema: [
      {
        type: 'object',
        properties: {
          target: { enum: ['limited', 'newly', 'widely'] }
        },
        additionalProperties: false
      }
    ],
    messages: {
      notBaseline: "{{name}} is not in required Baseline ({{target}})"
    }
  },
  create(context: Rule.RuleContext) {
    const options = context.options?.[0] as { target?: 'limited' | 'newly' | 'widely' } | undefined;
    const target = options?.target ?? 'widely';
    return {
      MemberExpression(node: any) {
        try {
          // Very naive mapping for demo: detect Array.prototype.toSorted
          const sourceText = context.getSourceCode().getText(node);
          if (/Array\s*\.\s*prototype\s*\.\s*toSorted/.test(sourceText) || /\btoSorted\b/.test(sourceText)) {
            if (!sdk.isSupported('js.array.toSorted', target)) {
              context.report({
                node: node.property as any,
                messageId: 'notBaseline',
                data: { name: 'Array.prototype.toSorted', target }
              });
            }
          }
        } catch {}
      }
    } as any;
  }
};

export default rule;


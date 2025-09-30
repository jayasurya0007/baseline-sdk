import { createDefaultSdk } from '@baseline-toolkit/baseline-sdk';
const sdk = createDefaultSdk();
const rule = {
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
    create(context) {
        const options = context.options?.[0];
        const target = options?.target ?? 'widely';
        return {
            MemberExpression(node) {
                try {
                    // Very naive mapping for demo: detect Array.prototype.toSorted
                    const sourceText = context.getSourceCode().getText(node);
                    if (/Array\s*\.\s*prototype\s*\.\s*toSorted/.test(sourceText) || /\btoSorted\b/.test(sourceText)) {
                        if (!sdk.isSupported('js.array.toSorted', target)) {
                            context.report({
                                node: node.property,
                                messageId: 'notBaseline',
                                data: { name: 'Array.prototype.toSorted', target }
                            });
                        }
                    }
                }
                catch { }
            }
        };
    }
};
export default rule;
//# sourceMappingURL=no-non-baseline.js.map
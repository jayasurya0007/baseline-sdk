function compareBaseline(feature, target) {
    const order = ['limited', 'newly', 'widely'];
    return order.indexOf(feature) >= order.indexOf(target);
}
class InMemoryDataSource {
    constructor(features) {
        this.byId = new Map();
        this.byName = new Map();
        this.byBcd = new Map();
        for (const f of features) {
            this.byId.set(f.id, f);
            if (f.name)
                this.byName.set(f.name, f);
            if (f.bcdId)
                this.byBcd.set(f.bcdId, f);
        }
    }
    getFeatureById(id) { return this.byId.get(id); }
    getFeatureByName(name) { return this.byName.get(name); }
    getFeatureByBcdId(bcdId) { return this.byBcd.get(bcdId); }
}
const features = [
    // Array methods
    { id: "array-by-copy", name: "Array by copy methods", status: { baseline: "newly", since: "2023-07" } },
    { id: "array-at", name: "Array.prototype.at", status: { baseline: "newly", since: "2022-03" } },
    { id: "array-findlast", name: "Array findLast methods", status: { baseline: "newly", since: "2022-09" } },
    // Promise methods
    { id: "promise-allsettled", name: "Promise.allSettled", status: { baseline: "newly", since: "2020-08" } },
    { id: "promise-any", name: "Promise.any", status: { baseline: "newly", since: "2021-08" } },
    // Modern JavaScript syntax
    { id: "optional-chaining", name: "Optional chaining (?.)", status: { baseline: "widely", since: "2020-04" } },
    { id: "nullish-coalescing", name: "Nullish coalescing (??)", status: { baseline: "widely", since: "2020-04" } },
    { id: "logical-assignment", name: "Logical assignment operators", status: { baseline: "newly", since: "2021-08" } },
    // Object methods
    { id: "object-hasown", name: "Object.hasOwn", status: { baseline: "newly", since: "2022-03" } },
    { id: "object-fromentries", name: "Object.fromEntries", status: { baseline: "widely", since: "2019-07" } },
    // String methods
    { id: "string-replaceall", name: "String.prototype.replaceAll", status: { baseline: "newly", since: "2021-08" } },
    { id: "string-matchall", name: "String.prototype.matchAll", status: { baseline: "widely", since: "2020-07" } },
    // Web APIs
    { id: "abortcontroller", name: "AbortController", status: { baseline: "widely", since: "2022-03" } },
    { id: "dynamic-import", name: "Dynamic import()", status: { baseline: "widely", since: "2020-07" } },
    { id: "bigint", name: "BigInt", status: { baseline: "widely", since: "2020-07" } }
];
const dataSource = new InMemoryDataSource(features);
function isSupported(featureId, target) {
    const rec = dataSource.getFeatureById(featureId);
    if (!rec)
        return false;
    return compareBaseline(rec.status.baseline, target);
}
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
                    const sourceText = context.getSourceCode().getText(node);
                    // Enhanced detection for array methods
                    const arrayMethods = [
                        { pattern: /\btoSorted\b/, featureId: 'array-by-copy', name: 'Array.prototype.toSorted' },
                        { pattern: /\btoReversed\b/, featureId: 'array-by-copy', name: 'Array.prototype.toReversed' },
                        { pattern: /\btoSpliced\b/, featureId: 'array-by-copy', name: 'Array.prototype.toSpliced' },
                        { pattern: /\bwith\b/, featureId: 'array-by-copy', name: 'Array.prototype.with' },
                        { pattern: /\bat\b/, featureId: 'array-at', name: 'Array.prototype.at' },
                        { pattern: /\bfindLast\b/, featureId: 'array-findlast', name: 'Array.prototype.findLast' },
                        { pattern: /\bfindLastIndex\b/, featureId: 'array-findlast', name: 'Array.prototype.findLastIndex' },
                        { pattern: /\breplaceAll\b/, featureId: 'string-replaceall', name: 'String.prototype.replaceAll' }
                    ];
                    for (const { pattern, featureId, name } of arrayMethods) {
                        if (pattern.test(sourceText)) {
                            if (!isSupported(featureId, target)) {
                                context.report({
                                    node: node.property,
                                    messageId: 'notBaseline',
                                    data: { name, target }
                                });
                            }
                        }
                    }
                }
                catch { }
            },
            CallExpression(node) {
                try {
                    const sourceText = context.getSourceCode().getText(node);
                    // Detect Promise methods
                    if (/Promise\.allSettled/.test(sourceText)) {
                        if (!isSupported('promise-allsettled', target)) {
                            context.report({
                                node: node.callee,
                                messageId: 'notBaseline',
                                data: { name: 'Promise.allSettled', target }
                            });
                        }
                    }
                    if (/Promise\.any/.test(sourceText)) {
                        if (!isSupported('promise-any', target)) {
                            context.report({
                                node: node.callee,
                                messageId: 'notBaseline',
                                data: { name: 'Promise.any', target }
                            });
                        }
                    }
                    // Detect Object.hasOwn
                    if (/Object\.hasOwn/.test(sourceText)) {
                        if (!isSupported('object-hasown', target)) {
                            context.report({
                                node: node.callee,
                                messageId: 'notBaseline',
                                data: { name: 'Object.hasOwn', target }
                            });
                        }
                    }
                    // Detect dynamic imports
                    if (node.callee.type === 'Import') {
                        if (!isSupported('dynamic-import', target)) {
                            context.report({
                                node: node.callee,
                                messageId: 'notBaseline',
                                data: { name: 'Dynamic import()', target }
                            });
                        }
                    }
                }
                catch { }
            },
            OptionalMemberExpression(node) {
                try {
                    if (!isSupported('optional-chaining', target)) {
                        context.report({
                            node: node,
                            messageId: 'notBaseline',
                            data: { name: 'Optional chaining (?.)', target }
                        });
                    }
                }
                catch { }
            },
            LogicalExpression(node) {
                try {
                    if (node.operator === '??') {
                        if (!isSupported('nullish-coalescing', target)) {
                            context.report({
                                node: node,
                                messageId: 'notBaseline',
                                data: { name: 'Nullish coalescing (??)', target }
                            });
                        }
                    }
                }
                catch { }
            },
            AssignmentExpression(node) {
                try {
                    if (['??=', '||=', '&&='].includes(node.operator)) {
                        if (!isSupported('logical-assignment', target)) {
                            context.report({
                                node: node,
                                messageId: 'notBaseline',
                                data: { name: `Logical assignment (${node.operator})`, target }
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
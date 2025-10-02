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
// Initialize with full web-features dataset
let dataSource;
// Synchronously load web-features data (this will be called once when the plugin loads)
function initializeDataSource() {
    try {
        // Use require for synchronous loading in ESLint context
        const webFeatures = require('web-features');
        const records = [];
        const entries = webFeatures.features || webFeatures.default || webFeatures;
        for (const [id, feat] of Object.entries(entries)) {
            const baseline = feat.status?.baseline === 'high' ? 'widely' :
                feat.status?.baseline === 'low' ? 'newly' : 'limited';
            const since = feat.status?.baseline_high_date || feat.status?.baseline_low_date;
            const bcdId = Array.isArray(feat.bcd) ? feat.bcd[0] : feat.bcd;
            records.push({
                id,
                name: feat.name || id,
                status: { baseline: baseline, since: since || undefined },
                bcdId: bcdId
            });
        }
        dataSource = new InMemoryDataSource(records);
        console.log(`🎯 ESLint plugin loaded ${records.length} web features from MDN dataset`);
    }
    catch (error) {
        // Fallback to basic features if web-features import fails
        console.warn('⚠️ ESLint plugin: Could not load web-features, using fallback');
        const fallbackFeatures = [
            { id: "array-by-copy", name: "Array by copy methods", status: { baseline: "newly", since: "2023-07" } },
            { id: "optional-chaining", name: "Optional chaining (?.)", status: { baseline: "widely", since: "2020-04" } }
        ];
        dataSource = new InMemoryDataSource(fallbackFeatures);
    }
}
// Initialize data source when module loads
initializeDataSource();
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
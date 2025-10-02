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
    {
        id: "js.array.toSorted",
        name: "Array.prototype.toSorted",
        status: { baseline: "newly", since: "2023-07" }
    },
    {
        id: "css.properties.scroll-timeline",
        name: "CSS scroll-timeline",
        bcdId: "css.properties.scroll-timeline",
        status: { baseline: "limited" }
    }
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
                    // Very naive mapping for demo: detect Array.prototype.toSorted
                    const sourceText = context.getSourceCode().getText(node);
                    if (/Array\s*\.\s*prototype\s*\.\s*toSorted/.test(sourceText) || /\btoSorted\b/.test(sourceText)) {
                        if (!isSupported('js.array.toSorted', target)) {
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
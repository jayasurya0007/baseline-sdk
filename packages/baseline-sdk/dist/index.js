import * as babel from '@babel/parser';
import postcss from 'postcss';
import features from './data/features.sample.js';
import { mapWebFeatureToRecord } from './webFeatures.js';
function compareBaseline(feature, target) {
    const order = ['limited', 'newly', 'widely'];
    return order.indexOf(feature) >= order.indexOf(target);
}
export class InMemoryDataSource {
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
export function createSdk(dataSource) {
    return {
        isSupported(featureId, target) {
            const rec = dataSource.getFeatureById(featureId);
            if (!rec)
                return false;
            return compareBaseline(rec.status.baseline, target);
        },
        async scanCode(source, options) {
            const issues = [];
            try {
                babel.parse(source, { sourceType: 'module', plugins: ['typescript', 'jsx'] });
                const textMatches = source.matchAll(/toSorted\b/g);
                for (const m of textMatches) {
                    const col = (m.index ?? 0);
                    const feature = dataSource.getFeatureByName('Array.prototype.toSorted');
                    if (feature && !compareBaseline(feature.status.baseline, options.target)) {
                        issues.push({ kind: 'js', featureId: feature.id, message: `${feature.name} is below required Baseline`, line: 1, column: col });
                    }
                }
            }
            catch { }
            try {
                await postcss().process(source, { from: undefined });
                const cssMatches = source.matchAll(/scroll-timeline\b/g);
                for (const m of cssMatches) {
                    const col = (m.index ?? 0);
                    const feature = dataSource.getFeatureByBcdId('css.properties.scroll-timeline');
                    if (feature && !compareBaseline(feature.status.baseline, options.target)) {
                        issues.push({ kind: 'css', featureId: feature.id, message: `CSS property 'scroll-timeline' is below required Baseline`, line: 1, column: col });
                    }
                }
            }
            catch { }
            return { issues };
        }
    };
}
export default createSdk;
export function createDefaultSdk(target = 'widely') {
    const ds = new InMemoryDataSource(features);
    return createSdk(ds);
}
export async function createWebFeaturesSdk() {
    // Dynamically import to avoid bundling for users who don't need it
    const mod = await import('web-features');
    const records = [];
    const entries = mod.features || mod.default || {};
    for (const [id, feat] of Object.entries(entries)) {
        const rec = mapWebFeatureToRecord(id, feat);
        if (rec)
            records.push(rec);
    }
    const ds = new InMemoryDataSource(records);
    return createSdk(ds);
}
//# sourceMappingURL=index.js.map
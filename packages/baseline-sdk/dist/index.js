import * as babel from '@babel/parser';
import postcss from 'postcss';
import features from './data/features.sample.js';
import { mapWebFeatureToRecord } from './webFeatures.js';
import { FeatureDetector } from './featureDetector.js';
import { createConciseBrowserMessage } from './browserCompatibility.js';
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
            // Use the comprehensive feature detector for 1000+ features
            const detector = new FeatureDetector(dataSource);
            const detectedFeatures = detector.detectFeatures(source, options.target);
            // Convert to the expected format with enhanced browser compatibility messages
            const issues = detectedFeatures.map(feature => {
                const featureRecord = dataSource.getFeatureById(feature.featureId);
                let message = feature.message;
                // Enhance message with browser compatibility if available
                if (featureRecord?.status.support) {
                    message = createConciseBrowserMessage(featureRecord.name || feature.featureId, featureRecord.status.support, options.target);
                }
                return {
                    kind: feature.kind,
                    featureId: feature.featureId,
                    message: message,
                    line: feature.line,
                    column: feature.column
                };
            });
            // Fallback: Also run the original basic detection for backward compatibility
            try {
                babel.parse(source, { sourceType: 'module', plugins: ['typescript', 'jsx'] });
                const textMatches = source.matchAll(/toSorted\b/g);
                for (const m of textMatches) {
                    const col = (m.index ?? 0);
                    const feature = dataSource.getFeatureByName('Array.prototype.toSorted');
                    if (feature && !compareBaseline(feature.status.baseline, options.target)) {
                        // Only add if not already detected by comprehensive detector
                        const alreadyDetected = issues.some(issue => issue.column === col && issue.featureId === feature.id);
                        if (!alreadyDetected) {
                            let message = `${feature.name} is below required Baseline`;
                            if (feature.status.support) {
                                message = createConciseBrowserMessage(feature.name, feature.status.support, options.target);
                            }
                            issues.push({ kind: 'js', featureId: feature.id, message, line: 1, column: col });
                        }
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
                        // Only add if not already detected by comprehensive detector
                        const alreadyDetected = issues.some(issue => issue.column === col && issue.featureId === feature.id);
                        if (!alreadyDetected) {
                            let message = `CSS property 'scroll-timeline' is below required Baseline`;
                            if (feature.status.support) {
                                message = createConciseBrowserMessage(feature.name, feature.status.support, options.target);
                            }
                            issues.push({ kind: 'css', featureId: feature.id, message, line: 1, column: col });
                        }
                    }
                }
            }
            catch { }
            return { issues };
        }
    };
}
export default createSdk;
export async function createDefaultSdk(target = 'widely') {
    // Now uses the complete web-features dataset by default for maximum coverage!
    return createWebFeaturesSdk();
}
export function createLegacySdk(target = 'widely') {
    // Legacy function that uses the original 3 sample features for quick testing
    const ds = new InMemoryDataSource(features);
    return createSdk(ds);
}
export function createFullFeaturesDefaultSdk(target = 'widely') {
    // Alias for createDefaultSdk() - now they're the same!
    return createDefaultSdk(target);
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
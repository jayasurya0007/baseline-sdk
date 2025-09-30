import type { FeatureRecord } from './types.js';
type WebFeature = {
    name: string;
    slug?: string;
    status?: {
        baseline?: 'low' | 'high' | false;
        baseline_low_date?: string;
        baseline_high_date?: string;
    };
    bcd?: string | string[];
};
export declare function mapWebFeatureToRecord(id: string, f: WebFeature): FeatureRecord | null;
export {};
//# sourceMappingURL=webFeatures.d.ts.map
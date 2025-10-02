import type { BaselineLevel, BaselineDataSource } from './types.js';
export interface DetectedFeature {
    featureId: string;
    line: number;
    column: number;
    kind: 'js' | 'css';
    message: string;
    pattern: string;
}
export declare class FeatureDetector {
    private dataSource;
    constructor(dataSource: BaselineDataSource);
    detectFeatures(source: string, target: BaselineLevel): DetectedFeature[];
    private isSupported;
    private getLineAndColumn;
}
//# sourceMappingURL=featureDetector.d.ts.map
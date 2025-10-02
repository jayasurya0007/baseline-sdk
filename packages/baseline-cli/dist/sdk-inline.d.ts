export type BaselineLevel = 'limited' | 'newly' | 'widely';
export interface FeatureStatus {
    baseline: BaselineLevel;
    since?: string;
}
export interface FeatureRecord {
    id: string;
    name: string;
    status: FeatureStatus;
    bcdId?: string;
}
export interface ScanIssue {
    kind: 'js' | 'css';
    featureId: string;
    message: string;
    line: number;
    column: number;
}
export interface ScanResult {
    issues: ScanIssue[];
}
export interface ScanOptions {
    target: BaselineLevel;
}
export interface BaselineDataSource {
    getFeatureById(id: string): FeatureRecord | undefined;
    getFeatureByName(name: string): FeatureRecord | undefined;
    getFeatureByBcdId(bcdId: string): FeatureRecord | undefined;
}
export interface BaselineSdk {
    isSupported(featureId: string, target: BaselineLevel): boolean;
    scanCode(source: string, options: ScanOptions): Promise<ScanResult>;
}
export declare class InMemoryDataSource implements BaselineDataSource {
    private byId;
    private byName;
    private byBcd;
    constructor(features: any[]);
    getFeatureById(id: string): any;
    getFeatureByName(name: string): any;
    getFeatureByBcdId(bcdId: string): any;
}
export declare function createSdk(dataSource: BaselineDataSource): BaselineSdk;
export declare function createDefaultSdk(): BaselineSdk;
export declare function createWebFeaturesSdk(): Promise<BaselineSdk>;
//# sourceMappingURL=sdk-inline.d.ts.map
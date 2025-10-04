export type BaselineLevel = 'limited' | 'newly' | 'widely';
export interface BrowserSupport {
    chrome?: string;
    chrome_android?: string;
    edge?: string;
    firefox?: string;
    firefox_android?: string;
    safari?: string;
    safari_ios?: string;
}
export interface FeatureStatus {
    baseline: BaselineLevel;
    since?: string;
    support?: BrowserSupport;
}
export interface FeatureRecord {
    id: string;
    name: string;
    status: FeatureStatus;
    bcdId?: string;
    description?: string;
    spec?: string | string[];
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
export {};
//# sourceMappingURL=types.d.ts.map
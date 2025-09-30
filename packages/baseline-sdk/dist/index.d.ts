import type { BaselineLevel, BaselineSdk, BaselineDataSource } from './types.js';
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
export default createSdk;
export declare function createDefaultSdk(target?: BaselineLevel): BaselineSdk;
export declare function createWebFeaturesSdk(): Promise<BaselineSdk>;
//# sourceMappingURL=index.d.ts.map
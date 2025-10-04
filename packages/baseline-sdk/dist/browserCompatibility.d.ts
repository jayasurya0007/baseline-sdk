export interface BrowserSupport {
    chrome?: string;
    chrome_android?: string;
    edge?: string;
    firefox?: string;
    firefox_android?: string;
    safari?: string;
    safari_ios?: string;
}
export interface EnhancedFeatureRecord {
    id: string;
    name: string;
    status: {
        baseline: 'limited' | 'newly' | 'widely';
        since?: string;
    };
    bcdId?: string;
    browserSupport?: BrowserSupport;
    description?: string;
    spec?: string | string[];
}
export interface BrowserCompatibilityInfo {
    browsers: string[];
    minVersions: {
        [browser: string]: string;
    };
    supportPercentage: number;
    formatted: string;
}
/**
 * Format browser support information into a readable string
 */
export declare function formatBrowserSupport(support: BrowserSupport): string;
/**
 * Calculate browser support percentage based on major browsers
 */
export declare function calculateSupportPercentage(support: BrowserSupport): number;
/**
 * Get browser compatibility information for a feature
 */
export declare function getBrowserCompatibility(support: BrowserSupport): BrowserCompatibilityInfo;
/**
 * Create a detailed browser support message
 */
export declare function createBrowserSupportMessage(featureName: string, baseline: string, support: BrowserSupport, target: 'limited' | 'newly' | 'widely'): string;
/**
 * Create a concise browser support message for CLI/ESLint
 */
export declare function createConciseBrowserMessage(featureName: string, support: BrowserSupport, target: 'limited' | 'newly' | 'widely'): string;
//# sourceMappingURL=browserCompatibility.d.ts.map
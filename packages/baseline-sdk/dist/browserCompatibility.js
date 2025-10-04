/**
 * Format browser support information into a readable string
 */
export function formatBrowserSupport(support) {
    const browserNames = {
        chrome: 'Chrome',
        chrome_android: 'Chrome Android',
        edge: 'Edge',
        firefox: 'Firefox',
        firefox_android: 'Firefox Android',
        safari: 'Safari',
        safari_ios: 'Safari iOS'
    };
    const entries = Object.entries(support)
        .filter(([_, version]) => version && version !== 'false')
        .map(([browser, version]) => `${browserNames[browser] || browser} ${version}+`)
        .sort();
    return entries.join(', ');
}
/**
 * Calculate browser support percentage based on major browsers
 */
export function calculateSupportPercentage(support) {
    const majorBrowsers = ['chrome', 'firefox', 'safari', 'edge'];
    const supportedBrowsers = majorBrowsers.filter(browser => support[browser] &&
        support[browser] !== 'false');
    return Math.round((supportedBrowsers.length / majorBrowsers.length) * 100);
}
/**
 * Get browser compatibility information for a feature
 */
export function getBrowserCompatibility(support) {
    const browsers = Object.keys(support).filter(browser => support[browser] &&
        support[browser] !== 'false');
    const minVersions = {};
    Object.entries(support).forEach(([browser, version]) => {
        if (version && version !== 'false') {
            minVersions[browser] = version;
        }
    });
    const supportPercentage = calculateSupportPercentage(support);
    const formatted = formatBrowserSupport(support);
    return {
        browsers,
        minVersions,
        supportPercentage,
        formatted
    };
}
/**
 * Create a detailed browser support message
 */
export function createBrowserSupportMessage(featureName, baseline, support, target) {
    const compat = getBrowserCompatibility(support);
    const baselineEmoji = baseline === 'high' ? '✅' : baseline === 'low' ? '⚠️' : '❌';
    return `${baselineEmoji} ${featureName}
Baseline: ${baseline} (${target} required)
Browser Support: ${compat.formatted}
Support: ${compat.supportPercentage}% of major browsers`;
}
/**
 * Create a concise browser support message for CLI/ESLint
 */
export function createConciseBrowserMessage(featureName, support, target) {
    const compat = getBrowserCompatibility(support);
    return `${featureName} is below required Baseline (${target}) - Supported in: ${compat.formatted}`;
}
//# sourceMappingURL=browserCompatibility.js.map
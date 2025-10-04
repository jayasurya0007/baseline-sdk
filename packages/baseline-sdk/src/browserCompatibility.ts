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
  minVersions: { [browser: string]: string };
  supportPercentage: number;
  formatted: string;
}

/**
 * Format browser support information into a readable string
 */
export function formatBrowserSupport(support: BrowserSupport): string {
  const browserNames: { [key: string]: string } = {
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
export function calculateSupportPercentage(support: BrowserSupport): number {
  const majorBrowsers = ['chrome', 'firefox', 'safari', 'edge'];
  const supportedBrowsers = majorBrowsers.filter(browser => 
    support[browser as keyof BrowserSupport] && 
    support[browser as keyof BrowserSupport] !== 'false'
  );
  
  return Math.round((supportedBrowsers.length / majorBrowsers.length) * 100);
}

/**
 * Get browser compatibility information for a feature
 */
export function getBrowserCompatibility(support: BrowserSupport): BrowserCompatibilityInfo {
  const browsers = Object.keys(support).filter(browser => 
    support[browser as keyof BrowserSupport] && 
    support[browser as keyof BrowserSupport] !== 'false'
  );
  
  const minVersions: { [browser: string]: string } = {};
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
export function createBrowserSupportMessage(
  featureName: string, 
  baseline: string, 
  support: BrowserSupport,
  target: 'limited' | 'newly' | 'widely'
): string {
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
export function createConciseBrowserMessage(
  featureName: string,
  support: BrowserSupport,
  target: 'limited' | 'newly' | 'widely'
): string {
  const compat = getBrowserCompatibility(support);
  return `${featureName} is below required Baseline (${target}) - Supported in: ${compat.formatted}`;
}

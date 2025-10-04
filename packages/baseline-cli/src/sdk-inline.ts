// Inlined SDK code for CLI to avoid external dependencies
import * as babel from '@babel/parser';
import postcss from 'postcss';

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

export interface ScanIssue { kind: 'js' | 'css'; featureId: string; message: string; line: number; column: number; }
export interface ScanResult { issues: ScanIssue[]; }
export interface ScanOptions { target: BaselineLevel; }

export interface BaselineDataSource {
  getFeatureById(id: string): FeatureRecord | undefined;
  getFeatureByName(name: string): FeatureRecord | undefined;
  getFeatureByBcdId(bcdId: string): FeatureRecord | undefined;
}

export interface BaselineSdk {
  isSupported(featureId: string, target: BaselineLevel): boolean;
  scanCode(source: string, options: ScanOptions): Promise<ScanResult>;
}

function compareBaseline(feature: BaselineLevel, target: BaselineLevel): boolean {
  const order: BaselineLevel[] = ['limited', 'newly', 'widely'];
  return order.indexOf(feature) >= order.indexOf(target);
}

/**
 * Format browser support information into a readable string
 */
function formatBrowserSupport(support: BrowserSupport): string {
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
 * Create a concise browser support message for CLI
 */
function createConciseBrowserMessage(
  featureName: string,
  support: BrowserSupport,
  target: 'limited' | 'newly' | 'widely'
): string {
  const formatted = formatBrowserSupport(support);
  return `${featureName} is below required Baseline (${target}) - Supported in: ${formatted}`;
}

export class InMemoryDataSource implements BaselineDataSource {
  private byId = new Map<string, any>();
  private byName = new Map<string, any>();
  private byBcd = new Map<string, any>();
  constructor(features: any[]) {
    for (const f of features) {
      this.byId.set(f.id, f);
      if (f.name) this.byName.set(f.name, f);
      if (f.bcdId) this.byBcd.set(f.bcdId, f);
    }
  }
  getFeatureById(id: string) { return this.byId.get(id); }
  getFeatureByName(name: string) { return this.byName.get(name); }
  getFeatureByBcdId(bcdId: string) { return this.byBcd.get(bcdId); }
}

export function createSdk(dataSource: BaselineDataSource): BaselineSdk {
  return {
    isSupported(featureId: string, target: BaselineLevel): boolean {
      const rec = dataSource.getFeatureById(featureId);
      if (!rec) return false;
      return compareBaseline(rec.status.baseline, target);
    },
    async scanCode(source: string, options: ScanOptions): Promise<ScanResult> {
      const issues: ScanIssue[] = [];
      
      // Use comprehensive feature detection patterns that match web-features dataset
      const jsPatterns = [
        { pattern: /\.toSorted\b/g, featureId: 'array-by-copy', name: 'Array.prototype.toSorted' },
        { pattern: /\.toReversed\b/g, featureId: 'array-by-copy', name: 'Array.prototype.toReversed' },
        { pattern: /\.toSpliced\b/g, featureId: 'array-by-copy', name: 'Array.prototype.toSpliced' },
        { pattern: /\.with\b/g, featureId: 'array-by-copy', name: 'Array.prototype.with' },
        { pattern: /\.at\b/g, featureId: 'array-at', name: 'Array.prototype.at' },
        { pattern: /\.findLast\b/g, featureId: 'array-findlast', name: 'Array.prototype.findLast' },
        { pattern: /\.findLastIndex\b/g, featureId: 'array-findlast', name: 'Array.prototype.findLastIndex' },
        { pattern: /Promise\.allSettled\b/g, featureId: 'promise-allsettled', name: 'Promise.allSettled' },
        { pattern: /Promise\.any\b/g, featureId: 'promise-any', name: 'Promise.any' },
        { pattern: /\?\./g, featureId: 'optional-chaining', name: 'Optional chaining (?.)' },
        { pattern: /\?\?(?!=)/g, featureId: 'nullish-coalescing', name: 'Nullish coalescing (??)' },
        { pattern: /\?\?=/g, featureId: 'logical-assignment', name: 'Nullish coalescing assignment (??=)' },
        { pattern: /Object\.hasOwn\b/g, featureId: 'object-hasown', name: 'Object.hasOwn' },
        { pattern: /\.replaceAll\b/g, featureId: 'string-replaceall', name: 'String.prototype.replaceAll' },
        { pattern: /new AbortController\b/g, featureId: 'abortcontroller', name: 'AbortController' },
        { pattern: /import\s*\(/g, featureId: 'dynamic-import', name: 'Dynamic import()' },
        { pattern: /\d+n\b/g, featureId: 'bigint', name: 'BigInt literals' }
      ];
      
      for (const { pattern, featureId, name } of jsPatterns) {
        const matches = source.matchAll(pattern);
        for (const m of matches) {
          const col = (m.index ?? 0);
          const feature = dataSource.getFeatureById(featureId);
          if (feature && !compareBaseline(feature.status.baseline, options.target)) {
            let message = `${name} is below required Baseline (${options.target})`;
            if (feature.status.support) {
              message = createConciseBrowserMessage(feature.name || name, feature.status.support, options.target);
            }
            issues.push({ kind: 'js', featureId: feature.id, message, line: 1, column: col });
          }
        }
      }

      try {
        await postcss().process(source, { from: undefined });
        // Enhanced CSS feature detection
        const cssPatterns = [
          { pattern: /display:\s*grid\b/gi, featureId: 'grid', name: 'CSS Grid Layout' },
          { pattern: /display:\s*flex\b/gi, featureId: 'flexbox', name: 'CSS Flexbox' },
          { pattern: /display:\s*contents\b/gi, featureId: 'display-contents', name: 'display: contents' },
          { pattern: /gap:/gi, featureId: 'flexbox-gap', name: 'Gap property' },
          { pattern: /@container\b/gi, featureId: 'container-queries', name: 'Container queries' },
          { pattern: /container-type:/gi, featureId: 'container-queries', name: 'container-type property' },
          { pattern: /aspect-ratio:/gi, featureId: 'aspect-ratio', name: 'aspect-ratio property' },
          { pattern: /accent-color:/gi, featureId: 'accent-color', name: 'accent-color property' },
          { pattern: /backdrop-filter:/gi, featureId: 'backdrop-filter', name: 'backdrop-filter property' },
          { pattern: /scroll-timeline:/gi, featureId: 'scroll-timeline', name: 'scroll-timeline property' },
          { pattern: /scroll-snap-type:/gi, featureId: 'scroll-snap', name: 'CSS Scroll Snap' },
          { pattern: /color-mix\s*\(/gi, featureId: 'color-mix', name: 'color-mix() function' },
          { pattern: /oklch\s*\(/gi, featureId: 'oklch', name: 'oklch() color function' },
          { pattern: /:has\s*\(/gi, featureId: 'css-has', name: ':has() pseudo-class' },
          { pattern: /:where\s*\(/gi, featureId: 'css-where', name: ':where() pseudo-class' },
          { pattern: /:is\s*\(/gi, featureId: 'css-is', name: ':is() pseudo-class' },
          { pattern: /inline-size:/gi, featureId: 'logical-properties', name: 'Logical properties (inline-size)' },
          { pattern: /view-transition-name:/gi, featureId: 'view-transitions', name: 'View Transitions API' },
          { pattern: /&\s*[.#\[:]/gi, featureId: 'css-nesting', name: 'CSS Nesting' }
        ];
        
        for (const { pattern, featureId, name } of cssPatterns) {
          const matches = source.matchAll(pattern);
          for (const m of matches) {
            const col = (m.index ?? 0);
            const feature = dataSource.getFeatureById(featureId);
            if (feature && !compareBaseline(feature.status.baseline, options.target)) {
              let message = `${name} is below required Baseline (${options.target})`;
              if (feature.status.support) {
                message = createConciseBrowserMessage(feature.name || name, feature.status.support, options.target);
              }
              issues.push({ kind: 'css', featureId: feature.id, message, line: 1, column: col });
            }
          }
        }
      } catch {}

      return { issues };
    }
  };
}

// Comprehensive features data for enhanced detection
const features = [
  // Array methods
  { 
    "id": "array-by-copy", 
    "name": "Array by copy methods", 
    "status": { 
      "baseline": "newly" as BaselineLevel, 
      "since": "2023-07",
      "support": {
        "chrome": "110",
        "chrome_android": "110",
        "edge": "110",
        "firefox": "115",
        "firefox_android": "115",
        "safari": "16",
        "safari_ios": "16"
      }
    } 
  },
  { 
    "id": "array-at", 
    "name": "Array.prototype.at", 
    "status": { 
      "baseline": "newly" as BaselineLevel, 
      "since": "2022-03",
      "support": {
        "chrome": "92",
        "chrome_android": "92",
        "edge": "92",
        "firefox": "90",
        "firefox_android": "90",
        "safari": "15.4",
        "safari_ios": "15.4"
      }
    } 
  },
  { 
    "id": "array-findlast", 
    "name": "Array findLast methods", 
    "status": { 
      "baseline": "newly" as BaselineLevel, 
      "since": "2022-09",
      "support": {
        "chrome": "97",
        "chrome_android": "97",
        "edge": "97",
        "firefox": "104",
        "firefox_android": "104",
        "safari": "15.4",
        "safari_ios": "15.4"
      }
    } 
  },
  
  // Promise methods
  { 
    "id": "promise-allsettled", 
    "name": "Promise.allSettled", 
    "status": { 
      "baseline": "newly" as BaselineLevel, 
      "since": "2020-08",
      "support": {
        "chrome": "76",
        "chrome_android": "76",
        "edge": "79",
        "firefox": "71",
        "firefox_android": "71",
        "safari": "13",
        "safari_ios": "13"
      }
    } 
  },
  { 
    "id": "promise-any", 
    "name": "Promise.any", 
    "status": { 
      "baseline": "newly" as BaselineLevel, 
      "since": "2021-08",
      "support": {
        "chrome": "85",
        "chrome_android": "85",
        "edge": "85",
        "firefox": "79",
        "firefox_android": "79",
        "safari": "14",
        "safari_ios": "14"
      }
    } 
  },
  
  // Modern JavaScript syntax
  { "id": "optional-chaining", "name": "Optional chaining (?.)", "status": { "baseline": "widely" as BaselineLevel, "since": "2020-04" } },
  { "id": "nullish-coalescing", "name": "Nullish coalescing (??)", "status": { "baseline": "widely" as BaselineLevel, "since": "2020-04" } },
  { "id": "logical-assignment", "name": "Logical assignment operators", "status": { "baseline": "newly" as BaselineLevel, "since": "2021-08" } },
  
  // Object methods
  { "id": "object-hasown", "name": "Object.hasOwn", "status": { "baseline": "newly" as BaselineLevel, "since": "2022-03" } },
  { "id": "object-fromentries", "name": "Object.fromEntries", "status": { "baseline": "widely" as BaselineLevel, "since": "2019-07" } },
  
  // String methods
  { "id": "string-replaceall", "name": "String.prototype.replaceAll", "status": { "baseline": "newly" as BaselineLevel, "since": "2021-08" } },
  { "id": "string-matchall", "name": "String.prototype.matchAll", "status": { "baseline": "widely" as BaselineLevel, "since": "2020-07" } },
  { "id": "string-trim", "name": "String trim methods", "status": { "baseline": "widely" as BaselineLevel, "since": "2019-07" } },
  
  // Web APIs
  { "id": "abortcontroller", "name": "AbortController", "status": { "baseline": "widely" as BaselineLevel, "since": "2022-03" } },
  { "id": "abortsignal-timeout", "name": "AbortSignal.timeout", "status": { "baseline": "newly" as BaselineLevel, "since": "2022-09" } },
  { "id": "dynamic-import", "name": "Dynamic import()", "status": { "baseline": "widely" as BaselineLevel, "since": "2020-07" } },
  { "id": "bigint", "name": "BigInt", "status": { "baseline": "widely" as BaselineLevel, "since": "2020-07" } },
  
  // CSS Layout
  { "id": "grid", "name": "CSS Grid Layout", "status": { "baseline": "widely" as BaselineLevel, "since": "2017-03" } },
  { "id": "flexbox", "name": "CSS Flexbox", "status": { "baseline": "widely" as BaselineLevel, "since": "2017-03" } },
  { "id": "flexbox-gap", "name": "Gap in Flexbox", "status": { "baseline": "widely" as BaselineLevel, "since": "2021-04" } },
  { "id": "display-contents", "name": "display: contents", "status": { "baseline": "newly" as BaselineLevel, "since": "2020-01" } },
  
  // CSS Container Queries
  { "id": "container-queries", "name": "CSS Container Queries", "status": { "baseline": "newly" as BaselineLevel, "since": "2022-09" } },
  
  // CSS Properties
  { "id": "aspect-ratio", "name": "aspect-ratio property", "status": { "baseline": "widely" as BaselineLevel, "since": "2021-08" } },
  { "id": "accent-color", "name": "accent-color property", "status": { "baseline": "newly" as BaselineLevel, "since": "2021-08" } },
  { "id": "backdrop-filter", "name": "backdrop-filter property", "status": { "baseline": "newly" as BaselineLevel, "since": "2021-03" } },
  { "id": "scroll-behavior", "name": "scroll-behavior property", "status": { "baseline": "widely" as BaselineLevel, "since": "2018-09" } },
  { "id": "scroll-snap", "name": "CSS Scroll Snap", "status": { "baseline": "widely" as BaselineLevel, "since": "2019-09" } },
  { "id": "scroll-timeline", "name": "scroll-timeline property", "status": { "baseline": "limited" as BaselineLevel } },
  
  // CSS Color Functions
  { "id": "color-mix", "name": "color-mix() function", "status": { "baseline": "limited" as BaselineLevel } },
  { "id": "oklch", "name": "oklch() color function", "status": { "baseline": "limited" as BaselineLevel } },
  { "id": "oklab", "name": "oklab() color function", "status": { "baseline": "limited" as BaselineLevel } },
  { "id": "lab-colors", "name": "Lab color functions", "status": { "baseline": "limited" as BaselineLevel } },
  
  // CSS Selectors
  { "id": "css-has", "name": ":has() pseudo-class", "status": { "baseline": "newly" as BaselineLevel, "since": "2022-12" } },
  { "id": "css-where", "name": ":where() pseudo-class", "status": { "baseline": "newly" as BaselineLevel, "since": "2021-04" } },
  { "id": "css-is", "name": ":is() pseudo-class", "status": { "baseline": "newly" as BaselineLevel, "since": "2021-04" } },
  
  // CSS Logical Properties
  { "id": "logical-properties", "name": "CSS Logical Properties", "status": { "baseline": "newly" as BaselineLevel, "since": "2021-04" } },
  
  // CSS View Transitions
  { "id": "view-transitions", "name": "View Transitions API", "status": { "baseline": "limited" as BaselineLevel } },
  
  // CSS Nesting
  { "id": "css-nesting", "name": "CSS Nesting", "status": { "baseline": "newly" as BaselineLevel, "since": "2023-03" } }
];

export function createDefaultSdk(): BaselineSdk {
  const ds = new InMemoryDataSource(features);
  return createSdk(ds);
}

// Function to map web-features data to our internal format
function mapWebFeatureToRecord(id: string, feat: any): any {
  const baseline = feat.status?.baseline === 'high' ? 'widely' : feat.status?.baseline === 'low' ? 'newly' : 'limited';
  const since = feat.status?.baseline_high_date || feat.status?.baseline_low_date;
  const bcdId = Array.isArray(feat.bcd) ? feat.bcd[0] : feat.bcd;
  const support = feat.status?.support;
  
  return {
    id,
    name: feat.name || id,
    status: { 
      baseline: baseline, 
      since: since || undefined,
      support: support || undefined
    },
    bcdId: bcdId,
    description: feat.description,
    spec: feat.spec
  };
}

export async function createWebFeaturesSdk(): Promise<BaselineSdk> {
  // Dynamically import to load the full web-features dataset
  const mod = await import('web-features');
  const records: any[] = [];
  const entries = (mod as any).features || (mod as any).default || {};
  
  for (const [id, feat] of Object.entries(entries as Record<string, any>)) {
    const rec = mapWebFeatureToRecord(id, feat as any);
    if (rec) records.push(rec);
  }
  
  console.log(`📊 Loaded ${records.length} web features from MDN dataset`);
  const ds = new InMemoryDataSource(records);
  return createSdk(ds);
}

import * as babel from '@babel/parser';
import postcss from 'postcss';
import type { BaselineLevel, BaselineSdk, BaselineDataSource, ScanOptions, ScanResult, ScanIssue } from './types.js';
import features from './data/features.sample.js';
import { mapWebFeatureToRecord } from './webFeatures.js';
import { FeatureDetector } from './featureDetector.js';
import { createConciseBrowserMessage, createBrowserSupportMessage } from './browserCompatibility.js';

function compareBaseline(feature: BaselineLevel, target: BaselineLevel): boolean {
  const order: BaselineLevel[] = ['limited', 'newly', 'widely'];
  return order.indexOf(feature) >= order.indexOf(target);
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
      // Use the comprehensive feature detector for 1000+ features
      const detector = new FeatureDetector(dataSource);
      const detectedFeatures = detector.detectFeatures(source, options.target);
      
      // Convert to the expected format with enhanced browser compatibility messages
      const issues: ScanIssue[] = detectedFeatures.map(feature => {
        const featureRecord = dataSource.getFeatureById(feature.featureId);
        let message = feature.message;
        
        // Enhance message with browser compatibility if available
        if (featureRecord?.status.support) {
          message = createConciseBrowserMessage(
            featureRecord.name || feature.featureId,
            featureRecord.status.support,
            options.target
          );
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
            const alreadyDetected = issues.some(issue => 
              issue.column === col && issue.featureId === feature.id
            );
            if (!alreadyDetected) {
              let message = `${feature.name} is below required Baseline`;
              if (feature.status.support) {
                message = createConciseBrowserMessage(feature.name, feature.status.support, options.target);
              }
              issues.push({ kind: 'js', featureId: feature.id, message, line: 1, column: col });
            }
          }
        }
      } catch {}

      try {
        await postcss().process(source, { from: undefined });
        const cssMatches = source.matchAll(/scroll-timeline\b/g);
        for (const m of cssMatches) {
          const col = (m.index ?? 0);
          const feature = dataSource.getFeatureByBcdId('css.properties.scroll-timeline');
          if (feature && !compareBaseline(feature.status.baseline, options.target)) {
            // Only add if not already detected by comprehensive detector
            const alreadyDetected = issues.some(issue => 
              issue.column === col && issue.featureId === feature.id
            );
            if (!alreadyDetected) {
              let message = `CSS property 'scroll-timeline' is below required Baseline`;
              if (feature.status.support) {
                message = createConciseBrowserMessage(feature.name, feature.status.support, options.target);
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

export default createSdk;

export async function createDefaultSdk(target: BaselineLevel = 'widely'): Promise<BaselineSdk> {
  // Now uses the complete web-features dataset by default for maximum coverage!
  return createWebFeaturesSdk();
}

export function createLegacySdk(target: BaselineLevel = 'widely'): BaselineSdk {
  // Legacy function that uses the original 3 sample features for quick testing
  const ds = new InMemoryDataSource(features as any[]);
  return createSdk(ds);
}

export function createFullFeaturesDefaultSdk(target: BaselineLevel = 'widely'): Promise<BaselineSdk> {
  // Alias for createDefaultSdk() - now they're the same!
  return createDefaultSdk(target);
}

export async function createWebFeaturesSdk(): Promise<BaselineSdk> {
  // Dynamically import to avoid bundling for users who don't need it
  const mod = await import('web-features');
  const records: any[] = [];
  const entries = (mod as any).features || (mod as any).default || {};
  for (const [id, feat] of Object.entries(entries as Record<string, any>)) {
    const rec = mapWebFeatureToRecord(id, feat as any);
    if (rec) records.push(rec);
  }
  const ds = new InMemoryDataSource(records);
  return createSdk(ds);
}


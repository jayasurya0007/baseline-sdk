import * as babel from '@babel/parser';
import postcss from 'postcss';
import type { BaselineLevel, BaselineSdk, BaselineDataSource, ScanOptions, ScanResult, ScanIssue } from './types.js';
import features from './data/features.sample.js';
import { mapWebFeatureToRecord } from './webFeatures.js';

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
      const issues: ScanIssue[] = [];
      try {
        babel.parse(source, { sourceType: 'module', plugins: ['typescript', 'jsx'] });
        const textMatches = source.matchAll(/toSorted\b/g);
        for (const m of textMatches) {
          const col = (m.index ?? 0);
          const feature = dataSource.getFeatureByName('Array.prototype.toSorted');
          if (feature && !compareBaseline(feature.status.baseline, options.target)) {
            issues.push({ kind: 'js', featureId: feature.id, message: `${feature.name} is below required Baseline`, line: 1, column: col });
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
            issues.push({ kind: 'css', featureId: feature.id, message: `CSS property 'scroll-timeline' is below required Baseline`, line: 1, column: col });
          }
        }
      } catch {}

      return { issues };
    }
  };
}

export default createSdk;

export function createDefaultSdk(target: BaselineLevel = 'widely'): BaselineSdk {
  const ds = new InMemoryDataSource(features as any[]);
  return createSdk(ds);
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


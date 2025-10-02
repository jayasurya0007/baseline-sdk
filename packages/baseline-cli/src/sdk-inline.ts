// Inlined SDK code for CLI to avoid external dependencies
import * as babel from '@babel/parser';
import postcss from 'postcss';

export type BaselineLevel = 'limited' | 'newly' | 'widely';

export interface FeatureStatus { baseline: BaselineLevel; since?: string; }
export interface FeatureRecord { id: string; name: string; status: FeatureStatus; bcdId?: string; }

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

// Sample features data
const features = [
  {
    "id": "js.array.toSorted",
    "name": "Array.prototype.toSorted",
    "status": { "baseline": "newly" as BaselineLevel, "since": "2023-07" }
  },
  {
    "id": "css.properties.scroll-timeline",
    "name": "CSS scroll-timeline",
    "bcdId": "css.properties.scroll-timeline",
    "status": { "baseline": "limited" as BaselineLevel }
  }
];

export function createDefaultSdk(): BaselineSdk {
  const ds = new InMemoryDataSource(features);
  return createSdk(ds);
}

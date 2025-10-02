import type { Rule } from 'eslint';

// Inline SDK to avoid circular dependencies
type BaselineLevel = 'limited' | 'newly' | 'widely';
interface BaselineFeature {
  id: string;
  name?: string;
  bcdId?: string;
  status: { baseline: BaselineLevel; since?: string };
}

function compareBaseline(feature: BaselineLevel, target: BaselineLevel): boolean {
  const order = ['limited', 'newly', 'widely'];
  return order.indexOf(feature) >= order.indexOf(target);
}

class InMemoryDataSource {
  private byId = new Map<string, BaselineFeature>();
  private byName = new Map<string, BaselineFeature>();
  private byBcd = new Map<string, BaselineFeature>();

  constructor(features: BaselineFeature[]) {
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

const features: BaselineFeature[] = [
  {
    id: "js.array.toSorted",
    name: "Array.prototype.toSorted",
    status: { baseline: "newly", since: "2023-07" }
  },
  {
    id: "css.properties.scroll-timeline",
    name: "CSS scroll-timeline",
    bcdId: "css.properties.scroll-timeline",
    status: { baseline: "limited" }
  }
];

const dataSource = new InMemoryDataSource(features);

function isSupported(featureId: string, target: BaselineLevel): boolean {
  const rec = dataSource.getFeatureById(featureId);
  if (!rec) return false;
  return compareBaseline(rec.status.baseline, target);
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow usage of features below the required Baseline',
      recommended: false
    },
    schema: [
      {
        type: 'object',
        properties: {
          target: { enum: ['limited', 'newly', 'widely'] }
        },
        additionalProperties: false
      }
    ],
    messages: {
      notBaseline: "{{name}} is not in required Baseline ({{target}})"
    }
  },
  create(context: Rule.RuleContext) {
    const options = context.options?.[0] as { target?: 'limited' | 'newly' | 'widely' } | undefined;
    const target = options?.target ?? 'widely';
    return {
      MemberExpression(node: any) {
        try {
          // Very naive mapping for demo: detect Array.prototype.toSorted
          const sourceText = context.getSourceCode().getText(node);
          if (/Array\s*\.\s*prototype\s*\.\s*toSorted/.test(sourceText) || /\btoSorted\b/.test(sourceText)) {
            if (!isSupported('js.array.toSorted', target)) {
              context.report({
                node: node.property as any,
                messageId: 'notBaseline',
                data: { name: 'Array.prototype.toSorted', target }
              });
            }
          }
        } catch {}
      }
    } as any;
  }
};

export default rule;


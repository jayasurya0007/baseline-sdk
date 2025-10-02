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

// Initialize with full web-features dataset
let dataSource: InMemoryDataSource;

// Synchronously load web-features data (this will be called once when the plugin loads)
function initializeDataSource(): void {
  try {
    // Use require for synchronous loading in ESLint context
    const webFeatures = require('web-features');
    const records: BaselineFeature[] = [];
    const entries = webFeatures.features || webFeatures.default || webFeatures;
    
    for (const [id, feat] of Object.entries(entries as Record<string, any>)) {
      const baseline = (feat as any).status?.baseline === 'high' ? 'widely' : 
                      (feat as any).status?.baseline === 'low' ? 'newly' : 'limited';
      const since = (feat as any).status?.baseline_high_date || (feat as any).status?.baseline_low_date;
      const bcdId = Array.isArray((feat as any).bcd) ? (feat as any).bcd[0] : (feat as any).bcd;
      
      records.push({
        id,
        name: (feat as any).name || id,
        status: { baseline: baseline as BaselineLevel, since: since || undefined },
        bcdId: bcdId
      });
    }
    
    dataSource = new InMemoryDataSource(records);
    console.log(`🎯 ESLint plugin loaded ${records.length} web features from MDN dataset`);
  } catch (error) {
    // Fallback to basic features if web-features import fails
    console.warn('⚠️ ESLint plugin: Could not load web-features, using fallback');
    const fallbackFeatures: BaselineFeature[] = [
      { id: "array-by-copy", name: "Array by copy methods", status: { baseline: "newly", since: "2023-07" } },
      { id: "optional-chaining", name: "Optional chaining (?.)", status: { baseline: "widely", since: "2020-04" } }
    ];
    dataSource = new InMemoryDataSource(fallbackFeatures);
  }
}

// Initialize data source when module loads
initializeDataSource();

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
          const sourceText = context.getSourceCode().getText(node);
          
          // Enhanced detection for array methods
          const arrayMethods = [
            { pattern: /\btoSorted\b/, featureId: 'array-by-copy', name: 'Array.prototype.toSorted' },
            { pattern: /\btoReversed\b/, featureId: 'array-by-copy', name: 'Array.prototype.toReversed' },
            { pattern: /\btoSpliced\b/, featureId: 'array-by-copy', name: 'Array.prototype.toSpliced' },
            { pattern: /\bwith\b/, featureId: 'array-by-copy', name: 'Array.prototype.with' },
            { pattern: /\bat\b/, featureId: 'array-at', name: 'Array.prototype.at' },
            { pattern: /\bfindLast\b/, featureId: 'array-findlast', name: 'Array.prototype.findLast' },
            { pattern: /\bfindLastIndex\b/, featureId: 'array-findlast', name: 'Array.prototype.findLastIndex' },
            { pattern: /\breplaceAll\b/, featureId: 'string-replaceall', name: 'String.prototype.replaceAll' }
          ];
          
          for (const { pattern, featureId, name } of arrayMethods) {
            if (pattern.test(sourceText)) {
              if (!isSupported(featureId, target)) {
                context.report({
                  node: node.property as any,
                  messageId: 'notBaseline',
                  data: { name, target }
                });
              }
            }
          }
        } catch {}
      },
      
      CallExpression(node: any) {
        try {
          const sourceText = context.getSourceCode().getText(node);
          
          // Detect Promise methods
          if (/Promise\.allSettled/.test(sourceText)) {
            if (!isSupported('promise-allsettled', target)) {
              context.report({
                node: node.callee as any,
                messageId: 'notBaseline',
                data: { name: 'Promise.allSettled', target }
              });
            }
          }
          
          if (/Promise\.any/.test(sourceText)) {
            if (!isSupported('promise-any', target)) {
              context.report({
                node: node.callee as any,
                messageId: 'notBaseline',
                data: { name: 'Promise.any', target }
              });
            }
          }
          
          // Detect Object.hasOwn
          if (/Object\.hasOwn/.test(sourceText)) {
            if (!isSupported('object-hasown', target)) {
              context.report({
                node: node.callee as any,
                messageId: 'notBaseline',
                data: { name: 'Object.hasOwn', target }
              });
            }
          }
          
          // Detect dynamic imports
          if (node.callee.type === 'Import') {
            if (!isSupported('dynamic-import', target)) {
              context.report({
                node: node.callee as any,
                messageId: 'notBaseline',
                data: { name: 'Dynamic import()', target }
              });
            }
          }
        } catch {}
      },
      
      OptionalMemberExpression(node: any) {
        try {
          if (!isSupported('optional-chaining', target)) {
            context.report({
              node: node as any,
              messageId: 'notBaseline',
              data: { name: 'Optional chaining (?.)', target }
            });
          }
        } catch {}
      },
      
      LogicalExpression(node: any) {
        try {
          if (node.operator === '??') {
            if (!isSupported('nullish-coalescing', target)) {
              context.report({
                node: node as any,
                messageId: 'notBaseline',
                data: { name: 'Nullish coalescing (??)', target }
              });
            }
          }
        } catch {}
      },
      
      AssignmentExpression(node: any) {
        try {
          if (['??=', '||=', '&&='].includes(node.operator)) {
            if (!isSupported('logical-assignment', target)) {
              context.report({
                node: node as any,
                messageId: 'notBaseline',
                data: { name: `Logical assignment (${node.operator})`, target }
              });
            }
          }
        } catch {}
      }
    } as any;
  }
};

export default rule;


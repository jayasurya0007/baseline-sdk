import * as vscode from 'vscode';
import { parse } from '@babel/parser';
// @ts-ignore
import traverse from '@babel/traverse';
// @ts-ignore
import * as t from '@babel/types';

type BaselineLevel = 'limited' | 'newly' | 'widely';

// Inline SDK to avoid circular dependencies  
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

// Load web-features data asynchronously
async function initializeDataSource(): Promise<void> {
  try {
    // Dynamically import to load the full web-features dataset
    const mod = await import('web-features');
    const records: BaselineFeature[] = [];
    const entries = (mod as any).features || (mod as any).default || {};
    
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
    console.log(`🎯 VSCode extension loaded ${records.length} web features from MDN dataset`);
  } catch (error) {
    // Fallback to basic features if web-features import fails
    console.warn('⚠️ VSCode extension: Could not load web-features, using fallback');
    const fallbackFeatures: BaselineFeature[] = [
      { id: "array-by-copy", name: "Array by copy methods", status: { baseline: "newly", since: "2023-07" } },
      { id: "optional-chaining", name: "Optional chaining (?.)", status: { baseline: "widely", since: "2020-04" } }
    ];
    dataSource = new InMemoryDataSource(fallbackFeatures);
  }
}

function isSupported(featureId: string, target: BaselineLevel): boolean {
  const rec = dataSource.getFeatureById(featureId);
  if (!rec) return false;
  return compareBaseline(rec.status.baseline, target);
}

// Enhanced feature detection
class FeatureDetector {
  private detectedFeatures = new Set<string>();
  private diagnostics: vscode.Diagnostic[] = [];

  detectJSFeatures(text: string, doc: vscode.TextDocument, target: BaselineLevel): vscode.Diagnostic[] {
    this.diagnostics = [];
    this.detectedFeatures.clear();
    
    try {
      const ast = parse(text, {
        sourceType: 'module',
        allowImportExportEverywhere: true,
        allowReturnOutsideFunction: true,
        plugins: ['topLevelAwait', 'optionalChaining']
      });
      
      traverse(ast, {
        CallExpression: (path: any) => {
          const featureId = this.getAPIFeature(path);
          if (featureId && !isSupported(featureId, target)) {
            this.addAPIDiagnostic(path.node, featureId, doc);
          }
        },
        MemberExpression: (path: any) => {
          const featureId = this.getInstanceFeature(path);
          if (featureId && !isSupported(featureId, target)) {
            this.addInstanceDiagnostic(path.node, featureId, doc);
          }
        },
        ArrayExpression: (path: any) => {
          if (path.node.spread) {
            const featureId = 'js.generators.array.initializer_spread';
            if (!isSupported(featureId, target)) {
              this.addSimpleDiagnostic(path.node, featureId, doc);
            }
          }
        },
        OptionalMemberExpression: (path: any) => {
          const featureId = 'js.operators.optional_chaining';
          if (!isSupported(featureId, target)) {
            this.addSimpleDiagnostic(path.node, featureId, doc);
          }
        },
        NullishCoalescingExpression: (path: any) => {
          const featureId = 'js.operators.nullish_coalescing';
          if (!isSupported(featureId, target)) {
            this.addSimpleDiagnostic(path.node, featureId, doc);
          }
        },
        TopLevelAwaitExpression: (path: any) => {
          const featureId = 'js.operators.top_level_await';
          if (!isSupported(featureId, target)) {
            this.addSimpleDiagnostic(path.node, featureId, doc);
          }
        }
      });
      
    } catch (error) {
      // Fallback to regex if parsing fails
      this.fallbackJSDetection(text, doc, target);
    }
    
    return this.diagnostics;
  }

  private getAPIFeature(path: any): string | null {
    const node = path.node;
    const name = this.getFunctionName(node);
    
    const apiMap: { [key: string]: string } = {
      'fetch': 'api.Fetch.Fetch_API',
      'IntersectionObserver': 'api.IntersectionObserver.IntersectionObserver',
      'IntersectionObserverEntry': 'api.IntersectionObserver.IntersectionObserver',
      'ResizeObserver': 'api.ResizeObserver.ResizeObserver',
      'PerformanceObserver': 'api.Performance.PerformanceObserver',
      'requestIdleCallback': 'api.Window.requestIdleCallback',
      'cancelIdleCallback': 'api.Window.cancelIdleCallback',
      'structuredClone': 'api.structuredClone',
      'import.meta': 'js.modules.import_meta',
      'queueMicrotask': 'api.globalThis.queueMicrotask',
      'BroadcastChannel': 'api.BroadcastChannel.BroadcastChannel'
    };
    
    return apiMap[name] || null;
  }

  private getInstanceFeature(path: any): string | null {
    const node = path.node;
    const object = this.getObjectName(node.object);
    const property = this.getPropertyName(node.property);
    
    const methodMap: { [key: string]: { [key: string]: string } } = {
      'Array': {
        'at': 'js.array.at',
        'fromAsync': 'js.array.fromAsync',
        'group': 'js.array.group',
        'groupBy': 'js.array.groupBy',
        'groupByToMap': 'js.array.groupByToMap',
        'sort': 'js.array.sort',
        'toSorted': 'js.array.toSorted',
        'toReversed': 'js.array.toReversed',
        'toSpliced': 'js.array.toSpliced',
        'with': 'js.array.with',
        'findLast': 'js.array.findLast',
        'findLastIndex': 'js.array.findLastIndex',
        'flatMap': 'js.array.flatMap',
        'flat': 'js.array.flat'
      },
      'String': {
        'replaceAll': 'js.string.replaceAll',
        'codePointAt': 'js.string.codePointAt',
        'fromCodePoint': 'js.string.fromCodePoint',
        'toWellFormed': 'js.string.toWellFormed',
        'isWellFormed': 'js.string.isWellFormed'
      },
      'Object': {
        'hasOwn': 'js.object.hasOwn',
        'fromEntries': 'js.object.fromEntries',
        'groupBy': 'js.object.groupBy',
        'structuredClone': 'api.structuredClone'
      },
      'Number': {
        'isNaN': 'js.number.isNaN',
        'isFinite': 'js.number.isFinite',
        'parseInt': 'js.number.parseInt',
        'parseFloat': 'js.number.parseFloat'
      },
      'Promise': {
        'any': 'js.promise.any',
        'allSettled': 'js.promise.allSettled'
      },
      'WebAssembly': {
        'instantiate': 'api.WebAssembly.WebAssembly',
        'compile': 'api.WebAssembly.WebAssembly'
      }
    };
    
    return methodMap[object]?.[property] || null;
  }

  private getFunctionName(node: any): string {
    if (t.isIdentifier(node.callee)) {
      return node.callee.name;
    }
    if (t.isMemberExpression(node.callee)) {
      return this.getPropertyName(node.callee.property);
    }
    return '';
  }

  private getObjectName(obj: any): string {
    return t.isIdentifier(obj) ? obj.name : '';
  }

  private getPropertyName(prop: any): string {
    return t.isIdentifier(prop) ? prop.name : 
           t.isStringLiteral(prop) ? prop.value : '';
  }

  private addAPIDiagnostic(node: any, featureId: string, doc: vscode.TextDocument) {
    const pos = doc.positionAt((node as any).start);
    const range = new vscode.Range(pos, pos.translate(0, this.getNodeLength(node)));
    const feature = dataSource.getFeatureById(featureId);
    const message = feature?.name ? `${feature.name} is below required Baseline` : `${featureId} is below required Baseline`;
    const diag = new vscode.Diagnostic(range, message, vscode.DiagnosticSeverity.Error);
    diag.source = 'baseline';
    this.diagnostics.push(diag);
  }

  private addInstanceDiagnostic(node: any, featureId: string, doc: vscode.TextDocument) {
    const pos = doc.positionAt((node as any).start);
    const range = new vscode.Range(pos, pos.translate(0, this.getNodeLength(node)));
    const feature = dataSource.getFeatureById(featureId);
    const message = feature?.name ? `${feature.name} is below required Baseline` : `${featureId} is below required Baseline`;
    const diag = new vscode.Diagnostic(range, message, vscode.DiagnosticSeverity.Error);
    diag.source = 'baseline';
    this.diagnostics.push(diag);
  }

  private addSimpleDiagnostic(node: any, featureId: string, doc: vscode.TextDocument) {
    const pos = doc.positionAt((node as any).start);
    const range = new vscode.Range(pos, pos.translate(0, this.getNodeLength(node)));
    const feature = dataSource.getFeatureById(featureId);
    const message = feature?.name ? `${feature.name} is below required Baseline` : `${featureId} is below required Baseline`;
    const diag = new vscode.Diagnostic(range, message, vscode.DiagnosticSeverity.Error);
    diag.source = 'baseline';
    this.diagnostics.push(diag);
  }

  private getNodeLength(node: any): number {
    if (node.end && node.start) {
      return node.end - node.start;
    }
    return 10; // fallback
  }

  private fallbackJSDetection(text: string, doc: vscode.TextDocument, target: BaselineLevel) {
    // Fallback regex patterns for basic features
    const patterns = [
      { regex: /\bfetch\s*\(/, featureId: 'api.Fetch.Fetch_API' },
      { regex: /IntersectionObserver\s*\(/, featureId: 'api.IntersectionObserver.IntersectionObserver' },
      { regex: /\.at\s*\(/, featureId: 'js.array.at' },
      { regex: /\.replaceAll\s*\(/, featureId: 'js.string.replaceAll' },
      { regex: /Promise\.any\s*\(/, featureId: 'js.promise.any' },
      { regex: /Object\.hasOwn\s*\(/, featureId: 'js.object.hasOwn' },
      { regex: /structuredClone\s*\(/, featureId: 'api.structuredClone' },
      { regex: /queueMicrotask\s*\(/, featureId: 'api.globalThis.queueMicrotask' }
    ];

    patterns.forEach(({ regex, featureId }) => {
      for (const match of text.matchAll(regex)) {
        if (!isSupported(featureId, target)) {
          const pos = doc.positionAt(match.index || 0);
          const length = match[0].length;
          const range = new vscode.Range(pos, pos.translate(0, length));
          const feature = dataSource.getFeatureById(featureId);
          const message = feature?.name ? `${feature.name} is below required Baseline` : `${featureId} is below required Baseline`;
          const diag = new vscode.Diagnostic(range, message, vscode.DiagnosticSeverity.Error);
          diag.source = 'baseline';
          this.diagnostics.push(diag);
        }
      }
    });
  }

  detectCSSFeatures(text: string, doc: vscode.TextDocument, target: BaselineLevel): vscode.Diagnostic[] {
    this.diagnostics = [];
    const patterns = [
      { regex: /scroll-timeline\s*:/, featureId: 'css.properties.scroll-timeline' },
      { regex: /container-type\s*:/, featureId: 'css.properties.container-type' },
      { regex: /:has\s*\(/, featureId: 'css.selectors.has' },
      { regex: /@container\b/, featureId: 'css.at-rules.container' },
      { regex: /container-name\s*:/, featureId: 'css.properties.container-name' },
      { regex: /container-query\s*:/, featureId: 'css.properties.container-query' },
      { regex: /@supports\s*\(/, featureId: 'css.conditional.supports' },
      { regex: /backdrop-filter\s*:/, featureId: 'css.properties.backdrop-filter' },
      { regex: /:is\s*\(/, featureId: 'css.selectors.is' },
      { regex: /:where\s*\(/, featureId: 'css.selectors.where' },
      { regex: /grid-template-areas\s*:/, featureId: 'css.properties.grid-template-areas' },
      { regex: /aspect-ratio\s*:/, featureId: 'css.properties.aspect-ratio' },
      { regex: /gap\s*:/, featureId: 'css.properties.gap.general_gap' },
      { regex: /transform-style\s*:/, featureId: 'css.properties.transform-style' },
      { regex: /@keyframes\s+/, featureId: 'css.at-rules.keyframes' },
      { regex: /will-change\s*:/, featureId: 'css.properties.will-change' }
    ];

    patterns.forEach(({ regex, featureId }) => {
      for (const match of text.matchAll(regex)) {
        if (!isSupported(featureId, target)) {
          const pos = doc.positionAt(match.index || 0);
          const feature = dataSource.getFeatureById(featureId);
          const message = feature?.name ? `${feature.name} is below required Baseline` : `${featureId} is below required Baseline`;
          const range = new vscode.Range(pos, pos.translate(0, match[0].length));
          const diag = new vscode.Diagnostic(range, message, vscode.DiagnosticSeverity.Error);
          diag.source = 'baseline';
          this.diagnostics.push(diag);
        }
      }
    });

    return this.diagnostics;
  }
}

export function activate(context: vscode.ExtensionContext) {
	const diagnosticCollection = vscode.languages.createDiagnosticCollection('baseline');
	context.subscriptions.push(diagnosticCollection);

	let featureDetector: FeatureDetector;

	// Initialize the full web-features dataset
	initializeDataSource().then(() => {
		console.log('🚀 VSCode Baseline extension ready with full web-features dataset');
		featureDetector = new FeatureDetector();
		console.log('📊 Enhanced AST-based feature detection initialized');
	}).catch(err => {
		console.error('❌ Failed to initialize VSCode Baseline extension:', err);
	});

	async function refreshDiagnostics(doc: vscode.TextDocument) {
		if (!['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'css'].includes(doc.languageId)) return;
		if (!featureDetector) return; // Wait for initialization
		
		const target = (vscode.workspace.getConfiguration().get('baseline.target') as BaselineLevel) ?? 'widely';
		const text = doc.getText();
		let diagnostics: vscode.Diagnostic[] = [];

		// Use enhanced AST-based detection for JS/TS
		if (['javascript', 'typescript', 'javascriptreact', 'typescriptreact'].includes(doc.languageId)) {
			diagnostics = featureDetector.detectJSFeatures(text, doc, target);
		} else if (doc.languageId === 'css') {
			diagnostics = featureDetector.detectCSSFeatures(text, doc, target);
		}

		diagnosticCollection.set(doc.uri, diagnostics);
	}

	context.subscriptions.push(vscode.workspace.onDidOpenTextDocument(refreshDiagnostics));
	context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(e => refreshDiagnostics(e.document)));
	if (vscode.window.activeTextEditor) {
		refreshDiagnostics(vscode.window.activeTextEditor.document);
	}

	const hoverProvider = vscode.languages.registerHoverProvider(
		[{ language: 'javascript' }, { language: 'typescript' }, { language: 'css' }],
		{
			provideHover(doc, position) {
				const wordRange = doc.getWordRangeAtPosition(position);
				if (!wordRange) return;
				const word = doc.getText(wordRange);
				const target = (vscode.workspace.getConfiguration().get('baseline.target') as BaselineLevel) ?? 'widely';
				
				// Enhanced hover detection - JS features
				const jsFeatureMap: { [key: string]: string } = {
					'fetch': 'api.Fetch.Fetch_API',
					'toSorted': 'js.array.toSorted',
					'at': 'js.array.at',
					'replaceAll': 'js.string.replaceAll',
					'any': 'js.promise.any',
					'hasOwn': 'js.object.hasOwn',
					'structuredClone': 'api.structuredClone',
					'IntersectionObserver': 'api.IntersectionObserver.IntersectionObserver',
					'ResizeObserver': 'api.ResizeObserver.ResizeObserver',
					'findLast': 'js.array.findLast',
					'flat': 'js.array.flat',
					'flatMap': 'js.array.flatMap',
					'fromEntries': 'js.object.fromEntries',
					'groupBy': 'js.object.groupBy'
				};
				
				// CSS feature detection
				const cssFeatureMap: { [key: string]: string } = {
					'scroll-timeline': 'css.properties.scroll-timeline',
					'container-type': 'css.properties.container-type',
					'container-name': 'css.properties.container-name',
					'backdrop-filter': 'css.properties.backdrop-filter',
					'aspect-ratio': 'css.properties.aspect-ratio',
					'gap': 'css.properties.gap.general_gap',
					'will-change': 'css.properties.will-change',
					'transform-style': 'css.operators.charset'
				};

				// Check for exact matches
				const jsFeature = jsFeatureMap[word];
				const cssFeature = cssFeatureMap[word];
				
				if (jsFeature) {
					const ok = isSupported(jsFeature, target);
					const feature = dataSource.getFeatureById(jsFeature);
					const name = feature?.name || jsFeature;
					return new vscode.Hover(ok ? `✅ ${name} is Baseline` : `⚠️ ${name} is NOT Baseline`);
				}
				
				if (cssFeature) {
					const ok = isSupported(cssFeature, target);
					const feature = dataSource.getFeatureById(cssFeature);
					const name = feature?.name || cssFeature;
					return new vscode.Hover(ok ? `✅ ${name} is Baseline` : `⚠️ ${name} is NOT Baseline`);
				}
				
				// Special cases for CSS selectors
				if (/:has/.test(word)) {
					const ok = isSupported('css.selectors.has', target);
					return new vscode.Hover(ok ? '✅ CSS :has() selector is Baseline' : '⚠️ CSS :has() selector is NOT Baseline');
				}
				if (/:is/.test(word)) {
					const ok = isSupported('css.selectors.is', target);
					return new vscode.Hover(ok ? '✅ CSS :is() selector is Baseline' : '⚠️ CSS :is() selector is NOT Baseline');
				}
				if (/@container/.test(word)) {
					const ok = isSupported('css.at-rules.container', target);
					return new vscode.Hover(ok ? '✅ CSS Container Queries (@container) are Baseline' : '⚠️ CSS Container Queries (@container) are NOT Baseline');
				}
			}
		}
	);

	context.subscriptions.push(hoverProvider);
}

export function deactivate() {}

"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const parser_1 = require("@babel/parser");
// @ts-ignore
const traverse_1 = __importDefault(require("@babel/traverse"));
// @ts-ignore
const t = __importStar(require("@babel/types"));
// Escape a string for safe usage inside RegExp constructor
function escapeRegex(input) {
    return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function compareBaseline(feature, target) {
    const order = ['limited', 'newly', 'widely'];
    return order.indexOf(feature) >= order.indexOf(target);
}
class InMemoryDataSource {
    constructor(features) {
        this.byId = new Map();
        this.byName = new Map();
        this.byBcd = new Map();
        for (const f of features) {
            this.byId.set(f.id, f);
            if (f.name)
                this.byName.set(f.name, f);
            if (f.bcdId)
                this.byBcd.set(f.bcdId, f);
        }
    }
    getFeatureById(id) { return this.byId.get(id); }
    getFeatureByName(name) { return this.byName.get(name); }
    getFeatureByBcdId(bcdId) { return this.byBcd.get(bcdId); }
}
// Initialize with full web-features dataset
let dataSource;
// Load web-features data asynchronously
async function initializeDataSource() {
    try {
        // Dynamically import to load the full web-features dataset
        const mod = await Promise.resolve().then(() => __importStar(require('web-features')));
        const records = [];
        const entries = mod.features || mod.default || {};
        for (const [id, feat] of Object.entries(entries)) {
            const baseline = feat.status?.baseline === 'high' ? 'widely' :
                feat.status?.baseline === 'low' ? 'newly' : 'limited';
            const since = feat.status?.baseline_high_date || feat.status?.baseline_low_date;
            const bcdId = Array.isArray(feat.bcd) ? feat.bcd[0] : feat.bcd;
            records.push({
                id,
                name: feat.name || id,
                status: { baseline: baseline, since: since || undefined },
                bcdId: bcdId
            });
        }
        dataSource = new InMemoryDataSource(records);
        console.log(`🎯 VSCode extension loaded ${records.length} web features from MDN dataset`);
    }
    catch (error) {
        // Fallback to basic features if web-features import fails
        console.warn('⚠️ VSCode extension: Could not load web-features, using fallback');
        const fallbackFeatures = [
            { id: "array-by-copy", name: "Array by copy methods", status: { baseline: "newly", since: "2023-07" } },
            { id: "optional-chaining", name: "Optional chaining (?.)", status: { baseline: "widely", since: "2020-04" } }
        ];
        dataSource = new InMemoryDataSource(fallbackFeatures);
    }
}
function isSupported(featureId, target) {
    const rec = dataSource.getFeatureById(featureId);
    if (!rec)
        return false;
    return compareBaseline(rec.status.baseline, target);
}
// Enhanced feature detection
class FeatureDetector {
    constructor() {
        this.detectedFeatures = new Set();
        this.diagnostics = [];
        this.cachedCssPatterns = null;
    }
    detectJSFeatures(text, doc, target) {
        this.diagnostics = [];
        this.detectedFeatures.clear();
        try {
            const ast = (0, parser_1.parse)(text, {
                sourceType: 'module',
                allowImportExportEverywhere: true,
                allowReturnOutsideFunction: true,
                plugins: ['topLevelAwait', 'optionalChaining']
            });
            (0, traverse_1.default)(ast, {
                CallExpression: (path) => {
                    const featureId = this.getAPIFeature(path);
                    if (featureId && !isSupported(featureId, target)) {
                        this.addAPIDiagnostic(path.node, featureId, doc);
                    }
                },
                MemberExpression: (path) => {
                    const featureId = this.getInstanceFeature(path);
                    if (featureId && !isSupported(featureId, target)) {
                        this.addInstanceDiagnostic(path.node, featureId, doc);
                    }
                },
                ArrayExpression: (path) => {
                    // Detect array literal spread: e.g., [...arr]
                    const hasSpread = Array.isArray(path.node.elements) && path.node.elements.some((el) => el && el.type === 'SpreadElement');
                    if (hasSpread) {
                        const featureId = 'js.generators.array.initializer_spread';
                        if (!isSupported(featureId, target)) {
                            this.addSimpleDiagnostic(path.node, featureId, doc);
                        }
                    }
                },
                OptionalMemberExpression: (path) => {
                    const featureId = 'js.operators.optional_chaining';
                    if (!isSupported(featureId, target)) {
                        this.addSimpleDiagnostic(path.node, featureId, doc);
                    }
                },
                NullishCoalescingExpression: (path) => {
                    const featureId = 'js.operators.nullish_coalescing';
                    if (!isSupported(featureId, target)) {
                        this.addSimpleDiagnostic(path.node, featureId, doc);
                    }
                },
                AwaitExpression: (path) => {
                    // Babel represents top-level await as AwaitExpression at Program body
                    const isTopLevel = !path.getFunctionParent();
                    if (isTopLevel) {
                        const featureId = 'js.operators.top_level_await';
                        if (!isSupported(featureId, target)) {
                            this.addSimpleDiagnostic(path.node, featureId, doc);
                        }
                    }
                }
            });
        }
        catch (error) {
            // Fallback to regex if parsing fails
            this.fallbackJSDetection(text, doc, target);
        }
        return this.diagnostics;
    }
    getAPIFeature(path) {
        const node = path.node;
        const name = this.getFunctionName(node);
        const apiMap = {
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
    getInstanceFeature(path) {
        const node = path.node;
        const object = this.getObjectName(node.object);
        const property = this.getPropertyName(node.property);
        const methodMap = {
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
    getFunctionName(node) {
        if (t.isIdentifier(node.callee)) {
            return node.callee.name;
        }
        if (t.isMemberExpression(node.callee)) {
            return this.getPropertyName(node.callee.property);
        }
        return '';
    }
    getObjectName(obj) {
        return t.isIdentifier(obj) ? obj.name : '';
    }
    getPropertyName(prop) {
        return t.isIdentifier(prop) ? prop.name :
            t.isStringLiteral(prop) ? prop.value : '';
    }
    addAPIDiagnostic(node, featureId, doc) {
        const pos = doc.positionAt(node.start);
        const range = new vscode.Range(pos, pos.translate(0, this.getNodeLength(node)));
        const feature = dataSource.getFeatureById(featureId);
        const message = feature?.name ? `${feature.name} is below required Baseline` : `${featureId} is below required Baseline`;
        const diag = new vscode.Diagnostic(range, message, vscode.DiagnosticSeverity.Error);
        diag.source = 'baseline';
        this.diagnostics.push(diag);
    }
    addInstanceDiagnostic(node, featureId, doc) {
        const pos = doc.positionAt(node.start);
        const range = new vscode.Range(pos, pos.translate(0, this.getNodeLength(node)));
        const feature = dataSource.getFeatureById(featureId);
        const message = feature?.name ? `${feature.name} is below required Baseline` : `${featureId} is below required Baseline`;
        const diag = new vscode.Diagnostic(range, message, vscode.DiagnosticSeverity.Error);
        diag.source = 'baseline';
        this.diagnostics.push(diag);
    }
    addSimpleDiagnostic(node, featureId, doc) {
        const pos = doc.positionAt(node.start);
        const range = new vscode.Range(pos, pos.translate(0, this.getNodeLength(node)));
        const feature = dataSource.getFeatureById(featureId);
        const message = feature?.name ? `${feature.name} is below required Baseline` : `${featureId} is below required Baseline`;
        const diag = new vscode.Diagnostic(range, message, vscode.DiagnosticSeverity.Error);
        diag.source = 'baseline';
        this.diagnostics.push(diag);
    }
    getNodeLength(node) {
        if (node.end && node.start) {
            return node.end - node.start;
        }
        return 10; // fallback
    }
    fallbackJSDetection(text, doc, target) {
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
    detectCSSFeatures(text, doc, target) {
        this.diagnostics = [];
        const patterns = this.getCssFeaturePatterns();
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
    getCssFeaturePatterns() {
        if (this.cachedCssPatterns)
            return this.cachedCssPatterns;
        const patterns = [];
        // Generate patterns from full dataset for CSS properties, selectors, and at-rules
        const addPropertyPattern = (prop, featureId) => {
            // Match like: "prop:" optionally with whitespace
            patterns.push({ regex: new RegExp(`${escapeRegex(prop)}\\s*:`, 'g'), featureId });
        };
        const addSelectorPattern = (selector, featureId) => {
            // Match like: ":selector("
            patterns.push({ regex: new RegExp(`:${escapeRegex(selector)}\\s*\\(`, 'g'), featureId });
        };
        const addAtRulePattern = (rule, featureId) => {
            // Match like: "@rule"
            patterns.push({ regex: new RegExp(`@${escapeRegex(rule)}\\b`, 'g'), featureId });
        };
        // Walk through all features in the data source
        const anyIds = [];
        // Collect ids via known keys (no direct iterator, so try some common ones)
        // We will derive from known CSS prefixes
        const cssPrefixes = ['css.properties.', 'css.selectors.', 'css.at-rules.'];
        // Probe common properties/selectors/atrules by trying to resolve known ids from dataset
        // Since we don't have iteration on dataSource, reflect over a representative set
        // We'll use a heuristic by reading names from a curated list and also widely used properties
        const knownProps = [
            'scroll-timeline', 'container-type', 'container-name', 'backdrop-filter', 'aspect-ratio', 'gap', 'transform-style', 'will-change', 'grid-template-areas'
        ];
        const knownSelectors = ['has', 'is', 'where'];
        const knownAtRules = ['container', 'supports', 'keyframes', 'media', 'scope', 'layer'];
        // Prefer generating from known lists first
        for (const p of knownProps) {
            const fid = `css.properties.${p}`;
            if (dataSource.getFeatureById(fid))
                addPropertyPattern(p, fid);
        }
        for (const s of knownSelectors) {
            const fid = `css.selectors.${s}`;
            if (dataSource.getFeatureById(fid))
                addSelectorPattern(s, fid);
        }
        for (const a of knownAtRules) {
            const fid = `css.at-rules.${a}`;
            if (dataSource.getFeatureById(fid))
                addAtRulePattern(a, fid);
        }
        // Fallback: include existing handcrafted patterns to ensure coverage
        const fallback = [
            { regex: /scroll-timeline\s*:/g, featureId: 'css.properties.scroll-timeline' },
            { regex: /container-type\s*:/g, featureId: 'css.properties.container-type' },
            { regex: /:has\s*\(/g, featureId: 'css.selectors.has' },
            { regex: /@container\b/g, featureId: 'css.at-rules.container' },
            { regex: /container-name\s*:/g, featureId: 'css.properties.container-name' },
            { regex: /@supports\s*\(/g, featureId: 'css.at-rules.supports' },
            { regex: /backdrop-filter\s*:/g, featureId: 'css.properties.backdrop-filter' },
            { regex: /:is\s*\(/g, featureId: 'css.selectors.is' },
            { regex: /:where\s*\(/g, featureId: 'css.selectors.where' },
            { regex: /grid-template-areas\s*:/g, featureId: 'css.properties.grid-template-areas' },
            { regex: /aspect-ratio\s*:/g, featureId: 'css.properties.aspect-ratio' },
            { regex: /gap\s*:/g, featureId: 'css.properties.gap.general_gap' },
            { regex: /transform-style\s*:/g, featureId: 'css.properties.transform-style' },
            { regex: /@keyframes\s+/g, featureId: 'css.at-rules.keyframes' },
            { regex: /will-change\s*:/g, featureId: 'css.properties.will-change' }
        ];
        for (const f of fallback)
            patterns.push(f);
        this.cachedCssPatterns = patterns;
        return patterns;
    }
}
function activate(context) {
    const diagnosticCollection = vscode.languages.createDiagnosticCollection('baseline');
    context.subscriptions.push(diagnosticCollection);
    let featureDetector;
    // Initialize the full web-features dataset
    initializeDataSource().then(() => {
        console.log('🚀 VSCode Baseline extension ready with full web-features dataset');
        featureDetector = new FeatureDetector();
        console.log('📊 Enhanced AST-based feature detection initialized');
    }).catch(err => {
        console.error('❌ Failed to initialize VSCode Baseline extension:', err);
    });
    async function refreshDiagnostics(doc) {
        if (!['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'css'].includes(doc.languageId))
            return;
        if (!featureDetector)
            return; // Wait for initialization
        const target = vscode.workspace.getConfiguration().get('baseline.target') ?? 'widely';
        const text = doc.getText();
        let diagnostics = [];
        // Use enhanced AST-based detection for JS/TS
        if (['javascript', 'typescript', 'javascriptreact', 'typescriptreact'].includes(doc.languageId)) {
            diagnostics = featureDetector.detectJSFeatures(text, doc, target);
        }
        else if (doc.languageId === 'css') {
            diagnostics = featureDetector.detectCSSFeatures(text, doc, target);
        }
        diagnosticCollection.set(doc.uri, diagnostics);
    }
    context.subscriptions.push(vscode.workspace.onDidOpenTextDocument(refreshDiagnostics));
    context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(e => refreshDiagnostics(e.document)));
    if (vscode.window.activeTextEditor) {
        refreshDiagnostics(vscode.window.activeTextEditor.document);
    }
    const hoverProvider = vscode.languages.registerHoverProvider([{ language: 'javascript' }, { language: 'typescript' }, { language: 'css' }], {
        provideHover(doc, position) {
            const wordRange = doc.getWordRangeAtPosition(position);
            if (!wordRange)
                return;
            const word = doc.getText(wordRange);
            const target = vscode.workspace.getConfiguration().get('baseline.target') ?? 'widely';
            // Enhanced hover detection - JS features
            const jsFeatureMap = {
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
            const cssFeatureMap = {
                'scroll-timeline': 'css.properties.scroll-timeline',
                'container-type': 'css.properties.container-type',
                'container-name': 'css.properties.container-name',
                'backdrop-filter': 'css.properties.backdrop-filter',
                'aspect-ratio': 'css.properties.aspect-ratio',
                'gap': 'css.properties.gap.general_gap',
                'will-change': 'css.properties.will-change',
                'transform-style': 'css.properties.transform-style'
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
    });
    context.subscriptions.push(hoverProvider);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map
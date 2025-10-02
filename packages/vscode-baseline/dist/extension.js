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
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
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
function activate(context) {
    const diagnosticCollection = vscode.languages.createDiagnosticCollection('baseline');
    context.subscriptions.push(diagnosticCollection);
    // Initialize the full web-features dataset
    initializeDataSource().then(() => {
        console.log('🚀 VSCode Baseline extension ready with full web-features dataset');
    }).catch(err => {
        console.error('❌ Failed to initialize VSCode Baseline extension:', err);
    });
    async function refreshDiagnostics(doc) {
        if (!['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'css'].includes(doc.languageId))
            return;
        const target = vscode.workspace.getConfiguration().get('baseline.target') ?? 'widely';
        // Simple feature detection - in a real implementation this would be more comprehensive
        const diagnostics = [];
        const text = doc.getText();
        // Check for Array.prototype.toSorted
        const toSortedMatches = text.matchAll(/\btoSorted\b/g);
        for (const match of toSortedMatches) {
            if (!isSupported('js.array.toSorted', target)) {
                const pos = doc.positionAt(match.index || 0);
                const range = new vscode.Range(pos, pos.translate(0, 8));
                const diag = new vscode.Diagnostic(range, 'Array.prototype.toSorted is below required Baseline', vscode.DiagnosticSeverity.Error);
                diag.source = 'baseline';
                diagnostics.push(diag);
            }
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
            if (/toSorted/.test(word)) {
                const target = vscode.workspace.getConfiguration().get('baseline.target') ?? 'widely';
                const ok = isSupported('js.array.toSorted', target);
                return new vscode.Hover(ok ? 'Array.prototype.toSorted is Baseline' : '⚠️ Array.prototype.toSorted is NOT Baseline');
            }
            if (/scroll-timeline/.test(word)) {
                const target = vscode.workspace.getConfiguration().get('baseline.target') ?? 'widely';
                const ok = isSupported('css.properties.scroll-timeline', target);
                return new vscode.Hover(ok ? 'scroll-timeline is Baseline' : '⚠️ scroll-timeline is NOT Baseline');
            }
        }
    });
    context.subscriptions.push(hoverProvider);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map
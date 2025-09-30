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
const baseline_sdk_1 = require("@baseline-toolkit/baseline-sdk");
function activate(context) {
    const diagnosticCollection = vscode.languages.createDiagnosticCollection('baseline');
    context.subscriptions.push(diagnosticCollection);
    async function refreshDiagnostics(doc) {
        if (!['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'css'].includes(doc.languageId))
            return;
        const target = vscode.workspace.getConfiguration().get('baseline.target') ?? 'widely';
        const sdk = (0, baseline_sdk_1.createDefaultSdk)(target);
        const result = await sdk.scanCode(doc.getText(), { target });
        const diagnostics = result.issues.map(issue => {
            const range = new vscode.Range(issue.line - 1, issue.column, issue.line - 1, issue.column + 1);
            const diag = new vscode.Diagnostic(range, issue.message, vscode.DiagnosticSeverity.Error);
            diag.source = 'baseline';
            return diag;
        });
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
                const sdk = (0, baseline_sdk_1.createDefaultSdk)(target);
                const ok = sdk.isSupported('js.array.toSorted', target);
                return new vscode.Hover(ok ? 'Array.prototype.toSorted is Baseline' : '⚠️ Array.prototype.toSorted is NOT Baseline');
            }
            if (/scroll-timeline/.test(word)) {
                const target = vscode.workspace.getConfiguration().get('baseline.target') ?? 'widely';
                const sdk = (0, baseline_sdk_1.createDefaultSdk)(target);
                const ok = false; // sample only
                return new vscode.Hover(ok ? 'scroll-timeline is Baseline' : '⚠️ scroll-timeline is NOT Baseline');
            }
        }
    });
    context.subscriptions.push(hoverProvider);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map
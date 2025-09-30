import * as vscode from 'vscode';
import { createDefaultSdk } from '@baseline-toolkit/baseline-sdk';

type BaselineLevel = 'limited' | 'newly' | 'widely';

export function activate(context: vscode.ExtensionContext) {
	const diagnosticCollection = vscode.languages.createDiagnosticCollection('baseline');
	context.subscriptions.push(diagnosticCollection);

	async function refreshDiagnostics(doc: vscode.TextDocument) {
		if (!['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'css'].includes(doc.languageId)) return;
		const target = (vscode.workspace.getConfiguration().get('baseline.target') as BaselineLevel) ?? 'widely';
		const sdk = createDefaultSdk(target);
		const result = await sdk.scanCode(doc.getText(), { target });
		const diagnostics: vscode.Diagnostic[] = result.issues.map(issue => {
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

	const hoverProvider = vscode.languages.registerHoverProvider(
		[{ language: 'javascript' }, { language: 'typescript' }, { language: 'css' }],
		{
			provideHover(doc, position) {
				const wordRange = doc.getWordRangeAtPosition(position);
				if (!wordRange) return;
				const word = doc.getText(wordRange);
				if (/toSorted/.test(word)) {
					const target = (vscode.workspace.getConfiguration().get('baseline.target') as BaselineLevel) ?? 'widely';
					const sdk = createDefaultSdk(target);
					const ok = sdk.isSupported('js.array.toSorted', target);
					return new vscode.Hover(ok ? 'Array.prototype.toSorted is Baseline' : '⚠️ Array.prototype.toSorted is NOT Baseline');
				}
				if (/scroll-timeline/.test(word)) {
					const target = (vscode.workspace.getConfiguration().get('baseline.target') as BaselineLevel) ?? 'widely';
					const sdk = createDefaultSdk(target);
					const ok = false; // sample only
					return new vscode.Hover(ok ? 'scroll-timeline is Baseline' : '⚠️ scroll-timeline is NOT Baseline');
				}
			}
		}
	);
	context.subscriptions.push(hoverProvider);
}

export function deactivate() {}

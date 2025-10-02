import * as vscode from 'vscode';

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

export function activate(context: vscode.ExtensionContext) {
	const diagnosticCollection = vscode.languages.createDiagnosticCollection('baseline');
	context.subscriptions.push(diagnosticCollection);

	async function refreshDiagnostics(doc: vscode.TextDocument) {
		if (!['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'css'].includes(doc.languageId)) return;
		const target = (vscode.workspace.getConfiguration().get('baseline.target') as BaselineLevel) ?? 'widely';
		// Simple feature detection - in a real implementation this would be more comprehensive
		const diagnostics: vscode.Diagnostic[] = [];
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

	const hoverProvider = vscode.languages.registerHoverProvider(
		[{ language: 'javascript' }, { language: 'typescript' }, { language: 'css' }],
		{
			provideHover(doc, position) {
				const wordRange = doc.getWordRangeAtPosition(position);
				if (!wordRange) return;
				const word = doc.getText(wordRange);
				if (/toSorted/.test(word)) {
					const target = (vscode.workspace.getConfiguration().get('baseline.target') as BaselineLevel) ?? 'widely';
					const ok = isSupported('js.array.toSorted', target);
					return new vscode.Hover(ok ? 'Array.prototype.toSorted is Baseline' : '⚠️ Array.prototype.toSorted is NOT Baseline');
				}
				if (/scroll-timeline/.test(word)) {
					const target = (vscode.workspace.getConfiguration().get('baseline.target') as BaselineLevel) ?? 'widely';
					const ok = isSupported('css.properties.scroll-timeline', target);
					return new vscode.Hover(ok ? 'scroll-timeline is Baseline' : '⚠️ scroll-timeline is NOT Baseline');
				}
			}
		}
	);
	context.subscriptions.push(hoverProvider);
}

export function deactivate() {}

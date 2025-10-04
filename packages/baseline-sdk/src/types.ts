export type BaselineLevel = 'limited' | 'newly' | 'widely';

export interface FeatureStatus { baseline: BaselineLevel; since?: string; }
export interface FeatureRecord { id: string; name: string; status: FeatureStatus; bcdId?: string; }

export interface ScanIssue { kind: 'js' | 'css'; featureId: string; message: string; line: number; column: number; }

export interface ScanResult { issues: ScanIssue[]; }

export interface ScanOptions { 
  target: BaselineLevel;
  aiSuggestions?: boolean;
  aiApiKey?: string;
}

export interface AIFixSuggestion {
  originalCode: string;
  suggestedCode: string;
  explanation: string;
  confidence: 'high' | 'medium' | 'low';
  featureId: string;
}

export interface ScanIssueWithSuggestion extends ScanIssue {
  aiSuggestion?: AIFixSuggestion;
}

export interface BaselineDataSource {
  getFeatureById(id: string): FeatureRecord | undefined;
  getFeatureByName(name: string): FeatureRecord | undefined;
  getFeatureByBcdId(bcdId: string): FeatureRecord | undefined;
}

export interface BaselineSdk {
  isSupported(featureId: string, target: BaselineLevel): boolean;
  scanCode(source: string, options: ScanOptions): Promise<ScanResult>;
}

export { }


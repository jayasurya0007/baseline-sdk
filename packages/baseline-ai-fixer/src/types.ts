export interface ScanIssue {
  kind: 'js' | 'css';
  featureId: string;
  message: string;
  line: number;
  column: number;
}

export interface AIFixSuggestion {
  originalCode: string;
  suggestedCode: string;
  explanation: string;
  confidence: 'high' | 'medium' | 'low';
  featureId: string;
}

export interface AIProviderConfig {
  apiKey: string;
  model?: string;
  timeout?: number;
}

export interface AIProvider {
  suggestFix(code: string, issue: ScanIssue, context?: string): Promise<AIFixSuggestion>;
  isAvailable(): Promise<boolean>;
}

export type AIProviderType = 'perplexity' | 'openai' | 'claude' | 'local';

export interface AIFixerOptions {
  provider: AIProviderType;
  config: AIProviderConfig;
  maxRetries?: number;
  cacheEnabled?: boolean;
}

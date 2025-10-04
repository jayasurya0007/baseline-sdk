import type { AIProvider, AIProviderConfig, AIFixSuggestion, ScanIssue } from '../types.js';
export declare class PerplexityProvider implements AIProvider {
    private apiKey;
    private model;
    private timeout;
    private baseURL;
    constructor(config: AIProviderConfig);
    isAvailable(): Promise<boolean>;
    suggestFix(code: string, issue: ScanIssue, context?: string): Promise<AIFixSuggestion>;
    private buildPrompt;
    private parseResponse;
}
//# sourceMappingURL=perplexity.d.ts.map
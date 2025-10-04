import type { AIFixerOptions, AIFixSuggestion, ScanIssue } from './types.js';
export declare class AIFixer {
    private provider;
    private cache?;
    private maxRetries;
    constructor(options: AIFixerOptions);
    isAvailable(): Promise<boolean>;
    suggestFix(code: string, issue: ScanIssue, context?: string): Promise<AIFixSuggestion>;
    suggestFixBatch(issues: Array<{
        code: string;
        issue: ScanIssue;
        context?: string;
    }>): Promise<AIFixSuggestion[]>;
    clearCache(): void;
    getCacheSize(): number;
}
//# sourceMappingURL=fixer.d.ts.map
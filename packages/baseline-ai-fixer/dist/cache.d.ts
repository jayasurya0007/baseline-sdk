import type { AIFixSuggestion } from './types.js';
export declare class FixCache {
    private cache;
    private maxSize;
    constructor(maxSize?: number);
    private generateKey;
    get(code: string, featureId: string): AIFixSuggestion | undefined;
    set(code: string, featureId: string, suggestion: AIFixSuggestion): void;
    clear(): void;
    size(): number;
}
//# sourceMappingURL=cache.d.ts.map
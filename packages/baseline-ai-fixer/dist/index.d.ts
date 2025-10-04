import { AIFixer } from './fixer.js';
import type { AIFixerOptions } from './types.js';
export { AIFixer } from './fixer.js';
export { PerplexityProvider } from './providers/perplexity.js';
export { FixCache } from './cache.js';
export type { ScanIssue, AIFixSuggestion, AIProviderConfig, AIProvider, AIProviderType, AIFixerOptions } from './types.js';
export declare function createPerplexityFixer(apiKey: string, options?: Partial<AIFixerOptions>): AIFixer;
//# sourceMappingURL=index.d.ts.map
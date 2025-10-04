import { AIFixer } from './fixer.js';
export { AIFixer } from './fixer.js';
export { PerplexityProvider } from './providers/perplexity.js';
export { FixCache } from './cache.js';
// Convenience function to create an AI fixer with Perplexity
export function createPerplexityFixer(apiKey, options) {
    return new AIFixer({
        provider: 'perplexity',
        config: {
            apiKey,
            model: options?.config?.model,
            timeout: options?.config?.timeout
        },
        maxRetries: options?.maxRetries,
        cacheEnabled: options?.cacheEnabled
    });
}
//# sourceMappingURL=index.js.map
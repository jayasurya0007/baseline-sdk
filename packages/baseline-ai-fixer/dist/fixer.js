import { PerplexityProvider } from './providers/perplexity.js';
import { FixCache } from './cache.js';
export class AIFixer {
    constructor(options) {
        this.maxRetries = options.maxRetries || 3;
        // Initialize cache if enabled
        if (options.cacheEnabled !== false) {
            this.cache = new FixCache();
        }
        // Initialize provider based on type
        switch (options.provider) {
            case 'perplexity':
                this.provider = new PerplexityProvider(options.config);
                break;
            // Future providers can be added here
            // case 'openai':
            //   this.provider = new OpenAIProvider(options.config);
            //   break;
            default:
                throw new Error(`Unsupported AI provider: ${options.provider}`);
        }
    }
    async isAvailable() {
        return this.provider.isAvailable();
    }
    async suggestFix(code, issue, context) {
        // Check cache first
        if (this.cache) {
            const cached = this.cache.get(code, issue.featureId);
            if (cached) {
                return cached;
            }
        }
        // Try to get suggestion with retries
        let lastError;
        for (let attempt = 0; attempt < this.maxRetries; attempt++) {
            try {
                const suggestion = await this.provider.suggestFix(code, issue, context);
                // Cache the result
                if (this.cache) {
                    this.cache.set(code, issue.featureId, suggestion);
                }
                return suggestion;
            }
            catch (error) {
                lastError = error instanceof Error ? error : new Error('Unknown error');
                // Don't retry on authentication errors
                if (lastError.message.includes('Invalid') || lastError.message.includes('API key')) {
                    throw lastError;
                }
                // Wait before retrying (exponential backoff)
                if (attempt < this.maxRetries - 1) {
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
                }
            }
        }
        throw lastError || new Error('Failed to get AI suggestion after retries');
    }
    async suggestFixBatch(issues) {
        const suggestions = [];
        for (const item of issues) {
            try {
                const suggestion = await this.suggestFix(item.code, item.issue, item.context);
                suggestions.push(suggestion);
            }
            catch (error) {
                // Log error but continue with other issues
                console.error(`Failed to get suggestion for ${item.issue.featureId}:`, error);
                // Add a fallback suggestion
                suggestions.push({
                    originalCode: item.code,
                    suggestedCode: item.code,
                    explanation: `Could not generate AI suggestion: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    confidence: 'low',
                    featureId: item.issue.featureId
                });
            }
        }
        return suggestions;
    }
    clearCache() {
        this.cache?.clear();
    }
    getCacheSize() {
        return this.cache?.size() || 0;
    }
}
//# sourceMappingURL=fixer.js.map
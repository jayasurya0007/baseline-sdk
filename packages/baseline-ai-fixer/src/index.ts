import { AIFixer } from './fixer.js';
import type { AIFixerOptions } from './types.js';

export { AIFixer } from './fixer.js';
export { PerplexityProvider } from './providers/perplexity.js';
export { FixCache } from './cache.js';
export { FreemiumTracker } from './freemium.js';
export { DEFAULT_FREE_TIER_API_KEY, FREE_TIER_CONFIG } from './config.js';
export type {
  ScanIssue,
  AIFixSuggestion,
  AIProviderConfig,
  AIProvider,
  AIProviderType,
  AIFixerOptions
} from './types.js';

// Convenience function to create an AI fixer with Perplexity
// If no API key provided, uses free tier with your default key
export function createPerplexityFixer(apiKey?: string, options?: Partial<AIFixerOptions>) {
  return new AIFixer({
    provider: 'perplexity',
    config: {
      apiKey: apiKey || '', // Empty string triggers free tier
      model: options?.config?.model,
      timeout: options?.config?.timeout
    },
    maxRetries: options?.maxRetries,
    cacheEnabled: options?.cacheEnabled
  });
}

// Convenience function to create a free tier AI fixer
export function createFreeTierFixer(options?: Partial<AIFixerOptions>) {
  return createPerplexityFixer('', options);
}

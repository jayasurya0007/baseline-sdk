import type { AIProvider, AIFixerOptions, AIFixSuggestion, ScanIssue } from './types.js';
import { PerplexityProvider } from './providers/perplexity.js';
import { FixCache } from './cache.js';
import { FreemiumTracker } from './freemium.js';
import { DEFAULT_FREE_TIER_API_KEY, FREE_TIER_CONFIG } from './config.js';

export class AIFixer {
  private provider: AIProvider;
  private cache?: FixCache;
  private maxRetries: number;
  private freemiumTracker?: FreemiumTracker;
  private isFreeTier: boolean;

  constructor(options: AIFixerOptions) {
    this.maxRetries = options.maxRetries || 3;
    
    // Check if using free tier (no API key provided)
    this.isFreeTier = !options.config.apiKey || options.config.apiKey === '';
    
    // Initialize freemium tracker if using free tier
    if (this.isFreeTier && FREE_TIER_CONFIG.enabled) {
      this.freemiumTracker = new FreemiumTracker();
    }
    
    // Initialize cache if enabled
    if (options.cacheEnabled !== false) {
      this.cache = new FixCache();
    }

    // Use default API key for free tier, or user's key
    const apiKey = this.isFreeTier ? DEFAULT_FREE_TIER_API_KEY : options.config.apiKey;

    // Initialize provider based on type
    switch (options.provider) {
      case 'perplexity':
        this.provider = new PerplexityProvider({
          ...options.config,
          apiKey
        });
        break;
      // Future providers can be added here
      // case 'openai':
      //   this.provider = new OpenAIProvider(options.config);
      //   break;
      default:
        throw new Error(`Unsupported AI provider: ${options.provider}`);
    }
  }

  async isAvailable(): Promise<boolean> {
    return this.provider.isAvailable();
  }

  async suggestFix(code: string, issue: ScanIssue, context?: string): Promise<AIFixSuggestion> {
    // Check free tier limit
    if (this.isFreeTier && this.freemiumTracker) {
      if (!this.freemiumTracker.canUseFreeTier()) {
        const remaining = this.freemiumTracker.getRemainingRequests();
        const resetTime = this.freemiumTracker.getTimeUntilReset();
        const hours = Math.ceil(resetTime / (1000 * 60 * 60));
        
        throw new Error(
          `Free tier limit reached (${this.freemiumTracker.getLimit()} requests/day). ` +
          `Resets in ${hours} hours. ` +
          `Upgrade to unlimited by setting your own PERPLEXITY_API_KEY.`
        );
      }
    }

    // Check cache first
    if (this.cache) {
      const cached = this.cache.get(code, issue.featureId);
      if (cached) {
        return cached;
      }
    }

    // Try to get suggestion with retries
    let lastError: Error | undefined;
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const suggestion = await this.provider.suggestFix(code, issue, context);
        
        // Record free tier usage
        if (this.isFreeTier && this.freemiumTracker) {
          this.freemiumTracker.recordUsage();
        }
        
        // Cache the result
        if (this.cache) {
          this.cache.set(code, issue.featureId, suggestion);
        }
        
        return suggestion;
      } catch (error) {
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

  async suggestFixBatch(
    issues: Array<{ code: string; issue: ScanIssue; context?: string }>
  ): Promise<AIFixSuggestion[]> {
    const suggestions: AIFixSuggestion[] = [];
    
    for (const item of issues) {
      try {
        const suggestion = await this.suggestFix(item.code, item.issue, item.context);
        suggestions.push(suggestion);
      } catch (error) {
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

  clearCache(): void {
    this.cache?.clear();
  }

  getCacheSize(): number {
    return this.cache?.size() || 0;
  }

  /**
   * Check if using free tier
   */
  isUsingFreeTier(): boolean {
    return this.isFreeTier;
  }

  /**
   * Get remaining free tier requests
   */
  getRemainingFreeTierRequests(): number {
    if (!this.isFreeTier || !this.freemiumTracker) {
      return -1; // Unlimited (using own API key)
    }
    return this.freemiumTracker.getRemainingRequests();
  }

  /**
   * Get free tier limit
   */
  getFreeTierLimit(): number {
    return FREE_TIER_CONFIG.dailyLimit;
  }

  /**
   * Get time until free tier reset (in milliseconds)
   */
  getTimeUntilReset(): number {
    if (!this.isFreeTier || !this.freemiumTracker) {
      return 0;
    }
    return this.freemiumTracker.getTimeUntilReset();
  }
}

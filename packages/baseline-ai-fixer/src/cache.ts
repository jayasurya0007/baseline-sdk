import crypto from 'crypto';
import type { AIFixSuggestion } from './types.js';

export class FixCache {
  private cache: Map<string, AIFixSuggestion>;
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  private generateKey(code: string, featureId: string): string {
    const hash = crypto.createHash('md5');
    hash.update(`${code}:${featureId}`);
    return hash.digest('hex');
  }

  get(code: string, featureId: string): AIFixSuggestion | undefined {
    const key = this.generateKey(code, featureId);
    return this.cache.get(key);
  }

  set(code: string, featureId: string, suggestion: AIFixSuggestion): void {
    const key = this.generateKey(code, featureId);
    
    // If cache is full, remove oldest entry
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    
    this.cache.set(key, suggestion);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

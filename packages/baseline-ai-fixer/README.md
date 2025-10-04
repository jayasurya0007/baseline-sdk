# @baseline-toolkit/baseline-ai-fixer

AI-powered fix suggestions for baseline compatibility issues using Perplexity AI.

## Installation

```bash
npm install @baseline-toolkit/baseline-ai-fixer
```

## Usage

### Basic Usage

```javascript
import { createPerplexityFixer } from '@baseline-toolkit/baseline-ai-fixer';

const fixer = createPerplexityFixer(process.env.PERPLEXITY_API_KEY);

const issue = {
  kind: 'js',
  featureId: 'array-by-copy',
  message: 'Array.prototype.toSorted is below required Baseline',
  line: 5,
  column: 12
};

const code = 'const sorted = arr.toSorted();';

const suggestion = await fixer.suggestFix(code, issue);

console.log('Original:', suggestion.originalCode);
console.log('Suggested:', suggestion.suggestedCode);
console.log('Explanation:', suggestion.explanation);
console.log('Confidence:', suggestion.confidence);
```

### Advanced Usage

```javascript
import { AIFixer } from '@baseline-toolkit/baseline-ai-fixer';

const fixer = new AIFixer({
  provider: 'perplexity',
  config: {
    apiKey: process.env.PERPLEXITY_API_KEY,
    model: 'llama-3.1-sonar-small-128k-online',
    timeout: 30000
  },
  maxRetries: 3,
  cacheEnabled: true
});

// Check if AI is available
const available = await fixer.isAvailable();
if (!available) {
  console.error('AI provider is not available');
  process.exit(1);
}

// Get suggestion with context
const suggestion = await fixer.suggestFix(
  code,
  issue,
  'This is part of a React component that sorts user data'
);

// Batch processing
const suggestions = await fixer.suggestFixBatch([
  { code: 'arr.toSorted()', issue: issue1 },
  { code: 'obj?.prop', issue: issue2 },
  { code: 'val ?? default', issue: issue3 }
]);

// Cache management
console.log('Cache size:', fixer.getCacheSize());
fixer.clearCache();
```

## API Reference

### `createPerplexityFixer(apiKey, options?)`

Convenience function to create an AI fixer with Perplexity provider.

**Parameters:**
- `apiKey` (string): Your Perplexity API key
- `options` (optional): Partial AIFixerOptions

**Returns:** `AIFixer` instance

### `AIFixer`

Main class for AI-powered fix suggestions.

#### Methods

##### `async isAvailable(): Promise<boolean>`

Check if the AI provider is available and configured correctly.

##### `async suggestFix(code, issue, context?): Promise<AIFixSuggestion>`

Get a fix suggestion for a single issue.

**Parameters:**
- `code` (string): The problematic code snippet
- `issue` (ScanIssue): The baseline compatibility issue
- `context` (string, optional): Additional context about the code

**Returns:** `AIFixSuggestion` with suggested fix and explanation

##### `async suggestFixBatch(issues): Promise<AIFixSuggestion[]>`

Get fix suggestions for multiple issues.

**Parameters:**
- `issues` (Array): Array of `{ code, issue, context? }` objects

**Returns:** Array of `AIFixSuggestion`

##### `clearCache(): void`

Clear the suggestion cache.

##### `getCacheSize(): number`

Get the current cache size.

## Configuration

### Environment Variables

```bash
# Required
PERPLEXITY_API_KEY=your_api_key_here

# Optional
PERPLEXITY_MODEL=llama-3.1-sonar-small-128k-online
PERPLEXITY_TIMEOUT=30000
```

### Options

```typescript
interface AIFixerOptions {
  provider: 'perplexity';  // More providers coming soon
  config: {
    apiKey: string;
    model?: string;        // Default: 'llama-3.1-sonar-small-128k-online'
    timeout?: number;      // Default: 30000 (30 seconds)
  };
  maxRetries?: number;     // Default: 3
  cacheEnabled?: boolean;  // Default: true
}
```

## Getting a Perplexity API Key

1. Sign up at [Perplexity AI](https://www.perplexity.ai/)
2. Navigate to API settings
3. Generate an API key
4. Set it as an environment variable: `PERPLEXITY_API_KEY`

## Features

- ✅ AI-powered fix suggestions using Perplexity AI
- ✅ Smart caching to reduce API calls
- ✅ Automatic retry with exponential backoff
- ✅ Batch processing support
- ✅ Confidence scoring for suggestions
- ✅ Context-aware suggestions
- ✅ TypeScript support

## License

MIT

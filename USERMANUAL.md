# Baseline Toolkit - User Manual

## 🚀 Quick Start

### Install the SDK
```bash
npm install @baseline-toolkit/baseline-sdk
```

### Basic Usage
```js
import { createDefaultSdk } from '@baseline-toolkit/baseline-sdk';

const sdk = createDefaultSdk();

// Check if a feature is supported
const isSupported = sdk.isSupported('js.array.toSorted', 'widely');
console.log('toSorted widely supported:', isSupported); // false

// Scan code for baseline issues
const code = `const arr = [3,1].toSorted();`;
const result = await sdk.scanCode(code, { target: 'widely' });
console.log(result.issues); // Shows baseline violations
```

## 🔧 CLI Tool

### Install CLI
```bash
npm install @baseline-toolkit/baseline-cli
```

### Use CLI
```bash
# Scan current directory
npx baseline-check .

# Scan with specific target
npx baseline-check . --target widely

# Ignore certain files
npx baseline-check . --ignore "node_modules/**" --ignore "dist/**"

# Output JSON report
npx baseline-check . --json > report.json
```

## 🔍 ESLint Plugin

### Install Plugin
```bash
npm install @baseline-toolkit/eslint-plugin
```

### Configure ESLint
```js
// eslint.config.js
export default [
  {
    plugins: {
      "baseline": await import("@baseline-toolkit/eslint-plugin")
    },
    rules: {
      "baseline/no-non-baseline": ["error", { target: "widely" }]
    }
  }
];
```

### Run ESLint
```bash
npx eslint src/
```

## 🎯 Baseline Targets

- **`limited`** - Very new features, limited browser support
- **`newly`** - Recently baseline features, good modern browser support  
- **`widely`** - Widely supported features, works in older browsers too

## 📝 API Reference

### SDK Methods

#### `createDefaultSdk()`
Creates SDK with sample feature data.

#### `createWebFeaturesSdk()`
Creates SDK with full web-features dataset (requires `web-features` package).

#### `sdk.isSupported(featureId, target)`
- `featureId`: Feature identifier (e.g., 'js.array.toSorted')
- `target`: 'limited' | 'newly' | 'widely'
- Returns: `boolean`

#### `sdk.scanCode(source, options)`
- `source`: Code string to scan
- `options`: `{ target: 'limited' | 'newly' | 'widely' }`
- Returns: `{ issues: Array<{ kind, featureId, message, line, column }> }`

## 🌐 VSCode Extension

### Install Extension
```bash
npm install @baseline-toolkit/vscode-extension
```

### Configure VSCode
Add to your VSCode settings:
```json
{
  "baseline.target": "widely"
}
```

### Features
- Real-time baseline violation detection
- Hover tooltips for feature compatibility
- Error highlighting in editor

## 📋 Common Examples

### Check Array Methods
```js
const sdk = createDefaultSdk();

// These will return false for 'widely' target
sdk.isSupported('js.array.toSorted', 'widely');
sdk.isSupported('js.array.toReversed', 'widely');
sdk.isSupported('js.array.with', 'widely');
```

### Check CSS Properties
```js
const cssCode = `
.container {
  scroll-timeline: auto;
  view-transition-name: slide;
}`;

const result = await sdk.scanCode(cssCode, { target: 'widely' });
// Will flag scroll-timeline and view-transition-name
```

### Scan JavaScript File
```js
const jsCode = `
const items = [3, 1, 4];
const sorted = items.toSorted(); // Will be flagged
const reversed = items.toReversed(); // Will be flagged
`;

const result = await sdk.scanCode(jsCode, { target: 'widely' });
console.log(`Found ${result.issues.length} baseline violations`);
```

## 🚨 Troubleshooting

### Import Errors
Make sure you're using the correct scoped package names:
- ✅ `@baseline-toolkit/baseline-sdk`
- ❌ `baseline-toolkit-sdk`

### ESLint Not Working
Ensure your ESLint config uses the new plugin format:
```js
plugins: {
  "baseline": await import("@baseline-toolkit/eslint-plugin")
}
```

### CLI Command Not Found
Install the CLI package globally:
```bash
npm install -g @baseline-toolkit/baseline-cli
```

## 📚 Feature IDs

Common feature IDs you can check:

### JavaScript
- `js.array.toSorted`
- `js.array.toReversed` 
- `js.array.with`
- `js.array.findLast`
- `js.array.findLastIndex`

### CSS
- `css.properties.scroll-timeline`
- `css.properties.view-transition-name`
- `css.properties.aspect-ratio`
- `css.properties.container-type`

### Full Dataset
For the complete list, use `createWebFeaturesSdk()` which includes all features from the MDN web-features dataset.

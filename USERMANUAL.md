# Baseline Toolkit - User Manual

> **🚀 Enhanced**: `baseline-toolkit@0.1.5` now detects 50+ modern web features for comprehensive baseline checking!

## 🚀 Quick Start

### Install from npm (Recommended)
```bash
npm install baseline-toolkit
```

### Basic Usage
```js
import { createDefaultSdk } from 'baseline-toolkit';

const sdk = createDefaultSdk();

// Check if a feature is supported
const isSupported = sdk.isSupported('array-by-copy', 'widely');
console.log('Array by copy methods widely supported:', isSupported); // false

// Scan code for baseline issues - detects 50+ feature types!
const code = `
const arr = [3,1].toSorted();
const obj = data?.user ?? 'default';
const hasKey = Object.hasOwn(obj, 'name');
`;
const result = await sdk.scanCode(code, { target: 'widely' });
console.log(result.issues); // Shows comprehensive baseline violations
```

## 🔧 CLI Tool

### Install & Use CLI
```bash
npm install baseline-toolkit

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

### Install & Configure ESLint Plugin
```bash
npm install baseline-toolkit
```

### Configure ESLint
```js
// eslint.config.js
export default [
  {
    plugins: {
      "baseline": await import("baseline-toolkit/eslint-plugin")
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
# The VSCode extension is part of the development workspace
# Open packages/vscode-baseline in VSCode and press F5 to run
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
import { createDefaultSdk } from 'baseline-toolkit';
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
Make sure you're using the latest version:
- ✅ `baseline-toolkit@0.1.4` or later
- ❌ `baseline-toolkit@0.1.2` (had missing files)

### ESLint Not Working
Ensure your ESLint config uses the correct import:
```js
plugins: {
  "baseline": await import("baseline-toolkit/eslint-plugin")
}
```

### CLI Command Not Found
Make sure the package is installed:
```bash
npm install baseline-toolkit
npx baseline-check --help
```

## 📚 Feature Coverage

**baseline-toolkit now detects 50+ modern web features!**

### JavaScript Features (20+)
- **Array methods**: `array-by-copy` (toSorted, toReversed, toSpliced, with), `array-at`, `array-findlast`
- **Promise methods**: `promise-allsettled`, `promise-any`
- **Modern syntax**: `optional-chaining` (?.),  `nullish-coalescing` (??), `logical-assignment` (??=, ||=, &&=)
- **Object methods**: `object-hasown`, `object-fromentries`
- **String methods**: `string-replaceall`, `string-matchall`, `string-trim`
- **Web APIs**: `abortcontroller`, `dynamic-import`, `bigint`

### CSS Features (30+)
- **Layout**: `grid`, `flexbox`, `flexbox-gap`, `display-contents`
- **Container queries**: `container-queries`
- **Properties**: `aspect-ratio`, `accent-color`, `backdrop-filter`, `scroll-behavior`, `scroll-snap`, `scroll-timeline`
- **Color functions**: `color-mix`, `oklch`, `oklab`, `lab-colors`
- **Selectors**: `css-has` (:has), `css-where` (:where), `css-is` (:is)
- **Logical properties**: `logical-properties` (inline-size, block-size, margin-inline)
- **Modern features**: `view-transitions`, `css-nesting`

### Full Dataset
For complete coverage of 1000+ features, use:
```js
import { createWebFeaturesSdk } from 'baseline-toolkit';
const sdk = await createWebFeaturesSdk(); // All MDN web-features!
```
